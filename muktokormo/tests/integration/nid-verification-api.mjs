/**
 * Manual NID verification — end-to-end HTTP + Storage test (LOCAL Supabase only).
 *   node --env-file=.env.local tests/integration/nid-verification-api.mjs
 *   (Supabase env vars overridden to the local stack, which must include Storage;
 *    TEST_BASE_URL → a local Next server.)
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

const BUCKET = "nid-documents";
const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
let passed = 0;
const pass = (m) => { passed += 1; console.log(`  PASS: ${m}`); };
const section = (t) => console.log(`\n=== ${t} ===`);

// Minimal byte payloads with real magic numbers.
const pad = (head, size = 2048) => {
  const b = Buffer.alloc(size, 0x41);
  head.copy(b, 0);
  return b;
};
const JPEG = pad(Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
const PNG = pad(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const WEBP = pad(Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]));
const TEXT = Buffer.from("this is definitely not an image ".repeat(40));

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
  return { client: c, cookie: () => Array.from(jar.entries()).map(([n, v]) => `${n}=${v}`).join("; ") };
}

async function api(path, { method = "GET", s, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { ...(s ? { Cookie: s.cookie() } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* */ }
  return { status: res.status, json };
}

async function makeUser(role) {
  const email = `nid-${role}-${crypto.randomUUID().slice(0, 8)}@test.local`;
  const password = `Pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Nid ${role} Person` } });
  assert.ifError(error);
  const id = data.user.id;
  if (role.startsWith("client")) await admin.from("clients").insert({ user_id: id });
  if (role.startsWith("freelancer")) await admin.from("freelancers").insert({ user_id: id });
  if (role === "admin") await admin.from("admins").insert({ user_id: id });
  return { id, email, password };
}

const mint = (s, front = "image/jpeg", back = "image/png", size = 2048) =>
  api("/api/nid/upload-url", {
    method: "POST",
    s,
    body: { files: [{ side: "front", contentType: front, size }, { side: "back", contentType: back, size }] },
  });

async function put(signedUrl, bytes, type) {
  const res = await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": type, "x-upsert": "true" }, body: bytes });
  return res.status;
}

/** Full browser flow: mint → upload both → submit. */
async function submitFlow(s, { front = JPEG, back = PNG, frontType = "image/jpeg", backType = "image/png" } = {}) {
  const m = await mint(s, frontType, backType);
  assert.equal(m.status, 200, JSON.stringify(m.json));
  assert.ok((await put(m.json.uploads.front.signedUrl, front, frontType)) < 300);
  assert.ok((await put(m.json.uploads.back.signedUrl, back, backType)) < 300);
  const r = await api("/api/nid/submit", {
    method: "POST",
    s,
    body: { submissionId: m.json.submissionId, frontPath: m.json.uploads.front.path, backPath: m.json.uploads.back.path, consent: true },
  });
  return { mint: m.json, res: r };
}

const objectExists = async (path) => {
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  return !error && Boolean(data);
};

