import { createAdminClient } from "@/lib/supabase/admin";
import { nidError, nidOk, removeNidObjects, requireNidAdmin } from "@/lib/nid/server";

export const runtime = "nodejs";

/** Retention periods; see docs/NID_VERIFICATION.md. */
const APPROVED_DAYS = 90;
const REJECTED_DAYS = 30;
const ORPHAN_HOURS = 24;

/**
 * POST /api/nid/admin/retention
 * Admin-only. Deletes NID images past their retention period and uploads
 * never attached to a submission. Submission records (status, dates,
 * reviewer) are kept; only the images are removed.
 */
export async function POST() {
  const gate = await requireNidAdmin();
  if (typeof gate !== "string") return gate;

  const db = createAdminClient();
  const { data, error } = await db.rpc("nid_retention_candidates", {
    p_approved_days: APPROVED_DAYS,
    p_rejected_days: REJECTED_DAYS,
    p_orphan_hours: ORPHAN_HOURS,
  });
  if (error) {
    console.error("nid_retention_candidates failed:", error.code);
    return nidError("SERVER_ERROR");
  }

  const rows = (data ?? []) as { verification_id: string | null; object_path: string }[];
  const paths = rows.map((r) => r.object_path);
  if (paths.length && !(await removeNidObjects(db, paths))) return nidError("SERVER_ERROR");

  const ids = Array.from(new Set(rows.map((r) => r.verification_id).filter((v): v is string => Boolean(v))));
  let submissions = 0;
  if (ids.length) {
    const { data: marked, error: markErr } = await db.rpc("nid_mark_documents_deleted", { p_ids: ids });
    if (markErr) {
      console.error("nid_mark_documents_deleted failed:", markErr.code);
      return nidError("SERVER_ERROR");
    }
    submissions = Number(marked) || 0;
  }

  return nidOk({
    deletedFiles: paths.length,
    submissionsPurged: submissions,
    orphanFiles: rows.filter((r) => !r.verification_id).length,
  });
}
