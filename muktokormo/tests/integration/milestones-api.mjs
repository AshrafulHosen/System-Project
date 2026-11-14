/**
 * Milestone contracts — end-to-end HTTP API test.
 *
 * Runs ONLY against a LOCAL Supabase (refuses any other URL) and a Next.js server
 * built against it. Exercises the real API routes with real signed-in sessions:
 *   [REAL NEXT.JS HTTP API]      -> http://localhost:<port>/api/...
 *   [REAL LOCAL SUPABASE]        -> auth, RLS, triggers, RPCs
 *   [REAL SANDBOX GATEWAY]       -> SSLCOMMERZ sandbox session creation (initiate)
 *   [ISOLATED VALIDATOR STUB]    -> only the SSLCOMMERZ *validation* response is stubbed,
 *                                   because the hosted OTP page can't be clicked headlessly;
 *                                   the real verifyAndSettlePayment + RPC still run.
 *
 *   node --env-file=.env.local --import ./tests/loader-alias.mjs tests/integration/milestones-api.mjs
 *   (with NEXT_PUBLIC_SUPABASE_URL / keys overridden to the local stack, see README in the test header)
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { verifyAndSettlePayment } from "../../src/lib/payments/callbacks.ts";

const BASE_URL = (process.env.TEST_BASE_URL || "http://localhost:3200").replace(/\/+$/, "");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

assert.ok(SUPABASE_URL && ANON && SERVICE, "Supabase env vars are required.");
assert.ok(
  /^http:\/\/(127\.0\.0\.1|localhost):\d+/.test(SUPABASE_URL),
  `Refusing to run: NEXT_PUBLIC_SUPABASE_URL (${SUPABASE_URL}) is not a local Supabase.`
);

const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
let passed = 0;
const pass = (m) => { passed += 1; console.log(`  PASS: ${m}`); };
const section = (t) => console.log(`\n=== ${t} ===`);

async function session(email, password) {
  const jar = new Map();
  const client = createServerClient(SUPABASE_URL, ANON, {
    cookies: {
      getAll: () => Array.from(jar.entries()).map(([name, value]) => ({ name, value })),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          if (value === "" || options?.maxAge === 0) jar.delete(name);
          else jar.set(name, value);
        }
      },
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  assert.ifError(error);
  return () => Array.from(jar.entries()).map(([n, v]) => `${n}=${v}`).join("; ");
}

async function api(path, { method = "GET", cookie, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { ...(cookie ? { Cookie: cookie() } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

async function withValidatorStub(payload, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) =>
    String(url).startsWith("https://sandbox.sslcommerz.com/validator/api/")
      ? new Response(JSON.stringify(payload), { status: 200 })
      : original(url, init);
  try { return await fn(); } finally { globalThis.fetch = original; }
}

async function makeUser(role) {
  const email = `ms-${role}-${crypto.randomUUID().slice(0, 8)}@test.local`;
  const password = `Pw-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: `MS ${role}` },
  });
  assert.ifError(error);
  return { id: data.user.id, email, password };
}

const run = async () => {
  section("Fixtures (local DB)");
  const [cu, fu, au, ou] = await Promise.all(["client", "freelancer", "admin", "outsider"].map(makeUser));
  const { data: cl } = await admin.from("clients").insert({ user_id: cu.id }).select("id").single();
  const { data: fl } = await admin.from("freelancers").insert({ user_id: fu.id, skills: ["Next.js"] }).select("id").single();
  await admin.from("admins").insert({ user_id: au.id });
  const { data: pr } = await admin.from("projects")
    .insert({ client_id: cl.id, title: "Milestone API test", description: "API level milestone test project.", status: "in_progress" })
    .select("id").single();
  const { data: pp } = await admin.from("proposals")
    .insert({ project_id: pr.id, freelancer_id: fl.id, cover_letter: "Cover", bid_amount: 25000, status: "accepted" })
    .select("id").single();
  const { data: ct, error: ctErr } = await admin.from("contracts")
    .insert({ proposal_id: pp.id, total_amount: 25000, status: "active", project_id: pr.id, client_id: cl.id, freelancer_id: fl.id })
    .select("id").single();
  assert.ifError(ctErr);
  pass("users, profiles, project, proposal and contract created");

  const [client, freelancer, adminS, outsider] = await Promise.all(
    [cu, fu, au, ou].map((u) => session(u.email, u.password))
  );
  pass("4 real authenticated sessions");

  section("Access control");
  let r = await api(`/api/contracts/${ct.id}/milestones`);
  assert.equal(r.status, 401); pass("anonymous GET → 401");
  r = await api(`/api/contracts/${ct.id}/milestones`, { cookie: outsider });
  assert.equal(r.status, 403); pass("outsider GET → 403");
  r = await api(`/api/contracts/${ct.id}/milestones`, { cookie: client });
  assert.equal(r.status, 200);
  assert.equal(r.json.contract.billingMode, "SINGLE");
  assert.equal(r.json.contract.canConvertToMilestones, true);
  pass("client sees SINGLE contract that can be converted");

  section("Plan agreement");
  const plan = {
    milestones: [
      { title: "Wireframes", amount: 10000, deliverables: ["Figma link"], deadline: "2026-12-10" },
      { title: "Build", amount: 15000 },
    ],
  };
  r = await api(`/api/contracts/${ct.id}/milestones`, { method: "POST", cookie: freelancer, body: { action: "propose_plan", payload: plan } });
  assert.equal(r.status, 403); pass("freelancer cannot propose plan → 403");
  r = await api(`/api/contracts/${ct.id}/milestones`, { method: "POST", cookie: client, body: { action: "drop_table", payload: {} } });
  assert.equal(r.status, 400); pass("unknown action → 400");
  r = await api(`/api/contracts/${ct.id}/milestones`, { method: "POST", cookie: client, body: { action: "propose_plan", payload: plan } });
  assert.equal(r.status, 200, JSON.stringify(r.json)); pass("client proposes plan");
  r = await api(`/api/contracts/${ct.id}/milestones`, { method: "POST", cookie: freelancer, body: { action: "accept_plan" } });
  assert.equal(r.status, 200); pass("freelancer accepts plan");

  r = await api(`/api/contracts/${ct.id}/milestones`, { cookie: freelancer });
  const [m1, m2] = r.json.milestones;
  assert.equal(r.json.contract.billingMode, "MILESTONE");
  assert.equal(r.json.contract.totalAmount, 25000);
  pass("contract is MILESTONE with total ৳25,000");

  section("Legacy whole-contract routes are closed");
  for (const route of ["start-work", "submit-work", "request-revision", "approve-release"]) {
    r = await api(`/api/contracts/${ct.id}/${route}`, { method: "POST", cookie: route === "start-work" || route === "submit-work" ? freelancer : client, body: { notes: "Trying the legacy route", feedback: "Trying the legacy route here" } });
    assert.equal(r.status, 409, `${route}: ${r.status} ${JSON.stringify(r.json)}`);
    assert.equal(r.json.code, "MILESTONE_CONTRACT");
  }
  pass("start-work / submit-work / request-revision / approve-release → 409 MILESTONE_CONTRACT");

  section("Funding a milestone");
  r = await api(`/api/payments/initiate`, { method: "POST", cookie: client, body: { contractId: ct.id } });
  assert.equal(r.status, 400); pass("initiate without milestoneId → 400");
  r = await api(`/api/payments/initiate`, { method: "POST", cookie: freelancer, body: { contractId: ct.id, milestoneId: m1.id } });
  assert.equal(r.status, 403); pass("freelancer cannot fund → 403");
  r = await api(`/api/payments/initiate`, { method: "POST", cookie: client, body: { contractId: ct.id, milestoneId: m1.id } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.amount, 10000);
  assert.equal(r.json.milestoneId, m1.id);
  assert.match(r.json.gatewayPageUrl, /^https:\/\/sandbox\.sslcommerz\.com\//);
  const tran = r.json.transactionId;
  pass(`real SSLCOMMERZ sandbox session created for ৳10,000 (${tran})`);

  r = await api(`/api/payments/initiate`, { method: "POST", cookie: client, body: { contractId: ct.id, milestoneId: m1.id } });
  assert.equal(r.status, 429); pass("double-click within 5s → 429");

  const tampered = await withValidatorStub(
    { status: "VALID", tran_id: tran, val_id: "V1", bank_tran_id: "B1", amount: "1.00", currency_type: "BDT" },
    () => verifyAndSettlePayment({ tranId: tran, valId: "V1", eventType: "IPN_CALLBACK" })
  );
  assert.equal(tampered.ok, false); pass("validator amount mismatch does not fund");

  const settled = await withValidatorStub(
    { status: "VALID", tran_id: tran, val_id: "V1", bank_tran_id: "B1", amount: "10000.00", currency_type: "BDT" },
    () => verifyAndSettlePayment({ tranId: tran, valId: "V1", eventType: "IPN_CALLBACK" })
  );
  assert.equal(settled.ok, true, JSON.stringify(settled)); pass("validated payment settles through real callback + RPC");

  r = await api(`/api/contracts/${ct.id}/milestones`, { cookie: client });
  assert.equal(r.json.milestones.find((m) => m.id === m1.id).status, "FUNDED");
  assert.equal(r.json.milestones.find((m) => m.id === m2.id).status, "PENDING");
  assert.equal(r.json.contract.fundedAmount, 10000);
  pass("only milestone 1 is funded; contract funded ৳10,000");

  r = await api(`/api/payments/initiate`, { method: "POST", cookie: client, body: { contractId: ct.id, milestoneId: m1.id } });
  assert.equal(r.status, 409); pass("funding an already-funded milestone → 409");

  section("Delivery, revision, approval, release");
  r = await api(`/api/milestones/${m1.id}`, { method: "POST", cookie: freelancer, body: { action: "release" } });
  assert.equal(r.status, 403); pass("freelancer cannot release → 403");
  r = await api(`/api/milestones/${m1.id}`, { method: "POST", cookie: freelancer, body: { action: "start" } });
  assert.equal(r.status, 200); pass("freelancer starts milestone 1");
  r = await api(`/api/milestones/${m1.id}`, { method: "POST", cookie: freelancer, body: { action: "submit", payload: { message: "Wireframes ready", attachments: ["javascript:alert(1)"] } } });
  assert.equal(r.status, 400); pass("javascript: attachment rejected by API → 400");
  r = await api(`/api/milestones/${m1.id}`, { method: "POST", cookie: freelancer, body: { action: "submit", payload: { message: "Wireframes ready", demo_url: "https://example.com/figma", attachments: ["https://example.com/pdf"] } } });
  assert.equal(r.status, 200); pass("freelancer submits milestone 1");
  r = await api(`/api/milestones/${m1.id}`, { method: "POST", cookie: client, body: { action: "request_revision", payload: { message: "Add the mobile breakpoints please." } } });
  assert.equal(r.status, 200); pass("client requests revision");
  r = await api(`/api/milestones/${m1.id}`, { method: "POST", cookie: freelancer, body: { action: "submit", payload: { message: "Mobile breakpoints added." } } });
  assert.equal(r.json.result.revision_number, 2); pass("resubmission is revision 2");
  r = await api(`/api/milestones/${m1.id}`, { method: "POST", cookie: client, body: { action: "approve" } });
  assert.equal(r.status, 200); pass("client approves");
  r = await api(`/api/milestones/${m1.id}`, { method: "POST", cookie: client, body: { action: "release" } });
  assert.equal(r.status, 200);
  assert.equal(Number(r.json.result.platform_fee), 700);
  assert.equal(Number(r.json.result.freelancer_net), 9300);
  pass("client releases: fee ৳700 (7%), freelancer ৳9,300");
  r = await api(`/api/milestones/${m1.id}`, { method: "POST", cookie: client, body: { action: "release" } });
  assert.equal(r.status, 409); pass("second release → 409");

  const { data: flRow } = await admin.from("freelancers").select("earned_bdt").eq("id", fl.id).single();
  assert.equal(Number(flRow.earned_bdt), 9300); pass("freelancer earnings credited exactly once");

  section("Dispute & admin resolution");
  // fund milestone 2 the same verified way
  r = await api(`/api/payments/initiate`, { method: "POST", cookie: client, body: { contractId: ct.id, milestoneId: m2.id } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const tran2 = r.json.transactionId;
  const s2 = await withValidatorStub(
    { status: "VALID", tran_id: tran2, val_id: "V2", bank_tran_id: "B2", amount: "15000.00", currency_type: "BDT" },
    () => verifyAndSettlePayment({ tranId: tran2, valId: "V2", eventType: "IPN_CALLBACK" })
  );
  assert.equal(s2.ok, true); pass("milestone 2 funded (verified)");

  r = await api(`/api/milestones/${m2.id}`, { method: "POST", cookie: freelancer, body: { action: "raise_dispute", payload: { message: "Client changed scope after funding." } } });
  assert.equal(r.status, 200); pass("freelancer opens dispute");
  r = await api(`/api/admin/disputes?status=OPEN`, { cookie: client });
  assert.equal(r.status, 403); pass("client cannot read admin dispute queue → 403");
  r = await api(`/api/admin/disputes?status=OPEN`, { cookie: adminS });
  const dispute = r.json.disputes.find((d) => d.milestone_id === m2.id);
  assert.ok(dispute); assert.ok(r.json.submissions !== undefined); pass("admin sees the dispute in the queue");
  r = await api(`/api/admin/disputes/${dispute.id}`, { method: "POST", cookie: client, body: { resolution: "REFUND_TO_CLIENT", notes: "Client trying to refund self." } });
  assert.equal(r.status, 403); pass("client cannot resolve disputes → 403");
  r = await api(`/api/admin/disputes/${dispute.id}`, { method: "POST", cookie: adminS, body: { resolution: "RELEASE_TO_FREELANCER", notes: "Scope change was agreed in chat; work is complete." } });
  assert.equal(r.status, 200, JSON.stringify(r.json)); pass("admin releases disputed milestone to freelancer");

  r = await api(`/api/contracts/${ct.id}/milestones`, { cookie: client });
  assert.equal(r.json.contract.paymentStatus, "RELEASED");
  assert.equal(r.json.contract.status.toLowerCase(), "completed");
  assert.equal(r.json.contract.releasedAmount, 25000);
  pass("contract completed, ৳25,000 released");

  const { data: ledger } = await admin.from("escrow_ledger").select("entry_type, milestone_id").eq("contract_id", ct.id);
  assert.equal(ledger.filter((l) => l.entry_type === "FUND").length, 2);
  assert.equal(ledger.filter((l) => l.entry_type === "RELEASE").length, 2);
  assert.ok(ledger.every((l) => l.milestone_id)); pass("ledger: 2 FUND + 2 RELEASE, every entry linked to a milestone");

  const { data: notes } = await admin.from("notifications").select("event_key").eq("user_id", cu.id);
  assert.ok(notes.some((n) => n.event_key.startsWith("contract_completed_client:"))); pass("client notified: contract completed, review available");

  console.log(`\nALL ${passed} MILESTONE API CHECKS PASSED`);
};

run().catch((err) => {
  console.error("\nFAILED:", err?.message || err);
  process.exit(1);
});
