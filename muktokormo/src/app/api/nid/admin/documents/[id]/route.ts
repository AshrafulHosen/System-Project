import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NID_BUCKET, type NidDocumentsResponse, type NidHistoryEntry } from "@/lib/nid/shared";
import { isUuid, NID_SIGNED_URL_SECONDS, nidError, requireNidAdmin } from "@/lib/nid/server";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/nid/admin/documents/[id]
 * Admin-only: submission details, review history and short-lived signed URLs
 * for the two NID images. Every view is written to the audit log.
 */
export async function GET(_req: Request, context: RouteContext) {
  const gate = await requireNidAdmin();
  if (typeof gate !== "string") return gate;
  const { id } = await context.params;
  if (!isUuid(id)) return nidError("INVALID_REQUEST");

  const db = createAdminClient();
  const { data: row, error } = await db
    .from("nid_verifications")
    .select("id, user_id, user_role, status, submitted_at, reviewed_at, rejection_reason, front_image_path, back_image_path, documents_deleted_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("NID document lookup failed:", error.code);
    return nidError("SERVER_ERROR");
  }
  if (!row) return nidError("NOT_FOUND");

  const [userRes, historyRes] = await Promise.all([
    db.from("users").select("name, email, phone_verified, created_at").eq("id", row.user_id).maybeSingle(),
    db
      .from("nid_verifications")
      .select("id, status, submitted_at, reviewed_at, reviewed_by, rejection_reason")
      .eq("user_id", row.user_id)
      .neq("id", row.id)
      .order("submitted_at", { ascending: false })
      .limit(20),
  ]);

  const reviewerIds = Array.from(
    new Set((historyRes.data ?? []).map((h) => h.reviewed_by as string | null).filter((v): v is string => Boolean(v)))
  );
  const { data: reviewers } = reviewerIds.length
    ? await db.from("users").select("id, name").in("id", reviewerIds)
    : { data: [] as { id: string; name: string }[] };
  const reviewerName = new Map((reviewers ?? []).map((r) => [r.id as string, r.name as string]));

  let front: string | null = null;
  let back: string | null = null;
  if (!row.documents_deleted_at && row.front_image_path && row.back_image_path) {
    const { data: signed, error: signErr } = await db.storage
      .from(NID_BUCKET)
      .createSignedUrls([row.front_image_path, row.back_image_path], NID_SIGNED_URL_SECONDS);
    if (signErr || !signed) {
      console.error("NID signed URL creation failed:", signErr?.message);
      return nidError("SERVER_ERROR");
    }
    front = signed[0]?.signedUrl ?? null;
    back = signed[1]?.signedUrl ?? null;
    await db.from("nid_verification_events").insert({ verification_id: row.id, actor_user_id: gate, event: "documents_viewed" });
  }

  const history: NidHistoryEntry[] = (historyRes.data ?? []).map((h) => ({
    id: h.id,
    status: h.status,
    submittedAt: h.submitted_at,
    reviewedAt: h.reviewed_at,
    reviewedByName: h.reviewed_by ? (reviewerName.get(h.reviewed_by) ?? "Administrator") : null,
    rejectionReason: h.rejection_reason,
  }));

  const payload: NidDocumentsResponse = {
    ok: true,
    submission: {
      id: row.id,
      userId: row.user_id,
      name: userRes.data?.name ?? "Unknown user",
      email: userRes.data?.email ?? "",
      role: row.user_role,
      status: row.status,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      rejectionReason: row.rejection_reason,
      documentsDeleted: Boolean(row.documents_deleted_at),
      phoneVerified: Boolean(userRes.data?.phone_verified),
      accountCreatedAt: userRes.data?.created_at ?? null,
    },
    documents: { front, back, expiresInSeconds: NID_SIGNED_URL_SECONDS },
    history,
  };
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store, private" } });
}
