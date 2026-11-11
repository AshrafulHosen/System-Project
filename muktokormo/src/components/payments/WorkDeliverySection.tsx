"use client";

import React, { useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Upload,
  AlertCircle,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { formatBdt } from "@/lib/format";
import { getWorkStatusMeta } from "@/lib/payments/escrow";
import { calculateContractFeeBreakdown } from "@/lib/payments/constants";
import type { WorkspaceContract } from "@/types";

interface ReleaseActionResult {
  ok: boolean;
  error?: string;
  grossAmount?: number;
  platformFee?: number;
  freelancerNet?: number;
}

interface WorkDeliverySectionProps {
  contract: WorkspaceContract;
  viewerRole: "client" | "freelancer" | "admin";
  lang?: "en" | "bn";
  hasOpenRefund?: boolean;
  onWorkUpdated: () => Promise<void> | void;
  onApproveRelease?: () => Promise<ReleaseActionResult>;
}

const BADGE_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function WorkDeliverySection({
  contract,
  viewerRole,
  lang = "en",
  hasOpenRefund = false,
  onWorkUpdated,
  onApproveRelease,
}: WorkDeliverySectionProps) {
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  const [notes, setNotes] = useState(contract.submissionNotes ?? "");
  const [demoUrl, setDemoUrl] = useState(contract.submissionDemoUrl ?? "");
  const [files, setFiles] = useState<string[]>(contract.submissionFiles ?? []);
  const [newFileTag, setNewFileTag] = useState("");
  const [revisionText, setRevisionText] = useState("");

  const [submittingAction, setSubmittingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const paymentStatus = String(contract.paymentStatus ?? "UNPAID").toUpperCase();
  const workStatus = String(contract.workStatus ?? "NOT_STARTED").toUpperCase();
  const workMeta = getWorkStatusMeta(workStatus);
  const breakdown = calculateContractFeeBreakdown(
    contract.totalBdt,
    contract.platformFeePct || 10
  );

  const isFunded = paymentStatus === "FUNDED";
  const isReleased = paymentStatus === "RELEASED" || workStatus === "RELEASED";
  const isRefunded = paymentStatus === "REFUNDED" || workStatus === "REFUNDED";
  const isSubmitted = workStatus === "SUBMITTED";
  const isRevision = workStatus === "REVISION_REQUESTED";

  const canFreelancerStart =
    viewerRole === "freelancer" &&
    isFunded &&
    !hasOpenRefund &&
    ["FUNDED", "NOT_STARTED"].includes(workStatus);

  const canFreelancerSubmit =
    viewerRole === "freelancer" &&
    isFunded &&
    !hasOpenRefund &&
    ["FUNDED", "IN_PROGRESS", "REVISION_REQUESTED", "NOT_STARTED"].includes(
      workStatus
    );

  const canClientReview =
    viewerRole === "client" && isFunded && isSubmitted && !hasOpenRefund;

  const handleStartWork = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/start-work`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Unable to mark work in progress.");
        return;
      }
      setSuccessMsg(
        lang === "en"
          ? "Work marked In Progress. You can submit deliverables once finished."
          : "কাজ চলমান হিসেবে চিহ্নিত হয়েছে।"
      );
      await onWorkUpdated();
    } catch {
      setErrorMsg("Network error starting work.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/submit-work`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes.trim(),
          demoUrl: demoUrl.trim() || undefined,
          files,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Failed to submit completed work.");
        return;
      }
      setSubmitModalOpen(false);
      setSuccessMsg(
        lang === "en"
          ? "Completed work submitted! Client has been notified for review."
          : "সম্পন্ন কাজ জমা হয়েছে! ক্লায়েন্টকে নোটিফিকেশন পাঠানো হয়েছে।"
      );
      await onWorkUpdated();
    } catch {
      setErrorMsg("Network error submitting completed work.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/request-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: revisionText.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Failed to send revision request.");
        return;
      }
      setRevisionModalOpen(false);
      setRevisionText("");
      setSuccessMsg(
        lang === "en"
          ? "Revision request sent to the freelancer."
          : "রিভিশনের অনুরোধ ফ্রিল্যান্সারকে পাঠানো হয়েছে।"
      );
      await onWorkUpdated();
    } catch {
      setErrorMsg("Network error sending revision request.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApproveConfirm = async () => {
    if (!onApproveRelease) {
      setApproveModalOpen(false);
      setInfoBanner(
        "Internal payment release (/api/contracts/[id]/approve-release) activates in Phase 7."
      );
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setInfoBanner(null);
    setSubmittingAction(true);
    try {
      const res = await onApproveRelease();
      if (!res.ok) {
        setErrorMsg(res.error || "Failed to approve work and release ledger payment.");
      } else {
        setApproveModalOpen(false);
        const gross = res.grossAmount ?? breakdown.grossAmount;
        const fee = res.platformFee ?? breakdown.platformFeeAmount;
        const net = res.freelancerNet ?? breakdown.freelancerPayableAmount;
        setSuccessMsg(
          lang === "en"
            ? `Work approved! Internal release recorded — Gross: ${formatBdt(gross)}, Platform Fee (${breakdown.platformFeePct}%): ${formatBdt(fee)}, Freelancer Simulated Earnings: +${formatBdt(net)}.`
            : `কাজ অনুমোদিত! অভ্যন্তরীণ লেজার রিলিজ: মোট ${formatBdt(gross)}, ফি ${formatBdt(fee)}, ফ্রিল্যান্সার আয় ${formatBdt(net)}।`
        );
        await onWorkUpdated();
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const [infoBanner, setInfoBanner] = useState<string | null>(null);

  const stageSteps = [
    {
      label: lang === "en" ? "1. Funded" : "১. ফান্ডেড",
      active: isFunded || isReleased,
    },
    {
      label: lang === "en" ? "2. In Progress" : "২. কাজ চলমান",
      active:
        ["IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "APPROVED", "RELEASED"].includes(
          workStatus
        ),
    },
    {
      label: lang === "en" ? "3. Submitted" : "৩. জমা হয়েছে",
      active: ["SUBMITTED", "APPROVED", "RELEASED"].includes(workStatus),
    },
    {
      label: lang === "en" ? "4. Released" : "৪. রিলিজড",
      active: isReleased,
    },
  ];

  return (
    <section className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {lang === "en"
                ? "Work Delivery & Client Approval"
                : "কাজ ডেলিভারি ও ক্লায়েন্ট অনুমোদন"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "en"
                ? "Verified submission and review pipeline backed by Supabase contracts"
                : "সুপাবেস কন্ট্রাক্টের সাথে সংযুক্ত কাজ জমা ও পর্যালোচনা ধাপ"}
            </p>
          </div>
        </div>

        <span
          className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${
            BADGE_CLASSES[workMeta.tone] ?? BADGE_CLASSES.slate
          }`}
        >
          {lang === "en" ? workMeta.label : workMeta.labelBn}
        </span>
      </div>

      {/* 4-Step Delivery Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {stageSteps.map((step) => (
          <div
            key={step.label}
            className={`px-3 py-2.5 rounded-2xl border text-center text-xs font-bold transition-colors ${
              step.active
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            {step.label}
          </div>
        ))}
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}
      {infoBanner && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold flex items-start gap-2">
          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{infoBanner}</span>
        </div>
      )}

      {/* Client Revision Feedback Callout */}
      {isRevision && contract.revisionFeedback && (
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <RotateCcw className="w-4 h-4" />
            <span>
              {lang === "en"
                ? "Client Requested Revisions"
                : "ক্লায়েন্ট রিভিশন চেয়েছেন"}
            </span>
          </div>
          <p className="text-rose-900 leading-relaxed">
            {contract.revisionFeedback}
          </p>
        </div>
      )}

      {/* Refund Requested Pause Notice */}
      {hasOpenRefund && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <p className="font-black">
            {lang === "en"
              ? "Refund Request Under Admin Review"
              : "রিফান্ড অনুরোধ অ্যাডমিন পর্যালোচনায় আছে"}
          </p>
          <p className="leading-relaxed text-amber-800">
            {lang === "en"
              ? "Work submissions and escrow release actions are paused while the platform admin reviews the pending refund request."
              : "রিফান্ড অনুরোধ নিষ্পত্তি না হওয়া পর্যন্ত কাজ জমা ও রিলিজ কার্যক্রম স্থগিত থাকবে।"}
          </p>
        </div>
      )}

      {/* Waiting for Funding / Refunded State */}
      {!isFunded && !isReleased && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center space-y-2">
          <Clock className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">
            {isRefunded
              ? lang === "en"
                ? "Contract closed — Escrow refund has been recorded"
                : "চুক্তি বন্ধ — এসক্রো রিফান্ড সম্পন্ন হয়েছে"
              : viewerRole === "freelancer"
                ? lang === "en"
                  ? "Waiting for client to fund the contract via SSLCOMMERZ Sandbox"
                  : "ক্লায়েন্ট SSLCOMMERZ স্যান্ডবক্সে ফান্ড জমা দেওয়ার অপেক্ষায়"
                : lang === "en"
                  ? "Fund this contract first so the freelancer can begin and submit deliverables"
                  : "ফ্রিল্যান্সার কাজ শুরু করার আগে কন্ট্রাক্টটি ফান্ড করুন"}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isRefunded
              ? lang === "en"
                ? "A REFUND entry exists in the internal escrow ledger. No further submissions or releases are permitted on this contract."
                : "অভ্যন্তরীণ লেজারে রিফান্ড এন্ট্রি সম্পন্ন হয়েছে। এই চুক্তিতে আর ডেলিভারি বা রিলিজ সম্ভব নয়।"
              : lang === "en"
                ? "Work submission and client release controls automatically unlock after gateway verification marks the contract FUNDED."
                : "গেটওয়ে যাচাইয়ের মাধ্যমে কন্ট্রাক্ট ফান্ডেড হলে ডেলিভারি ও অনুমোদন অপশন সক্রিয় হবে।"}
          </p>
        </div>
      )}

      {/* Submitted Deliverables Inspection View */}
      {(contract.submissionNotes || isSubmitted || isReleased) && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {lang === "en" ? "Deliverable Submission" : "জমা দেওয়া ডেলিভারি"}
              </span>
              <h3 className="text-sm font-black text-slate-900">
                {contract.freelancer.name} · {contract.freelancer.title}
              </h3>
            </div>
            {contract.submissionDemoUrl && (
              <a
                href={contract.submissionDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-sky-700 hover:bg-sky-50 transition-colors self-start sm:self-auto"
              >
                <span>{lang === "en" ? "Open Live Demo" : "লাইভ ডেমো দেখুন"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {contract.submissionNotes && (
            <p className="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/70 leading-relaxed whitespace-pre-wrap">
              {contract.submissionNotes}
            </p>
          )}

          {contract.submissionFiles && contract.submissionFiles.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {lang === "en" ? "Attached Deliverables" : "সংযুক্ত ডেলিভারি"}
              </span>
              <div className="flex flex-wrap gap-2">
                {contract.submissionFiles.map((file, idx) => (
                  <span
                    key={`${file}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{file}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block">Contract Amount</span>
              <span className="font-bold text-slate-900">
                {formatBdt(breakdown.grossAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">
                Platform Fee ({breakdown.platformFeePct}%)
              </span>
              <span className="font-bold text-slate-700">
                {formatBdt(breakdown.platformFeeAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Freelancer Payable</span>
              <span className="font-black text-emerald-700">
                {formatBdt(breakdown.freelancerPayableAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Phase 7: Internal Release Completed Banner */}
      {isReleased && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-black text-emerald-900">
                {lang === "en"
                  ? "Work Approved & Internal Escrow Release Completed"
                  : "কাজ অনুমোদিত ও অভ্যন্তরীণ এসক্রো রিলিজ সম্পন্ন হয়েছে"}
              </p>
              <p className="text-emerald-800">
                {lang === "en"
                  ? `Internal ledger operation only: Gross ${formatBdt(breakdown.grossAmount)}, Platform Commission (${breakdown.platformFeePct}%) ${formatBdt(contract.platformFeeAmount ?? breakdown.platformFeeAmount)}, Freelancer Simulated Earnings +${formatBdt(contract.netEarningsBdt || breakdown.freelancerPayableAmount)}. No external bank payout occurs.`
                  : `অভ্যন্তরীণ লেজার এন্ট্রি সম্পন্ন — ফ্রিল্যান্সারের সিমুলেটেড আয় +${formatBdt(contract.netEarningsBdt || breakdown.freelancerPayableAmount)}।`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      {(canFreelancerStart || canFreelancerSubmit || canClientReview) && (
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {canFreelancerStart && (
            <button
              type="button"
              disabled={submittingAction}
              onClick={handleStartWork}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
            >
              {submittingAction ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{lang === "en" ? "Start Working" : "কাজ শুরু করুন"}</span>
            </button>
          )}

          {canFreelancerSubmit && (
            <button
              type="button"
              disabled={submittingAction}
              onClick={() => {
                setNotes(contract.submissionNotes ?? "");
                setDemoUrl(contract.submissionDemoUrl ?? "");
                setFiles(contract.submissionFiles ?? []);
                setSubmitModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {isRevision
                  ? lang === "en"
                    ? "Resubmit Revised Work"
                    : "সংশোধিত কাজ জমা দিন"
                  : lang === "en"
                    ? "Submit Completed Work"
                    : "সম্পন্ন কাজ জমা দিন"}
              </span>
            </button>
          )}

          {canClientReview && (
            <>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => setRevisionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {lang === "en" ? "Request Revision" : "রিভিশন চান"}
                </span>
              </button>

              <button
                type="button"
                disabled={submittingAction}
                onClick={() => setApproveModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {lang === "en"
                    ? `Approve Work & Release (${formatBdt(breakdown.freelancerPayableAmount)} Net)`
                    : "কাজ অনুমোদন ও রিলিজ করুন"}
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Modal 1: Freelancer Work Submission */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {lang === "en"
                    ? "Submit Completed Work for Client Review"
                    : "ক্লায়েন্ট রিভিউয়ের জন্য কাজ জমা দিন"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Contract: {contract.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitWork} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "en"
                    ? "Completion Description *"
                    : "সম্পন্ন কাজের বিবরণ *"}
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Summarize completed deliverables, instructions, and test notes..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "en"
                    ? "Demo / Repository URL (Optional)"
                    : "ডেমো / রিপোজিটরি লিংক (ঐচ্ছিক)"}
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "en"
                    ? "Deliverable Files / Artifact References"
                    : "ডেলিভারি ফাইলের তালিকা"}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFileTag}
                    onChange={(e) => setNewFileTag(e.target.value)}
                    placeholder="e.g. final-build-v1.zip or Figma link"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newFileTag.trim();
                      if (trimmed && files.length < 15) {
                        setFiles([...files, trimmed]);
                        setNewFileTag("");
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {files.map((item, idx) => (
                      <span
                        key={`${item}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles(files.filter((_, i) => i !== idx))
                          }
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-60"
                >
                  {submittingAction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {submittingAction ? "Submitting..." : "Submit for Approval"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Client Revision Request */}
      {revisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
              <h3 className="text-sm font-black text-slate-900">
                {lang === "en" ? "Request Revision" : "রিভিশনের অনুরোধ"}
              </h3>
              <button
                type="button"
                onClick={() => setRevisionModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRequestRevision} className="p-5 space-y-4">
              <textarea
                required
                minLength={5}
                rows={4}
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                placeholder="Describe clearly what changes the freelancer should make before approval..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-black cursor-pointer disabled:opacity-60"
                >
                  <span>
                    {submittingAction ? "Sending..." : "Send Revision Request"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Client Approve Work Confirmation */}
      {approveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {lang === "en"
                    ? "Confirm Work Approval & Release"
                    : "কাজ অনুমোদন ও রিলিজ নিশ্চিত করুন"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Contract Amount:</span>
                <span className="font-bold text-slate-900">
                  {formatBdt(breakdown.grossAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Platform Fee ({breakdown.platformFeePct}%):
                </span>
                <span className="font-bold text-rose-600">
                  -{formatBdt(breakdown.platformFeeAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-900">
                <span>Freelancer Simulated Credit:</span>
                <span className="text-emerald-700">
                  {formatBdt(breakdown.freelancerPayableAmount)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              This action records an internal ledger RELEASE entry and updates the
              freelancer&apos;s simulated platform earnings. No external bank payout
              transfer occurs in sandbox mode.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleApproveConfirm}
                className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-60"
              >
                {submittingAction
                  ? "Processing..."
                  : onApproveRelease
                    ? "Approve & Record Release"
                    : "Phase 7 Release Preview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

