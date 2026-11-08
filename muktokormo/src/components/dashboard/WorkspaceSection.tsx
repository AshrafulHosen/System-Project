"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  ChevronRight,
  Upload,
  Sparkles,
  CheckCheck,
  Briefcase,
  X,
  Send,
  RotateCcw,
  Plus,
  Lock,
  Search,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserContracts,
  submitMilestoneDeliverable,
  approveMilestone,
  requestMilestoneRevision,
} from "@/lib/data/contracts";
import { formatBdt } from "@/lib/format";
import type { WorkspaceContract, WorkspaceMilestone } from "@/types";

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
  currentUserName,
  onOpenChat,
  onNavigateTab,
}: WorkspaceSectionProps) {
  const supabase = useMemo(() => createClient(), []);
  const [contracts, setContracts] = useState<WorkspaceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [stageFilter, setStageFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  // Modals for Milestone Actions
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
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch real contracts from database strictly for the logged-in user
  const loadContracts = async () => {
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
  };

  useEffect(() => {
    loadContracts();
  }, [supabase, role, currentUserId, currentEntityId]);

  // Handle Freelancer Work Submission
  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModal) return;
    if (!submitNotes.trim()) {
      alert("Please provide deliverable notes or completion summary.");
      return;
    }

    setActionLoading(true);
    try {
      const updated = await submitMilestoneDeliverable(
        supabase,
        submitModal.contractId,
        submitModal.milestone.id,
        {
          notes: submitNotes.trim(),
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

      setSuccessToast(
        lang === "en"
          ? "Milestone deliverable submitted successfully! Client has been notified."
          : "মাইলস্টোন ডেলিভারি সফলভাবে জমা দেওয়া হয়েছে!"
      );
      setSubmitModal(null);
      setSubmitNotes("");
      setSubmitDemoUrl("");
      setSubmitFiles([]);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error("Failed to submit deliverable:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Client Approving Milestone and Releasing Escrow
  const handleConfirmApprove = async () => {
    if (!approveModal) return;

    setActionLoading(true);
    try {
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
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Client Requesting Revision
  const handleConfirmRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviseModal) return;
    if (!revisionFeedback.trim()) {
      alert("Please provide specific feedback for revision.");
      return;
    }

    setActionLoading(true);
    try {
      const updated = await requestMilestoneRevision(
        supabase,
        reviseModal.contractId,
        reviseModal.milestone.id,
        revisionFeedback.trim()
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
          ? "Revision requested. Freelancer has been notified."
          : "রিভিশন অনুরোধ সফলভাবে ফ্রিল্যান্সারকে পাঠানো হয়েছে।"
      );
      setReviseModal(null);
      setRevisionFeedback("");
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error("Failed to request revision:", err);
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
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workspace Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              {lang === "en" ? "Project Workspace" : "প্রজেক্ট ওয়ার্কস্পেস"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">
              {lang === "en"
                ? `${contracts.length} Connected Contract${contracts.length === 1 ? "" : "s"}`
                : `${contracts.length}টি সক্রিয় চুক্তি`}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {lang === "en" ? "Workspace & Milestone Deliverables" : "ওয়ার্কস্পেস ও মাইলস্টোন ডেলিভারি"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === "en"
              ? "Track active contracts, submit milestone deliverables, and manage escrow disbursements in real-time."
              : "চলমান প্রজেক্ট চুক্তি, মাইলস্টোন ডেলিভারি ও এসক্রো রিলিজ পরিচালনা করুন।"}
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={lang === "en" ? "Search workspace..." : "ওয়ার্কস্পেস খুঁজুন..."}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#14a800] transition-all"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setStageFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                stageFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStageFilter("ACTIVE")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                stageFilter === "ACTIVE" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900"
              }`}
            >
              Active
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#14a800] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium text-slate-500">
            {lang === "en" ? "Loading your project workspaces..." : "ওয়ার্কস্পেস লোড হচ্ছে..."}
          </p>
        </div>
      ) : filteredContracts.length === 0 ? (
        /* Empty State: Only real database contracts shown. No static mock leaks. */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#14a800] flex items-center justify-center mx-auto shadow-xs">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {lang === "en" ? "No Active Workspaces Yet" : "এখনও কোনো সক্রিয় প্রজেক্ট ওয়ার্কস্পেস নেই"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
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
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    {lang === "en" ? "View Job Proposals" : "আবেদনসমূহ দেখুন"}
                  </button>
                )}
                <Link
                  href="/post-job"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14a800] hover:bg-[#108a00] text-white text-xs font-bold transition-all shadow-xs"
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
                    className="px-4 py-2 rounded-xl bg-[#14a800] hover:bg-[#108a00] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {lang === "en" ? "Find Work" : "কাজ খুঁজুন"}
                  </button>
                )}
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab("proposals")}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
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
            const completedCount = contract.milestones.filter(
              (m) => m.status === "APPROVED_RELEASED" || m.status === "APPROVED_AND_RELEASED"
            ).length;
            const totalMilestones = contract.milestones.length || 1;
            const progressPct = Math.round((completedCount / totalMilestones) * 100);

            return (
              <div
                key={contract.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6 hover:shadow-sm transition-all"
              >
                {/* Contract Summary Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {contract.contractCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                        {contract.stage}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {contract.category}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {contract.title}
                    </h3>

                    {/* Counterparty info */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                      <img
                        src={partner.avatar}
                        alt={partner.name}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <span>
                        <strong className="text-slate-800">{isClient ? "Talent:" : "Client:"}</strong>{" "}
                        {partner.name}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">
                        {isClient ? (partner as any).title : (partner as any).company}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Links */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {onOpenChat && (
                      <button
                        type="button"
                        onClick={() => onOpenChat(contract.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === "en" ? "Chat Partner" : "বার্তা পাঠান"}</span>
                      </button>
                    )}

                    <Link
                      href={`/contracts/${contract.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14a800] hover:bg-[#108a00] text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <span>{lang === "en" ? "Open Full Contract" : "কন্ট্রাক্ট দেখুন"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Financial Escrow Progress Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {lang === "en" ? "Total Contract" : "মোট চুক্তি"}
                    </p>
                    <p className="text-sm font-black text-slate-900 mt-0.5">
                      {formatBdt(contract.totalBdt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                      {lang === "en" ? "In Escrow Custody" : "এসক্রোতে জমা"}
                    </p>
                    <p className="text-sm font-black text-amber-700 mt-0.5">
                      {formatBdt(contract.escrowHeldBdt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      {lang === "en" ? "Released / Paid" : "পরিশোধিত"}
                    </p>
                    <p className="text-sm font-black text-emerald-700 mt-0.5">
                      {formatBdt(contract.releasedBdt)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      <span>{lang === "en" ? "Progress" : "অগ্রগতি"}</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#14a800] rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Milestones Delivery Workspace Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#14a800]" />
                      <span>{lang === "en" ? "Milestone Deliverables" : "মাইলস্টোন ডেলিভারিসমূহ"}</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {completedCount} of {totalMilestones} completed
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
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
                          className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {milestone.title}
                              </h5>

                              {/* Status Badge */}
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                                  <span>{lang === "en" ? "Approved & Paid" : "অনুমোদিত ও পরিশোধিত"}</span>
                                </span>
                              ) : isSubmitted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>{lang === "en" ? "Submitted (In Review)" : "পর্যালোচনাধীন"}</span>
                                </span>
                              ) : isRevision ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  <RotateCcw className="w-3 h-3 text-rose-600" />
                                  <span>{lang === "en" ? "Revision Requested" : "রিভিশন প্রয়োজন"}</span>
                                </span>
                              ) : isInProgress ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                                  <Clock className="w-3 h-3 text-sky-600" />
                                  <span>{lang === "en" ? "In Progress" : "চলমান"}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  <span>{lang === "en" ? "Locked in Escrow" : "এসক্রোতে সংরক্ষিত"}</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-1">
                              {milestone.description || "Project deliverable milestone phase."}
                            </p>

                            {/* Submitted Work Note or Link */}
                            {(milestone.deliverableNotes || milestone.submission?.notes) && (
                              <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-slate-700 space-y-1">
                                <p className="font-semibold text-slate-900">
                                  {lang === "en" ? "Submitted Deliverable Notes:" : "জমা দেওয়া কাজের বিবরণ:"}
                                </p>
                                <p className="text-[11px] text-slate-600 italic">
                                  "{milestone.deliverableNotes || milestone.submission?.notes}"
                                </p>
                                {(milestone.liveUrl || milestone.submission?.demoUrl) && (
                                  <a
                                    href={milestone.liveUrl || milestone.submission?.demoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
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
                            <span className="text-xs font-black text-slate-900">
                              {formatBdt(milestone.amountBdt)}
                            </span>

                            {/* Freelancer Action: Submit Work */}
                            {!isClient && (isInProgress || isRevision) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSubmitModal({
                                    contractId: contract.id,
                                    milestone,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#14a800] hover:bg-[#108a00] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#14a800] hover:bg-[#108a00] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{lang === "en" ? "Release Escrow" : "এসক্রো ছাড় করুন"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReviseModal({
                                      contractId: contract.id,
                                      milestone,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#14a800]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === "en" ? "Submit Milestone Deliverable" : "মাইলস্টোন কাজ জমা দিন"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-800">{submitModal.milestone.title}</p>
              <p className="text-slate-500">
                Amount: <span className="font-bold text-emerald-700">৳{submitModal.milestone.amountBdt.toLocaleString()} BDT</span> in escrow custody.
              </p>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#14a800]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "en" ? "Live Demo / Preview Link (Optional)" : "লাইভ ডেমো লিংক (ঐচ্ছিক)"}
                </label>
                <input
                  type="url"
                  value={submitDemoUrl}
                  onChange={(e) => setSubmitDemoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#14a800]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "en" ? "Attached Deliverable File Names" : "সংযুক্ত ফাইলের নাম"}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFileTag}
                    onChange={(e) => setNewFileTag(e.target.value)}
                    placeholder="e.g. final_project_v1.zip"
                    className="flex-1 text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#14a800]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newFileTag.trim()) {
                        setSubmitFiles([...submitFiles, newFileTag.trim()]);
                        setNewFileTag("");
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {submitFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {submitFiles.map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg"
                      >
                        <span>{f}</span>
                        <button
                          type="button"
                          onClick={() => setSubmitFiles(submitFiles.filter((_, idx) => idx !== i))}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubmitModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#14a800] hover:bg-[#108a00] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Client Approve Milestone & Release Escrow Modal            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {approveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#14a800] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {lang === "en" ? "Approve Deliverable & Release Escrow?" : "কাজ অনুমোদন ও এসক্রো ছাড় করবেন?"}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === "en"
                  ? `This will release ৳${approveModal.milestone.amountBdt.toLocaleString()} BDT from escrow custody directly to the freelancer's wallet.`
                  : `এটি এসক্রো থেকে ৳${approveModal.milestone.amountBdt.toLocaleString()} টাকা ফ্রিল্যান্সারের ওয়ালেটে স্থানান্তর করবে।`}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-800">{approveModal.milestone.title}</p>
              {(approveModal.milestone.deliverableNotes || approveModal.milestone.submission?.notes) && (
                <p className="text-slate-500 italic">
                  "{approveModal.milestone.deliverableNotes || approveModal.milestone.submission?.notes}"
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setApproveModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmApprove}
                className="flex-1 py-2.5 rounded-xl bg-[#14a800] hover:bg-[#108a00] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Confirm & Release"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: Client Request Changes / Revision Modal                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {reviseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === "en" ? "Request Deliverable Changes" : "রিভিশন বা সংশোধনের অনুরোধ"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviseModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRevision} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === "en" ? "Revision Feedback for Freelancer *" : "ফ্রিল্যান্সারের জন্য ফিডব্যাক *"}
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  placeholder="Detail the changes or adjustments needed on this milestone deliverable..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviseModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
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
