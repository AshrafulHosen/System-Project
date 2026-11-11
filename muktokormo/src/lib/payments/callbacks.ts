import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PaymentConfigError, getSslCommerzSandboxEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sanitizeGatewayPayload,
  validateSslCommerzByTranId,
  validateSslCommerzTransaction,
  type SslCommerzValidationResult,
} from "@/lib/sslcommerz";
import type { PaymentTransactionEventType } from "@/types/payment";

if (typeof window !== "undefined") {
  throw new Error("src/lib/payments/callbacks.ts cannot be imported in browser code.");
}

export interface ParsedGatewayCallback {
  raw: Record<string, string>;
  tranId: string;
  valId: string;
  status: string;
  bankTranId: string | null;
  cardType: string | null;
  cardBrand: string | null;
  cardIssuer: string | null;
  amount: number | null;
  currency: string | null;
  errorReason: string | null;
  valueA: string | null;
  valueB: string | null;
}

export interface VerifyAndSettleOutcome {
  ok: boolean;
  alreadySettled: boolean;
  statusCode: number;
  code: string;
  error?: string;
  contractId: string | null;
  paymentId: string | null;
  transactionId: string;
  status?: string;
  amount?: number;
  currency?: string;
  validationId?: string | null;
  cardType?: string | null;
  cardBrand?: string | null;
  gatewayStatus?: string;
}

export interface FailOrCancelOutcome {
  ok: boolean;
  ignoredBecauseSettled: boolean;
  statusCode: number;
  code: string;
  error?: string;
  contractId: string | null;
  paymentId: string | null;
  transactionId: string;
  status: string;
}

interface PaymentLookupRow {
  id: string;
  contract_id: string;
  client_id: string;
  freelancer_id: string;
  amount: number | string;
  platform_fee: number | string;
  freelancer_amount: number | string;
  currency: string;
  transaction_id: string;
  status: string;
  validation_id: string | null;
  bank_tran_id: string | null;
  card_type: string | null;
  card_brand: string | null;
}

interface SettleRpcResult {
  ok?: boolean;
  already_settled?: boolean;
  code?: string;
  payment_id?: string;
  contract_id?: string;
  status?: string;
  expected?: unknown;
  received?: unknown;
  gateway_status?: unknown;
}

const SETTLED_STATUSES = new Set(["FUNDED", "RELEASED", "REFUND_REQUESTED", "REFUNDED"]);

function pickString(raw: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const val = raw[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  return "";
}

/**
 * Safely extracts callback parameters from GET search params and POST bodies
 * (application/x-www-form-urlencoded, multipart/form-data, or application/json).
 */
export async function extractCallbackPayload(
  request: NextRequest
): Promise<ParsedGatewayCallback> {
  const raw: Record<string, string> = {};

  for (const [k, v] of request.nextUrl.searchParams.entries()) {
    raw[k] = v;
  }

  if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
    const contentType = (request.headers.get("content-type") ?? "").toLowerCase();

    try {
      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        for (const [k, v] of formData.entries()) {
          if (typeof v === "string") {
            raw[k] = v;
          }
        }
      } else if (contentType.includes("application/json")) {
        const json = (await request.json()) as unknown;
        if (json && typeof json === "object" && !Array.isArray(json)) {
          for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
            if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
              raw[k] = String(v);
            }
          }
        }
      } else {
        const bodyText = await request.text();
        if (bodyText.trim().startsWith("{")) {
          const json = JSON.parse(bodyText) as unknown;
          if (json && typeof json === "object" && !Array.isArray(json)) {
            for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
              if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
                raw[k] = String(v);
              }
            }
          }
        } else if (bodyText.trim().length > 0) {
          const params = new URLSearchParams(bodyText);
          for (const [k, v] of params.entries()) {
            raw[k] = v;
          }
        }
      }
    } catch {
      // Malformed bodies degrade gracefully to query params only
    }
  }

  const parsedAmount = Number(pickString(raw, "amount", "currency_amount"));
  const currencyRaw = pickString(raw, "currency", "currency_type");

  return {
    raw,
    tranId: pickString(raw, "tran_id", "transactionId"),
    valId: pickString(raw, "val_id", "valId"),
    status: pickString(raw, "status").toUpperCase(),
    bankTranId: pickString(raw, "bank_tran_id") || null,
    cardType: pickString(raw, "card_type") || null,
    cardBrand: pickString(raw, "card_brand") || null,
    cardIssuer: pickString(raw, "card_issuer") || null,
    amount: Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
    currency: currencyRaw ? currencyRaw.toUpperCase() : null,
    errorReason: pickString(raw, "error", "failedreason", "risk_title") || null,
    valueA: pickString(raw, "value_a") || null,
    valueB: pickString(raw, "value_b") || null,
  };
}

