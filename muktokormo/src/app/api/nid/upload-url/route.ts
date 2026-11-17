import { randomUUID } from "node:crypto";
import { getSessionUserId } from "@/lib/milestones/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedNidType, NID_BUCKET, NID_MAX_FILE_BYTES, type NidSide } from "@/lib/nid/shared";
import { allowUploadMint, nidError, nidObjectPath, nidOk, resolveNidRole } from "@/lib/nid/server";

export const runtime = "nodejs";

/**
 * POST /api/nid/upload-url
 * { files: [{ side: "front", contentType, size }, { side: "back", contentType, size }] }
 * Mints one-time signed upload URLs for the caller's own folder under a fresh
 * random submission id. The bucket itself also enforces type and size.
 */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return nidError("UNAUTHENTICATED");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return nidError("INVALID_REQUEST");
  }
  const files = (body as { files?: unknown })?.files;
  if (!Array.isArray(files) || files.length !== 2) return nidError("INVALID_REQUEST");

  const specs = new Map<NidSide, { contentType: string }>();
  for (const f of files) {
    const side = (f as { side?: unknown })?.side;
    const contentType = (f as { contentType?: unknown })?.contentType;
    const size = Number((f as { size?: unknown })?.size);
    if ((side !== "front" && side !== "back") || specs.has(side)) return nidError("INVALID_REQUEST");
    if (typeof contentType !== "string" || !isAllowedNidType(contentType)) return nidError("INVALID_FILE");
    if (!Number.isFinite(size) || size <= 0) return nidError("INVALID_FILE");
    if (size > NID_MAX_FILE_BYTES) return nidError("FILE_TOO_LARGE");
    specs.set(side, { contentType });
  }

  const db = createAdminClient();
  const role = await resolveNidRole(db, userId);
  if (role !== "client" && role !== "freelancer") return nidError("ROLE_NOT_ALLOWED");

  const { data: blocking, error: blockErr } = await db
    .from("nid_verifications")
    .select("status")
    .eq("user_id", userId)
    .in("status", ["pending", "approved"])
    .limit(1)
    .maybeSingle();
  if (blockErr) {
    console.error("NID upload-url status check failed:", blockErr.code);
    return nidError("SERVER_ERROR");
  }
  if (blocking?.status === "pending") return nidError("PENDING_EXISTS");
  if (blocking?.status === "approved") return nidError("ALREADY_VERIFIED");

  if (!allowUploadMint(userId)) return nidError("RATE_LIMITED");

  const submissionId = randomUUID();
  const uploads: Record<string, { path: string; signedUrl: string; contentType: string }> = {};
  for (const side of ["front", "back"] as const) {
    const { contentType } = specs.get(side)!;
    const path = nidObjectPath(userId, submissionId, side, contentType as Parameters<typeof nidObjectPath>[3]);
    const { data, error } = await db.storage.from(NID_BUCKET).createSignedUploadUrl(path, { upsert: true });
    if (error || !data) {
      console.error("NID createSignedUploadUrl failed:", error?.message);
      return nidError("SERVER_ERROR");
    }
    uploads[side] = { path: data.path, signedUrl: data.signedUrl, contentType };
  }

  return nidOk({ submissionId, uploads });
}
