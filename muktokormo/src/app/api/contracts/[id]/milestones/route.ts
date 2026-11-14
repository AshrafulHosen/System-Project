import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/payments/constants";
import { callMilestoneRpc, getSessionUserId, loadMilestoneWorkspace } from "@/lib/milestones/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const PLAN_ACTIONS = new Set([
  "save_plan",
  "propose_plan",
  "accept_plan",
  "request_plan_changes",
  "propose_amendment",
  "accept_amendment",
  "reject_amendment",
  "request_cancel",
  "confirm_cancel",
  "withdraw_cancel",
]);

/** GET — milestone workspace for a contract (parties & admins only). */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "Invalid contract id." }, { status: 400 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const result = await loadMilestoneWorkspace(id, userId);
  if (result.ok !== true) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

/**
 * POST — milestone plan & amendment actions.
 * Body: { action, payload }. The acting user is always the session user;
 * the database function enforces role, ownership and state rules.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "Invalid contract id." }, { status: 400 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  let body: { action?: unknown; payload?: unknown };
  try {
    body = (await request.json()) as { action?: unknown; payload?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  if (!PLAN_ACTIONS.has(action)) {
    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  }
  const payload =
    body.payload && typeof body.payload === "object" && !Array.isArray(body.payload) ? body.payload : {};
  if (JSON.stringify(payload).length > 100_000) {
    return NextResponse.json({ ok: false, error: "Request is too large." }, { status: 413 });
  }

  const rpc = await callMilestoneRpc("milestone_plan_action", {
    p_contract_id: id,
    p_actor_user_id: userId,
    p_action: action,
    p_payload: payload,
  });
  if (!rpc.ok) {
    return NextResponse.json({ ok: false, error: rpc.error, code: rpc.code }, { status: rpc.status });
  }
  return NextResponse.json({ ok: true, result: rpc.data });
}