/**
 * Resolves a safe external app base URL using APP_URL from server env,
 * falling back to request origin only if APP_URL is unavailable during an error redirect.
 */
export function buildAppRedirect(
  pathWithQuery: string,
  fallbackRequestUrl?: string
): NextResponse {
  let baseUrl: string;
  try {
    baseUrl = getSslCommerzSandboxEnv().appUrl;
  } catch {
    if (fallbackRequestUrl) {
      baseUrl = new URL(fallbackRequestUrl).origin;
    } else {
      baseUrl = "http://localhost:3000";
    }
  }

  const normalizedPath = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  const destination = new URL(normalizedPath, `${baseUrl}/`);
  return NextResponse.redirect(destination, { status: 303 });
}

async function logPaymentAuditEvent(params: {
  paymentId: string;
  contractId: string;
  eventType: PaymentTransactionEventType;
  tranId: string;
  valId?: string | null;
  bankTranId?: string | null;
  gatewayStatus: string;
  amount?: number | null;
  currency?: string | null;
  riskLevel?: string | null;
  summary: Record<string, unknown>;
}) {
  const adminDb = createAdminClient();
  await adminDb.from("payment_transactions").insert({
    payment_id: params.paymentId,
    contract_id: params.contractId,
    event_type: params.eventType,
    gateway: "SSLCOMMERZ",
    gateway_transaction_id: params.tranId,
    validation_id: params.valId ?? null,
    bank_tran_id: params.bankTranId ?? null,
    gateway_status: params.gatewayStatus,
    amount: params.amount ?? null,
    currency: params.currency ?? null,
    risk_level: params.riskLevel ?? null,
    response_summary: sanitizeGatewayPayload(params.summary),
  });
}

/**
 * Independently verifies a payment against SSLCOMMERZ Sandbox Validation API
 * and atomically settles it via public.settle_funded_payment RPC.
 */
