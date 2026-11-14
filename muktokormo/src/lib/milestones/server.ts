import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { loadAuthorizedContractForUser } from "@/lib/payments/contracts-server";
import { describeMilestoneResult } from "@/lib/milestones/messages";
import type {
  MilestoneDisputeRecord,
  MilestoneEventRecord,
  MilestonePaymentSummary,
  MilestoneRecord,
  MilestoneSubmissionRecord,
  MilestoneWorkspacePayload,
} from "@/types/milestone";

if (typeof window !== "undefined") {
  throw new Error("src/lib/milestones/server.ts cannot be imported in browser code.");
}

/** Returns the authenticated user id from the request cookies, or null. */
export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Loads everything the milestone UI needs for one contract, after verifying
 * the viewer is the contract's client, freelancer, or an admin.
 */
export async function loadMilestoneWorkspace(
  contractId: string,
  userId: string
): Promise<{ ok: false; status: number; error: string } | MilestoneWorkspacePayload> {
  const ctx = await loadAuthorizedContractForUser(contractId, userId);
  if (!ctx.ok || !ctx.contractRow) {
    return { ok: false, status: ctx.statusCode, error: ctx.error ?? "Not authorized." };
  }

  const adminDb = createAdminClient();
  const [contractRes, msRes, subRes, dispRes, evRes, payRes, propMsRes] = await Promise.all([
    adminDb
      .from("contracts")
      .select(
        "id, billing_mode, milestone_plan_status, milestone_plan_note, total_amount, funded_amount, released_amount, refunded_amount, platform_fee_pct, payment_status, status, proposal_id"
      )
      .eq("id", contractId)
      .single(),
    adminDb.from("contract_milestones").select("*").eq("contract_id", contractId).order("sort_order"),
    adminDb
      .from("milestone_submissions")
      .select("id, milestone_id, revision_number, message, demo_url, attachments, status, review_feedback, reviewed_at, created_at")
      .eq("contract_id", contractId)
      .order("revision_number", { ascending: false }),
    adminDb
      .from("milestone_disputes")
      .select("id, milestone_id, contract_id, raised_by_role, reason, previous_status, status, resolution, resolution_notes, resolved_at, created_at")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false }),
    adminDb
      .from("milestone_events")
      .select("id, milestone_id, actor_role, event_type, from_status, to_status, details, created_at")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false })
      .limit(60),
    adminDb
      .from("payments")
      .select("milestone_id, status, transaction_id, amount, created_at")
      .eq("contract_id", contractId)
      .not("milestone_id", "is", null)
      .order("created_at", { ascending: false }),
    adminDb
      .from("proposal_milestones")
      .select("title, amount_bdt, delivery_days, sort_order")
      .eq("proposal_id", (ctx.contractRow as { proposal_id?: string }).proposal_id ?? "00000000-0000-0000-0000-000000000000")
      .order("sort_order"),
  ]);

  const firstErr = [contractRes, msRes, subRes, dispRes, evRes, payRes].find((r) => r.error)?.error;
  if (firstErr || !contractRes.data) {
    console.error("loadMilestoneWorkspace failed:", firstErr?.message);
    return {
      ok: false,
      status: 500,
      error: "Failed to load milestones. Ensure the milestone migration has been applied.",
    };
  }

  const c = contractRes.data as Record<string, unknown>;
  const paymentStatus = String(c.payment_status ?? "UNPAID").toUpperCase();
  const billingMode = String(c.billing_mode ?? "SINGLE").toUpperCase() === "MILESTONE" ? "MILESTONE" : "SINGLE";

  // A single-payment contract may switch to milestones only before any money moved.
  let canConvert = false;
  if (billingMode === "SINGLE" && ["UNPAID", "FAILED", "CANCELLED"].includes(paymentStatus)) {
    const { data: active } = await adminDb
      .from("payments")
      .select("id")
      .eq("contract_id", contractId)
      .in("status", ["PENDING", "FUNDED", "RELEASED", "REFUND_REQUESTED", "REFUNDED"])
      .limit(1)
      .maybeSingle();
    canConvert = !active && String(c.status ?? "").toLowerCase() === "active";
  }

  const milestones = ((msRes.data ?? []) as Record<string, unknown>[]).map(
    (m) => ({ ...m, amount: num(m.amount), deliverables: (m.deliverables as string[]) ?? [] }) as MilestoneRecord
  );

  return {
    ok: true,
    viewerRole: ctx.viewerRole ?? "client",
    viewerUserId: userId,
    contract: {
      id: contractId,
      billingMode,
      planStatus: (String(c.milestone_plan_status ?? "NONE").toUpperCase() as MilestoneWorkspacePayload["contract"]["planStatus"]),
      planNote: (c.milestone_plan_note as string | null) ?? null,
      totalAmount: num(c.total_amount),
      fundedAmount: num(c.funded_amount),
      releasedAmount: num(c.released_amount),
      refundedAmount: num(c.refunded_amount),
      platformFeePct: num(c.platform_fee_pct),
      paymentStatus,
      status: String(c.status ?? ""),
      canConvertToMilestones: canConvert,
    },
    milestones,
    submissions: (subRes.data ?? []) as MilestoneSubmissionRecord[],
    disputes: (dispRes.data ?? []) as MilestoneDisputeRecord[],
    events: (evRes.data ?? []) as MilestoneEventRecord[],
    payments: ((payRes.data ?? []) as Record<string, unknown>[]).map(
      (p) => ({ ...p, amount: num(p.amount) }) as MilestonePaymentSummary
    ),
    proposalMilestones: ((propMsRes.data ?? []) as Record<string, unknown>[]).map((p) => ({
      title: String(p.title ?? ""),
      amount: num(p.amount_bdt),
      delivery_days: p.delivery_days === null || p.delivery_days === undefined ? null : num(p.delivery_days),
    })),
  };
}

/** Calls a milestone RPC with the service role and normalizes the result. */
export async function callMilestoneRpc(
  fn: "milestone_plan_action" | "milestone_work_action" | "release_milestone_payment" | "resolve_milestone_dispute",
  args: Record<string, unknown>
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; status: number; error: string; code?: string }> {
  const adminDb = createAdminClient();
  const { data, error } = await adminDb.rpc(fn, args);
  if (error) {
    console.error(`${fn} RPC failed:`, error.message);
    return { ok: false, status: 500, error: "The request could not be completed. Please try again." };
  }
  const result = (data ?? {}) as Record<string, unknown>;
  if (result.ok !== true) {
    const code = typeof result.code === "string" ? result.code : undefined;
    const mapped = describeMilestoneResult(code);
    return { ok: false, status: mapped.status, error: mapped.error, code };
  }
  return { ok: true, data: result };
}
