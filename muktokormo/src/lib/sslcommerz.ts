import crypto from "crypto";
import { getSslCommerzSandboxEnv } from "@/lib/env";

if (typeof window !== "undefined") {
  throw new Error("src/lib/sslcommerz.ts cannot be imported in browser code.");
}

export interface SslCommerzSessionInput {
  tranId: string;
  totalAmount: number;
  currency?: "BDT";
  productName: string;
  productCategory: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity?: string;
  customerCountry?: string;
  contractId: string;
  paymentId: string;
}

export interface SslCommerzSessionResult {
  ok: boolean;
  gatewayPageUrl: string | null;
  sessionKey: string | null;
  failedReason: string | null;
  rawSanitized: Record<string, unknown>;
}

export interface SslCommerzValidationResult {
  ok: boolean;
  status: string;
  tranId: string | null;
  valId: string | null;
  bankTranId: string | null;
  amount: number | null;
  currency: string | null;
  cardType: string | null;
  cardBrand: string | null;
  cardIssuer: string | null;
  riskLevel: string | null;
  valueA: string | null;
  valueB: string | null;
  errorMessage: string | null;
  rawSanitized: Record<string, unknown>;
}

const SENSITIVE_GATEWAY_KEYS = new Set([
  "store_passwd",
  "store_password",
  "store_id",
  "verify_sign",
  "verify_key",
  "passwd",
  "password",
  "secret",
  "service_role",
]);

function sanitizeGatewayValue(val: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) {
    return val.slice(0, 25).map((item) => sanitizeGatewayValue(item, depth + 1));
  }
  if (typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (SENSITIVE_GATEWAY_KEYS.has(k.toLowerCase())) {
        continue;
      }
      out[k] = sanitizeGatewayValue(v, depth + 1);
    }
    return out;
  }
  return val;
}

/**
 * Strips credentials/signatures before writing gateway responses into DB audit logs.
 */
export function sanitizeGatewayPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { value: String(payload ?? "") };
  }

  return sanitizeGatewayValue(payload, 0) as Record<string, unknown>;
}

/**
 * Generates a unique transaction ID compliant with SSLCOMMERZ <= 30 character tran_id limit.
 */
export function generateUniqueTransactionId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `MKP-${ts}-${rnd}`.slice(0, 28);
}

function cleanGatewayText(value: string, fallback: string, maxLen: number): string {
  const cleaned = value.replace(/[<>]/g, "").trim();
  const nonEmpty = cleaned.length > 0 ? cleaned : fallback;
  return nonEmpty.slice(0, maxLen);
}

/**
 * Calls the official SSLCOMMERZ Sandbox Session API (v4).
 */
