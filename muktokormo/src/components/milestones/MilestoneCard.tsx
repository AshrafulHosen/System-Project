"use client";

import React, { useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Lock,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  Wallet,
  X,
} from "lucide-react";
import { Button, StatusPill, type StatusTone } from "@/components/ui";
import type {
  MilestoneDisputeRecord,
  MilestoneRecord,
  MilestoneStatus,
  MilestoneSubmissionRecord,
} from "@/types/milestone";

export type MilestoneActionKind =
  | "fund"
  | "start"
  | "submit"
  | "approve"
  | "request_revision"
  | "release"
  | "raise_dispute"
  | "request_cancel"
  | "confirm_cancel"
  | "withdraw_cancel"
  | "accept_amendment"
  | "reject_amendment";

const STATUS_META: Record<MilestoneStatus, { en: string; bn: string; tone: StatusTone }> = {
  PENDING: { en: "Awaiting funding", bn: "ফান্ডের অপেক্ষায়", tone: "slate" },
  FUNDED: { en: "Funded", bn: "ফান্ডেড", tone: "sky" },
  IN_PROGRESS: { en: "In progress", bn: "চলমান", tone: "sky" },
  SUBMITTED: { en: "Submitted", bn: "জমা দেওয়া হয়েছে", tone: "amber" },
  REVISION_REQUESTED: { en: "Revision requested", bn: "রিভিশন অনুরোধ", tone: "rose" },
  APPROVED: { en: "Approved · ready to release", bn: "অনুমোদিত · রিলিজের জন্য প্রস্তুত", tone: "emerald" },
  RELEASED: { en: "Paid", bn: "পরিশোধিত", tone: "emerald" },
  CANCELLED: { en: "Cancelled", bn: "বাতিল", tone: "slate" },
  DISPUTED: { en: "In dispute", bn: "বিরোধে", tone: "rose" },
};

export function MilestoneStatusBadge({ status, lang }: { status: MilestoneStatus; lang: "en" | "bn" }) {
  const meta = STATUS_META[status] ?? STATUS_META.PENDING;
  return <StatusPill label={lang === "en" ? meta.en : meta.bn} tone={meta.tone} />;
}