export async function verifyAndSettlePayment(params: {
  tranId: string;
  valId?: string | null;
  eventType: "SUCCESS_CALLBACK" | "IPN_CALLBACK" | "VALIDATION_CHECK";
  allowTranIdQuery?: boolean;
  rawCallbackPayload?: Record<string, unknown>;
}): Promise<VerifyAndSettleOutcome> {
  const tranId = params.tranId.trim();
  if (!tranId) {
    return {
      ok: false,
      alreadySettled: false,
      statusCode: 400,
      code: "MISSING_TRAN_ID",
      error: "Transaction ID (tran_id) is missing.",
      contractId: null,
      paymentId: null,
      transactionId: "",
    };
  }

  // Ensure server gateway configuration is valid before processing
  getSslCommerzSandboxEnv();
  const adminDb = createAdminClient();

  // 1. Fetch authoritative local payment record
  const { data: paymentData, error: lookupErr } = await adminDb
    .from("payments")
    .select(
      "id, contract_id, client_id, freelancer_id, amount, platform_fee, freelancer_amount, currency, transaction_id, status, validation_id, bank_tran_id, card_type, card_brand"
    )
    .eq("transaction_id", tranId)
    .maybeSingle();

  if (lookupErr) {
    console.error("Database error looking up payment for verification:", lookupErr.message);
    return {
      ok: false,
      alreadySettled: false,
      statusCode: 500,
      code: "DB_LOOKUP_FAILED",
      error: "Failed to query payment record in database.",
      contractId: null,
      paymentId: null,
      transactionId: tranId,
    };
  }

  if (!paymentData) {
    return {
      ok: false,
      alreadySettled: false,
      statusCode: 404,
      code: "PAYMENT_NOT_FOUND",
      error: "No matching payment record found for transaction ID.",
      contractId: null,
      paymentId: null,
      transactionId: tranId,
    };
  }

  const payment = paymentData as unknown as PaymentLookupRow;
  const currentStatus = String(payment.status ?? "").toUpperCase();

  // 2. Idempotency check: duplicate success redirects or repeated IPNs must never duplicate ledger entries
  if (SETTLED_STATUSES.has(currentStatus)) {
    const existingValId = params.valId?.trim() || payment.validation_id;

    await logPaymentAuditEvent({
      paymentId: payment.id,
      contractId: payment.contract_id,
      eventType: params.eventType,
      tranId,
      valId: existingValId,
      bankTranId: payment.bank_tran_id,
      gatewayStatus: `IDEMPOTENT_${currentStatus}`,
      amount: Number(payment.amount),
      currency: payment.currency,
      summary: {
        already_settled: true,
        payment_status: currentStatus,
        ...(params.rawCallbackPayload ? { callback: sanitizeGatewayPayload(params.rawCallbackPayload) } : {}),
      },
    });

    return {
      ok: true,
      alreadySettled: true,
      statusCode: 200,
      code: "ALREADY_SETTLED",
      contractId: payment.contract_id,
      paymentId: payment.id,
      transactionId: tranId,
      status: currentStatus,
      amount: Number(payment.amount),
      currency: payment.currency,
      validationId: existingValId,
      cardType: payment.card_type,
      cardBrand: payment.card_brand,
      gatewayStatus: "VALIDATED",
    };
  }

  // 3. Only PENDING payments can be settled (each attempt generates a unique tran_id)
  if (currentStatus !== "PENDING") {
    await logPaymentAuditEvent({
      paymentId: payment.id,
      contractId: payment.contract_id,
      eventType: params.eventType,
      tranId,
      valId: params.valId ?? null,
      gatewayStatus: `REJECTED_STATE_${currentStatus}`,
      amount: Number(payment.amount),
      currency: payment.currency,
      summary: {
        error: `Cannot settle payment with current status ${currentStatus}.`,
      },
    });

    return {
      ok: false,
      alreadySettled: false,
      statusCode: 409,
      code: "INVALID_PAYMENT_STATE",
      error: `Payment attempt is already closed with status ${currentStatus}. Please initiate a new payment attempt.`,
      contractId: payment.contract_id,
      paymentId: payment.id,
      transactionId: tranId,
      status: currentStatus,
    };
  }

  const candidateValId = params.valId?.trim() || payment.validation_id?.trim() || "";
  if (!candidateValId && !params.allowTranIdQuery) {
    await logPaymentAuditEvent({
      paymentId: payment.id,
      contractId: payment.contract_id,
      eventType: params.eventType,
      tranId,
      gatewayStatus: "MISSING_VAL_ID",
      summary: {
        error: "Gateway callback did not include val_id.",
        ...(params.rawCallbackPayload ? { callback: sanitizeGatewayPayload(params.rawCallbackPayload) } : {}),
      },
    });

    return {
      ok: false,
      alreadySettled: false,
      statusCode: 400,
      code: "MISSING_VAL_ID",
      error: "Gateway validation ID (val_id) was not provided.",
      contractId: payment.contract_id,
      paymentId: payment.id,
      transactionId: tranId,
    };
  }

  // 4. Independent server-to-server SSLCOMMERZ Sandbox validation call
  const validation: SslCommerzValidationResult = candidateValId
    ? await validateSslCommerzTransaction(candidateValId)
    : await validateSslCommerzByTranId(tranId);

  const expectedAmount = Number(payment.amount);
  const expectedCurrency = String(payment.currency || "BDT").toUpperCase();

  let rejectionCode: string | null = null;
  let rejectionReason: string | null = null;

  if (!validation.ok) {
    rejectionCode = "GATEWAY_VALIDATION_FAILED";
    rejectionReason =
      validation.errorMessage || `Gateway validation failed (status: ${validation.status}).`;
  } else if (!validation.tranId || validation.tranId !== payment.transaction_id) {
    rejectionCode = "TRANSACTION_ID_MISMATCH";
    rejectionReason = `Validated transaction ID (${validation.tranId ?? "none"}) does not match pending payment (${payment.transaction_id}).`;
  } else if (
    validation.amount === null ||
    Math.abs(Math.round(validation.amount * 100) - Math.round(expectedAmount * 100)) > 1
  ) {
    rejectionCode = "AMOUNT_MISMATCH";
    rejectionReason = `Validated amount (${validation.amount ?? "none"}) does not match stored contract amount (${expectedAmount.toFixed(2)}).`;
  } else if (!validation.currency || validation.currency.toUpperCase() !== expectedCurrency) {
    rejectionCode = "CURRENCY_MISMATCH";
    rejectionReason = `Validated currency (${validation.currency ?? "none"}) does not match ${expectedCurrency}.`;
  } else if (validation.valueA && validation.valueA !== payment.contract_id) {
    rejectionCode = "CONTRACT_MISMATCH";
    rejectionReason = "Validated gateway contract reference does not match the expected contract.";
  }

  if (rejectionCode) {
    await logPaymentAuditEvent({
      paymentId: payment.id,
      contractId: payment.contract_id,
      eventType: params.eventType,
      tranId,
      valId: validation.valId ?? (candidateValId || null),
      bankTranId: validation.bankTranId,
      gatewayStatus: rejectionCode,
      amount: validation.amount,
      currency: validation.currency,
      riskLevel: validation.riskLevel,
      summary: {
        rejectionCode,
        rejectionReason,
        expectedAmount,
        expectedCurrency,
        gatewayValidation: validation.rawSanitized,
      },
    });

    return {
      ok: false,
      alreadySettled: false,
      statusCode: 422,
      code: rejectionCode,
      error: rejectionReason ?? "Payment validation check failed.",
      contractId: payment.contract_id,
      paymentId: payment.id,
      transactionId: tranId,
      gatewayStatus: validation.status,
    };
  }

  // 5. Execute atomic, idempotent settlement RPC (writes payment + contract + FUND ledger + notifications)
  const sanitizedSummary: Record<string, unknown> = {
    ...validation.rawSanitized,
    ...(validation.riskLevel !== null ? { risk_level: validation.riskLevel } : {}),
  };

  const { data: rpcRaw, error: rpcErr } = await adminDb.rpc("settle_funded_payment", {
    p_transaction_id: payment.transaction_id,
    p_validation_id: validation.valId ?? candidateValId,
    p_bank_tran_id: validation.bankTranId ?? "",
    p_gateway_status: validation.status,
    p_validated_amount: validation.amount,
    p_validated_currency: validation.currency,
    p_card_type: validation.cardType,
    p_card_brand: validation.cardBrand,
    p_card_issuer: validation.cardIssuer,
    p_event_type: params.eventType,
    p_response_summary: sanitizedSummary,
  });

  if (rpcErr) {
    console.error("settle_funded_payment RPC failed:", rpcErr.message);
    return {
      ok: false,
      alreadySettled: false,
      statusCode: 500,
      code: "SETTLEMENT_RPC_ERROR",
      error: "Failed to record verified payment in internal escrow ledger.",
      contractId: payment.contract_id,
      paymentId: payment.id,
      transactionId: tranId,
    };
  }

  const rpcRes = (rpcRaw ?? {}) as SettleRpcResult;
  if (!rpcRes.ok) {
    const rpcCode = String(rpcRes.code ?? "SETTLEMENT_REJECTED");
    return {
      ok: false,
      alreadySettled: false,
      statusCode: rpcCode === "CONTRACT_NOT_FOUND" ? 404 : 422,
      code: rpcCode,
      error: `Settlement blocked by ledger verification (${rpcCode}).`,
      contractId: payment.contract_id,
      paymentId: payment.id,
      transactionId: tranId,
    };
  }

  return {
    ok: true,
    alreadySettled: Boolean(rpcRes.already_settled),
    statusCode: 200,
    code: rpcRes.already_settled ? "ALREADY_SETTLED" : "FUNDED",
    contractId: payment.contract_id,
    paymentId: payment.id,
    transactionId: payment.transaction_id,
    status: String(rpcRes.status ?? "FUNDED"),
    amount: expectedAmount,
    currency: expectedCurrency,
    validationId: validation.valId ?? candidateValId,
    cardType: validation.cardType,
    cardBrand: validation.cardBrand,
    gatewayStatus: validation.status,
  };
}

