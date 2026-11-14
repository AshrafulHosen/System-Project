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

function validateSafeUrl(raw: unknown): { valid: boolean; value: string | null } {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { valid: true, value: null };
  }
  const trimmed = String(raw).trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { valid: false, value: null };
    }
    return { valid: true, value: parsed.toString() };
  } catch {
    return { valid: false, value: null };
  }
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
        { ok: false, error: "Authentication required to submit completed work." },
        { status: 401 }
      );
    }

    let body: { notes?: unknown; demoUrl?: unknown; files?: unknown };
    try {
      body = (await request.json()) as {
        notes?: unknown;
        demoUrl?: unknown;
        files?: unknown;
      };
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const notes = typeof body.notes === "string" ? body.notes.trim() : "";
    if (notes.length < 5 || notes.length > 4000) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please provide a completion description between 5 and 4000 characters.",
        },
        { status: 400 }
      );
    }

    const demoCheck = validateSafeUrl(body.demoUrl);
    if (!demoCheck.valid) {
      return NextResponse.json(
        { ok: false, error: "Demo / repository URL must start with http:// or https://." },
        { status: 400 }
      );
    }

    const files: string[] = [];
    if (Array.isArray(body.files)) {
      for (const item of body.files.slice(0, 15)) {
        if (typeof item === "string") {
          const clean = item.trim().slice(0, 200);
          if (clean.length > 0) files.push(clean);
        }
      }
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
          error: "This is a milestone contract. Submit work on a specific milestone instead.",
        },
        { status: 409 }
      );
    }

    if (!ctx.isContractFreelancer) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden. Only the assigned freelancer can submit work deliverables.",
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
        { ok: false, error: `Contract is no longer active (status: ${row.status}).` },
        { status: 409 }
      );
    }

    if (paymentStatus !== "FUNDED") {
      return NextResponse.json(
        {
          ok: false,
          error: "Contract payment must be FUNDED before submitting completed work.",
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
            "Work submission is paused while an admin-moderated refund request is pending for this contract.",
        },
        { status: 409 }
      );
    }

    if (
      !["NOT_STARTED", "FUNDED", "IN_PROGRESS", "REVISION_REQUESTED"].includes(
        workStatus
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: `Work cannot be submitted in current state (${workStatus}).`,
        },
        { status: 409 }
      );
    }

    const adminDb = createAdminClient();
    const nowIso = new Date().toISOString();

    const { error: updateErr } = await adminDb
      .from("contracts")
      .update({
        work_status: "SUBMITTED",
        work_started_at: row.work_started_at || nowIso,
        submission_notes: notes,
        submission_demo_url: demoCheck.value,
        submission_files: files,
        submitted_at: nowIso,
      })
      .eq("id", row.id)
      .eq("payment_status", "FUNDED");

    if (updateErr) {
      console.error("Failed saving work submission:", updateErr.message);
      return NextResponse.json(
        { ok: false, error: "Failed to save work submission." },
        { status: 500 }
      );
    }

    if (ctx.clientUserId) {
      const eventKey = `work_submitted:${row.id}:${nowIso}`;
      await adminDb.from("notifications").upsert(
        {
          user_id: ctx.clientUserId,
          role_target: "client",
          contract_id: row.id,
          event_key: eventKey,
          title: "Completed Work Submitted for Review",
          message: `The freelancer submitted deliverables for "${ctx.projectTitle}". Please inspect and approve or request revisions.`,
          title_bn: "কাজ পর্যালোচনার জন্য জমা হয়েছে",
          message_bn: `"${ctx.projectTitle}"-এর কাজ জমা দেওয়া হয়েছে। অনুগ্রহ করে যাচাই করে অনুমোদন বা রিভিশন দিন।`,
        },
        { onConflict: "user_id,event_key", ignoreDuplicates: true }
      );
    }

    return NextResponse.json({
      ok: true,
      workStatus: "SUBMITTED",
      submittedAt: nowIso,
      submissionNotes: notes,
      submissionDemoUrl: demoCheck.value,
      submissionFiles: files,
    });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.error("POST /api/contracts/[id]/submit-work error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error submitting contract work." },
      { status: 500 }
    );
  }
}