export async function initiateSslCommerzSession(
  input: SslCommerzSessionInput
): Promise<SslCommerzSessionResult> {
  const env = getSslCommerzSandboxEnv();

  const cityFromAddress =
    input.customerCity?.trim() ||
    input.customerAddress.split(",")[0]?.trim() ||
    "Dhaka";

  const formParams = new URLSearchParams({
    store_id: env.storeId,
    store_passwd: env.storePassword,
    total_amount: Number(input.totalAmount).toFixed(2),
    currency: input.currency ?? "BDT",
    tran_id: cleanGatewayText(input.tranId, generateUniqueTransactionId(), 30),
    success_url: `${env.appUrl}/api/payments/success`,
    fail_url: `${env.appUrl}/api/payments/fail`,
    cancel_url: `${env.appUrl}/api/payments/cancel`,
    ipn_url: `${env.appUrl}/api/payments/ipn`,
    shipping_method: "NO",
    num_of_item: "1",
    product_name: cleanGatewayText(input.productName, "MuktoKormo Contract Escrow", 240),
    product_category: cleanGatewayText(input.productCategory, "Freelance Services", 90),
    product_profile: "non-physical-goods",
    cus_name: cleanGatewayText(input.customerName, "MuktoKormo Client", 90),
    cus_email: cleanGatewayText(input.customerEmail, "client@muktokormo.com", 90),
    cus_phone: cleanGatewayText(input.customerPhone, "01700000000", 20),
    cus_add1: cleanGatewayText(input.customerAddress, "Dhaka, Bangladesh", 120),
    cus_city: cleanGatewayText(cityFromAddress, "Dhaka", 50),
    cus_country: cleanGatewayText(input.customerCountry ?? "Bangladesh", "Bangladesh", 50),
    value_a: input.contractId,
    value_b: input.paymentId,
  });

  try {
    const response = await fetch(env.sessionApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: formParams.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const rawText = await response.text();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      return {
        ok: false,
        gatewayPageUrl: null,
        sessionKey: null,
        failedReason: `Invalid non-JSON response from SSLCOMMERZ sandbox (HTTP ${response.status}).`,
        rawSanitized: { httpStatus: response.status, preview: rawText.slice(0, 300) },
      };
    }

    const sanitized = sanitizeGatewayPayload(parsed);
    const status = String(parsed.status ?? "").toUpperCase();
    const gatewayPageUrl =
      typeof parsed.GatewayPageURL === "string" && parsed.GatewayPageURL.trim().length > 0
        ? parsed.GatewayPageURL.trim()
        : null;
    const sessionKey =
      typeof parsed.sessionkey === "string" && parsed.sessionkey.trim().length > 0
        ? parsed.sessionkey.trim()
        : null;

    if (!response.ok || status !== "SUCCESS" || !gatewayPageUrl) {
      return {
        ok: false,
        gatewayPageUrl: null,
        sessionKey,
        failedReason:
          typeof parsed.failedreason === "string" && parsed.failedreason.trim()
            ? parsed.failedreason.trim()
            : `SSLCOMMERZ session initialization failed (status: ${status || response.status}).`,
        rawSanitized: sanitized,
      };
    }

    // Ensure returned gateway URL is a valid HTTPS URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(gatewayPageUrl);
    } catch {
      return {
        ok: false,
        gatewayPageUrl: null,
        sessionKey,
        failedReason: "SSLCOMMERZ returned an invalid GatewayPageURL.",
        rawSanitized: sanitized,
      };
    }

    if (parsedUrl.protocol !== "https:") {
      return {
        ok: false,
        gatewayPageUrl: null,
        sessionKey,
        failedReason: "SSLCOMMERZ returned a non-HTTPS GatewayPageURL.",
        rawSanitized: sanitized,
      };
    }

    return {
      ok: true,
      gatewayPageUrl,
      sessionKey,
      failedReason: null,
      rawSanitized: sanitized,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error connecting to SSLCOMMERZ sandbox.";
    return {
      ok: false,
      gatewayPageUrl: null,
      sessionKey: null,
      failedReason: message,
      rawSanitized: { networkError: true },
    };
  }
}

function parseValidationPayload(
  parsed: Record<string, unknown>,
  fallbackValId: string | null,
  httpOk: boolean,
  httpStatus: number
): SslCommerzValidationResult {
  const sanitized = sanitizeGatewayPayload(parsed);
  const status = String(parsed.status ?? "").toUpperCase();
  const parsedAmount = Number(parsed.amount ?? parsed.currency_amount);
  const rawCurrency =
    typeof parsed.currency === "string" && parsed.currency.trim()
      ? parsed.currency
      : typeof parsed.currency_type === "string" && parsed.currency_type.trim()
        ? parsed.currency_type
        : null;

  const isSuccessStatus = httpOk && (status === "VALID" || status === "VALIDATED");

  return {
    ok: isSuccessStatus,
    status: status || "UNKNOWN",
    tranId: typeof parsed.tran_id === "string" ? parsed.tran_id : null,
    valId: typeof parsed.val_id === "string" ? parsed.val_id : fallbackValId,
    bankTranId: typeof parsed.bank_tran_id === "string" ? parsed.bank_tran_id : null,
    amount: Number.isFinite(parsedAmount) ? parsedAmount : null,
    currency: rawCurrency ? rawCurrency.trim().toUpperCase() : null,
    cardType: typeof parsed.card_type === "string" ? parsed.card_type : null,
    cardBrand: typeof parsed.card_brand === "string" ? parsed.card_brand : null,
    cardIssuer: typeof parsed.card_issuer === "string" ? parsed.card_issuer : null,
    riskLevel:
      parsed.risk_level !== undefined && parsed.risk_level !== null
        ? String(parsed.risk_level)
        : null,
    valueA: typeof parsed.value_a === "string" && parsed.value_a.trim() ? parsed.value_a.trim() : null,
    valueB: typeof parsed.value_b === "string" && parsed.value_b.trim() ? parsed.value_b.trim() : null,
    errorMessage: isSuccessStatus
      ? null
      : typeof parsed.error === "string" && parsed.error
        ? parsed.error
        : `Gateway validation returned status: ${status || httpStatus}`,
    rawSanitized: sanitized,
  };
}

