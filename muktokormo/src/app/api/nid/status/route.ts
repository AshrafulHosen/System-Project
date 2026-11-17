import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/milestones/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NidStatusResponse } from "@/lib/nid/shared";
import { nidError, resolveNidRole } from "@/lib/nid/server";

export const runtime = "nodejs";

/** GET /api/nid/status — the caller's latest NID submission state (no document paths). */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return nidError("UNAUTHENTICATED");

  const db = createAdminClient();
  const [role, latestRes] = await Promise.all([
    resolveNidRole(db, userId),
    db
      .from("nid_verifications")
      .select("status, submitted_at, reviewed_at, rejection_reason")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (latestRes.error) {
    console.error("NID status query failed:", latestRes.error.code);
    return nidError("SERVER_ERROR");
  }

  // An approval is permanent; make sure a later row never hides it.
  let latest = latestRes.data;
  if (latest && latest.status !== "approved") {
    const { data: approved } = await db
      .from("nid_verifications")
      .select("status, submitted_at, reviewed_at, rejection_reason")
      .eq("user_id", userId)
      .eq("status", "approved")
      .maybeSingle();
    if (approved) latest = approved;
  }

  const nidRole = role === "client" || role === "freelancer" ? role : null;
  const status = (latest?.status as NidStatusResponse["status"] | undefined) ?? "not_verified";
  const payload: NidStatusResponse = {
    ok: true,
    status,
    role: nidRole,
    canSubmit: nidRole !== null && (status === "not_verified" || status === "rejected"),
    submittedAt: latest?.submitted_at ?? null,
    reviewedAt: latest?.reviewed_at ?? null,
    rejectionReason: status === "rejected" ? (latest?.rejection_reason ?? null) : null,
  };
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
