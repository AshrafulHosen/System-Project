import { createAdminClient } from "@/lib/supabase/admin";
import { NID_REASON_MAX, NID_REASON_MIN } from "@/lib/nid/shared";
import { isUuid, nidError, nidOk, requireNidAdmin } from "@/lib/nid/server";

export const runtime = "nodejs";

/**
 * POST /api/nid/admin/review
 * { verificationId, decision: "approved" | "rejected", rejectionReason? }
 * Admin-only, single transition from pending. Notifies the user.
 */
export async function POST(req: Request) {
  const gate = await requireNidAdmin();
  if (typeof gate !== "string") return gate;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return nidError("INVALID_REQUEST");
  }
  const { verificationId, decision } = body;
  if (!isUuid(verificationId)) return nidError("INVALID_REQUEST");
  if (decision !== "approved" && decision !== "rejected") return nidError("INVALID_REQUEST");

  const reason = typeof body.rejectionReason === "string" ? body.rejectionReason.trim().replace(/\s+/g, " ") : "";
  if (decision === "rejected" && (reason.length < NID_REASON_MIN || reason.length > NID_REASON_MAX)) {
    return nidError("REASON_REQUIRED");
  }

  const { data: result, error } = await createAdminClient().rpc("nid_review", {
    p_admin_user_id: gate,
    p_verification: verificationId,
    p_decision: decision,
    p_reason: decision === "rejected" ? reason : null,
  });
  if (error || !result) {
    console.error("nid_review failed:", error?.code ?? "no data");
    return nidError("SERVER_ERROR");
  }
  if (!result.ok) {
    const map: Record<string, Parameters<typeof nidError>[0]> = {
      NOT_ADMIN: "FORBIDDEN",
      NOT_FOUND: "NOT_FOUND",
      SELF_REVIEW: "SELF_REVIEW",
      ALREADY_REVIEWED: "ALREADY_REVIEWED",
      REASON_REQUIRED: "REASON_REQUIRED",
      INVALID_DECISION: "INVALID_REQUEST",
    };
    return nidError(map[result.code as string] ?? "SERVER_ERROR");
  }

  return nidOk({ id: result.id, status: result.status, reviewedAt: result.reviewed_at });
}
