import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NidAdminRow } from "@/lib/nid/shared";
import { nidError, requireNidAdmin } from "@/lib/nid/server";

export const runtime = "nodejs";

const STATUSES = ["pending", "approved", "rejected"] as const;
const ROLES = ["client", "freelancer"] as const;

/**
 * GET /api/nid/admin/requests?status=pending|approved|rejected&role=client|freelancer&q=&page=1&pageSize=20
 * Admin-only list of NID submissions with user name/email and per-status counts.
 */
export async function GET(req: Request) {
  const gate = await requireNidAdmin();
  if (typeof gate !== "string") return gate;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const role = url.searchParams.get("role");
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const page = Math.max(1, Math.floor(Number(url.searchParams.get("page")) || 1));
  const pageSize = Math.min(50, Math.max(5, Math.floor(Number(url.searchParams.get("pageSize")) || 20)));
  if (status && !(STATUSES as readonly string[]).includes(status)) return nidError("INVALID_REQUEST");
  if (role && !(ROLES as readonly string[]).includes(role)) return nidError("INVALID_REQUEST");

  const db = createAdminClient();

  // Search by name/email first, then filter submissions to those users.
  let userFilter: string[] | null = null;
  if (q) {
    const term = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const [byName, byEmail] = await Promise.all([
      db.from("users").select("id").ilike("name", term).limit(100),
      db.from("users").select("id").ilike("email", term).limit(100),
    ]);
    if (byName.error || byEmail.error) {
      console.error("NID admin search failed:", byName.error?.code ?? byEmail.error?.code);
      return nidError("SERVER_ERROR");
    }
    userFilter = Array.from(new Set([...(byName.data ?? []), ...(byEmail.data ?? [])].map((u) => u.id as string)));
    if (!userFilter.length) {
      return NextResponse.json(
        { ok: true, rows: [], total: 0, page, pageSize, counts: { all: 0, pending: 0, approved: 0, rejected: 0 } },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  let query = db
    .from("nid_verifications")
    .select("id, user_id, user_role, status, submitted_at, reviewed_at, rejection_reason, documents_deleted_at", {
      count: "exact",
    })
    .order("submitted_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (role) query = query.eq("user_role", role);
  if (userFilter) query = query.in("user_id", userFilter);
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const countQuery = (s?: string) => {
    let c = db.from("nid_verifications").select("id", { count: "exact", head: true });
    if (s) c = c.eq("status", s);
    if (role) c = c.eq("user_role", role);
    if (userFilter) c = c.in("user_id", userFilter);
    return c;
  };

  const [list, all, pending, approved, rejected] = await Promise.all([
    query,
    countQuery(),
    countQuery("pending"),
    countQuery("approved"),
    countQuery("rejected"),
  ]);
  if (list.error) {
    console.error("NID admin list failed:", list.error.code);
    return nidError("SERVER_ERROR");
  }

  const ids = Array.from(new Set((list.data ?? []).map((r) => r.user_id as string)));
  const { data: users } = ids.length
    ? await db.from("users").select("id, name, email").in("id", ids)
    : { data: [] as { id: string; name: string; email: string }[] };
  const byId = new Map((users ?? []).map((u) => [u.id as string, u]));

  const rows: NidAdminRow[] = (list.data ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: (byId.get(r.user_id)?.name as string) ?? "Unknown user",
    email: (byId.get(r.user_id)?.email as string) ?? "",
    role: r.user_role,
    status: r.status,
    submittedAt: r.submitted_at,
    reviewedAt: r.reviewed_at,
    rejectionReason: r.rejection_reason,
    documentsDeleted: Boolean(r.documents_deleted_at),
  }));

  return NextResponse.json(
    {
      ok: true,
      rows,
      total: list.count ?? rows.length,
      page,
      pageSize,
      counts: {
        all: all.count ?? 0,
        pending: pending.count ?? 0,
        approved: approved.count ?? 0,
        rejected: rejected.count ?? 0,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
