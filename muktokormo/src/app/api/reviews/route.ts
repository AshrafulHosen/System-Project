import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/payments/constants";
import { getSessionUserId } from "@/lib/milestones/server";
import { callReviewRpc, loadReviews, userIdForProfile } from "@/lib/reviews/server";
import { summarizeReviews } from "@/lib/reviews/constants";

/**
 * GET /api/reviews?freelancerId=… | ?clientId=…   — public, VISIBLE reviews only
 * Returns the reviews a profile has received plus a server-computed summary.
 */
export async function GET(request: NextRequest) {
  const freelancerId = request.nextUrl.searchParams.get("freelancerId");
  const clientId = request.nextUrl.searchParams.get("clientId");
  const kind = freelancerId ? "freelancer" : clientId ? "client" : null;
  const profileId = freelancerId ?? clientId;
  if (!kind || !isUuid(profileId)) {
    return NextResponse.json({ ok: false, error: "Provide a valid freelancerId or clientId." }, { status: 400 });
  }
  const userId = await userIdForProfile(kind, profileId);
  if (!userId) {
    return NextResponse.json({ ok: true, reviews: [], summary: summarizeReviews([]) });
  }
  const reviews = await loadReviews({
    revieweeUserId: userId,
    type: kind === "freelancer" ? "CLIENT_TO_FREELANCER" : "FREELANCER_TO_CLIENT",
    visibleOnly: true,
    limit: 50,
  });
  return NextResponse.json(
    { ok: true, reviews, summary: summarizeReviews(reviews) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/** POST /api/reviews — submit a review for a completed contract. */
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  if (!isUuid(body.contractId)) {
    return NextResponse.json({ ok: false, error: "A valid contractId is required." }, { status: 400 });
  }
  const categories = body.categories;
  if (!categories || typeof categories !== "object" || Array.isArray(categories)) {
    return NextResponse.json({ ok: false, error: "Rate every category from 1 to 5 stars." }, { status: 400 });
  }
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);

  // Reviewer identity, eligibility, scores and the overall rating are all decided in the database.
  const rpc = await callReviewRpc("submit_review", {
    p_contract_id: body.contractId,
    p_actor_user_id: userId,
    p_categories: categories,
    p_feedback: str(body.feedback, 2100) ?? "",
    p_highlights: str(body.highlights, 600),
    p_strengths: str(body.strengths, 600),
    p_improvements: str(body.improvements, 600),
  });
  if (!rpc.ok) {
    return NextResponse.json({ ok: false, error: rpc.error, code: rpc.code }, { status: rpc.status });
  }
  return NextResponse.json({ ok: true, result: rpc.data });
}
