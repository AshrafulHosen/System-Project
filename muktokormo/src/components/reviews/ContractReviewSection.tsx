"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MessageSquareQuote, Star } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { ReviewList, StarRatingInput } from "@/components/reviews/ReviewPrimitives";
import { REVIEW_CATEGORIES, REVIEW_LIMITS, type ReviewRecord, type ReviewType } from "@/lib/reviews/constants";

interface Eligibility {
  completed: boolean;
  viewerReviewType: ReviewType | null;
  canReview: boolean;
  alreadyReviewed: boolean;
  reviews: ReviewRecord[];
}

const fieldCls =
  "w-full rounded-lg bg-white border border-line-strong text-sm text-ink px-3 py-2.5 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/12";

export default function ContractReviewSection({ contractId, lang }: { contractId: string; lang: "en" | "bn" }) {
  const en = lang === "en";
  const [data, setData] = useState<Eligibility | null>(null);
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [highlights, setHighlights] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/reviews`, { cache: "no-store" });
      const json = (await res.json()) as Eligibility & { ok?: boolean };
      if (res.ok && json.ok) setData(json);
    } catch {
      /* section is optional; stay hidden on network errors */
    }
  }, [contractId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (!data || (!data.completed && data.reviews.length === 0)) return null;

  const type = data.viewerReviewType;
  const categories = type ? REVIEW_CATEGORIES[type] : [];
  const allRated = categories.every((c) => scores[c.key] >= 1);
  const preview = allRated ? categories.reduce((s, c) => s + scores[c.key], 0) / categories.length : 0;
  const revieweeLabel = type === "CLIENT_TO_FREELANCER" ? (en ? "the freelancer" : "ফ্রিল্যান্সার") : (en ? "the client" : "ক্লায়েন্ট");

  const submit = async () => {
    if (!allRated) return setErr(en ? "Rate every category." : "প্রতিটি বিভাগ রেট করুন।");
    const fb = feedback.trim();
    if (fb.length < REVIEW_LIMITS.feedbackMin) return setErr(en ? `Write at least ${REVIEW_LIMITS.feedbackMin} characters of feedback.` : "আরও বিস্তারিত লিখুন।");
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, categories: scores, feedback: fb, highlights, strengths, improvements }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) return setErr(json.error || "Could not submit the review.");
      setOpen(false);
      setDone(true);
      await load();
    } catch {
      setErr(en ? "Network error. Your review was not submitted." : "নেটওয়ার্ক ত্রুটি।");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white border border-line rounded-xl p-5 sm:p-6 space-y-4" aria-labelledby="contract-reviews-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-md bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <MessageSquareQuote className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="contract-reviews-heading" className="text-[15px] font-semibold text-ink">{en ? "Reviews" : "রিভিউ"}</h2>
            <p className="text-[13px] text-ink-3">
              {data.canReview
                ? en ? `The contract is complete. Share how working with ${revieweeLabel} went.` : "চুক্তি সম্পন্ন। আপনার অভিজ্ঞতা জানান।"
                : data.alreadyReviewed || done
                ? en ? "Thanks — your review is posted. Reviews can't be edited after submission." : "ধন্যবাদ — আপনার রিভিউ প্রকাশিত হয়েছে।"
                : en ? "Both parties can review each other once a contract is completed." : "চুক্তি সম্পন্ন হলে উভয় পক্ষ রিভিউ দিতে পারেন।"}
            </p>
          </div>
        </div>
        {data.canReview && (
          <Button onClick={() => { setErr(null); setOpen(true); }} leftIcon={<Star className="w-4 h-4" />}>
            {en ? "Write a review" : "রিভিউ লিখুন"}
          </Button>
        )}
      </div>

      <ReviewList reviews={data.reviews} lang={lang} canReport showModerationStatus />

      <Modal isOpen={open} onClose={() => !busy && setOpen(false)} maxWidthClass="max-w-xl"
        title={en ? `Review ${revieweeLabel}` : "রিভিউ লিখুন"}
        subtitle={en ? "Reviews are public on profiles and can't be edited after you submit." : "রিভিউ প্রোফাইলে প্রকাশিত হয় এবং পরে সম্পাদনা করা যায় না।"}>
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <div className="space-y-2.5">
            {categories.map((c) => (
              <StarRatingInput key={c.key} name={`cat-${c.key}`} label={en ? c.label : c.labelBn}
                value={scores[c.key] ?? 0} onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))} />
            ))}
            {allRated && (
              <p className="pt-2 border-t border-line text-[13px] text-ink-3">
                {en ? "Overall rating (calculated):" : "সামগ্রিক রেটিং:"} <span className="font-semibold text-ink mk-tabular">{preview.toFixed(2)}</span>
              </p>
            )}
          </div>

          <label className="block">
            <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Written feedback" : "লিখিত মতামত"}</span>
            <textarea rows={4} required maxLength={REVIEW_LIMITS.feedbackMax} value={feedback} onChange={(e) => setFeedback(e.target.value)} className={fieldCls}
              placeholder={en ? "What was it like to work together?" : "একসাথে কাজের অভিজ্ঞতা কেমন ছিল?"} />
            <span className="block mt-1 text-[12px] text-ink-4 mk-tabular">{feedback.trim().length}/{REVIEW_LIMITS.feedbackMax} · {en ? `min ${REVIEW_LIMITS.feedbackMin}` : "ন্যূনতম ২০"}</span>
          </label>

          <details className="rounded-lg border border-line">
            <summary className="px-3 py-2.5 text-[13px] font-medium text-ink-2 cursor-pointer">{en ? "Add highlights, strengths or improvements (optional)" : "ঐচ্ছিক বিস্তারিত"}</summary>
            <div className="p-3 pt-0 space-y-3">
              {[
                { v: highlights, set: setHighlights, label: en ? "Project highlights" : "হাইলাইট" },
                { v: strengths, set: setStrengths, label: en ? "Strengths" : "শক্তি" },
                { v: improvements, set: setImprovements, label: en ? "Areas for improvement" : "উন্নতির জায়গা" },
              ].map((f) => (
                <label key={f.label} className="block">
                  <span className="block text-[12.5px] text-ink-3 mb-1">{f.label}</span>
                  <textarea rows={2} maxLength={REVIEW_LIMITS.optionalMax} value={f.v} onChange={(e) => f.set(e.target.value)} className={fieldCls} />
                </label>
              ))}
            </div>
          </details>

          {err && <p role="alert" className="text-[13px] font-medium text-danger-strong">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>{en ? "Cancel" : "বাতিল"}</Button>
            <Button type="submit" loading={busy}>{en ? "Submit review" : "রিভিউ জমা দিন"}</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