const run = async () => {
  section("Fixtures + bucket");
  const [cu, fu, au, ou, c2u] = await Promise.all(["client", "freelancer", "admin", "outsider-none", "client2"].map(makeUser));
  const [client, freelancer, adminS, outsider, client2] = await Promise.all([cu, fu, au, ou, c2u].map((u) => session(u.email, u.password)));
  const { data: bucket } = await admin.storage.getBucket(BUCKET);
  assert.equal(bucket.public, false);
  assert.equal(bucket.file_size_limit, 5242880);
  assert.deepEqual([...bucket.allowed_mime_types].sort(), ["image/jpeg", "image/png", "image/webp"]);
  pass("private nid-documents bucket: 5 MB, JPEG/PNG/WebP only");

  section("Validation");
  assert.equal((await api("/api/nid/status")).status, 401);
  assert.equal((await mint(null)).status, 401);
  assert.equal((await api("/api/nid/submit", { method: "POST", body: {} })).status, 401);
  pass("unauthenticated requests rejected");

  const st0 = await api("/api/nid/status", { s: client });
  assert.equal(st0.json.status, "not_verified");
  assert.equal(st0.json.canSubmit, true);
  pass("new client starts Not Verified and may submit");

  assert.equal((await mint(adminS)).json.code, "ROLE_NOT_ALLOWED");
  assert.equal((await mint(outsider)).json.code, "ROLE_NOT_ALLOWED");
  pass("admins and accounts without a client/freelancer profile cannot submit");

  for (const bad of ["image/gif", "application/pdf", "image/svg+xml", "text/plain"]) {
    assert.equal((await mint(client, bad)).json.code, "INVALID_FILE", bad);
  }
  pass("unsupported MIME types rejected by the API");
  const big = await mint(client, "image/jpeg", "image/png", 5 * 1024 * 1024 + 1);
  assert.equal(big.status, 413);
  assert.equal(big.json.code, "FILE_TOO_LARGE");
  pass("declared size over 5 MB rejected by the API");

  const m0 = await mint(client);
  const oversize = await put(m0.json.uploads.front.signedUrl, Buffer.alloc(5 * 1024 * 1024 + 10, 0xff), "image/jpeg");
  assert.ok(oversize >= 400, `oversize upload got ${oversize}`);
  const gif = await put(m0.json.uploads.back.signedUrl, Buffer.from("GIF89a"), "image/gif");
  assert.ok(gif >= 400, `gif upload got ${gif}`);
  pass("Storage itself refuses > 5 MB and non-image uploads even with a valid token");

  const mismatch = await submitFlow(client, { front: TEXT, frontType: "image/jpeg" });
  assert.equal(mismatch.res.status, 400);
  assert.equal(mismatch.res.json.code, "INVALID_FILE");
  assert.equal(await objectExists(mismatch.mint.uploads.front.path), false);
  assert.equal(await objectExists(mismatch.mint.uploads.back.path), false);
  pass("content that is not a real image (magic-byte check) rejected and deleted");

  const noConsent = await api("/api/nid/submit", { method: "POST", s: client, body: { submissionId: crypto.randomUUID(), frontPath: "x", backPath: "y" } });
  assert.equal(noConsent.json.code, "CONSENT_REQUIRED");
  pass("submission without consent rejected");

  section("Ownership + duplicates");
  const fm = await mint(freelancer);
  const stolen = await api("/api/nid/submit", {
    method: "POST",
    s: client,
    body: { submissionId: fm.json.submissionId, frontPath: fm.json.uploads.front.path, backPath: fm.json.uploads.back.path, consent: true },
  });
  assert.equal(stolen.status, 400);
  pass("cannot submit files from another user's folder");

  const a = await mint(client2);
  const b = await mint(client2);
  for (const m of [a, b]) {
    await put(m.json.uploads.front.signedUrl, JPEG, "image/jpeg");
    await put(m.json.uploads.back.signedUrl, PNG, "image/png");
  }
  const race = await Promise.all(
    [a, b].map((m) =>
      api("/api/nid/submit", {
        method: "POST",
        s: client2,
        body: { submissionId: m.json.submissionId, frontPath: m.json.uploads.front.path, backPath: m.json.uploads.back.path, consent: true },
      })
    )
  );
  const statuses = race.map((r) => r.status).sort();
  assert.deepEqual(statuses, [200, 409], JSON.stringify(race.map((r) => r.json)));
  const { count: pendingCount } = await admin.from("nid_verifications").select("*", { count: "exact", head: true }).eq("user_id", c2u.id).eq("status", "pending");
  assert.equal(pendingCount, 1);
  pass("two concurrent submissions → exactly one pending record");
  assert.equal((await mint(client2)).json.code, "PENDING_EXISTS");
  pass("further submissions blocked while one is pending");

  section("Client + freelancer submit");
  const cs = await submitFlow(client);
  assert.equal(cs.res.status, 200, JSON.stringify(cs.res.json));
  const fs1 = await submitFlow(freelancer, { front: WEBP, frontType: "image/webp", back: JPEG, backType: "image/jpeg" });
  assert.equal(fs1.res.status, 200, JSON.stringify(fs1.res.json));
  assert.match(cs.mint.uploads.front.path, new RegExp(`^${cu.id}/[0-9a-f-]{36}/nid-front\\.jpg$`));
  assert.match(fs1.mint.uploads.front.path, /nid-front\.webp$/);
  pass("client (JPEG+PNG) and freelancer (WebP+JPEG) submissions stored as <user>/<submission>/nid-<side>.<ext>");

  const st1 = await api("/api/nid/status", { s: client });
  assert.equal(st1.json.status, "pending");
  assert.equal(st1.json.canSubmit, false);
  assert.ok(st1.json.submittedAt);
  assert.ok(!JSON.stringify(st1.json).includes(cu.id + "/"), "status must not expose document paths");
  pass("status shows Pending Review with date and no document paths");

  const { data: subNote } = await admin.from("notifications").select("title").eq("user_id", cu.id).like("event_key", "nid_submitted:%");
  assert.equal(subNote.length, 1);
  pass("submission confirmation notification created");

  section("Private storage");
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${cs.mint.uploads.front.path}`;
  assert.ok((await fetch(publicUrl)).status >= 400);
  pass("no public URL access");
  const own = await client.client.storage.from(BUCKET).download(cs.mint.uploads.front.path);
  assert.ok(own.error, "owner cannot read raw object either (server-only access)");
  const other = await freelancer.client.storage.from(BUCKET).download(cs.mint.uploads.front.path);
  assert.ok(other.error);
  const listed = await freelancer.client.storage.from(BUCKET).list(cu.id);
  assert.ok(listed.error || (listed.data ?? []).length === 0);
  const signAttempt = await freelancer.client.storage.from(BUCKET).createSignedUrl(cs.mint.uploads.front.path, 60);
  assert.ok(signAttempt.error);
  const upAttempt = await freelancer.client.storage.from(BUCKET).upload(`${cu.id}/evil/nid-front.jpg`, JPEG, { contentType: "image/jpeg" });
  assert.ok(upAttempt.error);
  pass("users cannot read, list, sign or write other users' NID objects");

  section("Admin API authorization");
  for (const s of [client, freelancer, outsider]) {
    assert.equal((await api("/api/nid/admin/requests", { s })).status, 403);
    assert.equal((await api(`/api/nid/admin/documents/${st1.json ? cs.mint.submissionId : ""}`, { s })).status, 403);
    assert.equal((await api("/api/nid/admin/review", { method: "POST", s, body: { verificationId: cs.mint.submissionId, decision: "approved" } })).status, 403);
    assert.equal((await api("/api/nid/admin/retention", { method: "POST", s })).status, 403);
  }
  assert.equal((await api("/api/nid/admin/requests")).status, 401);
  pass("non-admins get 403 on every admin endpoint");

  section("Admin list + filters + search");
  const pend = await api("/api/nid/admin/requests?status=pending&pageSize=50", { s: adminS });
  assert.equal(pend.status, 200);
  const ids = pend.json.rows.map((r) => r.id);
  assert.ok(ids.includes(cs.mint.submissionId) && ids.includes(fs1.mint.submissionId));
  pass("admin sees pending submissions");
  const onlyFl = await api("/api/nid/admin/requests?role=freelancer&pageSize=50", { s: adminS });
  assert.ok(onlyFl.json.rows.every((r) => r.role === "freelancer"));
  assert.ok(onlyFl.json.rows.some((r) => r.id === fs1.mint.submissionId));
  const onlyCl = await api("/api/nid/admin/requests?role=client&pageSize=50", { s: adminS });
  assert.ok(onlyCl.json.rows.every((r) => r.role === "client"));
  pass("role filters return only clients / only freelancers");
  const search = await api(`/api/nid/admin/requests?q=${encodeURIComponent(fu.email)}`, { s: adminS });
  assert.equal(search.json.rows.length, 1);
  assert.equal(search.json.rows[0].email, fu.email);
  const byName = await api(`/api/nid/admin/requests?q=${encodeURIComponent("Nid freelancer")}&pageSize=50`, { s: adminS });
  assert.ok(byName.json.rows.some((r) => r.userId === fu.id));
  assert.equal((await api("/api/nid/admin/requests?status=bogus", { s: adminS })).status, 400);
  pass("search by email and name works; invalid filters rejected");

  section("Document review");
  const docs = await api(`/api/nid/admin/documents/${fs1.mint.submissionId}`, { s: adminS });
  assert.equal(docs.status, 200, JSON.stringify(docs.json));
  assert.match(docs.json.documents.front, /token=/);
  assert.equal(docs.json.documents.expiresInSeconds, 120);
  const img = await fetch(docs.json.documents.front);
  assert.equal(img.status, 200);
  assert.equal(Buffer.from(await img.arrayBuffer()).subarray(8, 12).toString(), "WEBP");
  assert.equal(docs.json.submission.email, fu.email);
  pass("admin gets working short-lived signed URLs plus account info");
  const { count: views } = await admin.from("nid_verification_events").select("*", { count: "exact", head: true }).eq("verification_id", fs1.mint.submissionId).eq("event", "documents_viewed");
  assert.equal(views, 1);
  pass("document view recorded in audit log");

  section("Approve");
  const ap = await api("/api/nid/admin/review", { method: "POST", s: adminS, body: { verificationId: fs1.mint.submissionId, decision: "approved" } });
  assert.equal(ap.status, 200, JSON.stringify(ap.json));
  const { data: apRow } = await admin.from("nid_verifications").select("status, reviewed_by, reviewed_at, rejection_reason").eq("id", fs1.mint.submissionId).single();
  assert.equal(apRow.status, "approved");
  assert.equal(apRow.reviewed_by, au.id);
  assert.ok(apRow.reviewed_at);
  assert.equal(apRow.rejection_reason, null);
  pass("approval records status, reviewer id and timestamp");
  const fst = await api("/api/nid/status", { s: freelancer });
  assert.equal(fst.json.status, "approved");
  const { data: flRow } = await createClient(SUPABASE_URL, ANON).from("freelancers").select("is_nid_verified").eq("user_id", fu.id).single();
  assert.equal(flRow.is_nid_verified, true);
  pass("freelancer sees Identity Verified and public profile flag is set");
  const { data: apNote } = await admin.from("notifications").select("id").eq("user_id", fu.id).like("event_key", "nid_approved:%");
  assert.equal(apNote.length, 1);
  pass("approval notification sent");
  const again = await api("/api/nid/admin/review", { method: "POST", s: adminS, body: { verificationId: fs1.mint.submissionId, decision: "rejected", rejectionReason: "Trying to flip it afterwards." } });
  assert.equal(again.json.code, "ALREADY_REVIEWED");
  pass("a reviewed submission cannot be reviewed again");
  assert.equal((await mint(freelancer)).json.code, "ALREADY_VERIFIED");
  pass("approved users cannot submit again");

  section("Reject + resubmit");
  const noReason = await api("/api/nid/admin/review", { method: "POST", s: adminS, body: { verificationId: cs.mint.submissionId, decision: "rejected" } });
  assert.equal(noReason.json.code, "REASON_REQUIRED");
  const shortReason = await api("/api/nid/admin/review", { method: "POST", s: adminS, body: { verificationId: cs.mint.submissionId, decision: "rejected", rejectionReason: "blurry" } });
  assert.equal(shortReason.json.code, "REASON_REQUIRED");
  pass("rejection requires a 10–500 character reason");
  const reason = "The image is blurry or unreadable. Please upload a clearer photo of the card.";
  const rj = await api("/api/nid/admin/review", { method: "POST", s: adminS, body: { verificationId: cs.mint.submissionId, decision: "rejected", rejectionReason: reason } });
  assert.equal(rj.status, 200);
  const cst = await api("/api/nid/status", { s: client });
  assert.equal(cst.json.status, "rejected");
  assert.equal(cst.json.rejectionReason, reason);
  assert.equal(cst.json.canSubmit, true);
  const { data: clRow } = await admin.from("clients").select("is_verified").eq("user_id", cu.id).single();
  assert.equal(clRow.is_verified, false);
  const { data: rjNote } = await admin.from("notifications").select("message").eq("user_id", cu.id).like("event_key", "nid_rejected:%").single();
  assert.ok(rjNote.message.includes(reason));
  pass("rejected client sees the reason, keeps no badge, and is notified with the reason");

  const resub = await submitFlow(client);
  assert.equal(resub.res.status, 200, JSON.stringify(resub.res.json));
  assert.equal((await api("/api/nid/status", { s: client })).json.status, "pending");
  assert.equal(await objectExists(cs.mint.uploads.front.path), false);
  assert.equal(await objectExists(cs.mint.uploads.back.path), false);
  const { data: oldRow } = await admin.from("nid_verifications").select("status, rejection_reason, documents_deleted_at, front_image_path").eq("id", cs.mint.submissionId).single();
  assert.equal(oldRow.status, "rejected");
  assert.equal(oldRow.rejection_reason, reason);
  assert.ok(oldRow.documents_deleted_at);
  assert.equal(oldRow.front_image_path, null);
  pass("resubmission works; rejected images deleted but review history kept");
  const hist = await api(`/api/nid/admin/documents/${resub.mint.submissionId}`, { s: adminS });
  assert.equal(hist.json.history.length, 1);
  assert.equal(hist.json.history[0].rejectionReason, reason);
  assert.ok(hist.json.history[0].reviewedByName);
  pass("admin review shows previous review information");

  const ap2 = await api("/api/nid/admin/review", { method: "POST", s: adminS, body: { verificationId: resub.mint.submissionId, decision: "approved" } });
  assert.equal(ap2.status, 200);
  const { data: clRow2 } = await createClient(SUPABASE_URL, ANON).from("clients").select("is_verified").eq("user_id", cu.id).single();
  assert.equal(clRow2.is_verified, true);
  pass("approved client's public 'Identity Verified' flag set");

  section("Tamper resistance");
  const upd = await client2.client.from("nid_verifications").update({ status: "approved", reviewed_by: c2u.id }).eq("user_id", c2u.id).select();
  assert.ok(upd.error || (upd.data ?? []).length === 0);
  const ins = await client2.client.from("nid_verifications").insert({ user_id: c2u.id, user_role: "client", status: "approved", consent_at: new Date().toISOString(), reviewed_at: new Date().toISOString(), front_image_path: "a", back_image_path: "b" });
  assert.ok(ins.error);
  const del = await client2.client.from("nid_verifications").delete().eq("user_id", c2u.id).select();
  assert.ok(del.error || (del.data ?? []).length === 0);
  const { data: c2rows } = await admin.from("nid_verifications").select("status").eq("user_id", c2u.id);
  assert.deepEqual(c2rows.map((r) => r.status), ["pending"]);
  pass("users cannot update, insert or delete verification records");

  const flFlag = await client2.client.from("clients").update({ is_verified: true }).eq("user_id", c2u.id).select();
  assert.ok(flFlag.error);
  const fakeFl = await makeUser("freelancer-cheat");
  const cheat = await session(fakeFl.email, fakeFl.password);
  const cheatUpd = await cheat.client.from("freelancers").update({ is_nid_verified: true }).eq("user_id", fakeFl.id).select();
  assert.ok(cheatUpd.error);
  const titleUpd = await cheat.client.from("freelancers").update({ title: "Still editable" }).eq("user_id", fakeFl.id).select();
  assert.ifError(titleUpd.error);
  pass("users cannot set their own Identity Verified flags; other profile fields stay editable");

  const readOther = await client.client.from("nid_verifications").select("id").eq("user_id", c2u.id);
  assert.equal((readOther.data ?? []).length, 0);
  const readOwn = await client.client.from("nid_verifications").select("id").eq("user_id", cu.id);
  assert.equal(readOwn.data.length, 2);
  pass("RLS: users read only their own records");

  const rpc = await client.client.rpc("nid_review", { p_admin_user_id: au.id, p_verification: a.json.submissionId, p_decision: "approved", p_reason: null });
  assert.ok(rpc.error);
  pass("review RPC not callable from browser sessions");

  // Self-review guard: an admin's own (directly inserted) record.
  const selfId = crypto.randomUUID();
  await admin.from("nid_verifications").insert({ id: selfId, user_id: au.id, user_role: "client", front_image_path: "x/a", back_image_path: "x/b", consent_at: new Date().toISOString() });
  const self = await api("/api/nid/admin/review", { method: "POST", s: adminS, body: { verificationId: selfId, decision: "approved" } });
  assert.equal(self.json.code, "SELF_REVIEW");
  await admin.from("nid_verifications").delete().eq("id", selfId);
  pass("admins cannot approve their own submission");

  section("Retention");
  await admin.from("nid_verifications").update({ reviewed_at: new Date(Date.now() - 100 * 86400000).toISOString() }).eq("id", fs1.mint.submissionId);
  const orphan = await mint(cheat);
  assert.equal(orphan.status, 200, JSON.stringify(orphan.json));
  await put(orphan.json.uploads.front.signedUrl, JPEG, "image/jpeg");
  const { data: orphanCandidates } = await admin.rpc("nid_retention_candidates", { p_approved_days: 90, p_rejected_days: 30, p_orphan_hours: 0 });
  assert.ok(orphanCandidates.some((r) => r.verification_id === null && r.object_path === orphan.json.uploads.front.path));
  pass("unattached uploads are detected as orphans");
  const ret = await api("/api/nid/admin/retention", { method: "POST", s: adminS });
  assert.equal(ret.status, 200, JSON.stringify(ret.json));
  assert.ok(ret.json.submissionsPurged >= 1);
  assert.equal(await objectExists(fs1.mint.uploads.front.path), false);
  const { data: purged } = await admin.from("nid_verifications").select("status, documents_deleted_at").eq("id", fs1.mint.submissionId).single();
  assert.equal(purged.status, "approved");
  assert.ok(purged.documents_deleted_at);
  assert.equal((await api("/api/nid/status", { s: freelancer })).json.status, "approved");
  const afterDocs = await api(`/api/nid/admin/documents/${fs1.mint.submissionId}`, { s: adminS });
  assert.equal(afterDocs.json.submission.documentsDeleted, true);
  assert.equal(afterDocs.json.documents.front, null);
  pass("expired approved images deleted; status and badge preserved");

  console.log(`\nAll ${passed} NID verification checks passed.`);
};

run().catch((e) => {
  console.error("\nFAILED:", e);
  process.exit(1);
});
