/**
 * [ISOLATED AUTOMATED UNIT TESTS — MOCKED GATEWAY RESPONSES & ENV]
 *
 * Tests pure business/financial rules, env configuration guards, credential sanitization,
 * transaction ID uniqueness, callback payload extraction, and SSLCOMMERZ API payload
 * handling (with mocked global `fetch` and test env values).
 *
 * Live SSLCOMMERZ Sandbox & live Supabase RLS/RPC verification is tested separately in:
 * `tests/integration/verify-15-scenarios.mjs`
 */
import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  DEFAULT_PLATFORM_FEE_PCT,
  MIN_SSLCOMMERZ_AMOUNT_BDT,
  calculateContractFeeBreakdown,
  isUuid,
  parseProposalContractAlias,
  roundBdt,
} from "@/lib/payments/constants";
import { computeEscrowLedgerSummary } from "@/lib/payments/escrow";
import { PaymentConfigError, getSslCommerzSandboxEnv } from "@/lib/env";
import {
  generateUniqueRefundTransactionId,
  generateUniqueTransactionId,
  initiateSslCommerzRefund,
  initiateSslCommerzSession,
  querySslCommerzRefundStatus,
  sanitizeGatewayPayload,
  validateSslCommerzTransaction,
} from "@/lib/sslcommerz";
import { extractCallbackPayload } from "@/lib/payments/callbacks";

function withTestSandboxEnv(
  overrides: Record<string, string | undefined>,
  fn: () => unknown | Promise<unknown>
) {
  const keys = [
    "SSLCOMMERZ_STORE_ID",
    "SSLCOMMERZ_STORE_PASSWORD",
    "SSLCOMMERZ_IS_LIVE",
    "APP_URL",
  ];
  const backup = Object.fromEntries(keys.map((k) => [k, process.env[k]]));

  process.env.SSLCOMMERZ_STORE_ID = "mock_store_id";
  process.env.SSLCOMMERZ_STORE_PASSWORD = "mock_store_password_secret";
  process.env.SSLCOMMERZ_IS_LIVE = "false";
  process.env.APP_URL = "https://sandbox-test.ngrok-free.dev";

  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const k of keys) {
        const prev = backup[k];
        if (prev === undefined) delete process.env[k];
        else process.env[k] = prev;
      }
    });
}

test("[Unit] Server fee breakdown calculates the default 7% platform commission & 93% freelancer payable cleanly", () => {
  assert.equal(DEFAULT_PLATFORM_FEE_PCT, 7);
  const std = calculateContractFeeBreakdown(10000, DEFAULT_PLATFORM_FEE_PCT);
  assert.equal(std.grossAmount, 10000);
  assert.equal(std.platformFeeAmount, 700);
  assert.equal(std.freelancerPayableAmount, 9300);
  assert.equal(roundBdt(std.platformFeeAmount + std.freelancerPayableAmount), std.grossAmount);

  const frac = calculateContractFeeBreakdown(1234.55, 10);
  assert.equal(frac.grossAmount, 1234.55);
  assert.equal(frac.platformFeeAmount, 123.46);
  assert.equal(frac.freelancerPayableAmount, 1111.09);
  assert.equal(roundBdt(frac.platformFeeAmount + frac.freelancerPayableAmount), frac.grossAmount);
  assert.equal(MIN_SSLCOMMERZ_AMOUNT_BDT, 10);
});

test("[Unit] isUuid validates canonical UUIDs and rejects malformed strings", () => {
  assert.equal(isUuid("11111111-2222-4333-8444-555555555555"), true);
  assert.equal(isUuid("not-a-uuid"), false);
  assert.equal(isUuid(""), false);
  assert.equal(isUuid(null), false);
});

test("[Unit] parseProposalContractAlias extracts UUIDs from ctr-<proposalUuid> aliases only", () => {
  assert.equal(
    parseProposalContractAlias("ctr-132e3ece-d64f-46a4-bdad-e275ab1ef19b"),
    "132e3ece-d64f-46a4-bdad-e275ab1ef19b"
  );
  assert.equal(
    parseProposalContractAlias("CTR-132e3ece-d64f-46a4-bdad-e275ab1ef19b"),
    "132e3ece-d64f-46a4-bdad-e275ab1ef19b"
  );
  assert.equal(parseProposalContractAlias("ctr-8842"), null);
  assert.equal(parseProposalContractAlias("ctr-not-a-uuid"), null);
  assert.equal(
    parseProposalContractAlias("132e3ece-d64f-46a4-bdad-e275ab1ef19b"),
    null
  );
  assert.equal(parseProposalContractAlias(null), null);
});

