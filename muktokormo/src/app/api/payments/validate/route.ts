import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentConfigError, getSslCommerzSandboxEnv } from "@/lib/env";
import { isUuid } from "@/lib/payments/constants";
import { verifyAndSettlePayment } from "@/lib/payments/callbacks";
import { validateSslCommerzTransaction } from "@/lib/sslcommerz";

interface PaymentOwnershipRow {
  id: string;
  contract_id: string;
  client_id: string;
  freelancer_id: string;
  amount: number | string;
  currency: string;
  transaction_id: string;
  status: string;
  validation_id: string | null;
  card_type: string | null;
  card_brand: string | null;
  clients?: { user_id?: string | null } | { user_id?: string | null }[] | null;
  freelancers?: { user_id?: string | null } | { user_id?: string | null }[] | null;
}

function firstUserId(
  rel: { user_id?: string | null } | { user_id?: string | null }[] | null | undefined
): string | null {
  const item = Array.isArray(rel) ? rel[0] : rel;
  return item?.user_id ?? null;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller first
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to validate a payment." },
        { status: 401 }
      );
    }

    getSslCommerzSandboxEnv();
    const adminDb = createAdminClient();

    // 2. Parse and validate body
    let body: { transactionId?: unknown; paymentId?: unknown; valId?: unknown };
    try {
      body = (await request.json()) as {
        transactionId?: unknown;
        paymentId?: unknown;
        valId?: unknown;
      };
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const rawTranId =
      typeof body.transactionId === "string" ? body.transactionId.trim() : "";
    const rawPaymentId =
      typeof body.paymentId === "string" ? body.paymentId.trim() : "";
    const rawValId = typeof body.valId === "string" ? body.valId.trim() : "";

    if (!rawTranId && !isUuid(rawPaymentId)) {
      return NextResponse.json(
        { ok: false, error: "Provide a valid transactionId or paymentId UUID." },
        { status: 400 }
      );
    }

    if (rawTranId && !/^[A-Za-z0-9_-]{4,80}$/.test(rawTranId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid transactionId format." },
        { status: 400 }
      );
    }

    // 3. Look up payment and verify authorization (client owner, contract freelancer, or admin)
    const selectCols =
      "id, contract_id, client_id, freelancer_id, amount, currency, transaction_id, status, validation_id, card_type, card_brand, clients(user_id), freelancers(user_id)";

    const query = rawTranId
      ? adminDb.from("payments").select(selectCols).eq("transaction_id", rawTranId)
      : adminDb.from("payments").select(selectCols).eq("id", rawPaymentId);

    const { data: paymentRow, error: lookupErr } = await query.maybeSingle();

    if (lookupErr) {
      console.error("Validate route payment lookup error:", lookupErr.message);
      return NextResponse.json(
        { ok: false, error: "Failed to query payment record." },
        { status: 500 }
      );
    }

    if (!paymentRow) {
      return NextResponse.json(
        { ok: false, code: "PAYMENT_NOT_FOUND", error: "Payment record not found." },
        { status: 404 }
      );
    }

    const payment = paymentRow as unknown as PaymentOwnershipRow;
    const clientUserId = firstUserId(payment.clients);
    const freelancerUserId = firstUserId(payment.freelancers);
    const { data: isAdminFlag } = await adminDb.rpc("is_admin", { uid: user.id });

    const isAuthorized =
      Boolean(isAdminFlag) ||
      (clientUserId !== null && clientUserId === user.id) ||
      (freelancerUserId !== null && freelancerUserId === user.id);

    if (!isAuthorized) {
      return NextResponse.json(
        { ok: false, error: "Forbidden. You are not authorized to validate this payment." },
        { status: 403 }
      );
    }

    const valIdToCheck = rawValId || payment.validation_id || "";
    const statusUpper = String(payment.status ?? "").toUpperCase();

    // 4. If already settled, perform safe read-only SSLCOMMERZ re-check without exposing secrets
    if (["FUNDED", "RELEASED", "REFUND_REQUESTED", "REFUNDED"].includes(statusUpper)) {
      let gatewayCheckStatus = "VALIDATED";
      if (valIdToCheck) {
        const recheck = await validateSslCommerzTransaction(valIdToCheck);
        gatewayCheckStatus = recheck.status;
        await adminDb.from("payment_transactions").insert({
          payment_id: payment.id,
          contract_id: payment.contract_id,
          event_type: "VALIDATION_CHECK",
          gateway: "SSLCOMMERZ",
          gateway_transaction_id: payment.transaction_id,
          validation_id: recheck.valId ?? valIdToCheck,
          bank_tran_id: recheck.bankTranId,
          gateway_status: recheck.status,
          amount: recheck.amount ?? Number(payment.amount),
          currency: recheck.currency ?? payment.currency,
          risk_level: recheck.riskLevel,
          response_summary: recheck.rawSanitized,
        });
      }

      return NextResponse.json({
        ok: true,
        verified: true,
        alreadySettled: true,
        code: "ALREADY_SETTLED",
        contractId: payment.contract_id,
        paymentId: payment.id,
        transactionId: payment.transaction_id,
        paymentStatus: statusUpper,
        gatewayStatus: gatewayCheckStatus,
        amount: Number(payment.amount),
        currency: payment.currency,
        cardType: payment.card_type,
        cardBrand: payment.card_brand,
      });
    }

    // 5. For PENDING payments, run full validation & atomic settlement
    const outcome = await verifyAndSettlePayment({
      tranId: payment.transaction_id,
      valId: rawValId || undefined,
      eventType: "VALIDATION_CHECK",
      allowTranIdQuery: !rawValId,
    });

    return NextResponse.json(
      {
        ok: outcome.ok,
        verified: outcome.ok,
        alreadySettled: outcome.alreadySettled,
        code: outcome.code,
        contractId: outcome.contractId,
        paymentId: outcome.paymentId,
        transactionId: outcome.transactionId,
        paymentStatus: outcome.status ?? statusUpper,
        gatewayStatus: outcome.gatewayStatus ?? null,
        amount: outcome.amount ?? Number(payment.amount),
        currency: outcome.currency ?? payment.currency,
        cardType: outcome.cardType ?? null,
        cardBrand: outcome.cardBrand ?? null,
        error: outcome.error ?? null,
      },
      { status: outcome.statusCode }
    );
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("Unexpected payment validation endpoint error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error validating transaction." },
      { status: 500 }
    );
  }
}