/**
 * Safely records FAILED or CANCELLED attempts for PENDING payments without ever
 * downgrading an already-settled payment.
 */
export async function recordFailedOrCancelledAttempt(params: {
  tranId: string;
  targetStatus: "FAILED" | "CANCELLED";
  eventType: "FAIL_CALLBACK" | "CANCEL_CALLBACK" | "IPN_CALLBACK";
  gatewayStatus?: string | null;
  reason?: string | null;
  cardType?: string | null;
  bankTranId?: string | null;
  rawPayload?: Record<string, unknown>;
}): Promise<FailOrCancelOutcome> {
  const tranId = params.tranId.trim();
  if (!tranId) {
    return {
      ok: false,
      ignoredBecauseSettled: false,
      statusCode: 400,
      code: "MISSING_TRAN_ID",
      error: "Missing transaction ID.",
      contractId: null,
      paymentId: null,
      transactionId: "",
      status: params.targetStatus,
    };
  }

  const adminDb = createAdminClient();
  const { data: paymentData, error: lookupErr } = await adminDb
    .from("payments")
    .select("id, contract_id, client_id, transaction_id, status, amount, currency")
    .eq("transaction_id", tranId)
    .maybeSingle();

  if (lookupErr || !paymentData) {
    return {
      ok: false,
      ignoredBecauseSettled: false,
      statusCode: lookupErr ? 500 : 404,
      code: lookupErr ? "DB_LOOKUP_FAILED" : "PAYMENT_NOT_FOUND",
      error: lookupErr ? "Database error looking up transaction." : "Payment record not found.",
      contractId: null,
      paymentId: null,
      transactionId: tranId,
      status: params.targetStatus,
    };
  }

  const payment = paymentData as unknown as {
    id: string;
    contract_id: string;
    client_id: string;
    transaction_id: string;
    status: string;
    amount: number | string;
    currency: string;
  };
  const currentStatus = String(payment.status ?? "").toUpperCase();

  // Never downgrade an already settled/refunded payment
  if (SETTLED_STATUSES.has(currentStatus)) {
    await logPaymentAuditEvent({
      paymentId: payment.id,
      contractId: payment.contract_id,
      eventType: params.eventType,
      tranId,
      gatewayStatus: `IGNORED_${params.targetStatus}_ON_${currentStatus}`,
      amount: Number(payment.amount),
      currency: payment.currency,
      summary: {
        note: "Ignored fail/cancel event because payment is already settled.",
        ...(params.rawPayload ? { callback: sanitizeGatewayPayload(params.rawPayload) } : {}),
      },
    });

    return {
      ok: true,
      ignoredBecauseSettled: true,
      statusCode: 200,
      code: "IGNORED_ALREADY_SETTLED",
      contractId: payment.contract_id,
      paymentId: payment.id,
      transactionId: tranId,
      status: currentStatus,
    };
  }

  const reasonText =
    params.reason?.trim() ||
    (params.targetStatus === "CANCELLED"
      ? "Payment was cancelled by the client at SSLCOMMERZ sandbox."
      : "Payment failed at SSLCOMMERZ sandbox.");

  await logPaymentAuditEvent({
    paymentId: payment.id,
    contractId: payment.contract_id,
    eventType: params.eventType,
    tranId,
    bankTranId: params.bankTranId ?? null,
    gatewayStatus: params.gatewayStatus || params.targetStatus,
    amount: Number(payment.amount),
    currency: payment.currency,
    summary: {
      reason: reasonText,
      ...(params.rawPayload ? { callback: sanitizeGatewayPayload(params.rawPayload) } : {}),
    },
  });

  if (currentStatus === "PENDING") {
    await adminDb
      .from("payments")
      .update({
        status: params.targetStatus,
        failure_reason: reasonText,
        ...(params.cardType ? { card_type: params.cardType } : {}),
        ...(params.bankTranId ? { bank_tran_id: params.bankTranId } : {}),
      })
      .eq("id", payment.id)
      .eq("status", "PENDING");

    // Only update contract payment_status if contract is not yet funded/settled
    await adminDb
      .from("contracts")
      .update({ payment_status: params.targetStatus })
      .eq("id", payment.contract_id)
      .in("payment_status", ["UNPAID", "PENDING", "FAILED", "CANCELLED"]);

    // Create deduplicated notification for failed payment
    if (params.targetStatus === "FAILED") {
      const [{ data: clientRow }, { data: contractRow }] = await Promise.all([
        adminDb
          .from("clients")
          .select("user_id")
          .eq("id", payment.client_id)
          .maybeSingle(),
        adminDb
          .from("contracts")
          .select("contract_code, projects(title)")
          .eq("id", payment.contract_id)
          .maybeSingle(),
      ]);

      if (clientRow?.user_id) {
        const projectsRaw = (contractRow as { projects?: { title?: string } | { title?: string }[] | null } | null)
          ?.projects;
        const proj = Array.isArray(projectsRaw) ? projectsRaw[0] : projectsRaw;
        const label =
          proj?.title?.trim() ||
          `Contract ${(contractRow as { contract_code?: string } | null)?.contract_code || payment.contract_id.slice(0, 8)}`;

        await adminDb.from("notifications").upsert(
          {
            user_id: clientRow.user_id,
            role_target: "client",
            contract_id: payment.contract_id,
            payment_id: payment.id,
            event_key: `payment_failed:${payment.id}`,
            title: "Payment Failed",
            message: `Payment attempt (${tranId}) for "${label}" failed: ${reasonText}`,
            title_bn: "পেমেন্ট ব্যর্থ হয়েছে",
            message_bn: `"${label}"-এর পেমেন্ট চেষ্টা (${tranId}) সম্পন্ন হয়নি। আবার চেষ্টা করতে পারেন।`,
          },
          { onConflict: "user_id,event_key", ignoreDuplicates: true }
        );
      }
    }
  }

  return {
    ok: true,
    ignoredBecauseSettled: false,
    statusCode: 200,
    code: params.targetStatus,
    contractId: payment.contract_id,
    paymentId: payment.id,
    transactionId: tranId,
    status: currentStatus === "PENDING" ? params.targetStatus : currentStatus,
  };
}

