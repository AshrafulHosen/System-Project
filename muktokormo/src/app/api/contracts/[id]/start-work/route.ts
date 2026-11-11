import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentConfigError } from "@/lib/env";
import {
  hasOpenRefundForContract,
  loadAuthorizedContractForUser,
} from "@/lib/payments/contracts-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  void request;
  try {
    const { id } = await context.params;

    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to start work." },
        { status: 401 }
      );
    }

    const ctx = await loadAuthorizedContractForUser(id, user.id);
    if (!ctx.ok || !ctx.contractRow) {
      return NextResponse.json(
        { ok: false, error: ctx.error ?? "Contract access denied." },
        { status: ctx.statusCode }
      );
    }

    if (!ctx.isContractFreelancer) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden. Only the assigned freelancer can start work on this contract.",
        },
        { status: 403 }
      );
    }

    const row = ctx.contractRow;
    const contractStatus = String(row.status ?? "").toLowerCase();
    const paymentStatus = String(row.payment_status ?? "UNPAID").toUpperCase();
    const workStatus = String(row.work_status ?? "NOT_STARTED").toUpperCase();

    if (contractStatus !== "active") {
      return NextResponse.json(
        { ok: false, error: `Contract is not active (current status: ${row.status}).` },
        { status: 409 }
      );
    }

    if (paymentStatus !== "FUNDED") {
      return NextResponse.json(
        {
          ok: false,
          error: "Contract must be funded in simulated escrow before starting work.",
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
            "Work actions are paused while an admin-moderated refund request is pending for this contract.",
        },
        { status: 409 }
      );
    }

    if (workStatus === "IN_PROGRESS") {
      return NextResponse.json({
        ok: true,
        alreadyInProgress: true,
        workStatus: "IN_PROGRESS",
        workStartedAt: row.work_started_at ?? null,
      });
    }

    if (!["FUNDED", "NOT_STARTED", "REVISION_REQUESTED"].includes(workStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot mark work in progress from current status: ${workStatus}.`,
        },
        { status: 409 }
      );
    }

    const adminDb = createAdminClient();
    const startedAtIso = row.work_started_at || new Date().toISOString();

    const { error: updateErr } = await adminDb
      .from("contracts")
      .update({
        work_status: "IN_PROGRESS",
        work_started_at: startedAtIso,
      })
      .eq("id", row.id)
      .eq("payment_status", "FUNDED");

    if (updateErr) {
      console.error("Failed updating work_status to IN_PROGRESS:", updateErr.message);
      return NextResponse.json(
        { ok: false, error: "Failed to update contract work status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      alreadyInProgress: false,
      workStatus: "IN_PROGRESS",
      workStartedAt: startedAtIso,
    });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("POST /api/contracts/[id]/start-work error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error starting contract work." },
      { status: 500 }
    );
  }
}

