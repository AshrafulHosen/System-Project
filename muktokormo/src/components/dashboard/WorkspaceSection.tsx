"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Upload,
  Sparkles,
  CheckCheck,
  X,
  RotateCcw,
  Lock,
  Search,
  CreditCard,
  Play,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserContracts,
  submitMilestoneDeliverable,
  approveMilestone,
  requestMilestoneRevision,
} from "@/lib/data/contracts";
import { calculateContractFeeBreakdown, DEFAULT_PLATFORM_FEE_PCT, isUuid } from "@/lib/payments/constants";
import { getPaymentStatusMeta, getWorkStatusMeta } from "@/lib/payments/escrow";
import { formatBdt } from "@/lib/format";
import type { WorkspaceContract, WorkspaceMilestone } from "@/types";

const BADGE_CLASSES: Record<string, string> = {
  emerald: "bg-brand-soft text-navy border-brand/25",
  sky: "bg-brand-soft text-brand-strong border-brand-strong/20",
  amber: "bg-accent-soft text-accent border-accent/25",
  rose: "bg-danger-soft text-danger border-danger/20",
  indigo: "bg-plum-soft text-plum border-plum/20",
  slate: "bg-subtle text-ink-2 border-line",
};

interface WorkspaceSectionProps {
  role: "client" | "freelancer";
  lang?: "en" | "bn";
  currentUserId?: string | null;
  currentEntityId?: string | null;
  currentUserName?: string;
  onOpenChat?: (contractId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function WorkspaceSection({
  role,
  lang = "en",
  currentUserId,
  currentEntityId,
  currentUserName: _currentUserName,
  onOpenChat,
  onNavigateTab,
}: WorkspaceSectionProps) {
  void _currentUserName;
  const supabase = useMemo(() => createClient(), []);
  const [contracts, setContracts] = useState<WorkspaceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [stageFilter, setStageFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  // Modals for Milestone / Contract Actions
  const [submitModal, setSubmitModal] = useState<{
    contractId: string;
    milestone: WorkspaceMilestone;
  } | null>(null);

  const [approveModal, setApproveModal] = useState<{
    contractId: string;
    milestone: WorkspaceMilestone;
  } | null>(null);

  const [reviseModal, setReviseModal] = useState<{
    contractId: string;
    milestone: WorkspaceMilestone;
  } | null>(null);

  // Form states
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitDemoUrl, setSubmitDemoUrl] = useState("");
  const [submitFiles, setSubmitFiles] = useState<string[]>([]);
  const [newFileTag, setNewFileTag] = useState("");
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [initiatingContractId, setInitiatingContractId] = useState<string | null>(null);
  const [startingContractId, setStartingContractId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch real contracts from database strictly for the logged-in user
  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const live = await fetchUserContracts(supabase, {
        role,
        userId: currentUserId,
        entityId: currentEntityId,
      });
      setContracts(live || []);
    } catch (err) {
      console.error("Failed to load user workspace contracts:", err);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, role, currentUserId, currentEntityId]);

  useEffect(() => {
    let active = true;
    fetchUserContracts(supabase, {
      role,
      userId: currentUserId,
      entityId: currentEntityId,
    })
      .then((live) => {
        if (active) setContracts(live || []);
      })
      .catch((err) => {
        console.error("Failed to load user workspace contracts:", err);
        if (active) setContracts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [supabase, role, currentUserId, currentEntityId]);

  // Client initiates SSLCOMMERZ Sandbox payment session
  const handleFundContract = async (contract: WorkspaceContract) => {
    setActionError(null);
    setInitiatingContractId(contract.id);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: contract.id }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        gatewayPageUrl?: string;
      };
      if (!res.ok || !data.ok || !data.gatewayPageUrl) {
        setActionError(
          data.error || "Unable to launch SSLCOMMERZ Sandbox payment session."
        );
        return;
      }
      window.location.assign(data.gatewayPageUrl);
    } catch {
      setActionError("Network error while starting SSLCOMMERZ Sandbox checkout.");
    } finally {
      setInitiatingContractId(null);
    }
  };

  // Freelancer marks funded contract as IN_PROGRESS
  const handleStartWork = async (contract: WorkspaceContract) => {
    setActionError(null);
    setStartingContractId(contract.id);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/start-work`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setActionError(data.error || "Unable to mark contract work in progress.");
        return;
      }
      await loadContracts();
      setSuccessToast(
        lang === "en"
          ? "Work started! Status updated to In Progress."
          : "কাজ শুরু হয়েছে! স্ট্যাটাস চলমান হিসেবে আপডেট করা হয়েছে।"
      );
      setTimeout(() => setSuccessToast(null), 4000);
    } catch {
      setActionError("Network error starting work on contract.");
    } finally {
      setStartingContractId(null);
    }
  };

  // Handle Freelancer Work Submission
  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModal) return;
    const notesTrimmed = submitNotes.trim();
    if (notesTrimmed.length < 5) {
      setActionError(
        "Please provide deliverable notes or completion summary (at least 5 characters)."
      );
      return;
    }

    setActionError(null);
    setActionLoading(true);
    try {
      if (isUuid(submitModal.contractId)) {
        const res = await fetch(`/api/contracts/${submitModal.contractId}/submit-work`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: notesTrimmed,
            demoUrl: submitDemoUrl.trim() || undefined,
            files: submitFiles,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setActionError(data.error || "Failed to submit completed work.");
          return;
        }
        await loadContracts();
      } else {
        const updated = await submitMilestoneDeliverable(
          supabase,
          submitModal.contractId,
          submitModal.milestone.id,
          {
            notes: notesTrimmed,
            demoUrl: submitDemoUrl.trim() || undefined,
            attachments: submitFiles,
          }
        );

        if (updated) {
          setContracts((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        } else {
          await loadContracts();
        }
      }

      setSuccessToast(
        lang === "en"
          ? "Completed work submitted! Client has been notified for review."
          : "কাজ সফলভাবে জমা দেওয়া হয়েছে! ক্লায়েন্টকে জানানো হয়েছে।"
      );
      setSubmitModal(null);
      setSubmitNotes("");
      setSubmitDemoUrl("");
      setSubmitFiles([]);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error("Failed to submit deliverable:", err);
      setActionError("Unexpected network error submitting deliverable.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Client Approving Work & Recording Internal Ledger Release
  const handleConfirmApprove = async () => {
    if (!approveModal) return;

    setActionError(null);
    setActionLoading(true);
    try {
      if (isUuid(approveModal.contractId)) {
        const res = await fetch(
          `/api/contracts/${approveModal.contractId}/approve-release`,
          { method: "POST" }
        );
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          grossAmount?: number;
          platformFeePct?: number;
          platformFee?: number;
          freelancerNet?: number;
        };

        if (!res.ok || !data.ok) {
          setActionError(
            data.error || "Unable to approve work and record internal escrow release."
          );
          setApproveModal(null);
          return;
        }

        await loadContracts();
        setApproveModal(null);
        const grossText = formatBdt(data.grossAmount ?? approveModal.milestone.amountBdt);
        const feeText = formatBdt(data.platformFee ?? 0);
        const netText = formatBdt(data.freelancerNet ?? 0);
        setSuccessToast(
          lang === "en"
            ? `Work approved! Internal release recorded — Gross: ${grossText}, Platform Fee (${data.platformFeePct ?? DEFAULT_PLATFORM_FEE_PCT}%): ${feeText}, Freelancer Simulated Earnings: +${netText}.`
            : `কাজ অনুমোদিত ও অভ্যন্তরীণ লেজার রিলিজ সম্পন্ন! মোট ${grossText}, ফি ${feeText}, ফ্রিল্যান্সার আয় ${netText}।`
        );
        setTimeout(() => setSuccessToast(null), 6000);
        return;
      }

      const updated = await approveMilestone(
        supabase,
        approveModal.contractId,
        approveModal.milestone.id
      );

      if (updated) {
        setContracts((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      } else {
        await loadContracts();
      }

      setSuccessToast(
        lang === "en"
          ? `Milestone approved! ৳${approveModal.milestone.amountBdt.toLocaleString()} BDT released from escrow.`
          : "মাইলস্টোন অনুমোদিত ও এসক্রো তহবিল ছাড় করা হয়েছে!"
      );
      setApproveModal(null);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error("Failed to approve milestone:", err);
      setActionError("Network error recording approval release.");
      setApproveModal(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Client Requesting Revision
  const handleConfirmRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviseModal) return;
    const feedbackTrimmed = revisionFeedback.trim();
    if (feedbackTrimmed.length < 5) {
      setActionError(
        "Please provide specific revision feedback (at least 5 characters)."
      );
      return;
    }

    setActionError(null);
    setActionLoading(true);
    try {
      if (isUuid(reviseModal.contractId)) {
        const res = await fetch(
          `/api/contracts/${reviseModal.contractId}/request-revision`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feedback: feedbackTrimmed }),
          }
        );
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setActionError(data.error || "Failed to send revision request.");
          return;
        }
        await loadContracts();
      } else {
        const updated = await requestMilestoneRevision(
          supabase,
          reviseModal.contractId,
          reviseModal.milestone.id,
          feedbackTrimmed
        );

        if (updated) {
          setContracts((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        } else {
          await loadContracts();
        }
      }

      setSuccessToast(
        lang === "en"
          ? "Revision requested. Freelancer has been notified."
          : "রিভিশন অনুরোধ সফলভাবে ফ্রিল্যান্সারকে পাঠানো হয়েছে।"
      );
      setReviseModal(null);
      setRevisionFeedback("");
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error("Failed to request revision:", err);
      setActionError("Unexpected error sending revision request.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredContracts = useMemo(() => {
    let result = contracts;
    if (stageFilter !== "ALL") {
      result = result.filter((c) => c.stage === stageFilter);
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.contractCode.toLowerCase().includes(q) ||
          c.client.name.toLowerCase().includes(q) ||
          c.freelancer.name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [contracts, stageFilter, searchFilter]);

  return (
    <div className="space-y-6">
      {/* Toast & Error Notifications */}
      {successToast && (
        <div className="p-4 rounded-xl bg-brand-soft border border-brand/25 text-navy text-xs font-semibold flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-ink-3 hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-danger-soft border border-danger/25 text-danger text-xs font-semibold flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-danger shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-danger hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workspace Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-line rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full mk-eyebrow bg-brand-soft text-navy border border-brand/25">
              {lang === "en" ? "Project Workspace" : "প্রজেক্ট ওয়ার্কস্পেস"}
            </span>
            <span className="text-ink-4">•</span>
            <span className="text-xs font-medium text-ink-3 font-mono mk-tabular">
              {lang === "en"
                ? `${contracts.length} Connected Contract${contracts.length === 1 ? "" : "s"}`
                : `${contracts.length}টি সক্রিয় চুক্তি`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">
            {lang === "en" ? "Workspace & Milestone Deliverables" : "ওয়ার্কস্পেস ও মাইলস্টোন ডেলিভারি"}
          </h2>
          <p className="text-xs text-ink-3 mt-0.5">
            {lang === "en"
              ? "Track active contracts, submit milestone deliverables, and manage escrow disbursements in real-time."
              : "চলমান প্রজেক্ট চুক্তি, মাইলস্টোন ডেলিভারি ও এসক্রো রিলিজ পরিচালনা করুন।"}
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={lang === "en" ? "Search workspace..." : "ওয়ার্কস্পেস খুঁজুন..."}
              className="pl-8 pr-3 py-1.5 text-xs bg-canvas border border-line-strong rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>

          <div className="flex items-center bg-subtle p-1 rounded-lg border border-line text-xs font-semibold text-ink-2">
            <button
              type="button"
              onClick={() => setStageFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                stageFilter === "ALL" ? "bg-navy text-white shadow-2xs" : "hover:text-ink"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStageFilter("ACTIVE")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                stageFilter === "ACTIVE" ? "bg-navy text-white shadow-2xs" : "hover:text-ink"
              }`}
            >
              Active
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-line rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium text-ink-3">
            {lang === "en" ? "Loading your project workspaces..." : "ওয়ার্কস্পেস লোড হচ্ছে..."}
          </p>
        </div>
      ) : filteredContracts.length === 0 ? (
        /* Empty State: Only real database contracts shown. No static mock leaks. */
        <div className="bg-white border border-line rounded-xl p-10 sm:p-14 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-xl bg-brand-soft border border-brand/25 text-brand flex items-center justify-center mx-auto shadow-xs">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-ink">
              {lang === "en" ? "No Active Workspaces Yet" : "এখনও কোনো সক্রিয় প্রজেক্ট ওয়ার্কস্পেস নেই"}
            </h3>
            <p className="text-xs text-ink-3 max-w-md mx-auto mt-1 leading-relaxed">
              {role === "client"
                ? lang === "en"
                  ? "You don't have any active project contracts yet. Accept a proposal from a talent or post a new job to start an escrow-protected contract."
                  : "আপনার কোনো সক্রিয় চুক্তি নেই। ট্যালেন্ট নিয়োগ দিতে একটি কাজ পোস্ট করুন অথবা প্রাপ্ত আবেদন অনুমোদন করুন।"
                : lang === "en"
                ? "You don't have any active project contracts yet. Submit bids on open jobs to be hired by clients with secure escrow funding."
                : "আপনার কোনো সক্রিয় চুক্তি নেই। ক্লায়েন্টদের কাজে বিড করে নতুন প্রজেক্ট শুরু করুন।"}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {role === "client" ? (
              <>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab("proposals")}
                    className="px-4 py-2 rounded-lg bg-subtle hover:bg-muted text-ink text-xs font-semibold transition-all cursor-pointer"
                  >
                    {lang === "en" ? "View Job Proposals" : "আবেদনসমূহ দেখুন"}
                  </button>
                )}
                <Link
                  href="/post-job"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Post a New Job" : "নতুন কাজ পোস্ট করুন"}</span>
                </Link>
              </>
            ) : (
              <>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab("find-work")}
                    className="px-4 py-2 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    {lang === "en" ? "Find Work" : "কাজ খুঁজুন"}
                  </button>
                )}
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab("proposals")}
                    className="px-4 py-2 rounded-lg bg-white border border-line-strong hover:bg-canvas text-ink-2 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {lang === "en" ? "My Proposals" : "আমার আবেদনসমূহ"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* List of Real Active User Project Workspaces */
        <div className="space-y-6">
          {filteredContracts.map((contract) => {
            const isClient = role === "client";
            const partner = isClient ? contract.freelancer : contract.client;
            const isRealContract = isUuid(contract.id);
            const paymentStatus = String(
              contract.paymentStatus ?? "UNPAID"
            ).toUpperCase();
            const workStatus = String(
              contract.workStatus ?? "NOT_STARTED"
            ).toUpperCase();
            const paymentMeta = getPaymentStatusMeta(paymentStatus);
            const workMeta = getWorkStatusMeta(workStatus);
            const canFundContract =
              isClient &&
              isRealContract &&
              contract.stage === "ACTIVE" &&
              ["UNPAID", "FAILED", "CANCELLED"].includes(paymentStatus);
            const canStartWork =
              !isClient &&
              isRealContract &&
              contract.stage === "ACTIVE" &&
              paymentStatus === "FUNDED" &&
              ["FUNDED", "NOT_STARTED"].includes(workStatus);

            const completedCount = contract.milestones.filter(
              (m) => m.status === "APPROVED_RELEASED" || m.status === "APPROVED_AND_RELEASED"
            ).length;
            const totalMilestones = contract.milestones.length || 1;
            const progressPct = Math.round((completedCount / totalMilestones) * 100);

            // Milestone contracts are funded, delivered and released per milestone on the
            // contract page; whole-contract actions here would be rejected by the server.
            if (contract.billingMode === "MILESTONE") {
              const released = contract.releasedBdt ?? 0;
              const total = contract.totalBdt || 0;
              const pct = total > 0 ? Math.min(100, Math.round((released / total) * 100)) : 0;
              const planPending = contract.milestonePlanStatus && contract.milestonePlanStatus !== "ACCEPTED";
              return (
                <div key={contract.id} className="bg-white border border-line rounded-xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono mk-tabular text-[11px] text-ink-3">{contract.contractCode}</span>
                        <span className="px-1.5 py-0.5 rounded bg-brand-soft text-brand-strong text-[11px] font-medium">
                          {lang === "en" ? "Milestone contract" : "মাইলস্টোন চুক্তি"}
                        </span>
                        {planPending && (
                          <span className="px-1.5 py-0.5 rounded bg-accent-soft text-accent-strong text-[11px] font-medium">
                            {lang === "en" ? "Plan awaiting agreement" : "পরিকল্পনা অনুমোদনের অপেক্ষায়"}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 text-[15px] font-semibold text-ink truncate">
                        {lang === "en" ? contract.title : contract.titleBn || contract.title}
                      </h3>
                      <p className="text-[13px] text-ink-3">
                        {isClient ? (lang === "en" ? "Talent: " : "ফ্রিল্যান্সার: ") : (lang === "en" ? "Client: " : "ক্লায়েন্ট: ")}
                        {partner.name}
                      </p>
                    </div>
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md bg-brand hover:bg-brand-hover text-white text-[13px] font-medium transition-colors"
                    >
                      {lang === "en" ? "Manage milestones" : "মাইলস্টোন পরিচালনা"}
                    </Link>
                  </div>
                  <div>
                    <div className="flex justify-between text-[12px] text-ink-3 mb-1.5 mk-tabular">
                      <span>{lang === "en" ? "Released" : "রিলিজড"} ৳{released.toLocaleString("en-US")}</span>
                      <span>{lang === "en" ? "of" : "মোট"} ৳{total.toLocaleString("en-US")}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-subtle overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full bg-success rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={contract.id}
                className="bg-white border border-line rounded-xl p-6 shadow-xs space-y-6 hover:border-line-strong transition-all"
              >
                {/* Contract Summary Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-line">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono mk-tabular text-[10px] font-semibold text-ink-2 bg-subtle px-2 py-0.5 rounded border border-line">
                        {contract.contractCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-full mk-eyebrow bg-brand-soft text-brand-strong border border-brand-strong/20">
                        {contract.stage}
                      </span>
                      {isRealContract && (
                        <>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              BADGE_CLASSES[paymentMeta.tone] ?? BADGE_CLASSES.slate
                            }`}
                          >
                            {lang === "en" ? paymentMeta.label : paymentMeta.labelBn}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              BADGE_CLASSES[workMeta.tone] ?? BADGE_CLASSES.slate
                            }`}
                          >
                            {lang === "en" ? workMeta.label : workMeta.labelBn}
                          </span>
                        </>
                      )}
                      <span className="text-ink-4">•</span>
                      <span className="text-xs text-ink-3 font-medium">
                        {contract.category}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-ink">
                      {contract.title}
                    </h3>

                    {/* Counterparty info */}
                    <div className="flex items-center gap-2 text-xs text-ink-2 pt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={partner.avatar}
                        alt={partner.name}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-[rgba(16,24,40,0.12)]"
                      />
                      <span>
                        <strong className="text-ink">{isClient ? "Talent:" : "Client:"}</strong>{" "}
                        {partner.name}
                      </span>
                      <span className="text-ink-4">•</span>
                      <span className="text-ink-3">
                        {isClient ? contract.freelancer.title : contract.client.company}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Links */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {canFundContract && (
                      <button
                        type="button"
                        disabled={initiatingContractId === contract.id}
                        onClick={() => void handleFundContract(contract)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>
                          {initiatingContractId === contract.id
                            ? lang === "en"
                              ? "Redirecting..."
                              : "চালু হচ্ছে..."
                            : paymentStatus === "FAILED" || paymentStatus === "CANCELLED"
                              ? lang === "en"
                                ? "Retry Fund Contract"
                                : "পুনরায় ফান্ড করুন"
                              : lang === "en"
                                ? "Fund Contract"
                                : "কন্ট্রাক্ট ফান্ড করুন"}
                        </span>
                      </button>
                    )}

                    {canStartWork && (
                      <button
                        type="button"
                        disabled={startingContractId === contract.id}
                        onClick={() => void handleStartWork(contract)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink hover:bg-ink-2 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>
                          {startingContractId === contract.id
                            ? lang === "en"
                              ? "Starting..."
                              : "শুরু হচ্ছে..."
                            : lang === "en"
                              ? "Start Working"
                              : "কাজ শুরু করুন"}
                        </span>
                      </button>
                    )}

                    {onOpenChat && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(contract.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-subtle hover:bg-muted text-ink text-xs font-semibold transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-brand" />
                        <span>{lang === "en" ? "Chat Partner" : "বার্তা পাঠান"}</span>
                      </button>
                    )}

                    <Link
                      href={`/contracts/${contract.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold transition-all shadow-xs"
                    >
                      <span>{lang === "en" ? "Open Full Contract" : "কন্ট্রাক্ট দেখুন"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {isRealContract && workStatus === "REVISION_REQUESTED" && contract.revisionFeedback && (
                  <div className="p-3.5 rounded-lg bg-danger-soft border border-danger/25 text-xs text-danger-ink flex items-start gap-2.5">
                    <RotateCcw className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-danger">
                        {lang === "en" ? "Client Requested Revisions:" : "ক্লায়েন্টের রিভিশন ফিডব্যাক:"}
                      </p>
                      <p className="mt-0.5">{contract.revisionFeedback}</p>
                    </div>
                  </div>
                )}

                {/* Financial Escrow Progress Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-canvas p-4 rounded-lg border border-line">
                  <div>
                    <p className="mk-eyebrow text-ink-3">
                      {lang === "en" ? "Total Contract" : "মোট চুক্তি"}
                    </p>
                    <p className="text-sm font-semibold text-ink mt-0.5 font-mono mk-tabular">
                      {formatBdt(contract.totalBdt)}
                    </p>
                  </div>

                  <div>
                    <p className="mk-eyebrow text-accent">
                      {lang === "en" ? "In Escrow Custody" : "এসক্রোতে জমা"}
                    </p>
                    <p className="text-sm font-semibold text-accent mt-0.5 font-mono mk-tabular">
                      {formatBdt(contract.escrowHeldBdt)}
                    </p>
                  </div>

                  <div>
                    <p className="mk-eyebrow text-brand">
                      {lang === "en" ? "Released / Paid" : "পরিশোধিত"}
                    </p>
                    <p className="text-sm font-semibold text-brand mt-0.5 font-mono mk-tabular">
                      {formatBdt(contract.releasedBdt)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mk-eyebrow text-ink-3 mb-1 font-mono mk-tabular">
                      <span>{lang === "en" ? "Progress" : "অগ্রগতি"}</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Milestones Delivery Workspace Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-2 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-brand" />
                      <span>{lang === "en" ? "Milestone Deliverables" : "মাইলস্টোন ডেলিভারিসমূহ"}</span>
                    </h4>
                    <span className="text-[11px] text-ink-3 font-medium font-mono mk-tabular">
                      {completedCount} of {totalMilestones} completed
                    </span>
                  </div>

                  <div className="divide-y divide-line border border-line rounded-lg overflow-hidden bg-white">
                    {contract.milestones.map((milestone, idx) => {
                      const isSubmitted = milestone.status === "SUBMITTED";
                      const isApproved =
                        milestone.status === "APPROVED_RELEASED" ||
                        milestone.status === "APPROVED_AND_RELEASED";
                      const isInProgress = milestone.status === "IN_PROGRESS";
                      const isRevision = milestone.status === "REVISION_REQUESTED";

                      return (
                        <div
                          key={milestone.id}
                          className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-canvas transition-colors"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-subtle text-ink-2 text-[10px] font-semibold font-mono mk-tabular flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <h5 className="text-xs sm:text-sm font-semibold text-ink truncate">
                                {milestone.title}
                              </h5>

                              {/* Status Badge */}
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-soft text-navy border border-brand/25">
                                  <CheckCheck className="w-3 h-3 text-brand" />
                                  <span>{lang === "en" ? "Approved & Paid" : "অনুমোদিত ও পরিশোধিত"}</span>
                                </span>
                              ) : isSubmitted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-soft text-accent border border-accent/25 animate-pulse">
                                  <Clock className="w-3 h-3 text-accent" />
                                  <span>{lang === "en" ? "Submitted (In Review)" : "পর্যালোচনাধীন"}</span>
                                </span>
                              ) : isRevision ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger-soft text-danger border border-danger/20">
                                  <RotateCcw className="w-3 h-3 text-danger" />
                                  <span>{lang === "en" ? "Revision Requested" : "রিভিশন প্রয়োজন"}</span>
                                </span>
                              ) : isInProgress ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-soft text-brand-strong border border-brand-strong/20">
                                  <Clock className="w-3 h-3 text-brand-strong" />
                                  <span>{lang === "en" ? "In Progress" : "চলমান"}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-subtle text-ink-3 border border-line">
                                  <Lock className="w-3 h-3 text-ink-4" />
                                  <span>{lang === "en" ? "Locked in Escrow" : "এসক্রোতে সংরক্ষিত"}</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-ink-3 line-clamp-1">
                              {milestone.description || "Project deliverable milestone phase."}
                            </p>

                            {/* Submitted Work Note or Link */}
                            {(milestone.deliverableNotes || milestone.submission?.notes) && (
                              <div className="mt-2 p-2.5 rounded-lg bg-accent-soft border border-accent/25 text-xs text-ink-2 space-y-1">
                                <p className="font-semibold text-ink">
                                  {lang === "en" ? "Submitted Deliverable Notes:" : "জমা দেওয়া কাজের বিবরণ:"}
                                </p>
                                <p className="text-[11px] text-ink-2 italic">
                                  &ldquo;{milestone.deliverableNotes || milestone.submission?.notes}&rdquo;
                                </p>
                                {(milestone.liveUrl || milestone.submission?.demoUrl) && (
                                  <a
                                    href={milestone.liveUrl || milestone.submission?.demoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                                  >
                                    <span>{lang === "en" ? "Live Demo URL" : "লাইভ প্রিভিউ লিংক"}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Milestone Amount & Actions */}
                          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                            <span className="text-xs font-semibold text-ink font-mono mk-tabular">
                              {formatBdt(milestone.amountBdt)}
                            </span>

                            {/* Freelancer Action: Submit Work */}
                            {!isClient && (isInProgress || isRevision) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSubmitNotes(
                                    contract.submissionNotes ??
                                      milestone.deliverableNotes ??
                                      ""
                                  );
                                  setSubmitDemoUrl(
                                    contract.submissionDemoUrl ??
                                      milestone.liveUrl ??
                                      ""
                                  );
                                  setSubmitFiles(
                                    contract.submissionFiles ??
                                      milestone.fileNames ??
                                      []
                                  );
                                  setSubmitModal({
                                    contractId: contract.id,
                                    milestone,
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{lang === "en" ? "Submit Work" : "কাজ জমা দিন"}</span>
                              </button>
                            )}

                            {/* Client Actions: Approve Escrow or Request Changes */}
                            {isClient && isSubmitted && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setApproveModal({
                                      contractId: contract.id,
                                      milestone,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{lang === "en" ? "Approve Work" : "অনুমোদন করুন"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReviseModal({
                                      contractId: contract.id,
                                      milestone,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-subtle hover:bg-muted text-ink-2 text-xs font-semibold transition-all cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>{lang === "en" ? "Revise" : "রিভিশন"}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Freelancer Submit Deliverable Modal                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {submitModal && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSubmitModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-line-strong space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-semibold text-ink">
                  {lang === "en" ? "Submit Milestone Deliverable" : "মাইলস্টোন কাজ জমা দিন"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModal(null)}
                className="text-ink-3 hover:text-ink cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-canvas border border-line rounded-lg text-xs space-y-1">
              <p className="font-semibold text-ink">{submitModal.milestone.title}</p>
              <p className="text-ink-3">
                Amount: <span className="font-semibold text-brand font-mono mk-tabular">৳{submitModal.milestone.amountBdt.toLocaleString()} BDT</span> in escrow custody.
              </p>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {lang === "en" ? "Deliverable Summary / Notes *" : "কাজের বিবরণ / নোট *"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder={
                    lang === "en"
                      ? "Describe the completed deliverables, files included, and what the client should review..."
                      : "আপনার সম্পন্ন কাজের বিবরণ লিখুন..."
                  }
                  className="w-full text-xs p-3 rounded-lg border border-line-strong focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {lang === "en" ? "Live Demo / Preview Link (Optional)" : "লাইভ ডেমো লিংক (ঐচ্ছিক)"}
                </label>
                <input
                  type="url"
                  value={submitDemoUrl}
                  onChange={(e) => setSubmitDemoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 rounded-lg border border-line-strong focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {lang === "en" ? "Attached Deliverable File Names" : "সংযুক্ত ফাইলের নাম"}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFileTag}
                    onChange={(e) => setNewFileTag(e.target.value)}
                    placeholder="e.g. final_project_v1.zip"
                    className="flex-1 text-xs p-2 rounded-lg border border-line-strong focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newFileTag.trim()) {
                        setSubmitFiles([...submitFiles, newFileTag.trim()]);
                        setNewFileTag("");
                      }
                    }}
                    className="px-3 py-1.5 bg-subtle hover:bg-muted text-ink text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {submitFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {submitFiles.map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] bg-subtle text-ink-2 px-2.5 py-1 rounded-lg"
                      >
                        <span>{f}</span>
                        <button
                          type="button"
                          onClick={() => setSubmitFiles(submitFiles.filter((_, idx) => idx !== i))}
                          className="hover:text-danger cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setSubmitModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-ink-3 hover:bg-subtle transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Client Approve Work & Record Internal Release Modal        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {approveModal && (() => {
        const activeContract = contracts.find(
          (c) => c.id === approveModal.contractId
        );
        const isLiveContract = isUuid(approveModal.contractId);
        const feePct = activeContract?.platformFeePct || DEFAULT_PLATFORM_FEE_PCT;
        const grossAmount = isLiveContract && activeContract
          ? activeContract.totalBdt
          : approveModal.milestone.amountBdt;
        const breakdown = calculateContractFeeBreakdown(grossAmount, feePct);

        return (
          <div
            className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setApproveModal(null)}
          >
            <div
              className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-line-strong space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-xl bg-brand-soft border border-brand/25 text-brand flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-semibold text-ink">
                  {lang === "en"
                    ? "Approve Deliverable & Record Release?"
                    : "কাজ অনুমোদন ও লেজার রিলিজ করবেন?"}
                </h3>
                <p className="text-xs text-ink-3">
                  {isLiveContract
                    ? lang === "en"
                      ? "Records an internal RELEASE ledger entry and updates the freelancer's simulated earnings. No bank transfer happens in sandbox mode."
                      : "অভ্যন্তরীণ লেজারে RELEASE এন্ট্রি যুক্ত হবে এবং ফ্রিল্যান্সারের সিমুলেটেড আয় আপডেট হবে।"
                    : lang === "en"
                      ? `This will record a simulated ledger release of ৳${approveModal.milestone.amountBdt.toLocaleString()} BDT.`
                      : `এটি সিমুলেটেড লেজারে ৳${approveModal.milestone.amountBdt.toLocaleString()} টাকা রিলিজ হিসেবে সংরক্ষণ করবে।`}
                </p>
              </div>

              {isLiveContract && (
                <div className="p-3.5 bg-canvas rounded-lg border border-line text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-ink-3">Contract Amount:</span>
                    <span className="font-semibold text-ink font-mono mk-tabular">
                      {formatBdt(breakdown.grossAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-3 font-mono mk-tabular">
                      Platform Commission ({breakdown.platformFeePct}%):
                    </span>
                    <span className="font-semibold text-danger font-mono mk-tabular">
                      -{formatBdt(breakdown.platformFeeAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-line font-semibold">
                    <span className="text-ink">Freelancer Simulated Credit:</span>
                    <span className="text-brand font-mono mk-tabular">
                      {formatBdt(breakdown.freelancerPayableAmount)}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-canvas rounded-lg border border-line text-xs space-y-1">
                <p className="font-semibold text-ink">{approveModal.milestone.title}</p>
                {(approveModal.milestone.deliverableNotes || approveModal.milestone.submission?.notes) && (
                  <p className="text-ink-3 italic">
                    &ldquo;{approveModal.milestone.deliverableNotes || approveModal.milestone.submission?.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModal(null)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-ink-3 hover:bg-subtle transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmApprove}
                  className="flex-1 py-2.5 rounded-lg bg-navy hover:bg-brand text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading
                    ? "Processing..."
                    : isLiveContract
                      ? "Approve & Record Release"
                      : "Confirm & Release"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: Client Request Changes / Revision Modal                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {reviseModal && (
        <div
          className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setReviseModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-line-strong space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-semibold text-ink">
                  {lang === "en" ? "Request Deliverable Changes" : "রিভিশন বা সংশোধনের অনুরোধ"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviseModal(null)}
                className="text-ink-3 hover:text-ink cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRevision} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {lang === "en" ? "Revision Feedback for Freelancer *" : "ফ্রিল্যান্সারের জন্য ফিডব্যাক *"}
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  placeholder="Detail the changes or adjustments needed on this milestone deliverable..."
                  className="w-full text-xs p-3 rounded-lg border border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviseModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-ink-3 hover:bg-subtle transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-strong text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Send Revision Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