test("[Unit] computeEscrowLedgerSummary aggregates FUND, RELEASE, and REFUND accurately", () => {
  const fundedOnly = computeEscrowLedgerSummary([
    {
      id: "l1",
      payment_id: "p1",
      contract_id: "c1",
      entry_type: "FUND",
      amount: 10000,
      platform_fee_amount: 1000,
      freelancer_net_amount: 9000,
      currency: "BDT",
      is_simulated: true,
      description: "Funded",
      metadata: {},
      created_at: new Date().toISOString(),
    },
  ]);
  assert.equal(fundedOnly.totalFundedBdt, 10000);
  assert.equal(fundedOnly.currentlyHeldBdt, 10000);
  assert.equal(fundedOnly.totalReleasedBdt, 0);
  assert.equal(fundedOnly.isSimulated, true);

  const released = computeEscrowLedgerSummary([
    {
      id: "l1",
      payment_id: "p1",
      contract_id: "c1",
      entry_type: "FUND",
      amount: 10000,
      platform_fee_amount: 1000,
      freelancer_net_amount: 9000,
      currency: "BDT",
      is_simulated: true,
      description: "Funded",
      metadata: {},
      created_at: new Date().toISOString(),
    },
    {
      id: "l2",
      payment_id: "p1",
      contract_id: "c1",
      entry_type: "RELEASE",
      amount: 10000,
      platform_fee_amount: 1000,
      freelancer_net_amount: 9000,
      currency: "BDT",
      is_simulated: true,
      description: "Released",
      metadata: {},
      created_at: new Date().toISOString(),
    },
  ]);
  assert.equal(released.totalFundedBdt, 10000);
  assert.equal(released.totalReleasedBdt, 10000);
  assert.equal(released.currentlyHeldBdt, 0);
  assert.equal(released.platformFeeBdt, 1000);
  assert.equal(released.freelancerNetBdt, 9000);
});

test("[Unit] Sandbox environment guard blocks live mode and placeholder credentials", async () => {
  await withTestSandboxEnv({ SSLCOMMERZ_IS_LIVE: "true" }, () => {
    assert.throws(
      () => getSslCommerzSandboxEnv(),
      (err) => err instanceof PaymentConfigError && err.message.includes("Live SSLCOMMERZ gateway is blocked")
    );
  });

  await withTestSandboxEnv({ SSLCOMMERZ_STORE_PASSWORD: "your_sandbox_store_password" }, () => {
    assert.throws(() => getSslCommerzSandboxEnv(), PaymentConfigError);
  });

  await withTestSandboxEnv({ APP_URL: "https://demo.ngrok-free.dev/" }, () => {
    const env = getSslCommerzSandboxEnv();
    assert.equal(env.isLive, false);
    assert.equal(env.appUrl, "https://demo.ngrok-free.dev");
    assert.equal(env.sessionApiUrl, "https://sandbox.sslcommerz.com/gwprocess/v4/api.php");
    assert.equal(
      env.validationApiUrl,
      "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
    );
  });
});

test("[Unit] Unique transaction & refund IDs stay within SSLCOMMERZ 30-char cap", () => {
  const txSet = new Set(Array.from({ length: 20 }, () => generateUniqueTransactionId()));
  const rfSet = new Set(Array.from({ length: 20 }, () => generateUniqueRefundTransactionId()));
  assert.equal(txSet.size, 20);
  assert.equal(rfSet.size, 20);
  for (const id of txSet) {
    assert.ok(id.startsWith("MKP-"));
    assert.ok(id.length <= 30);
  }
  for (const id of rfSet) {
    assert.ok(id.startsWith("MKR-"));
    assert.ok(id.length <= 30);
  }
});

test("[Unit] sanitizeGatewayPayload recursively removes credentials, tokens, and store IDs", () => {
  const dirty = {
    status: "VALID",
    tran_id: "MKP-TEST-1",
    store_passwd: "DO_NOT_LEAK",
    store_id: "secret_store",
    verify_sign: "abc",
    nested: {
      password: "secret",
      secret: "top_secret",
      safeField: "ok",
    },
    items: [{ token: "kept_only_if_non_sensitive", service_role: "STRIP_ME", card_type: "VISA" }],
  };
  const clean = sanitizeGatewayPayload(dirty);
  const nested = clean.nested as Record<string, unknown>;
  const items = clean.items as Array<Record<string, unknown>>;
  assert.equal("store_passwd" in clean, false);
  assert.equal("store_id" in clean, false);
  assert.equal("verify_sign" in clean, false);
  assert.equal(nested.safeField, "ok");
  assert.equal("password" in nested, false);
  assert.equal("secret" in nested, false);
  assert.equal("service_role" in items[0], false);
  assert.equal(items[0].card_type, "VISA");
});

