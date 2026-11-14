"use client";

import React, { useState } from "react";
import { Flag, Star } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import {
  REPORT_REASONS,
  REVIEW_CATEGORIES,
  type ReviewRecord,
  type ReviewSummary,
} from "@/lib/reviews/constants";

/* ---------------------------------------------------------------- display */
export function StarDisplay({ value, size = "w-4 h-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className={`relative inline-block ${size}`} aria-hidden="true">
            <Star className={`absolute inset-0 ${size} text-muted-2`} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${size} fill-accent-bright text-accent-bright`} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/* ------------------------------------------------------------------ input */
export function StarRatingInput({
  label,
  value,
  onChange,
  name,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  name: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const words = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
  return (
    <fieldset className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true" className="text-[14px] text-ink-2">{label}</span>
      <div className="flex items-center gap-3">
        <div role="radiogroup" aria-label={label} className="flex items-center" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <label key={i} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(i)}>
              <input
                type="radio"
                name={name}
                value={i}
                checked={value === i}
                onChange={() => onChange(i)}
                className="sr-only peer"
                aria-label={`${i} star${i > 1 ? "s" : ""} — ${words[i]}`}
              />
              <Star
                aria-hidden="true"
                className={`w-6 h-6 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand rounded ${
                  i <= shown ? "fill-accent-bright text-accent-bright" : "text-muted-2"
                }`}
              />
            </label>
          ))}
        </div>
        <span className="w-20 text-[12px] text-ink-3" aria-live="polite">{shown ? words[shown] : "Not rated"}</span>
      </div>
    </fieldset>
  );
}

/* ---------------------------------------------------------------- summary */
export function ReviewSummaryCard({
  summary,
  type,
  lang,
}: {
  summary: ReviewSummary;
  type: "CLIENT_TO_FREELANCER" | "FREELANCER_TO_CLIENT";
  lang: "en" | "bn";
}) {
  const en = lang === "en";
  if (summary.count === 0) {
    return (
      <div className="rounded-xl border border-line bg-white p-5 text-[13px] text-ink-3">
        {en ? "No reviews yet. Ratings appear after completed contracts." : "এখনো কোনো রিভিউ নেই।"}
      </div>
    );
  }
  const max = Math.max(...Object.values(summary.distribution), 1);
  return (
    <div className="rounded-xl border border-line bg-white grid grid-cols-1 sm:grid-cols-[180px_1fr] divide-y sm:divide-y-0 sm:divide-x divide-line">
      <div className="p-5 flex flex-col justify-center">
        <p className="text-4xl font-semibold tracking-[-0.04em] text-ink mk-tabular leading-none">{summary.average.toFixed(1)}</p>
        <div className="mt-2"><StarDisplay value={summary.average} /></div>
        <p className="mt-1.5 text-[12px] text-ink-3">
          {summary.count} {en ? (summary.count === 1 ? "review" : "reviews") : "টি রিভিউ"}
        </p>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <ul className="space-y-1.5" aria-label={en ? "Rating distribution" : "রেটিং বণ্টন"}>
          {([5, 4, 3, 2, 1] as const).map((star) => (
            <li key={star} className="flex items-center gap-2 text-[12px]">
              <span className="w-6 text-ink-3 mk-tabular">{star}★</span>
              <span className="flex-1 h-1.5 rounded-full bg-subtle overflow-hidden">
                <span className="block h-full bg-accent-bright rounded-full" style={{ width: `${(summary.distribution[star] / max) * 100}%` }} />
              </span>
              <span className="w-6 text-right text-ink-4 mk-tabular">{summary.distribution[star]}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5">
          {REVIEW_CATEGORIES[type].map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-2 text-[12.5px]">
              <dt className="text-ink-3">{en ? c.label : c.labelBn}</dt>
              <dd className="font-medium text-ink mk-tabular">{(summary.categoryAverages[c.key] ?? 0).toFixed(1)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- list */
function fmtDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function ReviewList({
  reviews,
  lang,
  canReport = false,
  showModerationStatus = false,
}: {
  reviews: ReviewRecord[];
  lang: "en" | "bn";
  canReport?: boolean;
  showModerationStatus?: boolean;
}) {
  const en = lang === "en";
  const [reporting, setReporting] = useState<ReviewRecord | null>(null);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reported, setReported] = useState<Set<string>>(new Set());

  const submitReport = async () => {
    if (!reporting) return;
    if (!reason) return setErr(en ? "Choose a reason." : "কারণ বেছে নিন।");
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/reviews/${reporting.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) return setErr(json.error || "Report failed.");
      setReported((s) => new Set(s).add(reporting.id));
      setReporting(null);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  if (reviews.length === 0) return null;

  return (
    <>
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border border-line bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <StarDisplay value={r.overall_rating} />
                  <span className="text-[13px] font-semibold text-ink mk-tabular">{r.overall_rating.toFixed(1)}</span>
                  {showModerationStatus && r.moderation_status !== "VISIBLE" && (
                    <span className="px-1.5 py-0.5 rounded bg-danger-soft text-danger-strong text-[11px] font-medium">
                      {r.moderation_status === "HIDDEN" ? (en ? "Hidden by moderator" : "লুকানো") : (en ? "Removed" : "সরানো")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12px] text-ink-4">
                  {r.reviewer_name ?? (en ? "Verified party" : "যাচাইকৃত পক্ষ")}
                  {r.project_title ? ` · ${r.project_title}` : ""}
                </p>
              </div>
              <div className="text-right text-[11.5px] text-ink-4 leading-relaxed">
                {r.contract_completed_at && <p>{en ? "Completed" : "সম্পন্ন"} {fmtDate(r.contract_completed_at)}</p>}
                <p>{en ? "Reviewed" : "রিভিউ"} {fmtDate(r.created_at)}</p>
              </div>
            </div>

            {r.feedback && <p className="mt-3 text-[14px] text-ink-2 leading-relaxed whitespace-pre-line">{r.feedback}</p>}

            {(r.highlights || r.strengths || r.improvements) && (
              <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12.5px]">
                {r.highlights && <div className="rounded-lg bg-subtle p-2.5"><dt className="text-ink-4">{en ? "Highlights" : "হাইলাইট"}</dt><dd className="mt-0.5 text-ink-2">{r.highlights}</dd></div>}
                {r.strengths && <div className="rounded-lg bg-success-soft/60 p-2.5"><dt className="text-ink-4">{en ? "Strengths" : "শক্তি"}</dt><dd className="mt-0.5 text-ink-2">{r.strengths}</dd></div>}
                {r.improvements && <div className="rounded-lg bg-accent-soft/60 p-2.5"><dt className="text-ink-4">{en ? "Could improve" : "উন্নতির জায়গা"}</dt><dd className="mt-0.5 text-ink-2">{r.improvements}</dd></div>}
              </dl>
            )}

            {Object.keys(r.category_ratings).length > 0 && (
              <details className="mt-3">
                <summary className="text-[12px] font-medium text-ink-3 cursor-pointer">{en ? "Category ratings" : "বিভাগভিত্তিক রেটিং"}</summary>
                <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {REVIEW_CATEGORIES[r.review_type].map((c) => (
                    <div key={c.key} className="flex items-center justify-between text-[12.5px]">
                      <dt className="text-ink-3">{en ? c.label : c.labelBn}</dt>
                      <dd><StarDisplay value={Number(r.category_ratings[c.key] ?? 0)} size="w-3 h-3" /></dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}

            {canReport && (
              <div className="mt-3 flex justify-end">
                {reported.has(r.id) ? (
                  <span className="text-[12px] text-ink-4">{en ? "Reported — thank you." : "রিপোর্ট করা হয়েছে।"}</span>
                ) : (
                  <button type="button" onClick={() => { setReporting(r); setReason(""); setDetails(""); setErr(null); }}
                    className="inline-flex items-center gap-1 text-[12px] text-ink-4 hover:text-danger-strong cursor-pointer">
                    <Flag className="w-3.5 h-3.5" aria-hidden="true" /> {en ? "Report" : "রিপোর্ট"}
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <Modal isOpen={reporting !== null} onClose={() => !busy && setReporting(null)}
        title={en ? "Report this review" : "রিভিউ রিপোর্ট করুন"}
        subtitle={en ? "An administrator will review the report. Reviews are never changed silently." : "একজন অ্যাডমিন যাচাই করবেন।"}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submitReport(); }}>
          <fieldset className="space-y-1.5">
            <legend className="text-[13px] font-medium text-ink-2 mb-1">{en ? "Reason" : "কারণ"}</legend>
            {REPORT_REASONS.map((rr) => (
              <label key={rr.id} className="flex items-center gap-2 text-[14px] text-ink-2 cursor-pointer">
                <input type="radio" name="report-reason" value={rr.id} checked={reason === rr.id} onChange={() => setReason(rr.id)} />
                {rr.label}
              </label>
            ))}
          </fieldset>
          <label className="block">
            <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Details (optional)" : "বিস্তারিত"}</span>
            <textarea rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-lg bg-white border border-line-strong text-sm px-3 py-2.5 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/12" />
          </label>
          {err && <p role="alert" className="text-[13px] text-danger-strong">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReporting(null)} disabled={busy}>{en ? "Cancel" : "বাতিল"}</Button>
            <Button type="submit" variant="danger" loading={busy}>{en ? "Submit report" : "রিপোর্ট পাঠান"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
