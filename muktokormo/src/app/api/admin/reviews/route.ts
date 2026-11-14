import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUserId } from "@/lib/milestones/server";
import { isUuid } from "@/lib/payments/constants";
import { callReviewRpc, loadReviews } from "@/lib/reviews/server";

async function requireAdmin(): Promise<string | NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  const { data: isAdmin } = await createAdminClient().rpc("is_admin", { uid: userId });
  if (!isAdmin) return NextResponse.json({ ok: false, error: "Administrators only." }, { status: 403 });
  return userId;
}

/** GET /api/admin/reviews — reported reviews and their reports. */
export async function GET() {
  const gate = await requireAdmin();
  if (typeof gate !== "string") return gate;
  const adminDb = createAdminClient();
  const { data: reports, error } = await adminDb
    .from("review_reports")
    .select("id, review_id, reason, details, status, resolution_notes, resolved_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("Admin review reports failed:", error.message);
    return NextResponse.json({ ok: false, error: "Failed to load reports." }, { status: 500 });
  }
  const reviewIds = Array.from(new Set((reports ?? []).map((r) => r.review_id as string)));
  const reviews = reviewIds.length
    ? (await Promise.all(reviewIds.map((rid) => loadReviewById(rid)))).filter(Boolean)
    : [];
  return NextResponse.json({ ok: true, reports: reports ?? [], reviews }, { headers: { "Cache-Control": "no-store" } });
}

async function loadReviewById(reviewId: string) {
  const adminDb = createAdminClient();
  const { data } = await adminDb.from("reviews").select("contract_id").eq("id", reviewId).maybeSingle();
  if (!data) return null;
  const list = await loadReviews({ contractId: data.contract_id as string, visibleOnly: false, limit: 2 });
  return list.find((r) => r.id === reviewId) ?? null;
}

/** POST /api/admin/reviews — moderate: { reviewId, action: HIDE|REMOVE|RESTORE|DISMISS_REPORT, notes, reportId? } */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (typeof gate !== "string") return gate;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  if (!isUuid(body.reviewId) || (body.reportId !== undefined && body.reportId !== null && !isUuid(body.reportId))) {
    return NextResponse.json({ ok: false, error: "Invalid ids." }, { status: 400 });
  }
  const rpc = await callReviewRpc("moderate_review", {
    p_review_id: body.reviewId,
    p_admin_user_id: gate,
    p_action: typeof body.action === "string" ? body.action : "",
    p_notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : "",
    p_report_id: body.reportId ?? null,
  });
  if (!rpc.ok) {
    return NextResponse.json({ ok: false, error: rpc.error, code: rpc.code }, { status: rpc.status });
  }
  return NextResponse.json({ ok: true, result: rpc.data });
}