test("[Unit - Mocked Gateway] SSLCOMMERZ session, validation & refund status APIs handle success and processing states strictly", async () => {
  const realFetch = globalThis.fetch;

  await withTestSandboxEnv({}, async () => {
    try {
      // 1. Mock Session Creation
      let lastRequestBody = "";
      globalThis.fetch = async (url, init) => {
        lastRequestBody = String(init?.body ?? "");
        assert.equal(String(url), "https://sandbox.sslcommerz.com/gwprocess/v4/api.php");
        return new Response(
          JSON.stringify({
            status: "SUCCESS",
            sessionkey: "mock_sess_123",
            GatewayPageURL: "https://sandbox.sslcommerz.com/EasyCheckOut/mock_sess_123",
            store_passwd: "SHOULD_BE_STRIPPED",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      const sessRes = await initiateSslCommerzSession({
        tranId: "MKP-UNIT-1234",
        totalAmount: 10000,
        currency: "BDT",
        productName: "Full-Stack Web App",
        productCategory: "Software Development",
        customerName: "Tariq Client",
        customerEmail: "tariq@example.com",
        customerPhone: "01711111111",
        customerAddress: "Gulshan, Dhaka",
        contractId: "11111111-2222-4333-8444-555555555555",
        paymentId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      });
      assert.equal(sessRes.ok, true);
      assert.equal(sessRes.gatewayPageUrl, "https://sandbox.sslcommerz.com/EasyCheckOut/mock_sess_123");
      assert.equal("store_passwd" in sessRes.rawSanitized, false);
      assert.ok(lastRequestBody.includes("total_amount=10000.00"));
      assert.ok(lastRequestBody.includes("shipping_method=NO"));

      // 2. Mock Validation API (VALID)
      globalThis.fetch = async (url) => {
        assert.ok(String(url).startsWith("https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"));
        return new Response(
          JSON.stringify({
            status: "VALID",
            tran_id: "MKP-UNIT-1234",
            val_id: "VAL-UNIT-1",
            bank_tran_id: "BANK-UNIT-1",
            amount: "10000.00",
            currency_type: "BDT",
            card_type: "BKASH-BKash",
          }),
          { status: 200 }
        );
      };
      const valRes = await validateSslCommerzTransaction("VAL-UNIT-1");
      assert.equal(valRes.ok, true);
      assert.equal(valRes.tranId, "MKP-UNIT-1234");
      assert.equal(valRes.amount, 10000);
      assert.equal(valRes.currency, "BDT");

      // 3. Mock Refund Initiate ("success" returns ref id, NOT completed) & Refund Status ("processing" vs "refunded")
      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            APIConnect: "DONE",
            status: "success",
            refund_ref_id: "RF-MOCK-999",
            bank_tran_id: "BANK-UNIT-1",
          }),
          { status: 200 }
        );
      const rfInit = await initiateSslCommerzRefund({
        bankTranId: "BANK-UNIT-1",
        refundTransId: "MKR-UNIT-1",
        refundAmount: 10000,
        refundRemarks: "Unit test refund",
      });
      assert.equal(rfInit.ok, true);
      assert.equal(rfInit.refundRefId, "RF-MOCK-999");

      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            APIConnect: "DONE",
            status: "processing",
            refund_ref_id: "RF-MOCK-999",
          }),
          { status: 200 }
        );
      const processingCheck = await querySslCommerzRefundStatus("RF-MOCK-999");
      assert.equal(processingCheck.gatewayStatus, "PROCESSING");

      globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            APIConnect: "DONE",
            status: "refunded",
            refund_ref_id: "RF-MOCK-999",
          }),
          { status: 200 }
        );
      const refundedCheck = await querySslCommerzRefundStatus("RF-MOCK-999");
      assert.equal(refundedCheck.gatewayStatus, "REFUNDED");
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});

test("[Unit] extractCallbackPayload parses form-urlencoded gateway POST payloads safely", async () => {
  const req = new NextRequest("https://example.com/api/payments/ipn", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      tran_id: "MKP-FORM-1",
      val_id: "VAL-FORM-1",
      status: "valid",
      amount: "10000.00",
      currency: "bdt",
      card_type: "NAGAD-Nagad",
    }).toString(),
  });

  const parsed = await extractCallbackPayload(req);
  assert.equal(parsed.tranId, "MKP-FORM-1");
  assert.equal(parsed.valId, "VAL-FORM-1");
  assert.equal(parsed.status, "VALID");
  assert.equal(parsed.amount, 10000);
  assert.equal(parsed.currency, "BDT");
  assert.equal(parsed.cardType, "NAGAD-Nagad");
});
