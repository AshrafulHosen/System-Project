import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/payments/constants";
import { callMilestoneRpc, getSessionUserId } from "@/lib/milestones/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const RESOLUTIONS = new Set(["RELEASE_TO_FREELANCER", "REFUND_TO_CLIENT", "RESUME_WORK"]);

/** POST — resolve a milestone dispute. Admin rights are verified inside the RPC. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "Invalid dispute id." }, { status: 400 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  let body: { resolution?: unknown; notes?: unknown };
  try {
    body = (await request.json()) as { resolution?: unknown; notes?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const resolution = typeof body.resolution === "string" ? body.resolution.toUpperCase() : "";
  if (!RESOLUTIONS.has(resolution)) {
    return NextResponse.json({ ok: false, error: "Unknown resolution." }, { status: 400 });
  }
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 4000) : "";

  const rpc = await callMilestoneRpc("resolve_milestone_dispute", {
    p_dispute_id: id,
    p_admin_user_id: userId,
    p_resolution: resolution,
    p_notes: notes,
  });
  if (!rpc.ok) {
    return NextResponse.json({ ok: false, error: rpc.error, code: rpc.code }, { status: rpc.status });
  }
  return NextResponse.json({ ok: true, result: rpc.data });
}
