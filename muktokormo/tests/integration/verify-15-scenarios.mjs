/**
 * MuktoKormo Phase 10 — End-to-End Verification of All 15 Payment, Escrow, Work & Security Scenarios.
 *
 * Execution requirements:
 *   - Next.js app running at http://localhost:3000 (override via TEST_BASE_URL)
 *   - `node --env-file=.env.local --import ./tests/loader-alias.mjs tests/integration/verify-15-scenarios.mjs`
 *
 * Truthfulness / Labeling rules:
 *   Every test step explicitly tags whether it hits:
 *     [REAL SANDBOX GATEWAY]        -> Live HTTP calls to https://sandbox.sslcommerz.com/...
 *     [REAL NEXT.JS HTTP API]       -> Live HTTP requests to http://localhost:3000/api/...
 *     [REAL SUPABASE DB & RLS/RPC]  -> Live Supabase PostgreSQL queries, RLS, triggers, and RPCs
 *     [ISOLATED MOCK VALIDATOR STUB]-> In-process `globalThis.fetch` stub ONLY for simulating gateway
 *                                      VALID / mismatch responses against real `verifyAndSettlePayment`
 *                                      (since hosted SSLCOMMERZ OTP UI cannot be clicked headlessly).
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { verifyAndSettlePayment } from "../../src/lib/payments/callbacks.ts";

const BASE_URL = (process.env.TEST_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

assert.ok(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL must be configured.");
assert.ok(SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured.");
assert.ok(SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY must be configured.");

const adminDb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function logScenario(num, title, tags) {
  console.log(`\n=== Scenario ${String(num).padStart(2, "0")}: ${title} ${tags.join(" ")} ===`);
}

function logPass(detail) {
  console.log(`  PASS: ${detail}`);
}

async function createAuthenticatedSession(email, password) {
  const cookieJar = new Map();
  const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Array.from(cookieJar.entries()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          if (value === "" || options?.maxAge === 0) {
            cookieJar.delete(name);
          } else {
            cookieJar.set(name, value);
          }
        }
      },
    },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assert.ifError(error);
  assert.ok(data.user, `Expected authenticated user for ${email}`);

  const cookieHeader = () =>
    Array.from(cookieJar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

  return { user: data.user, supabaseClient: client, cookieHeader };
}

async function apiFetch(path, { method = "GET", cookie = "", body, headers = {}, redirect = "manual" } = {}) {
  const reqHeaders = {
    ...(cookie ? { Cookie: cookie } : {}),
    ...headers,
  };
  let reqBody;
  if (body !== undefined) {
    if (body instanceof URLSearchParams) {
      reqHeaders["Content-Type"] = "application/x-www-form-urlencoded";
      reqBody = body.toString();
    } else if (typeof body === "string") {
      reqBody = body;
    } else {
      reqHeaders["Content-Type"] = "application/json";
      reqBody = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: reqHeaders,
    body: reqBody,
    redirect,
  });

  const location = res.headers.get("location");
  let json = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    json = await res.json();
  }
  return { status: res.status, location, json, ok: res.ok };
}

async function withMockedValidatorFetch(mockFactory, fn) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const urlStr = String(url);
    if (urlStr.startsWith("https://sandbox.sslcommerz.com/validator/api/")) {
      return mockFactory(urlStr, init);
    }
    return originalFetch(url, init);
  };
  try {
    return await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function getBaselineCounts() {
  const tables = [
    "contracts",
    "payments",
    "payment_transactions",
    "escrow_ledger",
    "refund_requests",
    "notifications",
  ];
  const counts = {};
  for (const table of tables) {
    const { count, error } = await adminDb
      .from(table)
      .select("id", { count: "exact", head: true });
    assert.ifError(error);
    counts[table] = count ?? 0;
  }
  return counts;
}

async function run() {
  const runId = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const testPassword = `MkTest!${crypto.randomBytes(8).toString("hex")}`;

  const createdAuthUserIds = [];
  const createdClientIds = [];
  const createdFreelancerIds = [];
  const createdProjectIds = [];
  const createdProposalIds = [];
  const createdContractIds = [];

  const baselineCounts = await getBaselineCounts();
  console.log("Baseline table counts:", baselineCounts);

  // Quick reachability check on Next.js server
  const healthRes = await fetch(`${BASE_URL}/api/payments/ipn`);
  assert.equal(healthRes.status, 200, `Next.js server at ${BASE_URL} must be running before running integration tests.`);
  const healthJson = await healthRes.json();
  assert.equal(healthJson.sandbox, true);

  try {
    // Provision 4 temporary test users: Client A, Client B, Freelancer A, Admin Test
    const usersSpec = [
      { key: "clientA", email: `client-a-${runId}@example.com`, name: "Tariq Client A" },
      { key: "clientB", email: `client-b-${runId}@example.com`, name: "Rafi Client B" },
      { key: "freelancerA", email: `freelancer-a-${runId}@example.com`, name: "Nadia Freelancer A" },
      { key: "adminTest", email: `admin-test-${runId}@example.com`, name: "Platform Admin Test" },
    ];

    const authUsers = {};
    for (const spec of usersSpec) {
      const { data, error } = await adminDb.auth.admin.createUser({
        email: spec.email,
        password: testPassword,
        email_confirm: true,
        user_metadata: { full_name: spec.name },
      });
      assert.ifError(error);
      assert.ok(data.user);
      createdAuthUserIds.push(data.user.id);
      authUsers[spec.key] = { ...spec, id: data.user.id };

      await adminDb.from("users").upsert({
        id: data.user.id,
        email: spec.email,
        name: spec.name,
      });
    }

    const { data: clientARow, error: clAErr } = await adminDb
      .from("clients")
      .insert({
        user_id: authUsers.clientA.id,
        display_name: authUsers.clientA.name,
        company_name: "Dhaka Digital Ltd",
        location: "Banani, Dhaka",
      })
      .select("id")
      .single();
    assert.ifError(clAErr);
    createdClientIds.push(clientARow.id);

    const { data: clientBRow, error: clBErr } = await adminDb
      .from("clients")
      .insert({
        user_id: authUsers.clientB.id,
        display_name: authUsers.clientB.name,
        company_name: "Chittagong Labs",
        location: "Chattogram",
      })
      .select("id")
      .single();
    assert.ifError(clBErr);
    createdClientIds.push(clientBRow.id);

    const { data: freelancerARow, error: flAErr } = await adminDb
      .from("freelancers")
      .insert({
        user_id: authUsers.freelancerA.id,
        display_name: authUsers.freelancerA.name,
        title: "Senior Full-Stack Engineer",
        earned_bdt: 0,
      })
      .select("id, earned_bdt")
      .single();
    assert.ifError(flAErr);
    createdFreelancerIds.push(freelancerARow.id);

    const { error: admErr } = await adminDb
      .from("admins")
      .insert({ user_id: authUsers.adminTest.id, note: "Phase 10 Automated Integration Test Admin" });
    assert.ifError(admErr);

    // Create 2 projects, 2 accepted proposals, 2 active contracts for Client A + Freelancer A
    async function createContractFixture(title, amountBdt) {
      const { data: project, error: prErr } = await adminDb
        .from("projects")
        .insert({
          client_id: clientARow.id,
          title,
          description: "Automated Phase 10 integration verification contract fixture.",
          budget_min: amountBdt,
          budget_max: amountBdt,
          budget_bdt: amountBdt,
          category: "Web & App Development",
          status: "in_progress",
        })
        .select("id")
        .single();
      assert.ifError(prErr);
      createdProjectIds.push(project.id);

      const { data: proposal, error: propErr } = await adminDb
        .from("proposals")
        .insert({
          project_id: project.id,
          freelancer_id: freelancerARow.id,
          cover_letter: "Ready to execute milestone cleanly.",
          bid_amount: amountBdt,
          status: "accepted",
        })
        .select("id")
        .single();
      assert.ifError(propErr);
      createdProposalIds.push(proposal.id);

      const { data: contract, error: ctErr } = await adminDb
        .from("contracts")
        .insert({
          proposal_id: proposal.id,
          project_id: project.id,
          client_id: clientARow.id,
          freelancer_id: freelancerARow.id,
          total_amount: amountBdt,
          status: "active",
        })
        .select("id, contract_code, total_amount, platform_fee_pct, payment_status, work_status")
        .single();
      assert.ifError(ctErr);
      createdContractIds.push(contract.id);
      return contract;
    }

    const contract1 = await createContractFixture("E-Commerce Escrow Platform Build", 10000);
    const contract2 = await createContractFixture("Analytics Microservice Refund Fixture", 5000);

    // Authenticate all 4 sessions using @supabase/ssr cookies + createServerClient
    const sessClientA = await createAuthenticatedSession(authUsers.clientA.email, testPassword);
    const sessClientB = await createAuthenticatedSession(authUsers.clientB.email, testPassword);
    const sessFreelancerA = await createAuthenticatedSession(authUsers.freelancerA.email, testPassword);
    const sessAdmin = await createAuthenticatedSession(authUsers.adminTest.email, testPassword);

    // -------------------------------------------------------------------------
    // SCENARIO 1: Client initiates a payment (ignores client-spoofed amounts)
    // -------------------------------------------------------------------------
    logScenario(1, "Client initiates a payment", ["[REAL NEXT.JS HTTP API]", "[REAL SANDBOX GATEWAY]", "[REAL SUPABASE DB]"]);
    const init1 = await apiFetch("/api/payments/initiate", {
      method: "POST",
      cookie: sessClientA.cookieHeader(),
      body: {
        contractId: contract1.id,
        totalAmount: 1,
        amount: 5,
        platformFee: 0,
      },
    });
    assert.equal(init1.status, 200, `Expected 200 initiating payment, got ${init1.status}: ${JSON.stringify(init1.json)}`);
    assert.equal(init1.json.ok, true);
    assert.equal(init1.json.sandbox, true);
    assert.equal(init1.json.amount, 10000);
    assert.equal(init1.json.platformFee, 1000);
    assert.equal(init1.json.freelancerPayable, 9000);
    assert.equal(init1.json.currency, "BDT");
    assert.ok(String(init1.json.gatewayPageUrl).startsWith("https://sandbox.sslcommerz.com/"));
    const tx1 = init1.json.transactionId;
    const paymentId1 = init1.json.paymentId;
    assert.ok(tx1.startsWith("MKP-"));

    const { data: tx1Telemetry } = await adminDb
      .from("payment_transactions")
      .select("event_type, gateway_status, response_summary")
      .eq("payment_id", paymentId1)
      .single();
    assert.equal(tx1Telemetry.event_type, "INITIATE");
    assert.equal(tx1Telemetry.gateway_status, "SESSION_CREATED");
    assert.equal("store_passwd" in (tx1Telemetry.response_summary || {}), false);
    assert.equal("store_id" in (tx1Telemetry.response_summary || {}), false);
    logPass(`Created PENDING tx ${tx1} via live SSLCOMMERZ Sandbox (${init1.json.gatewayPageUrl.slice(0, 60)}...) with server-derived ৳10,000 split.`);

    // -------------------------------------------------------------------------
    // SCENARIO 3: Failed sandbox payment
    // -------------------------------------------------------------------------
    logScenario(3, "Failed sandbox payment", ["[REAL NEXT.JS HTTP API]", "[REAL SUPABASE DB]"]);
    const failRes = await apiFetch("/api/payments/fail", {
      method: "POST",
      body: new URLSearchParams({
        tran_id: tx1,
        status: "FAILED",
        error: "Insufficient test sandbox balance",
        card_type: "ROCKET-Rocket",
      }),
    });
    assert.equal(failRes.status, 303);
    assert.ok(failRes.location?.includes(`/contracts/${contract1.id}`));
    assert.ok(failRes.location?.includes("payment=failed"));

    const [{ data: p1AfterFail }, { data: ctAfterFail }, { data: failNotif }] = await Promise.all([
      adminDb.from("payments").select("status, failure_reason").eq("id", paymentId1).single(),
      adminDb.from("contracts").select("payment_status").eq("id", contract1.id).single(),
      adminDb.from("notifications").select("event_key, title").eq("payment_id", paymentId1).maybeSingle(),
    ]);
    assert.equal(p1AfterFail.status, "FAILED");
    assert.equal(ctAfterFail.payment_status, "FAILED");
    assert.equal(failNotif.event_key, `payment_failed:${paymentId1}`);
    logPass(`Recorded FAILED tx ${tx1}, preserved retryability, and emitted deduplicated client notification.`);

    // -------------------------------------------------------------------------
    // SCENARIO 4: Cancelled payment & retry
    // -------------------------------------------------------------------------
    logScenario(4, "Cancelled payment", ["[REAL NEXT.JS HTTP API]", "[REAL SANDBOX GATEWAY]", "[REAL SUPABASE DB]"]);
    const init2 = await apiFetch("/api/payments/initiate", {
      method: "POST",
      cookie: sessClientA.cookieHeader(),
      body: { contractId: contract1.id },
    });
    assert.equal(init2.status, 200);
    const tx2 = init2.json.transactionId;
    const paymentId2 = init2.json.paymentId;
    assert.notEqual(tx2, tx1, "Retry must allocate a fresh unique tran_id");

    const cancelRes = await apiFetch("/api/payments/cancel", {
      method: "POST",
      body: new URLSearchParams({ tran_id: tx2, status: "CANCELLED" }),
    });
    assert.equal(cancelRes.status, 303);
    assert.ok(cancelRes.location?.includes("payment=cancelled"));

    const [{ data: p2AfterCancel }, { data: ctAfterCancel }] = await Promise.all([
      adminDb.from("payments").select("status").eq("id", paymentId2).single(),
      adminDb.from("contracts").select("payment_status").eq("id", contract1.id).single(),
    ]);
    assert.equal(p2AfterCancel.status, "CANCELLED");
    assert.equal(ctAfterCancel.payment_status, "CANCELLED");
    logPass(`Recorded CANCELLED tx ${tx2}; contract remains retry-eligible.`);

    // -------------------------------------------------------------------------
    // SCENARIO 5: Invalid transaction ID
    // -------------------------------------------------------------------------
    logScenario(5, "Invalid transaction ID", ["[REAL NEXT.JS HTTP API]", "[REAL SUPABASE DB]"]);
    const invalidValidate = await apiFetch("/api/payments/validate", {
      method: "POST",
      cookie: sessClientA.cookieHeader(),
      body: { transactionId: "MKP-NONEXISTENT-9999" },
    });
    assert.equal(invalidValidate.status, 404);
    assert.equal(invalidValidate.json.code, "PAYMENT_NOT_FOUND");

    const invalidIpn = await apiFetch("/api/payments/ipn", {
      method: "POST",
      body: new URLSearchParams({ tran_id: "MKP-NONEXISTENT-9999", val_id: "FAKE", status: "VALID" }),
    });
    assert.equal(invalidIpn.status, 404);
    assert.equal(invalidIpn.json.code, "PAYMENT_NOT_FOUND");
    logPass("Both /api/payments/validate and /api/payments/ipn rejected unknown tran_id with 404 PAYMENT_NOT_FOUND.");

    // -------------------------------------------------------------------------
    // SCENARIO 2A, 6, 7, 2B: Re-initiate Tx3 -> Test forged success vs live sandbox,
    // amount mismatch, currency mismatch, and valid settlement
    // -------------------------------------------------------------------------
    logScenario(2, "Initiate Tx3 & verify forged val_id is rejected by live SSLCOMMERZ Sandbox", ["[REAL NEXT.JS HTTP API]", "[REAL SANDBOX GATEWAY]", "[REAL SUPABASE DB]"]);
    const init3 = await apiFetch("/api/payments/initiate", {
      method: "POST",
      cookie: sessClientA.cookieHeader(),
      body: { contractId: contract1.id },
    });
    assert.equal(init3.status, 200);
    const tx3 = init3.json.transactionId;
    const paymentId3 = init3.json.paymentId;
    assert.ok(![tx1, tx2].includes(tx3));

    // Visiting success URL with forged val_id hits real SSLCOMMERZ Sandbox validation API and MUST NOT settle!
    const forgedSuccess = await apiFetch("/api/payments/success", {
      method: "POST",
      body: new URLSearchParams({
        tran_id: tx3,
        val_id: "FORGED_VAL_ID_999",
        status: "VALID",
        amount: "10000.00",
        currency: "BDT",
      }),
    });
    assert.equal(forgedSuccess.status, 303);
    assert.ok(forgedSuccess.location?.includes("payment=verification_failed"));

    const { data: p3StillPending } = await adminDb
      .from("payments")
      .select("status")
      .eq("id", paymentId3)
      .single();
    assert.equal(p3StillPending.status, "PENDING", "Success callback with unverified val_id MUST NOT mark payment funded!");
    logPass(`Live SSLCOMMERZ Sandbox rejected forged val_id on /api/payments/success; payment ${tx3} remained PENDING.`);

    // SCENARIO 6: Amount mismatch
    logScenario(6, "Amount mismatch rejection", ["[ISOLATED MOCK VALIDATOR STUB]", "[REAL SUPABASE DB & RPC]"]);
    const amountMismatchOutcome = await withMockedValidatorFetch(
      () =>
        new Response(
          JSON.stringify({
            status: "VALID",
            tran_id: tx3,
            val_id: "VAL-TAMPER-AMT",
            bank_tran_id: "BANK-TAMPER-AMT",
            amount: "9500.00",
            currency_type: "BDT",
          }),
          { status: 200 }
        ),
      () =>
        verifyAndSettlePayment({
          tranId: tx3,
          valId: "VAL-TAMPER-AMT",
          eventType: "IPN_CALLBACK",
        })
    );
    assert.equal(amountMismatchOutcome.ok, false);
    assert.equal(amountMismatchOutcome.statusCode, 422);
    assert.equal(amountMismatchOutcome.code, "AMOUNT_MISMATCH");

    // Also test DB RPC guard directly
    const { data: rpcAmtMismatch } = await adminDb.rpc("settle_funded_payment", {
      p_transaction_id: tx3,
      p_validation_id: "VAL-TAMPER-AMT",
      p_bank_tran_id: "BANK-TAMPER-AMT",
      p_gateway_status: "VALID",
      p_validated_amount: 9500,
      p_validated_currency: "BDT",
      p_event_type: "VALIDATION_CHECK",
      p_response_summary: {},
    });
    assert.equal(rpcAmtMismatch.ok, false);
    assert.equal(rpcAmtMismatch.code, "AMOUNT_MISMATCH");
    logPass("Blocked amount mismatch at both TS verification layer and PostgreSQL settle_funded_payment RPC.");

    // SCENARIO 7: Currency mismatch
    logScenario(7, "Currency mismatch rejection", ["[ISOLATED MOCK VALIDATOR STUB]", "[REAL SUPABASE DB & RPC]"]);
    const currencyMismatchOutcome = await withMockedValidatorFetch(
      () =>
        new Response(
          JSON.stringify({
            status: "VALID",
            tran_id: tx3,
            val_id: "VAL-TAMPER-CURR",
            bank_tran_id: "BANK-TAMPER-CURR",
            amount: "10000.00",
            currency_type: "USD",
          }),
          { status: 200 }
        ),
      () =>
        verifyAndSettlePayment({
          tranId: tx3,
          valId: "VAL-TAMPER-CURR",
          eventType: "IPN_CALLBACK",
        })
    );
    assert.equal(currencyMismatchOutcome.ok, false);
    assert.equal(currencyMismatchOutcome.statusCode, 422);
    assert.equal(currencyMismatchOutcome.code, "CURRENCY_MISMATCH");

    const { data: rpcCurrMismatch } = await adminDb.rpc("settle_funded_payment", {
      p_transaction_id: tx3,
      p_validation_id: "VAL-TAMPER-CURR",
      p_bank_tran_id: "BANK-TAMPER-CURR",
      p_gateway_status: "VALID",
      p_validated_amount: 10000,
      p_validated_currency: "USD",
      p_event_type: "VALIDATION_CHECK",
      p_response_summary: {},
    });
    assert.equal(rpcCurrMismatch.ok, false);
    assert.equal(rpcCurrMismatch.code, "CURRENCY_MISMATCH");
    logPass("Blocked currency mismatch (USD != BDT) at both TS verification layer and PostgreSQL RPC.");

    // SCENARIO 2B: Valid payment settlement
    logScenario("2B", "Successful sandbox settlement -> internal escrow FUND ledger & dashboards", [
      "[ISOLATED MOCK VALIDATOR STUB]",
      "[REAL SUPABASE DB & RPC]",
      "[REAL NEXT.JS HTTP API]",
    ]);
    const validValId = `VAL-SBX-OK-${runId}`;
    const validBankTranId = `BANK-SBX-OK-${runId}`;
    const settleOutcome = await withMockedValidatorFetch(
      () =>
        new Response(
          JSON.stringify({
            status: "VALID",
            tran_id: tx3,
            val_id: validValId,
            bank_tran_id: validBankTranId,
            amount: "10000.00",
            currency_type: "BDT",
            card_type: "BKASH-BKash",
            card_brand: "MOBILEBANKING",
            card_issuer: "bKash Sandbox",
            risk_level: "0",
          }),
          { status: 200 }
        ),
      () =>
        verifyAndSettlePayment({
          tranId: tx3,
          valId: validValId,
          eventType: "SUCCESS_CALLBACK",
        })
    );
    assert.equal(settleOutcome.ok, true);
    assert.equal(settleOutcome.alreadySettled, false);
    assert.equal(settleOutcome.status, "FUNDED");

    const [{ data: p3Funded }, { data: ct1Funded }, { data: ledger1Fund }, { data: fundNotifs }] =
      await Promise.all([
        adminDb.from("payments").select("status, validation_id, bank_tran_id").eq("id", paymentId3).single(),
        adminDb.from("contracts").select("payment_status, work_status, funded_amount").eq("id", contract1.id).single(),
        adminDb.from("escrow_ledger").select("*").eq("contract_id", contract1.id),
        adminDb.from("notifications").select("user_id, event_key, role_target").eq("payment_id", paymentId3),
      ]);
    assert.equal(p3Funded.status, "FUNDED");
    assert.equal(p3Funded.validation_id, validValId);
    assert.equal(ct1Funded.payment_status, "FUNDED");
    assert.equal(ct1Funded.work_status, "FUNDED");
    assert.equal(Number(ct1Funded.funded_amount), 10000);
    assert.equal(ledger1Fund.length, 1);
    assert.equal(ledger1Fund[0].entry_type, "FUND");
    assert.equal(ledger1Fund[0].is_simulated, true);
    assert.equal(fundNotifs.length, 2, "Expected 1 client notification + 1 freelancer notification");

    // Verify dashboards match live Supabase values
    const [clDashFunded, flDashFunded] = await Promise.all([
      apiFetch("/api/payments/dashboard?role=client", { cookie: sessClientA.cookieHeader() }),
      apiFetch("/api/payments/dashboard?role=freelancer", { cookie: sessFreelancerA.cookieHeader() }),
    ]);
    assert.equal(clDashFunded.status, 200);
    assert.equal(clDashFunded.json.summary.inEscrowBdt, 10000);
    assert.equal(flDashFunded.status, 200);
    assert.equal(flDashFunded.json.summary.pendingEarningsBdt, 9000);
    assert.equal(flDashFunded.json.summary.activeFundedContractsCount, 1);
    logPass("Settled tx3 -> FUNDED; created single FUND ledger row; client/freelancer dashboards reflect ৳10,000 in escrow & ৳9,000 pending net.");

    // -------------------------------------------------------------------------
    // SCENARIO 8: Duplicate IPN & duplicate success callback idempotency
    // -------------------------------------------------------------------------
    logScenario(8, "Duplicate IPN notification idempotency", ["[REAL NEXT.JS HTTP API]", "[REAL SUPABASE DB]"]);
    const dupIpnRes = await apiFetch("/api/payments/ipn", {
      method: "POST",
      body: new URLSearchParams({
        tran_id: tx3,
        val_id: validValId,
        status: "VALID",
        amount: "10000.00",
        currency: "BDT",
      }),
    });
    assert.equal(dupIpnRes.status, 200);
    assert.equal(dupIpnRes.json.ok, true);
    assert.equal(dupIpnRes.json.alreadySettled, true);
    assert.equal(dupIpnRes.json.code, "ALREADY_SETTLED");

    const dupSuccRes = await apiFetch("/api/payments/success", {
      method: "POST",
      body: new URLSearchParams({ tran_id: tx3, val_id: validValId, status: "VALID" }),
    });
    assert.equal(dupSuccRes.status, 303);
    assert.ok(dupSuccRes.location?.includes("already_settled=1"));

    const [{ data: ledgerCountCheck }, { data: notifCountCheck }] = await Promise.all([
      adminDb.from("escrow_ledger").select("id").eq("payment_id", paymentId3),
      adminDb.from("notifications").select("id").eq("payment_id", paymentId3),
    ]);
    assert.equal(ledgerCountCheck.length, 1, "Duplicate callbacks must NOT insert duplicate FUND ledger rows");
    assert.equal(notifCountCheck.length, 2, "Duplicate callbacks must NOT insert duplicate notifications");
    logPass("Duplicate IPN and success redirect handled idempotently with 0 duplicate ledger or notification rows.");

    // -------------------------------------------------------------------------
    // SCENARIO 9: Client B attempts to fund Client A's contract
    // -------------------------------------------------------------------------
    logScenario(9, "Client B attempts to fund Client A's contract", ["[REAL NEXT.JS HTTP API]", "[REAL SUPABASE DB]"]);
    const crossClientInit = await apiFetch("/api/payments/initiate", {
      method: "POST",
      cookie: sessClientB.cookieHeader(),
      body: { contractId: contract2.id },
    });
    assert.equal(crossClientInit.status, 403);
    logPass("Blocked Client B from initiating payment on Client A's unpaid contract with HTTP 403.");

    // -------------------------------------------------------------------------
    // SCENARIO 10 (early check) & 11: Freelancer starts & submits work; Freelancer blocked from self-approval
    // -------------------------------------------------------------------------
    logScenario(11, "Freelancer starts work & submits completed deliverables", ["[REAL NEXT.JS HTTP API]", "[REAL SUPABASE DB]"]);
    const startWorkRes = await apiFetch(`/api/contracts/${contract1.id}/start-work`, {
      method: "POST",
      cookie: sessFreelancerA.cookieHeader(),
    });
    assert.equal(startWorkRes.status, 200);
    assert.equal(startWorkRes.json.workStatus, "IN_PROGRESS");

    const submitWorkRes = await apiFetch(`/api/contracts/${contract1.id}/submit-work`, {
      method: "POST",
      cookie: sessFreelancerA.cookieHeader(),
      body: {
        notes: "Completed full Next.js & SSLCOMMERZ Sandbox payment gateway integration with automated verification tests.",
        demoUrl: "https://github.com/muktokormo/demo-submission",
        files: ["delivery-notes.pdf", "architecture-diagram.png"],
      },
    });
    assert.equal(submitWorkRes.status, 200);
    assert.equal(submitWorkRes.json.workStatus, "SUBMITTED");

    const { data: ct1Submitted } = await adminDb
      .from("contracts")
      .select("work_status, submission_notes, submission_demo_url")
      .eq("id", contract1.id)
      .single();
    assert.equal(ct1Submitted.work_status, "SUBMITTED");
    assert.equal(ct1Submitted.submission_demo_url, "https://github.com/muktokormo/demo-submission");
    logPass("Contract 1 transitioned FUNDED -> IN_PROGRESS -> SUBMITTED with deliverable links saved.");

    // SCENARIO 10: Freelancer attempts to approve their own submitted work
    logScenario(10, "Freelancer attempts to approve their own work", ["[REAL NEXT.JS HTTP API]", "[REAL SUPABASE DB]"]);
    const flSelfApprove = await apiFetch(`/api/contracts/${contract1.id}/approve-release`, {
      method: "POST",
      cookie: sessFreelancerA.cookieHeader(),
    });
    assert.equal(flSelfApprove.status, 403);
    assert.equal(flSelfApprove.json.code, "FORBIDDEN_NOT_CONTRACT_CLIENT");
    logPass("Blocked freelancer self-approval with HTTP 403 FORBIDDEN_NOT_CONTRACT_CLIENT.");

    // -------------------------------------------------------------------------
    // SCENARIO 12: Client approves completed work & releases simulated payment
    // -------------------------------------------------------------------------
    logScenario(12, "Client approves work -> RELEASE ledger, 10% fee, earnings & dashboards", ["[REAL NEXT.JS HTTP API]", "[REAL SUPABASE DB & RPC]"]);
    const releaseRes = await apiFetch(`/api/contracts/${contract1.id}/approve-release`, {
      method: "POST",
      cookie: sessClientA.cookieHeader(),
    });
    assert.equal(releaseRes.status, 200);
    assert.equal(releaseRes.json.ok, true);
    assert.equal(releaseRes.json.grossAmount, 10000);
    assert.equal(releaseRes.json.platformFee, 1000);
    assert.equal(releaseRes.json.freelancerNet, 9000);
    assert.equal(releaseRes.json.isSimulated, true);

    const [{ data: ct1Released }, { data: flAfterRelease }, { data: ledger1All }] = await Promise.all([
      adminDb
        .from("contracts")
        .select("status, payment_status, work_status, released_amount, platform_fee_amount, freelancer_payable_amount")
        .eq("id", contract1.id)
        .single(),
      adminDb.from("freelancers").select("earned_bdt").eq("id", freelancerARow.id).single(),
      adminDb.from("escrow_ledger").select("entry_type, amount, platform_fee_amount, freelancer_net_amount").eq("contract_id", contract1.id),
    ]);
    assert.equal(ct1Released.payment_status, "RELEASED");
    assert.equal(ct1Released.work_status, "RELEASED");
    assert.equal(ct1Released.status, "completed");
    assert.equal(Number(ct1Released.released_amount), 10000);
    assert.equal(Number(flAfterRelease.earned_bdt), 9000);
    assert.equal(ledger1All.length, 2);
    assert.ok(ledger1All.some((r) => r.entry_type === "RELEASE" && Number(r.platform_fee_amount) === 1000 && Number(r.freelancer_net_amount) === 9000));

    // Verify all 3 dashboards reflect exact numbers
    const [clDashRel, flDashRel, admDashRel] = await Promise.all([
      apiFetch("/api/payments/dashboard?role=client", { cookie: sessClientA.cookieHeader() }),
      apiFetch("/api/payments/dashboard?role=freelancer", { cookie: sessFreelancerA.cookieHeader() }),
      apiFetch(`/api/admin/payments?q=${encodeURIComponent(tx3)}`, { cookie: sessAdmin.cookieHeader() }),
    ]);
    assert.equal(clDashRel.json.summary.releasedSpendingBdt, 10000);
    assert.equal(clDashRel.json.summary.inEscrowBdt, 0);
    assert.equal(flDashRel.json.summary.releasedEarningsBdt, 9000);
    assert.equal(flDashRel.json.summary.availableEarningsSimulatedBdt, 9000);
    assert.equal(admDashRel.status, 200);
    assert.ok(admDashRel.json.summary.platformCommissionEarnedBdt >= 1000);
    assert.equal(admDashRel.json.payments.length, 1);
    assert.equal(admDashRel.json.payments[0].status, "RELEASED");
    logPass("Released tx3 atomically: ৳1,000 fee, ৳9,000 freelancer credit verified across Supabase & Client/Freelancer/Admin dashboards.");

    // -------------------------------------------------------------------------
    // SCENARIO 13: Duplicate payment release attempt
    // -------------------------------------------------------------------------
    logScenario(13, "Duplicate payment release attempt blocked", ["[REAL NEXT.JS HTTP API]", "[REAL SUPABASE DB]"]);
    const dupRelease = await apiFetch(`/api/contracts/${contract1.id}/approve-release`, {
      method: "POST",
      cookie: sessClientA.cookieHeader(),
    });
    assert.equal(dupRelease.status, 409);
    assert.equal(dupRelease.json.code, "ALREADY_RELEASED");

    const { data: flNoDouble } = await adminDb
      .from("freelancers")
      .select("earned_bdt")
      .eq("id", freelancerARow.id)
      .single();
    assert.equal(Number(flNoDouble.earned_bdt), 9000, "Duplicate release MUST NOT double-credit earned_bdt");
    logPass("Duplicate release rejected with HTTP 409 ALREADY_RELEASED; earnings remained ৳9,000.");

    // -------------------------------------------------------------------------
    // SCENARIO 14: Refund request + open-refund work guard + Admin moderation
    // -------------------------------------------------------------------------
    logScenario(14, "Refund request workflow, open-refund work guard & admin moderation", [
      "[REAL NEXT.JS HTTP API]",
      "[REAL SANDBOX GATEWAY]",
      "[ISOLATED MOCK VALIDATOR STUB]",
      "[REAL SUPABASE DB & RPC]",
    ]);
    const init4 = await apiFetch("/api/payments/initiate", {
      method: "POST",
      cookie: sessClientA.cookieHeader(),
      body: { contractId: contract2.id },
    });
    assert.equal(init4.status, 200);
    const tx4 = init4.json.transactionId;
    const paymentId4 = init4.json.paymentId;

    const settle4 = await withMockedValidatorFetch(
      () =>
        new Response(
          JSON.stringify({
            status: "VALID",
            tran_id: tx4,
            val_id: `VAL-RF-${runId}`,
            bank_tran_id: `BANK-RF-${runId}`,
            amount: "5000.00",
            currency_type: "BDT",
            card_type: "VISA-Dutch Bangla",
          }),
          { status: 200 }
        ),
      () =>
        verifyAndSettlePayment({
          tranId: tx4,
          valId: `VAL-RF-${runId}`,
          eventType: "SUCCESS_CALLBACK",
        })
    );
    assert.equal(settle4.ok, true);

    const rfCreate = await apiFetch("/api/payments/refunds", {
      method: "POST",
      cookie: sessClientA.cookieHeader(),
      body: {
        contractId: contract2.id,
        reason: "Project cancelled mutually during milestone setup in sandbox verification.",
      },
    });
    assert.equal(rfCreate.status, 201);
    const refundId = rfCreate.json.refundRequest.id;
    assert.equal(rfCreate.json.refundRequest.status, "PENDING");
    assert.equal(Number(rfCreate.json.refundRequest.amount), 5000);

    // Duplicate refund attempt blocked
    const dupRfCreate = await apiFetch("/api/payments/refunds", {
      method: "POST",
      cookie: sessClientA.cookieHeader(),
      body: { contractId: contract2.id, reason: "Duplicate attempt should fail cleanly." },
    });
    assert.equal(dupRfCreate.status, 409);

    // Open-refund work guard blocks starting/submitting/approving work while refund is open
    const blockedStartWork = await apiFetch(`/api/contracts/${contract2.id}/start-work`, {
      method: "POST",
      cookie: sessFreelancerA.cookieHeader(),
    });
    assert.equal(blockedStartWork.status, 409);
    assert.equal(blockedStartWork.json.code, "REFUND_IN_PROGRESS");

    // Non-admin (Client A) cannot moderate refund
    const clientModAttempt = await apiFetch(`/api/admin/refunds/${refundId}`, {
      method: "POST",
      cookie: sessClientA.cookieHeader(),
      body: { action: "APPROVE", refundMode: "SIMULATED_INTERNAL" },
    });
    assert.equal(clientModAttempt.status, 403);

    // Admin approves simulated internal refund
    const adminApproveRf = await apiFetch(`/api/admin/refunds/${refundId}`, {
      method: "POST",
      cookie: sessAdmin.cookieHeader(),
      body: {
        action: "APPROVE",
        refundMode: "SIMULATED_INTERNAL",
        adminNotes: "Approved via Phase 10 integration suite.",
      },
    });
    assert.equal(adminApproveRf.status, 200);
    assert.equal(adminApproveRf.json.status, "COMPLETED");
    assert.equal(adminApproveRf.json.isSimulated, true);

    const [{ data: p4Refunded }, { data: ct2Refunded }, { data: rfLedger }, clDashAfterRf] =
      await Promise.all([
        adminDb.from("payments").select("status").eq("id", paymentId4).single(),
        adminDb.from("contracts").select("status, payment_status, work_status, refunded_amount").eq("id", contract2.id).single(),
        adminDb.from("escrow_ledger").select("entry_type, amount").eq("payment_id", paymentId4),
        apiFetch("/api/payments/dashboard?role=client", { cookie: sessClientA.cookieHeader() }),
      ]);
    assert.equal(clDashAfterRf.status, 200);
    assert.equal(p4Refunded.status, "REFUNDED");
    assert.equal(ct2Refunded.payment_status, "REFUNDED");
    assert.equal(ct2Refunded.work_status, "REFUNDED");
    assert.equal(ct2Refunded.status, "terminated");
    assert.equal(Number(ct2Refunded.refunded_amount), 5000);
    assert.ok(rfLedger.some((r) => r.entry_type === "REFUND" && Number(r.amount) === 5000));
    assert.equal(clDashAfterRf.json.summary.refundedBdt, 5000);
    logPass("Refund request -> open-refund work block -> Admin approval -> REFUND ledger entry & ৳5,000 dashboard total verified.");

    // -------------------------------------------------------------------------
    // SCENARIO 15: Unauthorized admin access + Supabase RLS & DB trigger verification
    // -------------------------------------------------------------------------
    logScenario(15, "Unauthorized admin access & Supabase RLS/Trigger enforcement", ["[REAL NEXT.JS HTTP API]", "[REAL SUPABASE DB & RLS/RPC]"]);

    const unauthAdm = await apiFetch("/api/admin/payments");
    assert.equal(unauthAdm.status, 401);
    const clientAdm = await apiFetch("/api/admin/payments", { cookie: sessClientA.cookieHeader() });
    assert.equal(clientAdm.status, 403);
    const flAdm = await apiFetch("/api/admin/payments", { cookie: sessFreelancerA.cookieHeader() });
    assert.equal(flAdm.status, 403);

    // Direct Supabase browser-client RLS & Trigger bypass checks as Client A
    const anonDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 15a. Direct UPDATE on payments MUST be blocked (0 rows updated or permission error)
    const { data: directPayUpd } = await sessClientA.supabaseClient
      .from("payments")
      .update({ status: "RELEASED" })
      .eq("id", paymentId4)
      .select("id");
    assert.equal((directPayUpd ?? []).length, 0, "Client MUST NOT update payments directly via RLS");

    // 15b. Direct INSERT into escrow_ledger MUST be blocked by RLS
    const { error: directLedgerErr } = await sessClientA.supabaseClient.from("escrow_ledger").insert({
      payment_id: paymentId4,
      contract_id: contract2.id,
      entry_type: "RELEASE",
      amount: 5000,
      description: "Tamper attempt",
    });
    assert.ok(directLedgerErr, "Direct client insert into escrow_ledger MUST fail via RLS");

    // 15c. Direct UPDATE on contracts financial column MUST fail via contracts_before_write_guard_trg
    const { error: directCtTamperErr } = await sessClientA.supabaseClient
      .from("contracts")
      .update({ total_amount: 1, payment_status: "RELEASED" })
      .eq("id", contract1.id);
    assert.ok(directCtTamperErr, "Direct client modification of contract financial fields MUST fail");
    const { data: ctAfterTamper } = await adminDb
      .from("contracts")
      .select("total_amount, payment_status")
      .eq("id", contract1.id)
      .single();
    assert.equal(Number(ctAfterTamper?.total_amount), 10000);
    assert.equal(ctAfterTamper?.payment_status, "RELEASED");

    // 15d. Direct UPDATE on freelancers.earned_bdt MUST fail via freelancers_earnings_guard_trg
    const { error: directEarningsTamperErr } = await sessFreelancerA.supabaseClient
      .from("freelancers")
      .update({ earned_bdt: 9999999 })
      .eq("id", freelancerARow.id);
    assert.ok(directEarningsTamperErr, "Direct freelancer modification of earned_bdt MUST fail");
    const { data: flAfterTamper } = await adminDb
      .from("freelancers")
      .select("earned_bdt")
      .eq("id", freelancerARow.id)
      .single();
    assert.equal(Number(flAfterTamper?.earned_bdt), 9000);

    // 15e. Direct RPC call from authenticated user MUST fail (REVOKE EXECUTE)
    const { error: rpcTamperErr } = await sessClientA.supabaseClient.rpc("release_escrow_payment", {
      p_contract_id: contract1.id,
      p_actor_user_id: authUsers.clientA.id,
    });
    assert.ok(rpcTamperErr, "Authenticated user MUST NOT execute financial RPC directly");

    // 15f. Cross-tenant & role-scoped RLS SELECT checks
    const [{ data: clientBPayments }, { data: flPendingFailRows }, { data: flTxRows }, { data: anonPayRows }] =
      await Promise.all([
        sessClientB.supabaseClient.from("payments").select("id").eq("contract_id", contract1.id),
        sessFreelancerA.supabaseClient
          .from("payments")
          .select("id, status")
          .in("id", [paymentId1, paymentId2]),
        sessFreelancerA.supabaseClient
          .from("payment_transactions")
          .select("id")
          .eq("payment_id", paymentId3),
        anonDb.from("payments").select("id").eq("id", paymentId3),
      ]);

    assert.equal((clientBPayments ?? []).length, 0, "Client B MUST NOT see Client A payments");
    assert.equal((flPendingFailRows ?? []).length, 0, "Freelancer MUST NOT see FAILED/CANCELLED checkout attempts");
    assert.equal((flTxRows ?? []).length, 0, "Freelancer MUST NOT see raw gateway payment_transactions");
    assert.equal((anonPayRows ?? []).length, 0, "Anonymous caller MUST NOT see payments");

    logPass("Admin auth checks (401/403), direct RLS write blocks, DB guard triggers, revoked RPCs, and cross-tenant SELECT isolation all verified.");

    console.log("\nALL 15 PAYMENT, ESCROW, LIFECYCLE & SECURITY SCENARIOS PASSED SUCCESSFULLY.");
  } finally {
    console.log("\nCleaning up temporary test rows bottom-up...");
    try {
      if (createdContractIds.length > 0) {
        await adminDb.from("notifications").delete().in("contract_id", createdContractIds);
        await adminDb.from("refund_requests").delete().in("contract_id", createdContractIds);
        await adminDb.from("escrow_ledger").delete().in("contract_id", createdContractIds);
        await adminDb.from("payment_transactions").delete().in("contract_id", createdContractIds);
        await adminDb.from("payments").delete().in("contract_id", createdContractIds);
        await adminDb.from("contracts").delete().in("id", createdContractIds);
      }
      if (createdAuthUserIds.length > 0) {
        await adminDb.from("notifications").delete().in("user_id", createdAuthUserIds);
        await adminDb.from("admins").delete().in("user_id", createdAuthUserIds);
      }
      if (createdProposalIds.length > 0) {
        await adminDb.from("proposals").delete().in("id", createdProposalIds);
      }
      if (createdProjectIds.length > 0) {
        await adminDb.from("projects").delete().in("id", createdProjectIds);
      }
      if (createdFreelancerIds.length > 0) {
        await adminDb.from("freelancers").delete().in("id", createdFreelancerIds);
      }
      if (createdClientIds.length > 0) {
        await adminDb.from("clients").delete().in("id", createdClientIds);
      }
      if (createdAuthUserIds.length > 0) {
        await adminDb.from("users").delete().in("id", createdAuthUserIds);
        for (const uid of createdAuthUserIds) {
          await adminDb.auth.admin.deleteUser(uid);
        }
      }

      const afterCounts = await getBaselineCounts();
      console.log("Post-cleanup table counts:", afterCounts);
      assert.deepEqual(afterCounts, baselineCounts, "Database table counts must return cleanly to baseline.");
      console.log("Cleanup verified: database restored to baseline state.");
    } catch (cleanupErr) {
      console.error("Cleanup error:", cleanupErr);
      process.exitCode = 1;
    }
  }
}

run().catch((err) => {
  console.error("15-scenario integration suite failed:", err);
  process.exit(1);
});
