import { createAdminClient } from "@/lib/supabase/admin";
import type { ReviewRecord, ReviewType } from "@/lib/reviews/constants";

if (typeof window !== "undefined") {
  throw new Error("src/lib/reviews/server.ts cannot be imported in browser code.");
}

const REVIEW_MESSAGES: Record<string, [number, string]> = {
  CONTRACT_NOT_FOUND: [404, "Contract not found."],
  REVIEW_NOT_FOUND: [404, "Review not found."],
  FORBIDDEN_NOT_CONTRACT_PARTY: [403, "Only the client and freelancer on this contract can review it."],
  FORBIDDEN_ADMIN_ONLY: [403, "Only administrators can moderate reviews."],
  INVALID_REVIEWEE: [409, "This contract has no one to review."],
  CONTRACT_NOT_COMPLETED: [409, "Reviews open once the contract is completed and every payment has been released."],
  ALREADY_REVIEWED: [409, "You have already reviewed this contract."],
  INVALID_CATEGORIES: [400, "Rate every category from 1 to 5 stars."],
  INVALID_FEEDBACK: [400, "Written feedback must be between 20 and 2,000 characters."],
  OPTIONAL_TEXT_TOO_LONG: [400, "Highlights, strengths and improvements can be at most 500 characters each."],
  CANNOT_REPORT_OWN_REVIEW: [409, "You can't report your own review."],
  INVALID_REASON: [400, "Choose a reason for the report."],
  DETAILS_TOO_LONG: [400, "Details can be at most 1,000 characters."],
  ALREADY_REPORTED: [409, "You've already reported this review."],
  INVALID_ACTION: [400, "Unknown moderation action."],
  NOTES_REQUIRED: [400, "Moderation notes are required (at least 10 characters)."],
};

export async function callReviewRpc(
  fn: "submit_review" | "report_review" | "moderate_review",
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
    const hit = code ? REVIEW_MESSAGES[code] : undefined;
    return { ok: false, status: hit?.[0] ?? 400, error: hit?.[1] ?? "Request rejected.", code };
  }
  return { ok: true, data: result };
}

const REVIEW_SELECT =
  "id, contract_id, review_type, overall_rating, category_ratings, feedback, highlights, strengths, improvements, moderation_status, contract_completed_at, created_at, reviewer_user_id, reviewee_user_id";

/** Loads reviews and decorates them with display names and project titles. */
export async function loadReviews(filter: {
  revieweeUserId?: string;
  reviewerUserId?: string;
  contractId?: string;
  type?: ReviewType;
  visibleOnly: boolean;
  limit?: number;
}): Promise<ReviewRecord[]> {
  const adminDb = createAdminClient();
  let q = adminDb.from("reviews").select(REVIEW_SELECT).order("created_at", { ascending: false }).limit(filter.limit ?? 100);
  if (filter.revieweeUserId) q = q.eq("reviewee_user_id", filter.revieweeUserId);
  if (filter.reviewerUserId) q = q.eq("reviewer_user_id", filter.reviewerUserId);
  if (filter.contractId) q = q.eq("contract_id", filter.contractId);
  if (filter.type) q = q.eq("review_type", filter.type);
  if (filter.visibleOnly) q = q.eq("moderation_status", "VISIBLE");
  const { data, error } = await q;
  if (error) {
    console.error("loadReviews failed:", error.message);
    return [];
  }
  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return [];

  const userIds = Array.from(
    new Set(rows.flatMap((r) => [r.reviewer_user_id, r.reviewee_user_id]).filter(Boolean) as string[])
  );
  const contractIds = Array.from(new Set(rows.map((r) => r.contract_id as string)));
  const [{ data: users }, { data: contracts }] = await Promise.all([
    adminDb.from("users").select("id, name").in("id", userIds),
    adminDb.from("contracts").select("id, projects(title)").in("id", contractIds),
  ]);
  const nameOf = new Map((users ?? []).map((u) => [u.id as string, u.name as string]));
  const titleOf = new Map(
    ((contracts ?? []) as { id: string; projects?: { title?: string } | { title?: string }[] | null }[]).map((c) => {
      const p = Array.isArray(c.projects) ? c.projects[0] : c.projects;
      return [c.id, p?.title ?? null];
    })
  );

  return rows.map((r) => ({
    id: r.id as string,
    contract_id: r.contract_id as string,
    review_type: r.review_type as ReviewType,
    overall_rating: Number(r.overall_rating),
    category_ratings: (r.category_ratings as Record<string, number>) ?? {},
    feedback: (r.feedback as string | null) ?? null,
    highlights: (r.highlights as string | null) ?? null,
    strengths: (r.strengths as string | null) ?? null,
    improvements: (r.improvements as string | null) ?? null,
    moderation_status: r.moderation_status as ReviewRecord["moderation_status"],
    contract_completed_at: (r.contract_completed_at as string | null) ?? null,
    created_at: r.created_at as string,
    // Public display uses first name only — reviews never expose emails or full profiles
    reviewer_name: firstName(nameOf.get(r.reviewer_user_id as string)),
    reviewee_name: firstName(nameOf.get(r.reviewee_user_id as string)),
    project_title: titleOf.get(r.contract_id as string) ?? null,
  }));
}

function firstName(full: string | undefined): string | null {
  if (!full) return null;
  return full.trim().split(/\s+/)[0] || null;
}

/** Resolves the auth user id behind a freelancer or client profile id. */
export async function userIdForProfile(kind: "freelancer" | "client", profileId: string): Promise<string | null> {
  const adminDb = createAdminClient();
  const { data } = await adminDb
    .from(kind === "freelancer" ? "freelancers" : "clients")
    .select("user_id")
    .eq("id", profileId)
    .maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}
