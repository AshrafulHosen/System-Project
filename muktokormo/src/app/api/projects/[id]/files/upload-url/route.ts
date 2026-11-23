import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  PROJECT_FILE_MAX_BYTES,
  PROJECT_FILE_TYPES,
  PROJECT_FILES_BUCKET,
  PROJECT_FILES_MAX_COUNT,
  isAllowedProjectFileType,
} from "@/lib/project-files/shared";
import { fileError, fileOk, gateProject } from "@/lib/project-files/server";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/projects/[id]/files/upload-url  { contentType, size }
 * Owner only. Mints a one-time signed upload URL at <project-id>/<file-id>.<ext>.
 * The bucket independently enforces the 20 MB limit and the type allow-list.
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
  const contentType = body.contentType;
  const size = Number(body.size);
  if (typeof contentType !== "string" || !isAllowedProjectFileType(contentType)) return fileError("INVALID_FILE");
  if (!Number.isFinite(size) || size <= 0) return fileError("INVALID_FILE");
  if (size > PROJECT_FILE_MAX_BYTES) return fileError("FILE_TOO_LARGE");

  const { count } = await gate.db.from("project_files").select("id", { count: "exact", head: true }).eq("project_id", id);
  if ((count ?? 0) >= PROJECT_FILES_MAX_COUNT) return fileError("TOO_MANY_FILES");

  const fileId = randomUUID();
  const path = `${id}/${fileId}.${PROJECT_FILE_TYPES[contentType]}`;
  const { data, error } = await gate.db.storage.from(PROJECT_FILES_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("project file createSignedUploadUrl failed:", error?.message);
    return fileError("SERVER_ERROR");
  }
  return fileOk({ fileId, path: data.path, signedUrl: data.signedUrl });
}
