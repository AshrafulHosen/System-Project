/**
 * Phone verification (Nishchit OTP) — end-to-end HTTP API test (LOCAL Supabase only).
 *   node --env-file=.env.local tests/integration/phone-verification-api.mjs
 *   (Supabase env vars overridden to the local stack; TEST_BASE_URL → `next dev` so the
 *    dev-only `devOtp` echo is available; NISHCHIT_API_KEY must be an nk_test_ key.)
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const BASE_URL = (process.env.TEST_BASE_URL || "http://localhost:3200").replace(/\/+$/, "");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+/.test(SUPABASE_URL ?? ""), "Refusing to run against a non-local Supabase.");
assert.ok(process.env.NISHCHIT_API_KEY?.startsWith("nk_test_"), "Use a Nishchit nk_test_ key for this test.");

const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
let passed = 0;
const pass = (m) => { passed += 1; console.log(`  PASS: ${m}`); };
const section = (t) => console.log(`\n=== ${t} ===`);

/** Random valid BD mobile that is not one of Nishchit's magic test numbers. */
const randomPhone = () => `+88019${String(crypto.randomInt(0, 1e8)).padStart(8, "0")}`;
const local = (e164) => `0${e164.slice(4)}`;

async function session(email, password) {
  const jar = new Map();
  const c = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => Array.from(jar.entries()).map(([name, value]) => ({ name, value })),
      setAll: (l) => l.forEach(({ name, value, options }) => (value === "" || options?.maxAge === 0 ? jar.delete(name) : jar.set(name, value))),
    },
  });
  const { error } = await c.auth.signInWithPassword({ email, password });
  assert.ifError(error);
  const ip = `10.${crypto.randomInt(0, 255)}.${crypto.randomInt(0, 255)}.${crypto.randomInt(1, 254)}`;
  return { client: c, cookie: () => Array.from(jar.entries()).map(([n, v]) => `${n}=${v}`).join("; "), ip };
}

async function api(path, { method = "GET", s, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(s ? { Cookie: s.cookie(), "X-Forwarded-For": s.ip } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* */ }
  return { status: res.status, json };
}

const send = (s, phone) => api("/api/phone/send-otp", { method: "POST", s, body: { phone } });
const verify = (s, otp) => api("/api/phone/verify-otp", { method: "POST", s, body: { otp } });
const status = (s) => api("/api/phone/status", { s });

/** Moves the user's send log back in time so the 60 s cooldown no longer applies. */
async function skipCooldown(userId) {
  const { error } = await admin
    .from("phone_otp_send_log")
    .update({ created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() })
    .eq("user_id", userId);
  assert.ifError(error);
}

async function makeUser(role) {
  const email = `ph-${role}-${crypto.randomUUID().slice(0, 8)}@test.local`;
  const password = `Pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Ph ${role}` } });
  assert.ifError(error);
  if (role === "client") await admin.from("clients").insert({ user_id: data.user.id });
  if (role === "freelancer") await admin.from("freelancers").insert({ user_id: data.user.id });
  return { id: data.user.id, email, password };
}

const wrongOf = (otp) => String((Number(otp) + 1) % 1_000_000).padStart(6, "0");

