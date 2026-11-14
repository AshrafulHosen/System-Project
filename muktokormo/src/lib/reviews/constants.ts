export type ReviewType = "CLIENT_TO_FREELANCER" | "FREELANCER_TO_CLIENT";

export interface ReviewCategory {
  key: string;
  label: string;
  labelBn: string;
}

/** Must match the keys enforced by public.submit_review in the database. */
export const REVIEW_CATEGORIES: Record<ReviewType, ReviewCategory[]> = {
  CLIENT_TO_FREELANCER: [
    { key: "work_quality", label: "Work quality", labelBn: "কাজের মান" },
    { key: "communication", label: "Communication", labelBn: "যোগাযোগ" },
    { key: "technical_skills", label: "Technical skills", labelBn: "কারিগরি দক্ষতা" },
    { key: "professionalism", label: "Professionalism", labelBn: "পেশাদারিত্ব" },
    { key: "deadline_management", label: "Deadline management", labelBn: "সময় ব্যবস্থাপনা" },
  ],
  FREELANCER_TO_CLIENT: [
    { key: "communication", label: "Communication", labelBn: "যোগাযোগ" },
    { key: "requirement_clarity", label: "Requirement clarity", labelBn: "চাহিদার স্পষ্টতা" },
    { key: "professionalism", label: "Professionalism", labelBn: "পেশাদারিত্ব" },
    { key: "payment_reliability", label: "Payment reliability", labelBn: "পেমেন্টের নির্ভরযোগ্যতা" },
    { key: "cooperation", label: "Cooperation", labelBn: "সহযোগিতা" },
  ],
};

export const REVIEW_LIMITS = { feedbackMin: 20, feedbackMax: 2000, optionalMax: 500 } as const;

export const REPORT_REASONS = [
  { id: "HARASSMENT", label: "Harassment or abuse" },
  { id: "FALSE_INFORMATION", label: "False or misleading information" },
  { id: "PRIVATE_INFORMATION", label: "Shares private information" },
  { id: "SPAM", label: "Spam or advertising" },
  { id: "OFF_TOPIC", label: "Not about this contract" },
  { id: "OTHER", label: "Something else" },
] as const;

export interface ReviewRecord {
  id: string;
  contract_id: string;
  review_type: ReviewType;
  overall_rating: number;
  category_ratings: Record<string, number>;
  feedback: string | null;
  highlights: string | null;
  strengths: string | null;
  improvements: string | null;
  moderation_status: "VISIBLE" | "HIDDEN" | "REMOVED";
  contract_completed_at: string | null;
  created_at: string;
  reviewer_name: string | null;
  reviewee_name: string | null;
  project_title: string | null;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  categoryAverages: Record<string, number>;
}

export function summarizeReviews(reviews: Pick<ReviewRecord, "overall_rating" | "category_ratings">[]): ReviewSummary {
  const distribution: ReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const catTotals: Record<string, { sum: number; n: number }> = {};
  let sum = 0;
  for (const r of reviews) {
    const overall = Number(r.overall_rating) || 0;
    sum += overall;
    const bucket = Math.min(5, Math.max(1, Math.round(overall))) as 1 | 2 | 3 | 4 | 5;
    distribution[bucket] += 1;
    for (const [k, v] of Object.entries(r.category_ratings ?? {})) {
      catTotals[k] ??= { sum: 0, n: 0 };
      catTotals[k].sum += Number(v) || 0;
      catTotals[k].n += 1;
    }
  }
  const categoryAverages: Record<string, number> = {};
  for (const [k, t] of Object.entries(catTotals)) categoryAverages[k] = Math.round((t.sum / t.n) * 100) / 100;
  return {
    average: reviews.length ? Math.round((sum / reviews.length) * 100) / 100 : 0,
    count: reviews.length,
    distribution,
    categoryAverages,
  };
}