function emptyValidationFailure(
  status: string,
  valId: string | null,
  errorMessage: string,
  rawSanitized: Record<string, unknown> = {}
): SslCommerzValidationResult {
  return {
    ok: false,
    status,
    tranId: null,
    valId,
    bankTranId: null,
    amount: null,
    currency: null,
    cardType: null,
    cardBrand: null,
    cardIssuer: null,
    riskLevel: null,
    valueA: null,
    valueB: null,
    errorMessage,
    rawSanitized,
  };
}

/**
 * Calls the official SSLCOMMERZ Sandbox Transaction Validation API.
 * Never skips independent server verification.
 */
export async function validateSslCommerzTransaction(
  valId: string
): Promise<SslCommerzValidationResult> {
  const env = getSslCommerzSandboxEnv();
  const cleanValId = valId.trim();

  if (!cleanValId) {
    return emptyValidationFailure("INVALID", null, "Missing val_id for SSLCOMMERZ validation.");
  }

  const url = new URL(env.validationApiUrl);
  url.searchParams.set("val_id", cleanValId);
  url.searchParams.set("store_id", env.storeId);
  url.searchParams.set("store_passwd", env.storePassword);
  url.searchParams.set("format", "json");
  url.searchParams.set("v", "1");

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const rawText = await response.text();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      return emptyValidationFailure(
        "INVALID_RESPONSE",
        cleanValId,
        `Non-JSON response from SSLCOMMERZ validation API (HTTP ${response.status}).`,
        { httpStatus: response.status, preview: rawText.slice(0, 300) }
      );
    }

    return parseValidationPayload(parsed, cleanValId, response.ok, response.status);
  } catch (err) {
    return emptyValidationFailure(
      "NETWORK_ERROR",
      cleanValId,
      err instanceof Error ? err.message : "Network error during validation.",
      { networkError: true }
    );
  }
}

/**
 * Queries SSLCOMMERZ Sandbox Transaction Validation by Merchant Transaction ID
 * (merchantTransIDvalidationAPI.php) as an authoritative fallback when checking pending sessions.
 */
export async function validateSslCommerzByTranId(
  tranId: string
): Promise<SslCommerzValidationResult> {
  const env = getSslCommerzSandboxEnv();
  const cleanTranId = tranId.trim();

  if (!cleanTranId) {
    return emptyValidationFailure("INVALID", null, "Missing tran_id for SSLCOMMERZ merchant query.");
  }

  const url = new URL(env.refundApiUrl);
  url.searchParams.set("tran_id", cleanTranId);
  url.searchParams.set("store_id", env.storeId);
  url.searchParams.set("store_passwd", env.storePassword);
  url.searchParams.set("format", "json");
  url.searchParams.set("v", "1");

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const rawText = await response.text();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      return emptyValidationFailure(
        "INVALID_RESPONSE",
        null,
        `Non-JSON response from SSLCOMMERZ transaction query API (HTTP ${response.status}).`,
        { httpStatus: response.status, preview: rawText.slice(0, 300) }
      );
    }

    const elementsRaw = parsed.element;
    const elements = Array.isArray(elementsRaw)
      ? (elementsRaw.filter((el): el is Record<string, unknown> => Boolean(el && typeof el === "object")))
      : [];

    if (elements.length === 0) {
      return emptyValidationFailure(
        String(parsed.APIConnect ?? "NOT_FOUND"),
        null,
        "No transaction records returned by SSLCOMMERZ sandbox for this transaction ID.",
        sanitizeGatewayPayload(parsed)
      );
    }

    const validEntry =
      elements.find((el) => {
        const s = String(el.status ?? "").toUpperCase();
        return s === "VALID" || s === "VALIDATED";
      }) ?? elements[0];

    return parseValidationPayload(validEntry, null, response.ok, response.status);
  } catch (err) {
    return emptyValidationFailure(
      "NETWORK_ERROR",
      null,
      err instanceof Error ? err.message : "Network error querying transaction status.",
      { networkError: true }
    );
  }
}

