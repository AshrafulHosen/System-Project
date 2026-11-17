import { getSessionUserId } from "@/lib/milestones/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isUuid,
  nidError,
  nidOk,
  parseOwnedPath,
  removeNidObjects,
  resolveNidRole,
  verifyUploadedImage,
} from "@/lib/nid/server";

export const runtime = "nodejs";

/**
 * POST /api/nid/submit  { submissionId, frontPath, backPath, consent: true }
 * Verifies ownership and content of the two uploaded images, then creates a
 * pending submission. Uploaded files that fail validation are deleted.
 */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return nidError("UNAUTHENTICATED");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return nidError("INVALID_REQUEST");
  }
  if (body.consent !== true) return nidError("CONSENT_REQUIRED");
  const submissionId = body.submissionId;
  if (!isUuid(submissionId)) return nidError("INVALID_REQUEST");

  const frontType = parseOwnedPath(body.frontPath, userId, submissionId, "front");
  const backType = parseOwnedPath(body.backPath, userId, submissionId, "back");
  if (!frontType || !backType) return nidError("INVALID_REQUEST");
  const frontPath = body.frontPath as string;
  const backPath = body.backPath as string;

  const db = createAdminClient();
  const role = await resolveNidRole(db, userId);
  if (role !== "client" && role !== "freelancer") return nidError("ROLE_NOT_ALLOWED");

  const [front, back] = await Promise.all([
    verifyUploadedImage(db, frontPath, frontType),
    verifyUploadedImage(db, backPath, backType),
  ]);
  for (const check of [front, back]) {
    if (!check.ok) {
      if (check.code !== "UPLOAD_MISSING") await removeNidObjects(db, [frontPath, backPath]);
      return nidError(check.code);
    }
  }

  const { data: result, error } = await db.rpc("nid_submit", {
    p_user_id: userId,
    p_role: role,
    p_submission_id: submissionId,
    p_front_path: frontPath,
    p_back_path: backPath,
  });
  if (error || !result) {
    console.error("nid_submit failed:", error?.code ?? "no data");
    return nidError("SERVER_ERROR");
  }
  if (!result.ok) {
    // Never delete files a concurrent identical request has already attached.
    const { data: attached } = await db.from("nid_verifications").select("id").eq("id", submissionId).maybeSingle();
    if (!attached) await removeNidObjects(db, [frontPath, backPath]);
    if (result.code === "PENDING_EXISTS" || result.code === "ALREADY_VERIFIED" || result.code === "ROLE_NOT_ALLOWED") {
      return nidError(result.code);
    }
    return nidError("SERVER_ERROR");
  }

  // Documents from earlier rejected submissions are no longer needed.
  const superseded = Array.isArray(result.superseded_paths) ? (result.superseded_paths as string[]) : [];
  if (superseded.length) await removeNidObjects(db, superseded);

  return nidOk({ status: "pending", submittedAt: result.submitted_at });
}
