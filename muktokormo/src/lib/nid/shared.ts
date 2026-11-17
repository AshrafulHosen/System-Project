/** NID verification constants and types shared by browser and server code. */

export const NID_BUCKET = "nid-documents";
export const NID_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const NID_ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
export type NidMimeType = keyof typeof NID_ALLOWED_TYPES;
export const NID_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const NID_REASON_MIN = 10;
export const NID_REASON_MAX = 500;

export type NidSide = "front" | "back";
export type NidStatus = "not_verified" | "pending" | "approved" | "rejected";
export type NidRole = "client" | "freelancer";

export interface NidStatusResponse {
  ok: true;
  status: NidStatus;
  role: NidRole | null;
  canSubmit: boolean;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface NidAdminRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: NidRole;
  status: Exclude<NidStatus, "not_verified">;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  documentsDeleted: boolean;
}

export interface NidHistoryEntry {
  id: string;
  status: Exclude<NidStatus, "not_verified">;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  rejectionReason: string | null;
}

export interface NidDocumentsResponse {
  ok: true;
  submission: NidAdminRow & { phoneVerified: boolean; accountCreatedAt: string | null };
  documents: { front: string | null; back: string | null; expiresInSeconds: number };
  history: NidHistoryEntry[];
}

export function isAllowedNidType(type: string): type is NidMimeType {
  return Object.prototype.hasOwnProperty.call(NID_ALLOWED_TYPES, type);
}

export function extensionOf(fileName: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(fileName.trim());
  return m ? m[1].toLowerCase() : "";
}

/** Browser-side pre-check; the server re-validates everything. */
export function validateNidFile(file: { name: string; type: string; size: number }): string | null {
  const ext = extensionOf(file.name);
  if (!isAllowedNidType(file.type) || !(NID_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return "Only JPG, JPEG, PNG or WebP images are accepted.";
  }
  if (file.size <= 0) return "The selected file is empty.";
  if (file.size > NID_MAX_FILE_BYTES) return "Each image must be 5 MB or smaller.";
  return null;
}
