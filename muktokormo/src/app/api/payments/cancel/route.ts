import type { NextRequest } from "next/server";
import {
  buildAppRedirect,
  extractCallbackPayload,
  recordFailedOrCancelledAttempt,
} from "@/lib/payments/callbacks";

async function handleCancelCallback(request: NextRequest) {
  const payload = await extractCallbackPayload(request);

  if (!payload.tranId) {
    return buildAppRedirect("/dashboard/client?payment=cancelled", request.url);
  }

  try {
    const outcome = await recordFailedOrCancelledAttempt({
      tranId: payload.tranId,
      targetStatus: "CANCELLED",
      eventType: "CANCEL_CALLBACK",
      gatewayStatus: payload.status || "CANCELLED",
      reason: payload.errorReason || "Client cancelled payment at SSLCOMMERZ sandbox.",
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
      payment: "cancelled",
      tran_id: payload.tranId,
    });
    return buildAppRedirect(`${contractSegment}?${qs.toString()}`, request.url);
  } catch (err) {
    console.error("Unhandled SSLCOMMERZ cancel callback error:", err);
    return buildAppRedirect(
      `/dashboard/client?payment=cancelled&tran_id=${encodeURIComponent(payload.tranId)}`,
      request.url
    );
  }
}

export async function POST(request: NextRequest) {
  return handleCancelCallback(request);
}

export async function GET(request: NextRequest) {
  return handleCancelCallback(request);
}

