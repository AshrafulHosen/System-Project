import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/milestones/server";
import { loadReviews } from "@/lib/reviews/server";
import { summarizeReviews } from "@/lib/reviews/constants";

/** GET /api/reviews/me — reviews the signed-in user received and wrote. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const [received, written] = await Promise.all([
    loadReviews({ revieweeUserId: userId, visibleOnly: false, limit: 100 }),
    loadReviews({ reviewerUserId: userId, visibleOnly: false, limit: 100 }),
  ]);
  const visibleReceived = received.filter((r) => r.moderation_status === "VISIBLE");
  return NextResponse.json(
    { ok: true, received, written, summary: summarizeReviews(visibleReceived) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
