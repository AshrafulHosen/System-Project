import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/payments/constants";
import { getSessionUserId } from "@/lib/milestones/server";
import { callReviewRpc } from "@/lib/reviews/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** POST — report a review for moderation. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "Invalid review id." }, { status: 400 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sign in to report a review." }, { status: 401 });
  }
  let body: { reason?: unknown; details?: unknown };
  try {
    body = (await request.json()) as { reason?: unknown; details?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const rpc = await callReviewRpc("report_review", {
    p_review_id: id,
    p_actor_user_id: userId,
    p_reason: typeof body.reason === "string" ? body.reason : "",
    p_details: typeof body.details === "string" ? body.details.slice(0, 1100) : null,
  });
  if (!rpc.ok) {
    return NextResponse.json({ ok: false, error: rpc.error, code: rpc.code }, { status: rpc.status });
  }
  return NextResponse.json({ ok: true });
}
