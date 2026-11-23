import { NextResponse } from "next/server";
import { PROJECT_FILES_BUCKET } from "@/lib/project-files/shared";
import { DOWNLOAD_URL_SECONDS, fileError, fileOk, gateProject, isUuid, removeStoredFiles } from "@/lib/project-files/server";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string; fileId: string }>;
}

async function loadFile(projectId: string, fileId: string) {
  const gate = await gateProject(projectId);
  if (gate instanceof NextResponse) return gate;
  if (!isUuid(fileId)) return fileError("INVALID_REQUEST");
  if (gate.access === "none") return fileError("FORBIDDEN");
  const { data: file, error } = await gate.db
    .from("project_files")
    .select("id, storage_path, file_name")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) {
    console.error("project_files lookup failed:", error.code);
    return fileError("SERVER_ERROR");
  }
  if (!file) return fileError("NOT_FOUND");
  return { gate, file };
}

/**
 * GET /api/projects/[id]/files/[fileId]
 * Owner, hired freelancer or admin: redirects to a 5-minute signed URL that
 * downloads the file under its original name.
 */
export async function GET(_req: Request, context: RouteContext) {
  const { id, fileId } = await context.params;
  const found = await loadFile(id, fileId);
  if (found instanceof NextResponse) return found;
  const { data, error } = await found.gate.db.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUrl(found.file.storage_path, DOWNLOAD_URL_SECONDS, { download: found.file.file_name });
  if (error || !data) {
    console.error("project file signed URL failed:", error?.message);
    return fileError("SERVER_ERROR");
  }
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { "Cache-Control": "no-store, private" } });
}

/** DELETE /api/projects/[id]/files/[fileId] — owner only. */
export async function DELETE(_req: Request, context: RouteContext) {
  const { id, fileId } = await context.params;
  const found = await loadFile(id, fileId);
  if (found instanceof NextResponse) return found;
  if (found.gate.access !== "owner") return fileError("FORBIDDEN");
  const { error } = await found.gate.db.from("project_files").delete().eq("id", fileId).eq("project_id", id);
  if (error) {
    console.error("project_files delete failed:", error.code);
    return fileError("SERVER_ERROR");
  }
  await removeStoredFiles(found.gate.db, [found.file.storage_path]);
  return fileOk({ deleted: true });
}
