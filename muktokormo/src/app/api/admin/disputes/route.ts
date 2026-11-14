import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUserId } from "@/lib/milestones/server";

/** GET — milestone disputes with evidence, for administrators only. */
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }
  const adminDb = createAdminClient();
  const { data: isAdmin } = await adminDb.rpc("is_admin", { uid: userId });
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Administrators only." }, { status: 403 });
  }

  const statusFilter = request.nextUrl.searchParams.get("status");
  let query = adminDb
    .from("milestone_disputes")
    .select(
      "id, milestone_id, contract_id, raised_by_role, reason, previous_status, status, resolution, resolution_notes, resolved_at, created_at, contract_milestones(title, amount, status, deliverables), contracts(contract_code, projects(title))"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (statusFilter === "OPEN" || statusFilter === "RESOLVED") {
    query = query.eq("status", statusFilter);
  }
  const { data: disputes, error } = await query;
  if (error) {
    console.error("Admin disputes query failed:", error.message);
    return NextResponse.json({ ok: false, error: "Failed to load disputes." }, { status: 500 });
  }

  const milestoneIds = Array.from(new Set((disputes ?? []).map((d) => d.milestone_id)));
  const { data: submissions } = milestoneIds.length
    ? await adminDb
        .from("milestone_submissions")
        .select("milestone_id, revision_number, message, demo_url, attachments, status, review_feedback, created_at")
        .in("milestone_id", milestoneIds)
        .order("revision_number", { ascending: false })
    : { data: [] };

  return NextResponse.json(
    { ok: true, disputes: disputes ?? [], submissions: submissions ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}
