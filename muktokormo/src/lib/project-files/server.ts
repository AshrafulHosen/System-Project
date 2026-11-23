import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUserId } from "@/lib/milestones/server";
import {
  PROJECT_FILES_BUCKET,
  type ProjectFileAccess,
  type ProjectFileRecord,
  type ProjectFilesResponse,
} from "@/lib/project-files/shared";

if (typeof window !== "undefined") {
  throw new Error("src/lib/project-files/server.ts cannot be imported in browser code.");
}

export const DOWNLOAD_URL_SECONDS = 300;

export type ProjectFileErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_REQUEST"
  | "INVALID_FILE"
  | "FILE_TOO_LARGE"
  | "TOO_MANY_FILES"
  | "UPLOAD_MISSING"
  | "SERVER_ERROR";

const STATUS: Record<ProjectFileErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INVALID_REQUEST: 400,
  INVALID_FILE: 400,
  FILE_TOO_LARGE: 413,
  TOO_MANY_FILES: 409,
  UPLOAD_MISSING: 400,
  SERVER_ERROR: 500,
};

const MESSAGES: Record<ProjectFileErrorCode, string> = {
  UNAUTHENTICATED: "Please sign in to view project files.",
  FORBIDDEN: "Only the client and the hired freelancer can access these files.",
  NOT_FOUND: "File or project not found.",
  INVALID_REQUEST: "The request could not be read.",
  INVALID_FILE: "That file type isn't supported. Use PDF, Word, Excel, PowerPoint, TXT, CSV, PNG, JPG, WebP or ZIP.",
  FILE_TOO_LARGE: "Each file must be 20 MB or smaller.",
  TOO_MANY_FILES: "A project can have up to 10 files.",
  UPLOAD_MISSING: "The file upload did not complete. Please try again.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};

export function fileError(code: ProjectFileErrorCode) {
  return NextResponse.json(
    { ok: false, code, error: MESSAGES[code] },
    { status: STATUS[code], headers: { "Cache-Control": "no-store" } }
  );
}

export function fileOk(body: Record<string, unknown>) {
  return NextResponse.json({ ok: true, ...body }, { headers: { "Cache-Control": "no-store" } });
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export interface FileGate {
  userId: string;
  access: ProjectFileAccess;
  db: SupabaseClient;
}

/** Resolves the caller and their access level for a project (404 if it doesn't exist). */
export async function gateProject(projectId: string): Promise<FileGate | NextResponse> {
  if (!isUuid(projectId)) return fileError("INVALID_REQUEST");
  const userId = await getSessionUserId();
  if (!userId) return fileError("UNAUTHENTICATED");
  const db = createAdminClient();
  const [{ data: project }, { data: access, error }] = await Promise.all([
    db.from("projects").select("id").eq("id", projectId).maybeSingle(),
    db.rpc("project_file_access", { p_project_id: projectId, p_uid: userId }),
  ]);
  if (error) {
    console.error("project_file_access failed:", error.code);
    return fileError("SERVER_ERROR");
  }
  if (!project) return fileError("NOT_FOUND");
  return { userId, db, access: (access as ProjectFileAccess | null) ?? "none" };
}

/** File list for a project; parties get metadata, everyone else only the count. */
export async function listProjectFiles(gate: FileGate, projectId: string): Promise<ProjectFilesResponse | NextResponse> {
  const { data, error, count } = await gate.db
    .from("project_files")
    .select("id, file_name, mime_type, size_bytes, created_at", { count: "exact" })
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("project_files list failed:", error.code);
    return fileError("SERVER_ERROR");
  }
  const files: ProjectFileRecord[] =
    gate.access === "none"
      ? []
      : (data ?? []).map((f) => ({
          id: f.id,
          fileName: f.file_name,
          mimeType: f.mime_type,
          sizeBytes: Number(f.size_bytes),
          createdAt: f.created_at,
        }));
  return { ok: true, projectId, access: gate.access, count: count ?? files.length, files };
}

/** Storage metadata for one object, or null if it doesn't exist. */
export async function storedObjectInfo(db: SupabaseClient, path: string): Promise<{ size: number; mimetype: string } | null> {
  const slash = path.lastIndexOf("/");
  const folder = path.slice(0, slash);
  const name = path.slice(slash + 1);
  const { data, error } = await db.storage.from(PROJECT_FILES_BUCKET).list(folder, { search: name, limit: 5 });
  if (error) return null;
  const obj = (data ?? []).find((o) => o.name === name);
  const meta = obj?.metadata as { size?: number; mimetype?: string } | undefined;
  if (!obj || !meta) return null;
  return { size: Number(meta.size ?? 0), mimetype: String(meta.mimetype ?? "") };
}

export async function removeStoredFiles(db: SupabaseClient, paths: string[]) {
  if (!paths.length) return;
  const { error } = await db.storage.from(PROJECT_FILES_BUCKET).remove(paths);
  if (error) console.error("project file removal failed:", error.message);
}