const run = async () => {
  section("Fixtures");
  const [cu, fu, xu, yu] = await Promise.all(["client", "freelancer", "other", "other2"].map(makeUser));
  const [client, freelancer, other, other2] = await Promise.all([cu, fu, xu, yu].map((u) => session(u.email, u.password)));
  pass("client, freelancer and two extra users signed in");

  section("Auth + validation");
  assert.equal((await status()).status, 401);
  assert.equal((await send(null, randomPhone())).status, 401);
  assert.equal((await verify(null, "123456")).status, 401);
  pass("unauthenticated requests are rejected (401)");

  for (const bad of ["12345", "+14155550123", "01212345678", "abc", "+8801712345678999", ""]) {
    const r = await send(client, bad);
    assert.equal(r.status, 400, `phone ${bad}`);
    assert.equal(r.json.code, "INVALID_PHONE");
  }
  pass("invalid / non-BD phone numbers rejected");
  assert.equal((await verify(client, "12ab56")).json.code, "INVALID_OTP");
  assert.equal((await verify(client, "123456")).json.code, "NO_PENDING");
  pass("malformed OTP rejected; verify without pending code → NO_PENDING");

  const initial = await status(client);
  assert.equal(initial.status, 200);
  assert.equal(initial.json.verified, false);
  assert.equal(initial.json.phoneNumber, null);
  assert.equal(initial.json.pending, null);
  pass("new users start Not Verified");

  section("Client: request + verify");
  const clientPhone = randomPhone();
  const s1 = await send(client, local(clientPhone));
  assert.equal(s1.status, 200, JSON.stringify(s1.json));
  assert.equal(s1.json.phoneNumber, clientPhone);
  assert.match(s1.json.devOtp, /^\d{6}$/);
  pass("client OTP request accepted by Nishchit (local 01… format normalised)");

  const st1 = await status(client);
  assert.equal(st1.json.pending.phoneNumber, clientPhone);
  assert.equal(st1.json.pending.attemptsRemaining, 5);
  assert.ok(st1.json.resendAvailableAt);
  const raw = JSON.stringify(st1.json);
  assert.ok(!raw.includes(s1.json.devOtp) && !/otp_?hash/i.test(raw), "status must not leak OTP or hash");
  pass("status reports pending OTP without exposing code or hash");

  const { data: row } = await admin.from("phone_verifications").select("otp_hash").eq("user_id", cu.id).single();
  assert.match(row.otp_hash, /^[0-9a-f]{64}$/);
  assert.notEqual(row.otp_hash, s1.json.devOtp);
  pass("only an HMAC-SHA256 hash is stored");

  const cd = await send(client, clientPhone);
  assert.equal(cd.status, 429);
  assert.equal(cd.json.code, "COOLDOWN");
  assert.ok(cd.json.retryAfter > 0 && cd.json.retryAfter <= 60);
  pass("resend within 60 s blocked by cooldown");

  const w = await verify(client, wrongOf(s1.json.devOtp));
  assert.equal(w.status, 400);
  assert.equal(w.json.code, "WRONG_CODE");
  assert.equal(w.json.attemptsRemaining, 4);
  pass("incorrect OTP rejected with attempts remaining");

  const ok = await verify(client, s1.json.devOtp);
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  assert.equal(ok.json.verified, true);
  const { data: u1 } = await admin.from("users").select("phone_number, phone_verified, phone_verified_at").eq("id", cu.id).single();
  assert.equal(u1.phone_number, clientPhone);
  assert.equal(u1.phone_verified, true);
  assert.ok(u1.phone_verified_at);
  const { count: leftover } = await admin.from("phone_verifications").select("*", { count: "exact", head: true }).eq("user_id", cu.id);
  assert.equal(leftover, 0);
  pass("correct OTP verifies phone, stamps phone_verified_at, deletes pending record");

  const reuse = await verify(client, s1.json.devOtp);
  assert.equal(reuse.json.code, "NO_PENDING");
  pass("OTP cannot be reused");

  const st2 = await status(client);
  assert.equal(st2.json.verified, true);
  assert.equal(st2.json.phoneNumber, clientPhone);
  pass("verified user sees Verified status");

  section("Freelancer: independent verification");
  const flPhone = randomPhone();
  const f1 = await send(freelancer, flPhone);
  assert.equal(f1.status, 200, JSON.stringify(f1.json));
  assert.equal((await status(client)).json.pending, null, "client unaffected by freelancer pending OTP");
  const cross = await verify(client, f1.json.devOtp);
  assert.equal(cross.json.code, "NO_PENDING");
  pass("freelancer's OTP cannot be used by the client account");
  const f2 = await verify(freelancer, f1.json.devOtp);
  assert.equal(f2.status, 200);
  assert.equal((await status(freelancer)).json.phoneNumber, flPhone);
  pass("freelancer verifies independently");

  section("Duplicates + phone change");
  const dup = await send(other, clientPhone);
  assert.equal(dup.status, 409);
  assert.equal(dup.json.code, "PHONE_IN_USE");
  pass("number verified on another account cannot be claimed");
  assert.equal((await send(client, clientPhone)).json.code, "ALREADY_VERIFIED");
  pass("re-verifying own current number is refused");

  await skipCooldown(cu.id);
  const newPhone = randomPhone();
  const c1 = await send(client, newPhone);
  assert.equal(c1.status, 200, JSON.stringify(c1.json));
  const mid = await status(client);
  assert.equal(mid.json.verified, true);
  assert.equal(mid.json.phoneNumber, clientPhone, "old verified number kept until new one verified");
  assert.equal(mid.json.pending.phoneNumber, newPhone);
  pass("changing number keeps the previous verified number while pending");
  const c2 = await verify(client, c1.json.devOtp);
  assert.equal(c2.status, 200);
  const after = await status(client);
  assert.equal(after.json.phoneNumber, newPhone);
  assert.equal(after.json.verified, true);
  pass("new number replaces old one only after successful OTP");
  await skipCooldown(xu.id);
  assert.equal((await send(other, clientPhone)).status, 200);
  pass("released old number becomes available to other accounts");

  section("Attempts + expiry");
  await skipCooldown(xu.id);
  const a1 = await send(other, randomPhone());
  assert.equal(a1.status, 200, JSON.stringify(a1.json));
  const wrong = wrongOf(a1.json.devOtp);
  const results = await Promise.all(Array.from({ length: 7 }, () => verify(other, wrong)));
  const codes = results.map((r) => r.json.code).sort();
  assert.equal(codes.filter((c) => c === "WRONG_CODE").length, 4, codes.join(","));
  assert.equal(codes.filter((c) => c === "TOO_MANY_ATTEMPTS").length, 3, codes.join(","));
  const { data: attemptsRow } = await admin.from("phone_verifications").select("attempts").eq("user_id", xu.id).single();
  assert.equal(attemptsRow.attempts, 5);
  pass("7 concurrent wrong guesses → exactly 5 attempts counted (atomic)");
  const locked = await verify(other, a1.json.devOtp);
  assert.equal(locked.json.code, "TOO_MANY_ATTEMPTS");
  pass("correct code refused once max attempts exhausted");

  await skipCooldown(xu.id);
  const e1 = await send(other, randomPhone());
  assert.equal(e1.status, 200);
  await admin.from("phone_verifications").update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq("user_id", xu.id);
  const exp = await verify(other, e1.json.devOtp);
  assert.equal(exp.status, 410);
  assert.equal(exp.json.code, "EXPIRED");
  assert.equal((await status(other)).json.pending.expired, true);
  pass("expired OTP cannot be used and status reports Expired");

  section("SMS provider failure");
  const fail = await send(other2, "+8801700000003");
  assert.equal(fail.status, 502, JSON.stringify(fail.json));
  assert.equal(fail.json.code, "SMS_FAILED");
  assert.equal((await status(other2)).json.pending, null);
  const retry = await send(other2, randomPhone());
  assert.equal(retry.status, 200, "failed send must not start a cooldown");
  pass("Nishchit gateway failure → SMS_FAILED, reservation rolled back, no cooldown");

  section("Rate limits");
  await skipCooldown(yu.id);
  const backfill = Array.from({ length: 5 }, (_, i) => ({
    user_id: yu.id,
    phone_number: randomPhone(),
    created_at: new Date(Date.now() - (10 + i) * 60 * 1000).toISOString(),
  }));
  await admin.from("phone_otp_send_log").insert(backfill);
  assert.equal((await send(other2, randomPhone())).json.code, "RATE_LIMITED");
  pass("per-user hourly send limit enforced");

  const hotPhone = randomPhone();
  await admin.from("phone_otp_send_log").insert(
    Array.from({ length: 5 }, () => ({ user_id: xu.id, phone_number: hotPhone, created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() }))
  );
  await skipCooldown(fu.id);
  assert.equal((await send(freelancer, hotPhone)).json.code, "RATE_LIMITED");
  pass("per-phone hourly send limit enforced");

  const ipHash = crypto.createHmac("sha256", process.env.PHONE_OTP_SECRET).update(`ip:${freelancer.ip}`).digest("hex").slice(0, 32);
  await admin.from("phone_otp_send_log").insert(
    Array.from({ length: 15 }, () => ({ user_id: xu.id, phone_number: randomPhone(), ip_hash: ipHash, created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() }))
  );
  await skipCooldown(fu.id);
  assert.equal((await send(freelancer, randomPhone())).json.code, "RATE_LIMITED");
  pass("per-IP hourly send limit enforced");

  section("Direct database access from the browser session");
  const pv = await client.client.from("phone_verifications").select("*");
  assert.ok(pv.error || (pv.data ?? []).length === 0, "pending OTP rows must not be readable");
  const pvAll = await other.client.from("phone_verifications").select("*").eq("user_id", xu.id);
  assert.ok(pvAll.error || (pvAll.data ?? []).length === 0);
  const logRead = await client.client.from("phone_otp_send_log").select("*");
  assert.ok(logRead.error || (logRead.data ?? []).length === 0);
  pass("users cannot read any phone_verifications / send-log rows");

  const flip = await other2.client.from("users").update({ phone_verified: true, phone_number: randomPhone() }).eq("id", yu.id).select();
  assert.ok(flip.error, "authenticated user must not set phone_verified");
  const { data: still } = await admin.from("users").select("phone_verified").eq("id", yu.id).single();
  assert.equal(still.phone_verified, false);
  pass("users cannot set their own phone_verified / phone_number");

  const unverify = await client.client.from("users").update({ phone_verified: false }).eq("id", cu.id).select();
  assert.ok(unverify.error);
  const rename = await client.client.from("users").update({ name: "Renamed Client" }).eq("id", cu.id).select();
  assert.ifError(rename.error);
  pass("other profile fields remain user-editable");

  const steal = await other.client.from("users").update({ phone_verified: true }).eq("id", cu.id).select();
  assert.ok(steal.error || (steal.data ?? []).length === 0);
  pass("users cannot modify another user's verification");

  const rpc = await client.client.rpc("phone_otp_complete", { p_user_id: cu.id, p_otp_hash: "x" });
  assert.ok(rpc.error, "OTP RPCs must not be callable by authenticated users");
  pass("OTP database functions are service-role only");

  console.log(`\nAll ${passed} phone verification checks passed.`);
};

run().catch((e) => {
  console.error("\nFAILED:", e);
  process.exit(1);
});
