import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isUuid } from "@/lib/payments/constants";
import { getSessionUserId } from "@/lib/milestones/server";
import { loadAuthorizedContractForUser } from "@/lib/payments/contracts-server";
import { loadReviews } from "@/lib/reviews/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET — both reviews on a contract plus whether the viewer may review now.
 * Eligibility is computed server-side; the submit RPC re-checks it.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "Invalid contract id." }, { status: 400 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const ctx = await loadAuthorizedContractForUser(id, userId);
  if (!ctx.ok || !ctx.contractRow) {
    return NextResponse.json({ ok: false, error: ctx.error }, { status: ctx.statusCode });
  }

  const row = ctx.contractRow as { payment_status?: string | null; status?: string | null };
  const completed =
    String(row.payment_status ?? "").toUpperCase() === "RELEASED" &&
    String(row.status ?? "").toLowerCase() === "completed";

  const reviews = await loadReviews({ contractId: id, visibleOnly: false, limit: 2 });
  const myType = ctx.isContractClient ? "CLIENT_TO_FREELANCER" : ctx.isContractFreelancer ? "FREELANCER_TO_CLIENT" : null;
  const alreadyReviewed = myType ? reviews.some((r) => r.review_type === myType) : false;

  // Admins and parties see both; hidden/removed reviews are shown only with their status.
  return NextResponse.json(
    {
      ok: true,
      completed,
      viewerReviewType: myType,
      canReview: Boolean(myType) && completed && !alreadyReviewed,
      alreadyReviewed,
      reviews,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
