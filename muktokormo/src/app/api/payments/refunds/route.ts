import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentConfigError } from "@/lib/env";
import { isUuid, roundBdt } from "@/lib/payments/constants";
import { loadAuthorizedContractForUser } from "@/lib/payments/contracts-server";

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to view refund requests." },
        { status: 401 }
      );
    }

    const contractId = request.nextUrl.searchParams.get("contractId")?.trim() || null;
    if (contractId && !isUuid(contractId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid contractId UUID." },
        { status: 400 }
      );
    }

    const adminDb = createAdminClient();
    const [{ data: isAdminFlag }, { data: clientRow }, { data: freelancerRow }] =
      await Promise.all([
        adminDb.rpc("is_admin", { uid: user.id }),
        adminDb.from("clients").select("id").eq("user_id", user.id).maybeSingle(),
        adminDb.from("freelancers").select("id").eq("user_id", user.id).maybeSingle(),
      ]);

    const isAdmin = Boolean(isAdminFlag);

    if (contractId) {
      const ctx = await loadAuthorizedContractForUser(contractId, user.id);
      if (!ctx.ok) {
        return NextResponse.json(
          { ok: false, error: ctx.error ?? "Forbidden." },
          { status: ctx.statusCode }
        );
      }
      const { data: rows, error } = await adminDb
        .from("refund_requests")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { ok: false, error: "Failed to load contract refund requests." },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, refundRequests: rows ?? [] });
    }

    if (isAdmin) {
      const { data: rows, error } = await adminDb
        .from("refund_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        return NextResponse.json(
          { ok: false, error: "Failed to load refund requests." },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, refundRequests: rows ?? [] });
    }

    const filters: string[] = [];
    if (clientRow?.id) filters.push(`client_id.eq.${clientRow.id}`);
    if (freelancerRow?.id) filters.push(`freelancer_id.eq.${freelancerRow.id}`);

    if (filters.length === 0) {
      return NextResponse.json({ ok: true, refundRequests: [] });
    }

    const { data: rows, error } = await adminDb
      .from("refund_requests")
      .select("*")
      .or(filters.join(","))
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Failed to load your refund requests." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, refundRequests: rows ?? [] });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("GET /api/payments/refunds error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error fetching refund requests." },
      { status: 500 }
    );
  }
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
        { ok: false, error: "Authentication required to request an escrow refund." },
        { status: 401 }
      );
    }

    // 2. Validate request body (never accept refund amount from browser)
    let body: { contractId?: unknown; reason?: unknown };
    try {
      body = (await request.json()) as { contractId?: unknown; reason?: unknown };
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!isUuid(body?.contractId)) {
      return NextResponse.json(
        { ok: false, error: "A valid contractId UUID is required." },
        { status: 400 }
      );
    }
    const contractId = body.contractId.trim();

    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length < 10 || reason.length > 1500) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please provide a clear refund reason (10 to 1500 characters).",
        },
        { status: 400 }
      );
    }

    // 3. Verify client ownership of this contract
    const ctx = await loadAuthorizedContractForUser(contractId, user.id);
    if (!ctx.ok || !ctx.contractRow) {
      return NextResponse.json(
        { ok: false, error: ctx.error ?? "Contract access denied." },
        { status: ctx.statusCode }
      );
    }

    if (!ctx.isContractClient) {
      return NextResponse.json(
        {
          ok: false,
          code: "FORBIDDEN_NOT_CONTRACT_CLIENT",
          error: "Forbidden. Only the client who owns this contract can request a refund.",
        },
        { status: 403 }
      );
    }

    const row = ctx.contractRow;
    const contractPaymentStatus = String(row.payment_status ?? "UNPAID").toUpperCase();
    const contractWorkStatus = String(row.work_status ?? "NOT_STARTED").toUpperCase();
    const contractStage = String(row.status ?? "active").toLowerCase();

    if (contractPaymentStatus === "RELEASED" || contractWorkStatus === "RELEASED") {
      return NextResponse.json(
        {
          ok: false,
          code: "PAYMENT_ALREADY_RELEASED",
          error: "Refund unavailable: contract payment has already been released on the ledger.",
        },
        { status: 409 }
      );
    }

    if (contractPaymentStatus === "REFUNDED" || contractWorkStatus === "REFUNDED") {
      return NextResponse.json(
        {
          ok: false,
          code: "ALREADY_REFUNDED",
          error: "This contract payment has already been refunded.",
        },
        { status: 409 }
      );
    }

    if (contractPaymentStatus !== "FUNDED") {
      return NextResponse.json(
        {
          ok: false,
          code: "CONTRACT_NOT_FUNDED",
          error: `Only funded contracts can be refunded (current payment status: ${contractPaymentStatus}).`,
        },
        { status: 409 }
      );
    }

    if (contractStage === "completed" || contractStage === "terminated") {
      return NextResponse.json(
        {
          ok: false,
          code: "CONTRACT_CLOSED",
          error: `Refund cannot be requested on a ${contractStage} contract.`,
        },
        { status: 409 }
      );
    }

    const adminDb = createAdminClient();

    // 4. Locate authoritative FUNDED payment record & verify no open refund already exists
    const { data: fundedPayment, error: payErr } = await adminDb
      .from("payments")
      .select("id, contract_id, client_id, freelancer_id, amount, currency, status, transaction_id")
      .eq("contract_id", contractId)
      .in("status", ["FUNDED", "REFUND_REQUESTED", "RELEASED", "REFUNDED"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (payErr) {
      console.error("Refund payment lookup failed:", payErr.message);
      return NextResponse.json(
        { ok: false, error: "Failed to verify contract payment eligibility." },
        { status: 500 }
      );
    }

    if (!fundedPayment) {
      return NextResponse.json(
        {
          ok: false,
          code: "NO_FUNDED_PAYMENT",
          error: "No settled FUNDED payment record found for this contract.",
        },
        { status: 409 }
      );
    }

    if (fundedPayment.status === "REFUND_REQUESTED") {
      return NextResponse.json(
        {
          ok: false,
          code: "REFUND_ALREADY_PENDING",
          error: "A refund request is already open for this contract payment.",
        },
        { status: 409 }
      );
    }

    if (fundedPayment.status !== "FUNDED") {
      return NextResponse.json(
        {
          ok: false,
          code: "PAYMENT_NOT_REFUNDABLE",
          error: `Payment ${fundedPayment.transaction_id} cannot be refunded in state ${fundedPayment.status}.`,
        },
        { status: 409 }
      );
    }

    const { data: existingOpenRefund } = await adminDb
      .from("refund_requests")
      .select("id, status")
      .eq("payment_id", fundedPayment.id)
      .in("status", ["PENDING", "APPROVED", "GATEWAY_INITIATED", "COMPLETED"])
      .maybeSingle();

    if (existingOpenRefund) {
      return NextResponse.json(
        {
          ok: false,
          code: "OPEN_REFUND_EXISTS",
          error: `An open refund request already exists (status: ${existingOpenRefund.status}).`,
        },
        { status: 409 }
      );
    }

    // 5. Server-computed refund amount matching authoritative payment row
    const authoritativeAmount = roundBdt(Number(fundedPayment.amount));

    const { data: insertedRefund, error: insertErr } = await adminDb
      .from("refund_requests")
      .insert({
        payment_id: fundedPayment.id,
        contract_id: contractId,
        requested_by_user_id: user.id,
        client_id: fundedPayment.client_id,
        freelancer_id: fundedPayment.freelancer_id,
        amount: authoritativeAmount,
        reason,
        status: "PENDING",
        refund_mode: "SIMULATED_INTERNAL",
      })
      .select("*")
      .single();

    if (insertErr || !insertedRefund) {
      const code = (insertErr as { code?: string } | null)?.code;
      if (code === "23505") {
        return NextResponse.json(
          {
            ok: false,
            code: "OPEN_REFUND_EXISTS",
            error: "A refund request has already been submitted for this payment.",
          },
          { status: 409 }
        );
      }
      console.error("Failed inserting refund request:", insertErr?.message);
      return NextResponse.json(
        { ok: false, error: "Failed to submit refund request." },
        { status: 500 }
      );
    }

    // 6. Atomically guard-transition payments.status from FUNDED -> REFUND_REQUESTED
    const { data: updatedPaymentRows, error: updErr } = await adminDb
      .from("payments")
      .update({ status: "REFUND_REQUESTED" })
      .eq("id", fundedPayment.id)
      .eq("status", "FUNDED")
      .select("id");

    if (updErr || !updatedPaymentRows || updatedPaymentRows.length === 0) {
      // Roll back newly inserted refund request to keep state consistent
      await adminDb.from("refund_requests").delete().eq("id", insertedRefund.id);
      return NextResponse.json(
        {
          ok: false,
          code: "PAYMENT_STATE_CONFLICT",
          error: "Payment state changed concurrently; refund request was not created.",
        },
        { status: 409 }
      );
    }

    // 7. Emit deduplicated notifications to Freelancer, Client, and Admins
    const { data: adminRows } = await adminDb.from("admins").select("user_id");
    const notificationRows: {
      user_id: string;
      role_target: "client" | "freelancer" | "admin";
      contract_id: string;
      payment_id: string;
      event_key: string;
      title: string;
      message: string;
      title_bn: string;
      message_bn: string;
    }[] = [];

    if (ctx.freelancerUserId) {
      notificationRows.push({
        user_id: ctx.freelancerUserId,
        role_target: "freelancer",
        contract_id: contractId,
        payment_id: fundedPayment.id,
        event_key: `refund_requested_fl:${insertedRefund.id}`,
        title: "Client Requested Escrow Refund",
        message: `The client requested a ৳${authoritativeAmount.toLocaleString("en-BD")} refund on "${ctx.projectTitle}". Admin review is pending.`,
        title_bn: "ক্লায়েন্ট এসক্রো রিফান্ড অনুরোধ করেছেন",
        message_bn: `"${ctx.projectTitle}" চুক্তিতে ৳${authoritativeAmount.toLocaleString("en-BD")} রিফান্ডের অনুরোধ করা হয়েছে (অ্যাডমিন পর্যালোচনাধীন)।`,
      });
    }

    if (ctx.clientUserId) {
      notificationRows.push({
        user_id: ctx.clientUserId,
        role_target: "client",
        contract_id: contractId,
        payment_id: fundedPayment.id,
        event_key: `refund_requested_cl:${insertedRefund.id}`,
        title: "Refund Request Submitted",
        message: `Your refund request of ৳${authoritativeAmount.toLocaleString("en-BD")} for "${ctx.projectTitle}" is pending admin moderation.`,
        title_bn: "রিফান্ড অনুরোধ জমা হয়েছে",
        message_bn: `"${ctx.projectTitle}"-এর জন্য ৳${authoritativeAmount.toLocaleString("en-BD")} রিফান্ড অনুরোধ অ্যাডমিন যাচাইয়ের অপেক্ষায় আছে।`,
      });
    }

    for (const adm of adminRows ?? []) {
      if (adm?.user_id) {
        notificationRows.push({
          user_id: String(adm.user_id),
          role_target: "admin",
          contract_id: contractId,
          payment_id: fundedPayment.id,
          event_key: `refund_requested_admin:${insertedRefund.id}:${adm.user_id}`,
          title: "New Refund Request Pending Review",
          message: `Refund of ৳${authoritativeAmount.toLocaleString("en-BD")} requested for "${ctx.projectTitle}" (${fundedPayment.transaction_id}).`,
          title_bn: "নতুন রিফান্ড অনুরোধ পর্যালোচনার অপেক্ষায়",
          message_bn: `"${ctx.projectTitle}" চুক্তির ৳${authoritativeAmount.toLocaleString("en-BD")} রিফান্ড অনুরোধ পর্যালোচনার অপেক্ষায়।`,
        });
      }
    }

    if (notificationRows.length > 0) {
      await adminDb
        .from("notifications")
        .upsert(notificationRows, {
          onConflict: "user_id,event_key",
          ignoreDuplicates: true,
        });
    }

    return NextResponse.json(
      {
        ok: true,
        refundRequest: insertedRefund,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("POST /api/payments/refunds error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error submitting refund request." },
      { status: 500 }
    );
  }
}

