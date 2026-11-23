import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fileError, gateProject, isUuid, listProjectFiles } from "@/lib/project-files/server";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/contracts/[id]/files
 * The project files for the job this contract belongs to. Same access rules as
 * /api/projects/[id]/files: the contract's freelancer is the "hired" party.
 */
export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isUuid(id)) return fileError("INVALID_REQUEST");

  const db = createAdminClient();
  const { data: contract, error } = await db
    .from("contracts")
    .select("project_id, proposals(project_id)")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("contract project lookup failed:", error.code);
    return fileError("SERVER_ERROR");
  }
  const embedded = contract?.proposals as { project_id?: string } | { project_id?: string }[] | null | undefined;
  const viaProposal = Array.isArray(embedded) ? embedded[0]?.project_id : embedded?.project_id;
  const projectId = (contract?.project_id as string | null) ?? viaProposal ?? null;
  if (!projectId) return fileError("NOT_FOUND");

  const gate = await gateProject(projectId);
  if (gate instanceof NextResponse) return gate;
  if (gate.access === "none") return fileError("FORBIDDEN");
  const list = await listProjectFiles(gate, projectId);
  if (list instanceof NextResponse) return list;
  return NextResponse.json(list, { headers: { "Cache-Control": "no-store, private" } });
}
