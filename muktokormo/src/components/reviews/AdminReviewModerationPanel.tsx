"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Flag, RefreshCw } from "lucide-react";
import { Button, EmptyState, StatusPill } from "@/components/ui";
import { ReviewList } from "@/components/reviews/ReviewPrimitives";
import type { ReviewRecord } from "@/lib/reviews/constants";

interface ReportRow {
  id: string;
  review_id: string;
  reason: string;
  details: string | null;
  status: "OPEN" | "DISMISSED" | "ACTIONED";
  resolution_notes: string | null;
  created_at: string;
}

const ACTIONS = [
  { id: "DISMISS_REPORT", label: "Keep review (dismiss report)", variant: "outline" as const },
  { id: "HIDE", label: "Hide review", variant: "secondary" as const },
  { id: "REMOVE", label: "Remove review", variant: "danger" as const },
];

export default function AdminReviewModerationPanel() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [rowErr, setRowErr] = useState<Record<string, string>>({});
  const [showResolved, setShowResolved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews", { cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; error?: string; reports?: ReportRow[]; reviews?: ReviewRecord[] };
      if (!res.ok || !json.ok) return setError(json.error || "Failed to load reports.");
      setReports(json.reports ?? []);
      setReviews(json.reviews ?? []);
      setError(null);
    } catch {
      setError("Network error while loading reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const act = async (report: ReportRow, action: string) => {
    const note = (notes[report.id] ?? "").trim();
    if (note.length < 10) return setRowErr((e) => ({ ...e, [report.id]: "Write at least 10 characters explaining the decision." }));
    setBusy(`${report.id}:${action}`);
    setRowErr((e) => ({ ...e, [report.id]: "" }));
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: report.review_id, reportId: report.id, action, notes: note }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) return setRowErr((e) => ({ ...e, [report.id]: json.error || "Moderation failed." }));
      await load();
    } catch {
      setRowErr((e) => ({ ...e, [report.id]: "Network error. Nothing was changed." }));
    } finally {
      setBusy(null);
    }
  };

  const visible = reports.filter((r) => (showResolved ? r.status !== "OPEN" : r.status === "OPEN"));

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-ink-3" aria-hidden="true" />
          <h3 className="text-[15px] font-semibold text-ink">Reported reviews</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowResolved((v) => !v)}>
            {showResolved ? "Show open" : "Show resolved"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void load()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Refresh</Button>
        </div>
      </div>
      {error && <p role="alert" className="px-5 py-3 text-[13px] text-danger-strong">{error}</p>}
      {loading ? (
        <div className="p-6 h-28 animate-pulse" aria-busy="true" />
      ) : visible.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={<Flag className="w-6 h-6" />} title={showResolved ? "No resolved reports" : "No open reports"}
            description="When someone reports a review, it appears here with the full review for moderation." />
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((rep) => {
            const review = reviews.find((rv) => rv.id === rep.review_id);
            return (
              <li key={rep.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={rep.status.toLowerCase()} tone={rep.status === "OPEN" ? "rose" : "slate"} />
                  <span className="text-[13px] font-medium text-ink">{rep.reason.replace(/_/g, " ").toLowerCase()}</span>
                  <span className="text-[12px] text-ink-4">· {new Date(rep.created_at).toLocaleString("en-GB")}</span>
                </div>
                {rep.details && <p className="text-[13px] text-ink-2">“{rep.details}”</p>}
                {review ? <ReviewList reviews={[review]} lang="en" showModerationStatus /> : <p className="text-[13px] text-ink-4">Review no longer exists.</p>}
                {rep.status === "OPEN" ? (
                  <div className="space-y-2">
                    <label className="block">
                      <span className="block text-[13px] font-medium text-ink-2 mb-1.5">Decision notes (audited; sent to the reviewer if hidden or removed)</span>
                      <textarea rows={2} maxLength={2000} value={notes[rep.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [rep.id]: e.target.value }))}
                        className="w-full rounded-lg bg-white border border-line-strong text-sm px-3 py-2.5 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/12" />
                    </label>
                    {rowErr[rep.id] && <p role="alert" className="text-[13px] text-danger-strong">{rowErr[rep.id]}</p>}
                    <div className="flex flex-wrap gap-2">
                      {ACTIONS.map((a) => (
                        <Button key={a.id} size="sm" variant={a.variant} loading={busy === `${rep.id}:${a.id}`} disabled={busy !== null}
                          onClick={() => void act(rep, a.id)}>
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-3"><span className="font-medium text-ink-2">Decision: </span>{rep.resolution_notes}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
