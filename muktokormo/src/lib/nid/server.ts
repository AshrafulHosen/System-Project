import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUserId } from "@/lib/milestones/server";
import {
  NID_ALLOWED_TYPES,
  NID_BUCKET,
  NID_MAX_FILE_BYTES,
  type NidMimeType,
  type NidRole,
  type NidSide,
} from "@/lib/nid/shared";

if (typeof window !== "undefined") {
  throw new Error("src/lib/nid/server.ts cannot be imported in browser code.");
}

/** Lifetime of admin document-viewing URLs. */
export const NID_SIGNED_URL_SECONDS = 120;

export type NidErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "ROLE_NOT_ALLOWED"
  | "INVALID_REQUEST"
  | "INVALID_FILE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_MISSING"
  | "CONSENT_REQUIRED"
  | "PENDING_EXISTS"
  | "ALREADY_VERIFIED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "REASON_REQUIRED"
  | "ALREADY_REVIEWED"
  | "SELF_REVIEW"
  | "DOCUMENTS_DELETED"
  | "SERVER_ERROR";

const STATUS: Record<NidErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ROLE_NOT_ALLOWED: 403,
  INVALID_REQUEST: 400,
  INVALID_FILE: 400,
  FILE_TOO_LARGE: 413,
  UPLOAD_MISSING: 400,
  CONSENT_REQUIRED: 400,
  PENDING_EXISTS: 409,
  ALREADY_VERIFIED: 409,
  RATE_LIMITED: 429,
  NOT_FOUND: 404,
  REASON_REQUIRED: 400,
  ALREADY_REVIEWED: 409,
  SELF_REVIEW: 403,
  DOCUMENTS_DELETED: 410,
  SERVER_ERROR: 500,
};

const MESSAGES: Record<NidErrorCode, string> = {
  UNAUTHENTICATED: "Please sign in to continue.",
  FORBIDDEN: "Administrators only.",
  ROLE_NOT_ALLOWED: "Only client and freelancer accounts can submit identity documents.",
  INVALID_REQUEST: "The request could not be read.",
  INVALID_FILE: "Only JPG, JPEG, PNG or WebP images are accepted.",
  FILE_TOO_LARGE: "Each image must be 5 MB or smaller.",
  UPLOAD_MISSING: "Both NID images must be uploaded before submitting.",
  CONSENT_REQUIRED: "Please confirm your consent before submitting.",
  PENDING_EXISTS: "You already have a submission awaiting review.",
  ALREADY_VERIFIED: "Your identity is already verified.",
  RATE_LIMITED: "Too many upload attempts. Please try again later.",
  NOT_FOUND: "Submission not found.",
  REASON_REQUIRED: "A rejection reason of 10–500 characters is required.",
  ALREADY_REVIEWED: "This submission has already been reviewed.",
  SELF_REVIEW: "You cannot review your own submission.",
  DOCUMENTS_DELETED: "The documents for this submission have been deleted under the retention policy.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};

export function nidError(code: NidErrorCode, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { ok: false, code, error: MESSAGES[code], ...extra },
    { status: STATUS[code], headers: { "Cache-Control": "no-store" } }
  );
}

export function nidOk(body: Record<string, unknown>) {
  return NextResponse.json({ ok: true, ...body }, { headers: { "Cache-Control": "no-store" } });
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

/** Role used for NID submissions. Admins (and unknown accounts) may not submit. */
export async function resolveNidRole(db: SupabaseClient, userId: string): Promise<NidRole | "admin" | null> {
  const [adminRes, clientRes, freelancerRes] = await Promise.all([
    db.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
    db.from("clients").select("user_id").eq("user_id", userId).maybeSingle(),
    db.from("freelancers").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);
  if (adminRes.data) return "admin";
  if (clientRes.data) return "client";
  if (freelancerRes.data) return "freelancer";
  return null;
}

/** Returns the admin's user id, or an error response. */
export async function requireNidAdmin(): Promise<string | NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) return nidError("UNAUTHENTICATED");
  const { data: isAdmin, error } = await createAdminClient().rpc("is_admin", { uid: userId });
  if (error) {
    console.error("is_admin check failed:", error.code);
    return nidError("SERVER_ERROR");
  }
  if (!isAdmin) return nidError("FORBIDDEN");
  return userId;
}

/** Canonical object path: <user-id>/<submission-id>/nid-<side>.<ext> */
export function nidObjectPath(userId: string, submissionId: string, side: NidSide, type: NidMimeType): string {
  return `${userId}/${submissionId}/nid-${side}.${NID_ALLOWED_TYPES[type]}`;
}

/** Parses a path and confirms it belongs to the user, submission and side. */
export function parseOwnedPath(path: unknown, userId: string, submissionId: string, side: NidSide): NidMimeType | null {
  if (typeof path !== "string") return null;
  const m = /^([0-9a-f-]{36})\/([0-9a-f-]{36})\/nid-(front|back)\.(jpg|png|webp)$/i.exec(path);
  if (!m || m[1] !== userId || m[2] !== submissionId || m[3] !== side) return null;
  const ext = m[4].toLowerCase();
  const entry = Object.entries(NID_ALLOWED_TYPES).find(([, e]) => e === ext);
  return entry ? (entry[0] as NidMimeType) : null;
}

function sniffImageType(bytes: Uint8Array): NidMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export type UploadCheck = { ok: true } | { ok: false; code: "UPLOAD_MISSING" | "INVALID_FILE" | "FILE_TOO_LARGE" };

/**
 * Server-side validation of an uploaded object: it must exist, be ≤ 5 MB and
 * its content (magic bytes) must match the extension in its path.
 */
export async function verifyUploadedImage(db: SupabaseClient, path: string, expected: NidMimeType): Promise<UploadCheck> {
  const { data, error } = await db.storage.from(NID_BUCKET).download(path);
  if (error || !data) return { ok: false, code: "UPLOAD_MISSING" };
  if (data.size === 0) return { ok: false, code: "INVALID_FILE" };
  if (data.size > NID_MAX_FILE_BYTES) return { ok: false, code: "FILE_TOO_LARGE" };
  const head = new Uint8Array(await data.slice(0, 16).arrayBuffer());
  if (sniffImageType(head) !== expected) return { ok: false, code: "INVALID_FILE" };
  return { ok: true };
}

export async function removeNidObjects(db: SupabaseClient, paths: string[]): Promise<boolean> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (!unique.length) return true;
  const { error } = await db.storage.from(NID_BUCKET).remove(unique);
  if (error) {
    console.error("NID object removal failed:", error.message);
    return false;
  }
  return true;
}

/**
 * Small per-instance throttle for minting upload URLs. Storage itself caps
 * file size/type, and orphaned uploads are purged by the retention job.
 */
const uploadMints = new Map<string, number[]>();
export function allowUploadMint(userId: string, limit = 10, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (uploadMints.get(userId) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    uploadMints.set(userId, recent);
    return false;
  }
  recent.push(now);
  uploadMints.set(userId, recent);
  return true;
}