/**
 * Shared asynchronous SSLCOMMERZ IPN listener used by both
 * /api/payments/ipn and /ipn (merchant dashboard IPN URL).
 */
export async function handleSslCommerzIpnRequest(request: NextRequest) {
  try {
    getSslCommerzSandboxEnv();
    const payload = await extractCallbackPayload(request);

    if (!payload.tranId) {
      return NextResponse.json(
        { ok: false, code: "MISSING_TRAN_ID", error: "Missing tran_id in IPN payload." },
        { status: 400 }
      );
    }

    const gwStatus = payload.status;

    if (
      gwStatus === "FAILED" ||
      gwStatus === "CANCELLED" ||
      gwStatus === "CANCELED" ||
      gwStatus === "EXPIRED" ||
      gwStatus === "UNATTEMPTED"
    ) {
      const targetStatus =
        gwStatus === "CANCELLED" || gwStatus === "CANCELED" ? "CANCELLED" : "FAILED";
      const result = await recordFailedOrCancelledAttempt({
        tranId: payload.tranId,
        targetStatus,
        eventType: "IPN_CALLBACK",
        gatewayStatus: gwStatus,
        reason: payload.errorReason,
        cardType: payload.cardType,
        bankTranId: payload.bankTranId,
        rawPayload: payload.raw,
      });

      return NextResponse.json(
        {
          ok: result.ok,
          code: result.code,
          status: result.status,
          transactionId: result.transactionId,
          contractId: result.contractId,
          ignoredBecauseSettled: result.ignoredBecauseSettled,
        },
        { status: result.statusCode }
      );
    }

    // For VALID / VALIDATED or any non-failed IPN event, independently verify with SSLCOMMERZ Validation API
    const settled = await verifyAndSettlePayment({
      tranId: payload.tranId,
      valId: payload.valId,
      eventType: "IPN_CALLBACK",
      allowTranIdQuery: !payload.valId,
      rawCallbackPayload: payload.raw,
    });

    return NextResponse.json(
      {
        ok: settled.ok,
        alreadySettled: settled.alreadySettled,
        code: settled.code,
        status: settled.status ?? null,
        transactionId: settled.transactionId,
        contractId: settled.contractId,
        paymentId: settled.paymentId,
        error: settled.error ?? null,
      },
      { status: settled.statusCode }
    );
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      console.error("IPN configuration error:", err.message);
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("Unexpected error in SSLCOMMERZ IPN handler:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error handling IPN." },
      { status: 500 }
    );
  }
}

