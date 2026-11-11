import type { NextRequest } from "next/server";
import {
  buildAppRedirect,
  extractCallbackPayload,
  recordFailedOrCancelledAttempt,
} from "@/lib/payments/callbacks";

async function handleFailCallback(request: NextRequest) {
  const payload = await extractCallbackPayload(request);

  if (!payload.tranId) {
    return buildAppRedirect(
      "/dashboard/client?payment=failed&reason=MISSING_TRAN_ID",
      request.url
    );
  }

  try {
    const outcome = await recordFailedOrCancelledAttempt({
      tranId: payload.tranId,
      targetStatus: "FAILED",
      eventType: "FAIL_CALLBACK",
      gatewayStatus: payload.status || "FAILED",
      reason: payload.errorReason,
      cardType: payload.cardType,
      bankTranId: payload.bankTranId,
      rawPayload: payload.raw,
    });

    const contractSegment = outcome.contractId
      ? `/contracts/${outcome.contractId}`
      : "/dashboard/client";

    if (outcome.ignoredBecauseSettled) {
      const qs = new URLSearchParams({
        payment: "success",
        tran_id: outcome.transactionId,
        already_settled: "1",
      });
      return buildAppRedirect(`${contractSegment}?${qs.toString()}`, request.url);
    }

    const qs = new URLSearchParams({
      payment: "failed",
      tran_id: payload.tranId,
      reason: outcome.code,
    });
    return buildAppRedirect(`${contractSegment}?${qs.toString()}`, request.url);
  } catch (err) {
    console.error("Unhandled SSLCOMMERZ fail callback error:", err);
    return buildAppRedirect(
      `/dashboard/client?payment=failed&tran_id=${encodeURIComponent(payload.tranId)}`,
      request.url
    );
  }
}

export async function POST(request: NextRequest) {
  return handleFailCallback(request);
}

export async function GET(request: NextRequest) {
  return handleFailCallback(request);
}