const HELD = new Set<MilestoneStatus>(["FUNDED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "APPROVED"]);

function fmtDate(iso: string | null, lang: "en" | "bn") {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "bn-BD", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

interface Props {
  milestone: MilestoneRecord;
  index: number;
  viewerRole: "client" | "freelancer" | "admin";
  viewerUserId: string;
  submissions: MilestoneSubmissionRecord[];
  openDispute?: MilestoneDisputeRecord;
  hasPendingPayment: boolean;
  lang: "en" | "bn";
  busyAction: string | null;
  onAction: (kind: MilestoneActionKind, milestone: MilestoneRecord) => void;
}

export default function MilestoneCard({
  milestone: m,
  index,
  viewerRole,
  viewerUserId,
  submissions,
  openDispute,
  hasPendingPayment,
  lang,
  busyAction,
  onAction,
}: Props) {
  const en = lang === "en";
  const [showHistory, setShowHistory] = useState(false);
  const isClient = viewerRole === "client";
  const isFreelancer = viewerRole === "freelancer";
  const isAmendment = m.agreement_status === "PROPOSED";
  const isDone = m.status === "RELEASED";
  const isCancelled = m.status === "CANCELLED";
  const busy = (k: string) => busyAction === `${k}:${m.id}`;
  const latest = submissions[0];

  const btn = (kind: MilestoneActionKind, label: string, icon: React.ReactNode, variant: "primary" | "outline" | "ghost" | "danger" | "secondary" = "outline") => (
    <Button key={kind} size="sm" variant={variant} leftIcon={icon} loading={busy(kind)}
      disabled={busyAction !== null} onClick={() => onAction(kind, m)}>
      {label}
    </Button>
  );

  const actions: React.ReactNode[] = [];
  if (isAmendment && isFreelancer) {
    actions.push(btn("accept_amendment", en ? "Accept milestone" : "গ্রহণ", <Check className="w-3.5 h-3.5" />, "primary"));
    actions.push(btn("reject_amendment", en ? "Decline" : "প্রত্যাখ্যান", <X className="w-3.5 h-3.5" />));
  }
  if (m.agreement_status === "ACCEPTED") {
    if (m.status === "PENDING") {
      if (isClient && !m.cancel_requested_by) {
        actions.push(btn("fund", hasPendingPayment ? (en ? "Retry funding" : "আবার ফান্ড") : (en ? `Fund ৳${m.amount.toLocaleString("en-US")}` : "ফান্ড করুন"), <Lock className="w-3.5 h-3.5" />, "primary"));
      }
      if (m.cancel_requested_by && m.cancel_requested_by !== viewerUserId && viewerRole !== "admin") {
        actions.push(btn("confirm_cancel", en ? "Confirm cancellation" : "বাতিল নিশ্চিত", <X className="w-3.5 h-3.5" />, "danger"));
      } else if (m.cancel_requested_by === viewerUserId) {
        actions.push(btn("withdraw_cancel", en ? "Withdraw cancellation" : "অনুরোধ প্রত্যাহার", <RotateCcw className="w-3.5 h-3.5" />, "ghost"));
      } else if (!m.cancel_requested_by && viewerRole !== "admin" && !hasPendingPayment) {
        actions.push(btn("request_cancel", en ? "Request cancellation" : "বাতিলের অনুরোধ", <X className="w-3.5 h-3.5" />, "ghost"));
      }
    }
    if (isFreelancer && m.status === "FUNDED") actions.push(btn("start", en ? "Start work" : "কাজ শুরু", <Play className="w-3.5 h-3.5" />, "primary"));
    if (isFreelancer && ["FUNDED", "IN_PROGRESS", "REVISION_REQUESTED"].includes(m.status))
      actions.push(btn("submit", m.status === "REVISION_REQUESTED" ? (en ? "Resubmit work" : "আবার জমা") : (en ? "Submit work" : "কাজ জমা"), <Send className="w-3.5 h-3.5" />, m.status === "FUNDED" ? "outline" : "primary"));
    if (isClient && m.status === "SUBMITTED") {
      actions.push(btn("approve", en ? "Approve work" : "অনুমোদন", <Check className="w-3.5 h-3.5" />, "primary"));
      actions.push(btn("request_revision", en ? "Request revision" : "রিভিশন চান", <RotateCcw className="w-3.5 h-3.5" />));
    }
    if (isClient && m.status === "APPROVED") actions.push(btn("release", en ? "Release payment" : "পেমেন্ট রিলিজ", <Wallet className="w-3.5 h-3.5" />, "primary"));
    if (viewerRole !== "admin" && HELD.has(m.status))
      actions.push(btn("raise_dispute", en ? "Open dispute" : "বিরোধ খুলুন", <ShieldAlert className="w-3.5 h-3.5" />, "ghost"));
  }

  const deadline = fmtDate(m.deadline, lang);
  const overdue = !!m.deadline && !isDone && !isCancelled && new Date(`${m.deadline}T23:59:59`) < new Date();

  return (
    <article
      className={`relative bg-white border rounded-xl overflow-hidden ${
        m.status === "DISPUTED" ? "border-danger-border" : isAmendment ? "border-accent-border" : "border-line"
      } ${isCancelled ? "opacity-60" : ""}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden="true"
            className={`w-9 h-9 shrink-0 rounded-md flex items-center justify-center text-[13px] font-semibold mk-tabular ${
              isDone ? "bg-success text-white" : HELD.has(m.status) ? "bg-brand text-white" : "bg-subtle text-ink-3"
            }`}
          >
            {isDone ? <Check className="w-4 h-4" /> : index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">{m.title}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {isAmendment ? (
                    <StatusPill label={en ? "Proposed amendment" : "প্রস্তাবিত সংশোধন"} tone="amber" />
                  ) : (
                    <MilestoneStatusBadge status={m.status} lang={lang} />
                  )}
                  {m.cancel_requested_by && m.status === "PENDING" && (
                    <StatusPill label={en ? "Cancellation requested" : "বাতিলের অনুরোধ"} tone="rose" showDot={false} />
                  )}
                  {m.revision_count > 0 && (
                    <span className="text-[12px] text-ink-4">{m.revision_count} {en ? (m.revision_count === 1 ? "revision" : "revisions") : "রিভিশন"}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold tracking-[-0.03em] text-ink mk-tabular leading-tight">৳{m.amount.toLocaleString("en-US")}</p>
                {deadline && (
                  <p className={`mt-0.5 inline-flex items-center gap-1 text-[12px] ${overdue ? "text-danger-strong font-medium" : "text-ink-3"}`}>
                    <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                    {overdue ? (en ? "Overdue · " : "সময় পার · ") : en ? "Due " : "ডেডলাইন "}
                    {deadline}
                  </p>
                )}
              </div>
            </div>

            {m.description && <p className="mt-3 text-[13.5px] text-ink-2 leading-relaxed whitespace-pre-line">{m.description}</p>}

            {m.deliverables.length > 0 && (
              <ul className="mt-3 space-y-1" aria-label={en ? "Deliverables" : "ডেলিভারেবল"}>
                {m.deliverables.map((d, i) => (
                  <li key={`${d}-${i}`} className="flex items-start gap-2 text-[13px] text-ink-2">
                    <FileText className="w-3.5 h-3.5 mt-0.5 text-ink-4 shrink-0" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
            )}

            {openDispute && (
              <div className="mt-4 p-3 rounded-lg bg-danger-soft border border-danger-border text-[13px] text-danger-ink">
                <p className="font-medium">
                  {en ? `Dispute opened by the ${openDispute.raised_by_role}` : "বিরোধ খোলা হয়েছে"}
                </p>
                <p className="mt-1 leading-relaxed">{openDispute.reason}</p>
                <p className="mt-1 text-[12px]">{en ? "Funds stay in escrow until an administrator resolves this." : "অ্যাডমিন নিষ্পত্তি না করা পর্যন্ত টাকা এসক্রোতে থাকবে।"}</p>
              </div>
            )}

            {latest && (
              <div className="mt-4 rounded-lg border border-line bg-canvas">
                <div className="p-3">
                  <p className="text-[12px] text-ink-4">
                    {en ? `Latest submission · revision ${latest.revision_number}` : `সর্বশেষ জমা · ${latest.revision_number}`}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-2 whitespace-pre-line">{latest.message}</p>
                  {(latest.demo_url || latest.attachments?.length > 0) && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {latest.demo_url && (
                        <li>
                          <a href={latest.demo_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:text-brand-hover">
                            {en ? "Demo / repository" : "ডেমো"} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        </li>
                      )}
                      {latest.attachments?.map((a, i) => (
                        <li key={`${a.url}-${i}`}>
                          <a href={a.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:text-brand-hover">
                            {a.label || `${en ? "Link" : "লিংক"} ${i + 1}`} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {latest.review_feedback && (
                    <p className="mt-2 text-[12.5px] text-ink-3">
                      <span className="font-medium text-ink-2">{en ? "Client feedback: " : "ক্লায়েন্টের মতামত: "}</span>
                      {latest.review_feedback}
                    </p>
                  )}
                </div>
                {submissions.length > 1 && (
                  <>
                    <button type="button" onClick={() => setShowHistory((v) => !v)} aria-expanded={showHistory}
                      className="w-full flex items-center justify-between px-3 py-2 border-t border-line text-[12px] font-medium text-ink-3 hover:text-ink cursor-pointer">
                      {en ? `Submission history (${submissions.length})` : `জমার ইতিহাস (${submissions.length})`}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHistory ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    {showHistory && (
                      <ol className="border-t border-line divide-y divide-line">
                        {submissions.slice(1).map((s) => (
                          <li key={s.id} className="p-3 text-[12.5px]">
                            <p className="text-ink-4">
                              {en ? "Revision" : "রিভিশন"} {s.revision_number} · {fmtDate(s.created_at, lang)} · {s.status.replace(/_/g, " ").toLowerCase()}
                            </p>
                            <p className="mt-1 text-ink-2 whitespace-pre-line">{s.message}</p>
                            {s.review_feedback && <p className="mt-1 text-ink-3">↳ {s.review_feedback}</p>}
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </div>
            )}

            {actions.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
          </div>
        </div>
      </div>
    </article>
  );
}