export interface SslCommerzRefundInitiateInput {
  bankTranId: string;
  refundTransId: string;
  refundAmount: number;
  refundRemarks: string;
  refeId?: string;
}

export interface SslCommerzRefundInitiateResult {
  ok: boolean;
  apiConnect: string | null;
  gatewayStatus: string;
  refundRefId: string | null;
  bankTranId: string | null;
  errorReason: string | null;
  rawSanitized: Record<string, unknown>;
}

export interface SslCommerzRefundStatusResult {
  ok: boolean;
  apiConnect: string | null;
  gatewayStatus: "REFUNDED" | "PROCESSING" | "CANCELLED" | "UNKNOWN";
  bankTranId: string | null;
  tranId: string | null;
  initiatedOn: string | null;
  refundedOn: string | null;
  errorReason: string | null;
  rawSanitized: Record<string, unknown>;
}

/**
 * Generates a unique refund_trans_id compliant with SSLCOMMERZ <= 30 character limit.
 */
export function generateUniqueRefundTransactionId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `MKR-${ts}-${rnd}`.slice(0, 28);
}

/**
 * Calls the official SSLCOMMERZ Sandbox Refund Initiate API (GET merchantTransIDvalidationAPI.php).
 * Note: Gateway `status: "success"` means the refund request was queued/initiated, NOT finalized.
 */
export async function initiateSslCommerzRefund(
  input: SslCommerzRefundInitiateInput
): Promise<SslCommerzRefundInitiateResult> {
  const env = getSslCommerzSandboxEnv();
  const cleanBankTranId = input.bankTranId.trim();

  if (!cleanBankTranId) {
    return {
      ok: false,
      apiConnect: null,
      gatewayStatus: "MISSING_BANK_TRAN_ID",
      refundRefId: null,
      bankTranId: null,
      errorReason: "Missing bank_tran_id required by SSLCOMMERZ Sandbox Refund API.",
      rawSanitized: {},
    };
  }

  const url = new URL(env.refundApiUrl);
  url.searchParams.set("bank_tran_id", cleanBankTranId);
  url.searchParams.set(
    "refund_trans_id",
    cleanGatewayText(input.refundTransId, generateUniqueRefundTransactionId(), 30)
  );
  url.searchParams.set("refund_amount", Number(input.refundAmount).toFixed(2));
  url.searchParams.set(
    "refund_remarks",
    cleanGatewayText(input.refundRemarks, "Contract escrow refund approved by MuktoKormo admin", 250)
  );
  if (input.refeId?.trim()) {
    url.searchParams.set("refe_id", cleanGatewayText(input.refeId, "MK-REF", 50));
  }
  url.searchParams.set("store_id", env.storeId);
  url.searchParams.set("store_passwd", env.storePassword);
  url.searchParams.set("v", "1");
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const rawText = await response.text();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      return {
        ok: false,
        apiConnect: null,
        gatewayStatus: "INVALID_RESPONSE",
        refundRefId: null,
        bankTranId: cleanBankTranId,
        errorReason: `Non-JSON response from SSLCOMMERZ Sandbox Refund API (HTTP ${response.status}).`,
        rawSanitized: { httpStatus: response.status, preview: rawText.slice(0, 300) },
      };
    }

    const sanitized = sanitizeGatewayPayload(parsed);
    const apiConnect = typeof parsed.APIConnect === "string" ? parsed.APIConnect : null;
    const statusRaw = String(parsed.status ?? "UNKNOWN").trim().toUpperCase();
    const refundRefId =
      typeof parsed.refund_ref_id === "string" && parsed.refund_ref_id.trim()
        ? parsed.refund_ref_id.trim()
        : null;
    const errorReason =
      typeof parsed.errorReason === "string" && parsed.errorReason.trim()
        ? parsed.errorReason.trim()
        : typeof parsed.failedreason === "string" && parsed.failedreason.trim()
          ? parsed.failedreason.trim()
          : null;

    const ok = response.ok && statusRaw === "SUCCESS" && Boolean(refundRefId);

    return {
      ok,
      apiConnect,
      gatewayStatus: statusRaw || "UNKNOWN",
      refundRefId,
      bankTranId:
        typeof parsed.bank_tran_id === "string" && parsed.bank_tran_id.trim()
          ? parsed.bank_tran_id.trim()
          : cleanBankTranId,
      errorReason: ok
        ? null
        : errorReason || `SSLCOMMERZ Refund initiation did not return success/refund_ref_id (status: ${statusRaw || response.status}).`,
      rawSanitized: sanitized,
    };
  } catch (err) {
    return {
      ok: false,
      apiConnect: null,
      gatewayStatus: "NETWORK_ERROR",
      refundRefId: null,
      bankTranId: cleanBankTranId,
      errorReason:
        err instanceof Error
          ? err.message
          : "Network error calling SSLCOMMERZ Sandbox Refund API.",
      rawSanitized: { networkError: true },
    };
  }
}

