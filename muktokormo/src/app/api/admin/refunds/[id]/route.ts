import crypto from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentConfigError, getSslCommerzSandboxEnv } from "@/lib/env";
import { isUuid } from "@/lib/payments/constants";
import {
  generateUniqueRefundTransactionId,
  initiateSslCommerzRefund,
  querySslCommerzRefundStatus,
  sanitizeGatewayPayload,
} from "@/lib/sslcommerz";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ProcessRefundRpcResult {
  ok?: boolean;
  code?: string;
  status?: string;
  refund_mode?: string;
  current_status?: string;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 1. Authenticate caller first
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required for admin refund moderation." },
        { status: 401 }
      );
    }

    if (!isUuid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid refund request UUID." },
        { status: 400 }
      );
    }

    const adminDb = createAdminClient();
    const { data: isAdminFlag, error: adminErr } = await adminDb.rpc("is_admin", {
      uid: user.id,
    });

    if (adminErr || !isAdminFlag) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden. Only verified platform administrators can moderate refunds.",
        },
        { status: 403 }
      );
    }

    // 2. Validate body
    let body: { action?: unknown; refundMode?: unknown; adminNotes?: unknown };
    try {
      body = (await request.json()) as {
        action?: unknown;
        refundMode?: unknown;
        adminNotes?: unknown;
      };
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const rawAction = String(body.action ?? "").trim().toUpperCase();
    if (!["APPROVE", "REJECT", "CHECK_GATEWAY_STATUS"].includes(rawAction)) {
      return NextResponse.json(
        {
          ok: false,
          error: "action must be APPROVE, REJECT, or CHECK_GATEWAY_STATUS.",
        },
        { status: 400 }
      );
    }

    const rawMode = String(body.refundMode ?? "SIMULATED_INTERNAL").trim().toUpperCase();
    if (
      rawAction === "APPROVE" &&
      !["SIMULATED_INTERNAL", "SSLCOMMERZ_SANDBOX_API"].includes(rawMode)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "refundMode must be SIMULATED_INTERNAL or SSLCOMMERZ_SANDBOX_API.",
        },
        { status: 400 }
      );
    }

    const cleanNotes =
      typeof body.adminNotes === "string" && body.adminNotes.trim().length > 0
        ? body.adminNotes.trim().slice(0, 1000)
        : null;

    // 3. Load refund request & parent payment
    const { data: refundRow, error: rfErr } = await adminDb
      .from("refund_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (rfErr) {
      console.error("Failed loading refund request:", rfErr.message);
      return NextResponse.json(
        { ok: false, error: "Database error loading refund request." },
        { status: 500 }
      );
    }

    if (!refundRow) {
      return NextResponse.json(
        { ok: false, error: "Refund request not found." },
        { status: 404 }
      );
    }

    const currentStatus = String(refundRow.status ?? "").toUpperCase();
    if (!["PENDING", "GATEWAY_INITIATED"].includes(currentStatus)) {
      return NextResponse.json(
        {
          ok: false,
          code: "REFUND_ALREADY_DECIDED",
          error: `Refund request is already finalized with status ${currentStatus}.`,
        },
        { status: 409 }
      );
    }

    const { data: paymentRow, error: payErr } = await adminDb
      .from("payments")
      .select(
        "id, contract_id, client_id, freelancer_id, amount, currency, transaction_id, status, bank_tran_id, validation_id"
      )
      .eq("id", refundRow.payment_id)
      .maybeSingle();

    if (payErr || !paymentRow) {
      return NextResponse.json(
        { ok: false, error: "Associated payment record could not be loaded." },
        { status: 404 }
      );
    }

    const [{ data: clientUserRow }, { data: freelancerUserRow }] = await Promise.all([
      adminDb
        .from("clients")
        .select("user_id")
        .eq("id", refundRow.client_id)
        .maybeSingle(),
      adminDb
        .from("freelancers")
        .select("user_id")
        .eq("id", refundRow.freelancer_id)
        .maybeSingle(),
    ]);

    // 4A. REJECT branch
    if (rawAction === "REJECT") {
      const { data: rpcRaw, error: rpcErr } = await adminDb.rpc(
        "process_refund_decision",
        {
          p_refund_id: id,
          p_admin_user_id: user.id,
          p_decision: "REJECT",
          p_refund_mode: String(refundRow.refund_mode ?? "SIMULATED_INTERNAL"),
          p_admin_notes: cleanNotes,
          p_gateway_refund_ref_id: null,
          p_gateway_status: null,
        }
      );

      if (rpcErr) {
        console.error("process_refund_decision (REJECT) error:", rpcErr.message);
        return NextResponse.json(
          { ok: false, error: "Failed to reject refund request." },
          { status: 500 }
        );
      }

      const rpc = (rpcRaw ?? {}) as ProcessRefundRpcResult;
      if (!rpc.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: rpc.code ?? "REJECT_FAILED",
            error: `Refund rejection blocked (${rpc.code ?? "error"}).`,
          },
          { status: 409 }
        );
      }

      const { data: updated } = await adminDb
        .from("refund_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        status: "REJECTED",
        refundRequest: updated,
      });
    }

    // 4B. APPROVE via Simulated Internal Ledger
    if (rawAction === "APPROVE" && rawMode === "SIMULATED_INTERNAL") {
      if (currentStatus !== "PENDING") {
        return NextResponse.json(
          {
            ok: false,
            code: "INVALID_REFUND_STATE",
            error: `Cannot run simulated internal approval while status is ${currentStatus}. Check gateway status or reject first.`,
          },
          { status: 409 }
        );
      }

      const ts = Date.now().toString(36).toUpperCase();
      const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
      const simRefId = `SIM-REF-${ts}-${suffix}`;

      const { data: rpcRaw, error: rpcErr } = await adminDb.rpc(
        "process_refund_decision",
        {
          p_refund_id: id,
          p_admin_user_id: user.id,
          p_decision: "APPROVE",
          p_refund_mode: "SIMULATED_INTERNAL",
          p_admin_notes: cleanNotes,
          p_gateway_refund_ref_id: simRefId,
          p_gateway_status: "SIMULATED_INTERNAL",
        }
      );

      if (rpcErr) {
        console.error("process_refund_decision (SIMULATED) error:", rpcErr.message);
        return NextResponse.json(
          { ok: false, error: "Failed to execute simulated internal refund." },
          { status: 500 }
        );
      }

      const rpc = (rpcRaw ?? {}) as ProcessRefundRpcResult;
      if (!rpc.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: rpc.code ?? "SIMULATED_REFUND_REJECTED",
            error: `Refund approval rejected (${rpc.code ?? "error"}).`,
          },
          { status: 409 }
        );
      }

      const { data: updated } = await adminDb
        .from("refund_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        status: "COMPLETED",
        refundMode: "SIMULATED_INTERNAL",
        isSimulated: true,
        refundRequest: updated,
      });
    }

    // Ensure SSLCOMMERZ credentials & sandbox safety config exist for gateway refund operations
    getSslCommerzSandboxEnv();

    // 4C. APPROVE via SSLCOMMERZ Sandbox Refund API
    if (rawAction === "APPROVE" && rawMode === "SSLCOMMERZ_SANDBOX_API") {
      if (currentStatus !== "PENDING") {
        return NextResponse.json(
          {
            ok: false,
            code: "ALREADY_GATEWAY_INITIATED",
            error: "Gateway refund has already been initiated. Use CHECK_GATEWAY_STATUS instead.",
          },
          { status: 409 }
        );
      }

      const bankTranId = paymentRow.bank_tran_id?.trim() || "";
      if (!bankTranId) {
        return NextResponse.json(
          {
            ok: false,
            code: "MISSING_BANK_TRAN_ID",
            error:
              "Payment record has no SSLCOMMERZ bank_tran_id required for the Sandbox Refund API. Use Simulated Internal Refund or verify payment telemetry first.",
          },
          { status: 422 }
        );
      }

      const refundTransId = generateUniqueRefundTransactionId();
      const initRes = await initiateSslCommerzRefund({
        bankTranId,
        refundTransId,
        refundAmount: Number(refundRow.amount),
        refundRemarks: cleanNotes || String(refundRow.reason ?? "Admin approved escrow refund"),
        refeId: refundRow.id.slice(0, 32),
      });

      await adminDb.from("payment_transactions").insert({
        payment_id: paymentRow.id,
        contract_id: paymentRow.contract_id,
        event_type: "REFUND_INITIATE",
        gateway: "SSLCOMMERZ",
        gateway_transaction_id: refundTransId,
        validation_id: initRes.refundRefId,
        bank_tran_id: initRes.bankTranId ?? bankTranId,
        gateway_status: initRes.gatewayStatus,
        amount: Number(refundRow.amount),
        currency: paymentRow.currency ?? "BDT",
        response_summary: sanitizeGatewayPayload({
          ...initRes.rawSanitized,
          refund_request_id: id,
          refund_trans_id: refundTransId,
          errorReason: initRes.errorReason,
        }),
      });

      if (!initRes.ok || !initRes.refundRefId) {
        await adminDb
          .from("refund_requests")
          .update({
            gateway_status: initRes.gatewayStatus,
            admin_notes: cleanNotes ?? refundRow.admin_notes,
          })
          .eq("id", id);

        return NextResponse.json(
          {
            ok: false,
            code: "GATEWAY_REFUND_INITIATE_FAILED",
            error:
              initRes.errorReason ||
              `SSLCOMMERZ Sandbox rejected refund initiation (status: ${initRes.gatewayStatus}). Request remains PENDING so you can retry or use Simulated Internal Refund.`,
            gatewayStatus: initRes.gatewayStatus,
          },
          { status: 422 }
        );
      }

      // Mandatory follow-up verification: status="success" on initiation only means queued
      const statusCheck = await querySslCommerzRefundStatus(initRes.refundRefId);
      await adminDb.from("payment_transactions").insert({
        payment_id: paymentRow.id,
        contract_id: paymentRow.contract_id,
        event_type: "REFUND_STATUS",
        gateway: "SSLCOMMERZ",
        gateway_transaction_id: refundTransId,
        validation_id: initRes.refundRefId,
        bank_tran_id: statusCheck.bankTranId ?? bankTranId,
        gateway_status: statusCheck.gatewayStatus,
        amount: Number(refundRow.amount),
        currency: paymentRow.currency ?? "BDT",
        response_summary: sanitizeGatewayPayload({
          ...statusCheck.rawSanitized,
          refund_request_id: id,
          refund_ref_id: initRes.refundRefId,
          errorReason: statusCheck.errorReason,
        }),
      });

      if (statusCheck.gatewayStatus === "CANCELLED") {
        await adminDb
          .from("refund_requests")
          .update({
            status: "FAILED",
            refund_mode: "SSLCOMMERZ_SANDBOX_API",
            gateway_refund_ref_id: initRes.refundRefId,
            gateway_status: "CANCELLED",
            admin_notes: cleanNotes ?? refundRow.admin_notes,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", id);

        await adminDb
          .from("payments")
          .update({ status: "FUNDED" })
          .eq("id", paymentRow.id)
          .eq("status", "REFUND_REQUESTED");

        if (clientUserRow?.user_id) {
          await adminDb.from("notifications").upsert(
            {
              user_id: String(clientUserRow.user_id),
              role_target: "client",
              contract_id: refundRow.contract_id,
              payment_id: refundRow.payment_id,
              event_key: `refund_gw_failed:${id}`,
              title: "Sandbox Gateway Refund Cancelled",
              message: `SSLCOMMERZ Sandbox cancelled gateway refund (Ref: ${initRes.refundRefId}). Contract payment remains funded.`,
              title_bn: "স্যান্ডবক্স গেটওয়ে রিফান্ড বাতিল হয়েছে",
              message_bn: `SSLCOMMERZ স্যান্ডবক্স গেটওয়ে রিফান্ড (${initRes.refundRefId}) বাতিল হয়েছে।`,
            },
            { onConflict: "user_id,event_key", ignoreDuplicates: true }
          );
        }

        const { data: failedRow } = await adminDb
          .from("refund_requests")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        return NextResponse.json(
          {
            ok: false,
            code: "GATEWAY_REFUND_CANCELLED",
            error:
              statusCheck.errorReason ||
              "SSLCOMMERZ Sandbox reported the refund as cancelled.",
            refundRequest: failedRow,
          },
          { status: 422 }
        );
      }

      // Only pass REFUNDED to RPC if querySslCommerzRefundStatus explicitly verified "refunded"
      const rpcGatewayStatus =
        statusCheck.gatewayStatus === "REFUNDED" ? "REFUNDED" : "PROCESSING";

      const { data: rpcRaw, error: rpcErr } = await adminDb.rpc(
        "process_refund_decision",
        {
          p_refund_id: id,
          p_admin_user_id: user.id,
          p_decision: "APPROVE",
          p_refund_mode: "SSLCOMMERZ_SANDBOX_API",
          p_admin_notes: cleanNotes,
          p_gateway_refund_ref_id: initRes.refundRefId,
          p_gateway_status: rpcGatewayStatus,
        }
      );

      if (rpcErr) {
        console.error("process_refund_decision (GATEWAY) error:", rpcErr.message);
        return NextResponse.json(
          { ok: false, error: "Failed recording gateway refund state." },
          { status: 500 }
        );
      }

      const rpc = (rpcRaw ?? {}) as ProcessRefundRpcResult;
      if (!rpc.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: rpc.code ?? "GATEWAY_REFUND_RECORD_ERROR",
            error: `Unable to update refund state (${rpc.code ?? "error"}).`,
          },
          { status: 409 }
        );
      }

      if (rpc.status === "GATEWAY_INITIATED") {
        const gwNotifs: {
          user_id: string;
          role_target: "client" | "freelancer";
          contract_id: string;
          payment_id: string;
          event_key: string;
          title: string;
          message: string;
          title_bn: string;
          message_bn: string;
        }[] = [];

        if (clientUserRow?.user_id) {
          gwNotifs.push({
            user_id: String(clientUserRow.user_id),
            role_target: "client",
            contract_id: refundRow.contract_id,
            payment_id: refundRow.payment_id,
            event_key: `refund_gw_initiated:${id}`,
            title: "Sandbox Refund Queued with SSLCOMMERZ",
            message: `Admin initiated an SSLCOMMERZ Sandbox refund (Ref: ${initRes.refundRefId}). Awaiting gateway confirmation.`,
            title_bn: "SSLCOMMERZ স্যান্ডবক্সে রিফান্ড শুরু হয়েছে",
            message_bn: `অ্যাডমিন SSLCOMMERZ স্যান্ডবক্স রিফান্ড (${initRes.refundRefId}) শুরু করেছেন। গেটওয়ে নিশ্চিতকরণের অপেক্ষায়।`,
          });
        }
        if (freelancerUserRow?.user_id) {
          gwNotifs.push({
            user_id: String(freelancerUserRow.user_id),
            role_target: "freelancer",
            contract_id: refundRow.contract_id,
            payment_id: refundRow.payment_id,
            event_key: `refund_gw_initiated_fl:${id}`,
            title: "Gateway Refund Processing",
            message: `Admin queued an SSLCOMMERZ Sandbox refund (Ref: ${initRes.refundRefId}) for this contract.`,
            title_bn: "গেটওয়ে রিফান্ড প্রক্রিয়াধীন",
            message_bn: `চুক্তির জন্য SSLCOMMERZ স্যান্ডবক্স রিফান্ড (${initRes.refundRefId}) শুরু হয়েছে।`,
          });
        }
        if (gwNotifs.length > 0) {
          await adminDb.from("notifications").upsert(gwNotifs, {
            onConflict: "user_id,event_key",
            ignoreDuplicates: true,
          });
        }
      }

      const { data: updated } = await adminDb
        .from("refund_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        status: rpc.status ?? "GATEWAY_INITIATED",
        refundMode: "SSLCOMMERZ_SANDBOX_API",
        gatewayStatus: rpcGatewayStatus,
        refundRefId: initRes.refundRefId,
        refundRequest: updated,
      });
    }

    // 4D. CHECK_GATEWAY_STATUS for an existing GATEWAY_INITIATED SSLCOMMERZ refund
    const existingRefId = refundRow.gateway_refund_ref_id?.trim() || "";
    if (
      currentStatus !== "GATEWAY_INITIATED" ||
      refundRow.refund_mode !== "SSLCOMMERZ_SANDBOX_API" ||
      !existingRefId
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "NO_ACTIVE_GATEWAY_REFUND",
          error:
            "Gateway status polling applies only to GATEWAY_INITIATED SSLCOMMERZ refunds with a valid refund_ref_id.",
        },
        { status: 409 }
      );
    }

    const statusCheck = await querySslCommerzRefundStatus(existingRefId);
    await adminDb.from("payment_transactions").insert({
      payment_id: paymentRow.id,
      contract_id: paymentRow.contract_id,
      event_type: "REFUND_STATUS",
      gateway: "SSLCOMMERZ",
      gateway_transaction_id: paymentRow.transaction_id,
      validation_id: existingRefId,
      bank_tran_id: statusCheck.bankTranId ?? paymentRow.bank_tran_id,
      gateway_status: statusCheck.gatewayStatus,
      amount: Number(refundRow.amount),
      currency: paymentRow.currency ?? "BDT",
      response_summary: sanitizeGatewayPayload({
        ...statusCheck.rawSanitized,
        refund_request_id: id,
        refund_ref_id: existingRefId,
        errorReason: statusCheck.errorReason,
      }),
    });

    if (statusCheck.gatewayStatus === "REFUNDED") {
      const { data: rpcRaw, error: rpcErr } = await adminDb.rpc(
        "process_refund_decision",
        {
          p_refund_id: id,
          p_admin_user_id: user.id,
          p_decision: "APPROVE",
          p_refund_mode: "SSLCOMMERZ_SANDBOX_API",
          p_admin_notes: cleanNotes ?? refundRow.admin_notes,
          p_gateway_refund_ref_id: existingRefId,
          p_gateway_status: "REFUNDED",
        }
      );

      if (rpcErr || !(rpcRaw as ProcessRefundRpcResult | null)?.ok) {
        return NextResponse.json(
          { ok: false, error: "Failed finalizing confirmed SSLCOMMERZ refund." },
          { status: 500 }
        );
      }

      const { data: updated } = await adminDb
        .from("refund_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        status: "COMPLETED",
        gatewayStatus: "REFUNDED",
        refundRefId: existingRefId,
        refundRequest: updated,
      });
    }

    if (statusCheck.gatewayStatus === "CANCELLED") {
      await adminDb
        .from("refund_requests")
        .update({
          status: "FAILED",
          gateway_status: "CANCELLED",
          admin_notes: cleanNotes ?? refundRow.admin_notes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      await adminDb
        .from("payments")
        .update({ status: "FUNDED" })
        .eq("id", paymentRow.id)
        .eq("status", "REFUND_REQUESTED");

      if (clientUserRow?.user_id) {
        await adminDb.from("notifications").upsert(
          {
            user_id: String(clientUserRow.user_id),
            role_target: "client",
            contract_id: refundRow.contract_id,
            payment_id: refundRow.payment_id,
            event_key: `refund_gw_failed:${id}`,
            title: "Sandbox Gateway Refund Cancelled",
            message: `SSLCOMMERZ Sandbox cancelled refund request (Ref: ${existingRefId}). Contract payment restored to Funded.`,
            title_bn: "স্যান্ডবক্স গেটওয়ে রিফান্ড বাতিল",
            message_bn: `SSLCOMMERZ রিফান্ড (${existingRefId}) বাতিল হয়েছে।`,
          },
          { onConflict: "user_id,event_key", ignoreDuplicates: true }
        );
      }

      const { data: updated } = await adminDb
        .from("refund_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        status: "FAILED",
        gatewayStatus: "CANCELLED",
        refundRefId: existingRefId,
        refundRequest: updated,
      });
    }

    await adminDb
      .from("refund_requests")
      .update({
        gateway_status: statusCheck.gatewayStatus,
        ...(cleanNotes ? { admin_notes: cleanNotes } : {}),
      })
      .eq("id", id);

    const { data: refreshed } = await adminDb
      .from("refund_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      status: "GATEWAY_INITIATED",
      gatewayStatus: statusCheck.gatewayStatus,
      refundRefId: existingRefId,
      refundRequest: refreshed,
      message:
        statusCheck.errorReason ||
        "SSLCOMMERZ Sandbox reports refund is still processing. Poll again shortly.",
    });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("POST /api/admin/refunds/[id] error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error processing refund decision." },
      { status: 500 }
    );
  }
}

