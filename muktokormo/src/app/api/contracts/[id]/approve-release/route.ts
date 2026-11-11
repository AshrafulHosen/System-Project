import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentConfigError } from "@/lib/env";
import {
  DEFAULT_PLATFORM_FEE_PCT,
  calculateContractFeeBreakdown,
  isUuid,
} from "@/lib/payments/constants";
import {
  hasOpenRefundForContract,
  loadAuthorizedContractForUser,
} from "@/lib/payments/contracts-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ReleaseRpcResult {
  ok?: boolean;
  code?: string;
  contract_id?: string;
  payment_id?: string;
  gross_amount?: number;
  platform_fee?: number;
  freelancer_net?: number;
}

export async function POST(request: NextRequest, context: RouteContext) {
  void request;
  try {
    const { id } = await context.params;

    // 1. Authenticate user first (before reading server-only secrets)
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to approve work and release payment." },
        { status: 401 }
      );
    }

    if (!isUuid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid contract UUID." },
        { status: 400 }
      );
    }

    // 2. Verify contract membership & client ownership
    const ctx = await loadAuthorizedContractForUser(id, user.id);
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
          error:
            "Forbidden. Only the contract client can approve completed work and record payment release.",
        },
        { status: 403 }
      );
    }

    // 3. Enforce contract pre-conditions cleanly before hitting transactional RPC
    const row = ctx.contractRow;
    const paymentStatus = String(row.payment_status ?? "UNPAID").toUpperCase();
    const workStatus = String(row.work_status ?? "NOT_STARTED").toUpperCase();

    if (paymentStatus === "RELEASED" || workStatus === "RELEASED") {
      return NextResponse.json(
        {
          ok: false,
          code: "ALREADY_RELEASED",
          error: "Duplicate release blocked: payment has already been released for this contract.",
        },
        { status: 409 }
      );
    }

    if (paymentStatus !== "FUNDED") {
      return NextResponse.json(
        {
          ok: false,
          code: "CONTRACT_NOT_FUNDED",
          error: `Contract payment must be FUNDED before approval release (current status: ${paymentStatus}).`,
        },
        { status: 409 }
      );
    }

    if (await hasOpenRefundForContract(row.id)) {
      return NextResponse.json(
        {
          ok: false,
          code: "REFUND_IN_PROGRESS",
          error:
            "Escrow release is blocked while an admin-moderated refund request is pending or gateway-initiated.",
        },
        { status: 409 }
      );
    }

    if (workStatus !== "SUBMITTED") {
      return NextResponse.json(
        {
          ok: false,
          code: "WORK_NOT_SUBMITTED",
          error: `Freelancer must submit completed work before release (current work status: ${workStatus}).`,
        },
        { status: 409 }
      );
    }

    // 4. Execute atomic PostgreSQL transaction via service_role RPC
    const adminDb = createAdminClient();
    const { data: rpcRaw, error: rpcErr } = await adminDb.rpc(
      "release_escrow_payment",
      {
        p_contract_id: id,
        p_actor_user_id: user.id,
      }
    );

    if (rpcErr) {
      console.error("release_escrow_payment RPC failed:", rpcErr.message);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to record internal escrow release.",
        },
        { status: 500 }
      );
    }

    const rpc = (rpcRaw ?? {}) as ReleaseRpcResult;
    if (!rpc.ok) {
      const code = rpc.code ?? "RELEASE_REJECTED";
      const statusMap: Record<string, number> = {
        CONTRACT_NOT_FOUND: 404,
        FORBIDDEN_NOT_CONTRACT_CLIENT: 403,
        ALREADY_RELEASED: 409,
        CONTRACT_NOT_FUNDED: 409,
        WORK_NOT_SUBMITTED: 409,
        FUNDED_PAYMENT_NOT_FOUND: 409,
      };
      const messageMap: Record<string, string> = {
        CONTRACT_NOT_FOUND: "Contract not found.",
        FORBIDDEN_NOT_CONTRACT_CLIENT:
          "Forbidden. Only the contract client can release payment.",
        ALREADY_RELEASED:
          "Duplicate release blocked: escrow payment has already been released.",
        CONTRACT_NOT_FUNDED:
          "Contract must be funded before releasing payment.",
        WORK_NOT_SUBMITTED:
          "Work must be in SUBMITTED state before client approval release.",
        FUNDED_PAYMENT_NOT_FOUND:
          "No active FUNDED payment record found for this contract.",
      };
      return NextResponse.json(
        {
          ok: false,
          code,
          error: messageMap[code] ?? `Unable to release payment (${code}).`,
        },
        { status: statusMap[code] ?? 409 }
      );
    }

    const feePct =
      row.platform_fee_pct !== null && row.platform_fee_pct !== undefined
        ? Number(row.platform_fee_pct)
        : DEFAULT_PLATFORM_FEE_PCT;
    const fallbackBreakdown = calculateContractFeeBreakdown(
      Number(row.total_amount ?? 0),
      feePct
    );

    const grossAmount = Number(rpc.gross_amount ?? fallbackBreakdown.grossAmount);
    const platformFee = Number(rpc.platform_fee ?? fallbackBreakdown.platformFeeAmount);
    const freelancerNet = Number(
      rpc.freelancer_net ?? fallbackBreakdown.freelancerPayableAmount
    );

    return NextResponse.json({
      ok: true,
      contractId: rpc.contract_id ?? id,
      paymentId: rpc.payment_id ?? null,
      paymentStatus: "RELEASED",
      workStatus: "RELEASED",
      grossAmount,
      platformFeePct: feePct,
      platformFee,
      freelancerNet,
      isSimulated: true,
      ledgerOperationNote:
        "Internal ledger operation only: RELEASE entry created and freelancer simulated earnings updated. No actual bank or MFS money transfer occurs in sandbox mode.",
    });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("POST /api/contracts/[id]/approve-release error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error approving work and releasing payment." },
      { status: 500 }
    );
  }
}

