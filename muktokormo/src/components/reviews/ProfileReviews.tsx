"use client";

import React, { useEffect, useState } from "react";
import { ReviewList, ReviewSummaryCard } from "@/components/reviews/ReviewPrimitives";
import { summarizeReviews, type ReviewRecord, type ReviewSummary } from "@/lib/reviews/constants";

/** Public reviews a freelancer or client profile has received (visible reviews only). */
export default function ProfileReviews({
  profileKind,
  profileId,
  lang,
}: {
  profileKind: "freelancer" | "client";
  profileId: string;
  lang: "en" | "bn";
}) {
  const [state, setState] = useState<{ reviews: ReviewRecord[]; summary: ReviewSummary } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const param = profileKind === "freelancer" ? "freelancerId" : "clientId";
        const res = await fetch(`/api/reviews?${param}=${encodeURIComponent(profileId)}`, { cache: "no-store" });
        const json = (await res.json()) as { ok?: boolean; error?: string; reviews?: ReviewRecord[]; summary?: ReviewSummary };
        if (cancelled) return;
        if (!res.ok || !json.ok) return setError(json.error || "Could not load reviews.");
        setState({ reviews: json.reviews ?? [], summary: json.summary ?? summarizeReviews([]) });
      } catch {
        if (!cancelled) setError("Network error while loading reviews.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileKind, profileId]);

  if (error) return <p role="alert" className="text-[13px] text-danger-strong">{error}</p>;
  if (!state) return <div className="h-28 rounded-xl border border-line bg-white animate-pulse" aria-busy="true" />;

  return (
    <div className="space-y-3">
      <ReviewSummaryCard
        summary={state.summary}
        type={profileKind === "freelancer" ? "CLIENT_TO_FREELANCER" : "FREELANCER_TO_CLIENT"}
        lang={lang}
      />
      <ReviewList reviews={state.reviews} lang={lang} canReport />
    </div>
  );
}
