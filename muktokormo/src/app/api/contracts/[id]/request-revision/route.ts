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
  try {
    const { id } = await context.params;

    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await serverSupabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to request a revision." },
        { status: 401 }
      );
    }

    let body: { feedback?: unknown };
    try {
      body = (await request.json()) as { feedback?: unknown };
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const feedback = typeof body.feedback === "string" ? body.feedback.trim() : "";
    if (feedback.length < 5 || feedback.length > 2000) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please provide specific revision feedback (5 to 2000 characters).",
        },
        { status: 400 }
      );
    }

    const ctx = await loadAuthorizedContractForUser(id, user.id);
    if (!ctx.ok || !ctx.contractRow) {
      return NextResponse.json(
        { ok: false, error: ctx.error ?? "Contract access denied." },
        { status: ctx.statusCode }
      );
    }

    // Milestone contracts use per-milestone endpoints (/api/milestones/[id]).
    if (String((ctx.contractRow as { billing_mode?: string | null }).billing_mode ?? "SINGLE").toUpperCase() === "MILESTONE") {
      return NextResponse.json(
        {
          ok: false,
          code: "MILESTONE_CONTRACT",
          error: "This is a milestone contract. Request revisions on a specific milestone instead.",
        },
        { status: 409 }
      );
    }

    if (!ctx.isContractClient) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden. Only the contract client can request deliverable revisions.",
        },
        { status: 403 }
      );
    }

    const row = ctx.contractRow;
    const paymentStatus = String(row.payment_status ?? "UNPAID").toUpperCase();
    const workStatus = String(row.work_status ?? "NOT_STARTED").toUpperCase();

    if (paymentStatus !== "FUNDED") {
      return NextResponse.json(
        { ok: false, error: "Revision can only be requested on funded contracts." },
        { status: 409 }
      );
    }

    if (await hasOpenRefundForContract(row.id)) {
      return NextResponse.json(
        {
          ok: false,
          code: "REFUND_IN_PROGRESS",
          error:
            "Revision requests are paused while an admin-moderated refund request is pending for this contract.",
        },
        { status: 409 }
      );
    }

    if (workStatus !== "SUBMITTED") {
      return NextResponse.json(
        {
          ok: false,
          error: "Revision can only be requested after work has been submitted.",
        },
        { status: 409 }
      );
    }

    const adminDb = createAdminClient();
    const nowIso = new Date().toISOString();

    const { error: updateErr } = await adminDb
      .from("contracts")
      .update({
        work_status: "REVISION_REQUESTED",
        revision_feedback: feedback,
      })
      .eq("id", row.id)
      .eq("work_status", "SUBMITTED");

    if (updateErr) {
      console.error("Failed saving revision request:", updateErr.message);
      return NextResponse.json(
        { ok: false, error: "Failed to record revision request." },
        { status: 500 }
      );
    }

    if (ctx.freelancerUserId) {
      await adminDb.from("notifications").upsert(
        {
          user_id: ctx.freelancerUserId,
          role_target: "freelancer",
          contract_id: row.id,
          event_key: `revision_requested:${row.id}:${nowIso}`,
          title: "Revision Requested on Deliverable",
          message: `Client requested changes on "${ctx.projectTitle}": ${feedback}`,
          title_bn: "কাজে রিভিশনের অনুরোধ করা হয়েছে",
          message_bn: `ক্লায়েন্ট "${ctx.projectTitle}"-এ সংশোধনের অনুরোধ করেছেন।`,
        },
        { onConflict: "user_id,event_key", ignoreDuplicates: true }
      );
    }

    return NextResponse.json({
      ok: true,
      workStatus: "REVISION_REQUESTED",
      revisionFeedback: feedback,
    });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("POST /api/contracts/[id]/request-revision error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error requesting revision." },
      { status: 500 }
    );
  }
}