/**
 * Calls the official SSLCOMMERZ Sandbox Refund Status Query API by `refund_ref_id`.
 * Only `"refunded"` confirms gateway refund settlement; `"processing"` remains pending/initiated.
 */
export async function querySslCommerzRefundStatus(
  refundRefId: string
): Promise<SslCommerzRefundStatusResult> {
  const env = getSslCommerzSandboxEnv();
  const cleanRefId = refundRefId.trim();

  if (!cleanRefId) {
    return {
      ok: false,
      apiConnect: null,
      gatewayStatus: "UNKNOWN",
      bankTranId: null,
      tranId: null,
      initiatedOn: null,
      refundedOn: null,
      errorReason: "Missing refund_ref_id for SSLCOMMERZ refund status query.",
      rawSanitized: {},
    };
  }

  const url = new URL(env.refundApiUrl);
  url.searchParams.set("refund_ref_id", cleanRefId);
  url.searchParams.set("store_id", env.storeId);
  url.searchParams.set("store_passwd", env.storePassword);
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const rawText = await response.text();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      return {
        ok: false,
        apiConnect: null,
        gatewayStatus: "UNKNOWN",
        bankTranId: null,
        tranId: null,
        initiatedOn: null,
        refundedOn: null,
        errorReason: `Non-JSON response from SSLCOMMERZ Refund Status API (HTTP ${response.status}).`,
        rawSanitized: { httpStatus: response.status, preview: rawText.slice(0, 300) },
      };
    }

    const sanitized = sanitizeGatewayPayload(parsed);
    const apiConnect = typeof parsed.APIConnect === "string" ? parsed.APIConnect : null;
    const rawStatus = String(parsed.status ?? "").trim().toUpperCase();
    const mappedStatus: SslCommerzRefundStatusResult["gatewayStatus"] =
      rawStatus === "REFUNDED"
        ? "REFUNDED"
        : rawStatus === "PROCESSING" || rawStatus === "SUCCESS"
          ? "PROCESSING"
          : rawStatus === "CANCELLED" || rawStatus === "CANCELED" || rawStatus === "FAILED"
            ? "CANCELLED"
            : "UNKNOWN";

    const errorReason =
      typeof parsed.errorReason === "string" && parsed.errorReason.trim()
        ? parsed.errorReason.trim()
        : null;

    return {
      ok: response.ok && (mappedStatus === "REFUNDED" || mappedStatus === "PROCESSING"),
      apiConnect,
      gatewayStatus: mappedStatus,
      bankTranId: typeof parsed.bank_tran_id === "string" ? parsed.bank_tran_id : null,
      tranId: typeof parsed.tran_id === "string" ? parsed.tran_id : null,
      initiatedOn: typeof parsed.initiated_on === "string" ? parsed.initiated_on : null,
      refundedOn: typeof parsed.refunded_on === "string" ? parsed.refunded_on : null,
      errorReason:
        mappedStatus === "UNKNOWN"
          ? errorReason || `Unexpected refund status response: ${rawStatus || response.status}`
          : errorReason,
      rawSanitized: sanitized,
    };
  } catch (err) {
    return {
      ok: false,
      apiConnect: null,
      gatewayStatus: "UNKNOWN",
      bankTranId: null,
      tranId: null,
      initiatedOn: null,
      refundedOn: null,
      errorReason:
        err instanceof Error
          ? err.message
          : "Network error querying SSLCOMMERZ refund status.",
      rawSanitized: { networkError: true },
    };
  }
}

