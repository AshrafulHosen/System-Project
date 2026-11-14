"use client";

import React, { useEffect, useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import { EmptyState, Tabs } from "@/components/ui";
import { ReviewList, ReviewSummaryCard } from "@/components/reviews/ReviewPrimitives";
import type { ReviewRecord, ReviewSummary } from "@/lib/reviews/constants";

/** Dashboard section: reviews the signed-in user received and wrote. */
export default function MyReviewsSection({ role, lang }: { role: "client" | "freelancer"; lang: "en" | "bn" }) {
  const en = lang === "en";
  const [tab, setTab] = useState<"received" | "written">("received");
  const [data, setData] = useState<{ received: ReviewRecord[]; written: ReviewRecord[]; summary: ReviewSummary } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews/me", { cache: "no-store" });
        const json = (await res.json()) as { ok?: boolean; error?: string; received?: ReviewRecord[]; written?: ReviewRecord[]; summary?: ReviewSummary };
        if (cancelled) return;
        if (!res.ok || !json.ok) {
          setError(res.status === 401 ? (en ? "Sign in to see your reviews." : "রিভিউ দেখতে লগইন করুন।") : json.error || "Failed to load reviews.");
          return;
        }
        setData({ received: json.received ?? [], written: json.written ?? [], summary: json.summary! });
      } catch {
        if (!cancelled) setError(en ? "Network error while loading reviews." : "রিভিউ লোড করা যায়নি।");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [en]);

  const receivedType = role === "freelancer" ? "CLIENT_TO_FREELANCER" : "FREELANCER_TO_CLIENT";
  const list = data ? (tab === "received" ? data.received : data.written) : [];

  return (
    <section className="space-y-4" aria-labelledby="my-reviews-heading">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 id="my-reviews-heading" className="text-[17px] sm:text-lg font-semibold tracking-[-0.025em] text-ink">
            {en ? "Reviews" : "রিভিউ"}
          </h2>
          <p className="text-[13px] text-ink-3 mt-0.5">
            {en ? "Ratings are calculated from visible reviews on completed contracts." : "সম্পন্ন চুক্তির রিভিউ থেকে রেটিং হিসাব করা হয়।"}
          </p>
        </div>
        <Tabs
          items={[
            { id: "received", label: en ? "Received" : "প্রাপ্ত", count: data?.received.length },
            { id: "written", label: en ? "Written" : "লিখিত", count: data?.written.length },
          ]}
          activeId={tab}
          onChange={setTab}
        />
      </div>

      {error && <p role="alert" className="text-[13px] text-danger-strong">{error}</p>}
      {!data && !error && <div className="h-32 rounded-xl border border-line bg-white animate-pulse" aria-busy="true" />}

      {data && tab === "received" && <ReviewSummaryCard summary={data.summary} type={receivedType} lang={lang} />}

      {data && list.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote className="w-6 h-6" />}
          title={tab === "received" ? (en ? "No reviews received yet" : "এখনো রিভিউ পাননি") : (en ? "You haven't written any reviews" : "আপনি এখনো রিভিউ লেখেননি")}
          description={en ? "You can review the other party from the contract page once a contract is completed." : "চুক্তি সম্পন্ন হলে চুক্তির পেজ থেকে রিভিউ দিতে পারবেন।"}
        />
      ) : (
        data && <ReviewList reviews={list} lang={lang} canReport={tab === "received"} showModerationStatus />
      )}
    </section>
  );
}
