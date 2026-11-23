/** Project attachment rules shared by browser and server. */

export const PROJECT_FILES_BUCKET = "project-files";
export const PROJECT_FILE_MAX_BYTES = 20 * 1024 * 1024;
export const PROJECT_FILES_MAX_COUNT = 10;

/** MIME type → stored extension. Must match the bucket's allowed_mime_types. */
export const PROJECT_FILE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
};

export const PROJECT_FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip," + Object.keys(PROJECT_FILE_TYPES).join(",");

export type ProjectFileAccess = "owner" | "hired" | "admin" | "none";

export interface ProjectFileRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ProjectFilesResponse {
  ok: true;
  projectId: string;
  access: ProjectFileAccess;
  count: number;
  files: ProjectFileRecord[];
}

export function isAllowedProjectFileType(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(PROJECT_FILE_TYPES, type);
}

export function validateProjectFile(file: { name: string; type: string; size: number }): string | null {
  if (!isAllowedProjectFileType(file.type)) {
    return `"${file.name}" isn't a supported type. Use PDF, Word, Excel, PowerPoint, TXT, CSV, PNG, JPG, WebP or ZIP.`;
  }
  if (file.size <= 0) return `"${file.name}" is empty.`;
  if (file.size > PROJECT_FILE_MAX_BYTES) return `"${file.name}" is larger than 20 MB.`;
  return null;
}

/** Keeps a display name safe and bounded (the storage path never uses it). */
export function cleanFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/]/g, "_")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  return (cleaned || "file").slice(0, 200);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
