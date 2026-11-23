import { NextResponse } from "next/server";
import {
  PROJECT_FILE_MAX_BYTES,
  PROJECT_FILE_TYPES,
  PROJECT_FILES_MAX_COUNT,
  cleanFileName,
} from "@/lib/project-files/shared";
import {
  fileError,
  fileOk,
  gateProject,
  isUuid,
  listProjectFiles,
  removeStoredFiles,
  storedObjectInfo,
} from "@/lib/project-files/server";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/files
 * Owner, hired freelancer(s) and admins get the file list. Any other signed-in
 * user only learns how many files exist (shown as "shared after hiring").
 */
export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const gate = await gateProject(id);
  if (gate instanceof NextResponse) return gate;
  const list = await listProjectFiles(gate, id);
  if (list instanceof NextResponse) return list;
  return NextResponse.json(list, { headers: { "Cache-Control": "no-store, private" } });
}

/**
 * POST /api/projects/[id]/files  { fileId, path, fileName }
 * Owner only. Registers a file the browser uploaded via a signed upload URL,
 * using the size and type Storage actually recorded.
 */
export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const gate = await gateProject(id);
  if (gate instanceof NextResponse) return gate;
  if (gate.access !== "owner") return fileError("FORBIDDEN");

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fileError("INVALID_REQUEST");
  }
  const { fileId, path } = body;
  if (!isUuid(fileId) || typeof path !== "string" || typeof body.fileName !== "string") return fileError("INVALID_REQUEST");
  const m = /^([0-9a-f-]{36})\/([0-9a-f-]{36})\.([a-z]+)$/i.exec(path);
  if (!m || m[1] !== id || m[2] !== fileId) return fileError("INVALID_REQUEST");

  const info = await storedObjectInfo(gate.db, path);
  if (!info) return fileError("UPLOAD_MISSING");
  const expectedExt = PROJECT_FILE_TYPES[info.mimetype];
  if (!expectedExt || expectedExt !== m[3].toLowerCase()) {
    await removeStoredFiles(gate.db, [path]);
    return fileError("INVALID_FILE");
  }
  if (info.size <= 0 || info.size > PROJECT_FILE_MAX_BYTES) {
    await removeStoredFiles(gate.db, [path]);
    return fileError("FILE_TOO_LARGE");
  }

  const { count } = await gate.db.from("project_files").select("id", { count: "exact", head: true }).eq("project_id", id);
  if ((count ?? 0) >= PROJECT_FILES_MAX_COUNT) {
    await removeStoredFiles(gate.db, [path]);
    return fileError("TOO_MANY_FILES");
  }

  const { data: row, error } = await gate.db
    .from("project_files")
    .upsert(
      {
        id: fileId,
        project_id: id,
        uploaded_by: gate.userId,
        storage_path: path,
        file_name: cleanFileName(body.fileName),
        mime_type: info.mimetype,
        size_bytes: info.size,
      },
      { onConflict: "id", ignoreDuplicates: true }
    )
    .select("id, file_name, mime_type, size_bytes, created_at")
    .maybeSingle();
  if (error) {
    console.error("project_files insert failed:", error.code);
    return fileError("SERVER_ERROR");
  }

  return fileOk({
    file: row
      ? { id: row.id, fileName: row.file_name, mimeType: row.mime_type, sizeBytes: Number(row.size_bytes), createdAt: row.created_at }
      : null,
  });
}
