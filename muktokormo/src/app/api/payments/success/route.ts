import type { NextRequest } from "next/server";
import {
  buildAppRedirect,
  extractCallbackPayload,
  verifyAndSettlePayment,
} from "@/lib/payments/callbacks";

async function handleSuccessCallback(request: NextRequest) {
  const payload = await extractCallbackPayload(request);

  if (!payload.tranId) {
    return buildAppRedirect(
      "/dashboard/client?payment=verification_failed&reason=MISSING_TRAN_ID",
      request.url
    );
  }

  try {
    const outcome = await verifyAndSettlePayment({
      tranId: payload.tranId,
      valId: payload.valId,
      eventType: "SUCCESS_CALLBACK",
      allowTranIdQuery: false,
      rawCallbackPayload: payload.raw,
    });

    const contractSegment = outcome.contractId
      ? `/contracts/${outcome.contractId}`
      : "/dashboard/client";

    if (outcome.ok) {
      const qs = new URLSearchParams({
        payment: "success",
        tran_id: outcome.transactionId,
        ...(outcome.alreadySettled ? { already_settled: "1" } : {}),
      });
      return buildAppRedirect(`${contractSegment}?${qs.toString()}`, request.url);
    }

    const qs = new URLSearchParams({
      payment: "verification_failed",
      tran_id: payload.tranId,
      reason: outcome.code,
    });
    return buildAppRedirect(`${contractSegment}?${qs.toString()}`, request.url);
  } catch (err) {
    console.error("Unhandled SSLCOMMERZ success callback error:", err);
    const qs = new URLSearchParams({
      payment: "verification_failed",
      tran_id: payload.tranId,
      reason: "GATEWAY_VERIFICATION_ERROR",
    });
    return buildAppRedirect(`/dashboard/client?${qs.toString()}`, request.url);
  }
}

export async function POST(request: NextRequest) {
  return handleSuccessCallback(request);
}

export async function GET(request: NextRequest) {
  return handleSuccessCallback(request);
}

