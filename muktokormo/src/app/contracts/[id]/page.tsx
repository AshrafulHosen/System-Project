"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Download, 
  Send, 
  ArrowLeft, 
  AlertCircle, 
  Check, 
  Layers, 
  Calendar, 
  MessageSquare, 
  FileText, 
  DollarSign, 
  RotateCcw, 
  Star, 
  ChevronRight, 
  Smartphone, 
  Upload, 
  Sparkles,
  HelpCircle,
  Eye,
  CheckCheck,
  X
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { INITIAL_WORKSPACE_CONTRACTS } from "@/data/mockContracts";
import { WorkspaceContract, WorkspaceMilestone, MilestoneSubmission, ContractActivity } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ContractWorkspacePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const contractId = resolvedParams.id;

  // Find contract or default to first
  const initialData = INITIAL_WORKSPACE_CONTRACTS.find(
    (c) => c.id === contractId || c.contractCode.toLowerCase() === contractId.toLowerCase()
  ) || INITIAL_WORKSPACE_CONTRACTS[0];

  const [contract, setContract] = useState<WorkspaceContract>(initialData);
  const [activeRole, setActiveRole] = useState<"client" | "freelancer">("freelancer");
  const [lang, setLang] = useState<"en" | "bn">("en");

  // Modals & Drawers
  const [selectedMilestoneForSubmit, setSelectedMilestoneForSubmit] = useState<WorkspaceMilestone | null>(null);
  const [selectedMilestoneForApproval, setSelectedMilestoneForApproval] = useState<WorkspaceMilestone | null>(null);
  const [selectedMilestoneForRevision, setSelectedMilestoneForRevision] = useState<WorkspaceMilestone | null>(null);

  // Form states for work submission
  const [submitTitle, setSubmitTitle] = useState("Complete Frontend Storefront Delivery v1.0");
  const [submitDemoUrl, setSubmitDemoUrl] = useState("https://apex-lifestyle-demo.vercel.app");
  const [submitNotes, setSubmitNotes] = useState(
    "Hi Nafisur! I have completed all product grid layouts, responsive navigation, cart drawer animations, and bKash payment modal mockups. Please check the live Vercel URL and attached repository."
  );
  const [submitFiles, setSubmitFiles] = useState<string[]>([
    "apex_storefront_src.zip",
    "Tailwind_Theme_Tokens.pdf",
    "lighthouse_performance_report.png",
  ]);

  // Form state for revision
  const [revisionNotes, setRevisionNotes] = useState(
    "The mobile navigation menu is slightly overlapping the search bar on iPhone screen widths. Please adjust the z-index and padding."
  );

  // Quick message input
  const [quickMessage, setQuickMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: string; time: string; text: string; isClient: boolean }>>([
    {
      sender: "Nafisur Rahman",
      time: "Oct 2, 02:40 PM",
      text: "Welcome to the project Tanvir! Milestone 1 is funded in bKash Escrow. Let me know if you need any asset files.",
      isClient: true,
    },
    {
      sender: "Tanvir Rahman",
      time: "Oct 2, 03:00 PM",
      text: "Thanks Nafisur! I am beginning with the Next.js App Router structure and responsive header now.",
      isClient: false,
    },
  ]);

  // Handle Freelancer submitting work
  const handleConfirmSubmitWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneForSubmit) return;

    const newSubmission: MilestoneSubmission = {
      id: `sub-${Date.now()}`,
      milestoneId: selectedMilestoneForSubmit.id,
      title: submitTitle,
      notes: submitNotes,
      demoUrl: submitDemoUrl.trim() || undefined,
      fileNames: submitFiles,
      submittedAt: "Just now",
    };

    const newActivity: ContractActivity = {
      id: `act-${Date.now()}`,
      timestamp: "Just now",
      actor: contract.freelancer.name,
      actorRole: "FREELANCER",
      action: `Work Deliverables Submitted for Milestone #${selectedMilestoneForSubmit.order}`,
      details: submitTitle,
      badgeType: "SUBMISSION",
    };

    setContract((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === selectedMilestoneForSubmit.id
          ? { ...m, status: "SUBMITTED" as const, submission: newSubmission }
          : m
      ),
      activityLogs: [newActivity, ...prev.activityLogs],
    }));

    setSelectedMilestoneForSubmit(null);
  };

  // Handle Client approving work & releasing funds
  const handleConfirmApproval = () => {
    if (!selectedMilestoneForApproval) return;

    const trxCode = `TRX-REL-${Math.floor(100000 + Math.random() * 900000)}`;

    const newActivity: ContractActivity = {
      id: `act-${Date.now()}`,
      timestamp: "Just now",
      actor: contract.client.name,
      actorRole: "CLIENT",
      action: `Milestone #${selectedMilestoneForApproval.order} Approved & ৳${selectedMilestoneForApproval.amountBdt.toLocaleString()} Released`,
      details: `Escrow released to freelancer's ${contract.freelancer.payoutMethod} account (${contract.freelancer.payoutAccount}).`,
      badgeType: "PAYOUT",
      trxId: trxCode,
    };

    setContract((prev) => {
      const updatedReleased = prev.releasedBdt + selectedMilestoneForApproval.amountBdt;
      const updatedEscrow = Math.max(0, prev.escrowHeldBdt - selectedMilestoneForApproval.amountBdt);

      return {
        ...prev,
        releasedBdt: updatedReleased,
        escrowHeldBdt: updatedEscrow,
        milestones: prev.milestones.map((m) =>
          m.id === selectedMilestoneForApproval.id
            ? { ...m, status: "APPROVED_RELEASED" as const, mfsTrxId: trxCode, releasedAt: "Just now" }
            : m
        ),
        activityLogs: [newActivity, ...prev.activityLogs],
      };
    });

    setSelectedMilestoneForApproval(null);
  };

  // Handle Client requesting revision
  const handleConfirmRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneForRevision) return;

    const newActivity: ContractActivity = {
      id: `act-${Date.now()}`,
      timestamp: "Just now",
      actor: contract.client.name,
      actorRole: "CLIENT",
      action: `Revision Requested for Milestone #${selectedMilestoneForRevision.order}`,
      details: revisionNotes,
      badgeType: "REVISION",
    };

    setContract((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === selectedMilestoneForRevision.id
          ? {
              ...m,
              status: "REVISION_REQUESTED" as const,
              submission: m.submission
                ? { ...m.submission, revisionFeedback: revisionNotes }
                : undefined,
            }
          : m
      ),
      activityLogs: [newActivity, ...prev.activityLogs],
    }));

    setSelectedMilestoneForRevision(null);
  };

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessage.trim()) return;

    const newMsg = {
      sender: activeRole === "client" ? contract.client.name : contract.freelancer.name,
      time: "Just now",
      text: quickMessage.trim(),
      isClient: activeRole === "client",
    };

    setMessages((prev) => [...prev, newMsg]);
    setQuickMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        onOpenPostJob={() => {}}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === "en" ? "bn" : "en"))}
        role={activeRole}
        onToggleRole={() => setActiveRole((prev) => (prev === "client" ? "freelancer" : "client"))}
        searchQuery=""
        onSearchChange={() => {}}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation Breadcrumb & Perspective Switcher Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/contracts"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Contracts</span>
            </Link>

            <span className="text-slate-300">/</span>
            
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {contract.contractCode}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {contract.category}
              </span>
            </div>
          </div>

          {/* Perspective Switcher: Test as Client vs Freelancer */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-500 px-2.5 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Workspace Role:</span>
            </span>

            <button
              onClick={() => setActiveRole("freelancer")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeRole === "freelancer"
                  ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Freelancer ({contract.freelancer.name.split(" ")[0]})
            </button>

            <button
              onClick={() => setActiveRole("client")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeRole === "client"
                  ? "bg-white text-sky-700 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Client ({contract.client.name.split(" ")[0]})
            </button>
          </div>
        </div>

        {/* Contract Title & Parties Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Contract & Escrow Protected
                </span>
                <span className="text-xs text-slate-400">• Started {contract.startedAt} • Due {contract.deadlineDate}</span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                {lang === "en" ? contract.title : (contract.titleBn || contract.title)}
              </h1>
            </div>

            {/* Quick Summary Pill */}
            <div className="text-left lg:text-right shrink-0">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                Total Contract Value
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ৳{contract.totalBdt.toLocaleString()} <span className="text-sm font-bold text-slate-500">BDT</span>
              </span>
            </div>
          </div>

          {/* Two-Party Breakdown: Client vs Freelancer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
            {/* Client Card */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4">
              <img
                src={contract.client.avatar}
                alt={contract.client.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Employer / Client
                </span>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-slate-900">{contract.client.name}</h4>
                  {contract.client.isVerified && (
                    <span title="Verified Client" className="text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">{contract.client.company} • {contract.client.location}</p>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{contract.client.rating.toFixed(1)} rating</span>
                </div>
              </div>
            </div>

            {/* Freelancer Card */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4">
              <img
                src={contract.freelancer.avatar}
                alt={contract.freelancer.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Assigned Freelancer
                </span>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-slate-900">{contract.freelancer.name}</h4>
                  {contract.freelancer.isNidVerified && (
                    <span title="NID Smart Card Verified" className="text-emerald-600">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">{contract.freelancer.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                    Wallet: {contract.freelancer.payoutMethod} ({contract.freelancer.payoutAccount})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Escrow Safe Ledger Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>MuktoKormo BDT Escrow Vault</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                ৳{contract.escrowHeldBdt.toLocaleString()} BDT Locked in Safe Custody
              </h3>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                Client funds are held in compliant escrow via bKash/Nagad Merchant Safe. Money is only released to the freelancer after the client reviews and approves each milestone deliverable.
              </p>
            </div>

            {/* Financial Ledger Grid */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center backdrop-blur-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">Locked in Escrow</span>
                <span className="text-base sm:text-lg font-black text-white">৳{contract.escrowHeldBdt.toLocaleString()}</span>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center backdrop-blur-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">Released (Paid)</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">৳{contract.releasedBdt.toLocaleString()}</span>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center backdrop-blur-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">Next Milestone</span>
                <span className="text-base sm:text-lg font-black text-slate-300">৳{contract.remainingBdt.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Delivery Tracker */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Milestone Deliverables Pipeline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track each deliverable phase, submit completed code/designs, and release escrow funds.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{contract.milestones.length} Milestones Scheduled</span>
            </div>
          </div>

          {/* Milestones Cards */}
          <div className="space-y-4">
            {contract.milestones.map((milestone) => {
              const isLocked = milestone.status === "LOCKED_IN_ESCROW";
              const isInProgress = milestone.status === "IN_PROGRESS";
              const isSubmitted = milestone.status === "SUBMITTED";
              const isReleased = milestone.status === "APPROVED_RELEASED";
              const isRevision = milestone.status === "REVISION_REQUESTED";

              return (
                <div
                  key={milestone.id}
                  className={`border rounded-2xl p-5 sm:p-6 transition-all ${
                    isReleased
                      ? "border-emerald-300 bg-emerald-50/20"
                      : isSubmitted
                      ? "border-sky-300 bg-sky-50/20 shadow-xs"
                      : isRevision
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    
                    {/* Left: Milestone Header & Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-slate-100 text-slate-700">
                          Milestone #{milestone.order}
                        </span>

                        {isReleased && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Approved & Escrow Released
                          </span>
                        )}

                        {isSubmitted && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            Pending Client Approval
                          </span>
                        )}

                        {isRevision && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            Revision Requested by Client
                          </span>
                        )}

                        {isInProgress && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            Work In Progress
                          </span>
                        )}

                        {isLocked && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            Locked (Phase 2 Escrow)
                          </span>
                        )}

                        <span className="text-xs text-slate-400 ml-auto lg:ml-2">
                          Due by {milestone.dueDate}
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-slate-900">
                        {milestone.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="text-left lg:text-right shrink-0 lg:pl-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 flex lg:flex-col items-center lg:items-end justify-between gap-3">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                          Milestone Amount
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          ৳{milestone.amountBdt.toLocaleString()} BDT
                        </span>
                      </div>

                      {/* Action buttons depending on status and active perspective */}
                      <div className="flex items-center gap-2">
                        {/* Freelancer Action: Submit Work */}
                        {activeRole === "freelancer" && (isInProgress || isRevision) && (
                          <button
                            onClick={() => setSelectedMilestoneForSubmit(milestone)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{isRevision ? "Resubmit Revised Work" : "Submit Work for Review"}</span>
                          </button>
                        )}

                        {/* Client Actions: Review, Approve or Request Revision */}
                        {activeRole === "client" && isSubmitted && (
                          <>
                            <button
                              onClick={() => setSelectedMilestoneForRevision(milestone)}
                              className="px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Request Changes
                            </button>

                            <button
                              onClick={() => setSelectedMilestoneForApproval(milestone)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Approve & Release ৳{milestone.amountBdt.toLocaleString()}</span>
                            </button>
                          </>
                        )}

                        {/* Released Payout Stamp */}
                        {isReleased && milestone.mfsTrxId && (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
                            MFS Paid: {milestone.mfsTrxId}
                          </span>
                        )}
                      </div>

                    </div>

                  </div>

                  {/* Submission Details Box (If Work has been submitted) */}
                  {milestone.submission && (
                    <div className="mt-4 pt-4 border-t border-slate-200/80 bg-white p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Submitted Deliverables ({milestone.submission.submittedAt})
                        </span>
                        {milestone.submission.demoUrl && (
                          <a
                            href={milestone.submission.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline"
                          >
                            <span>Inspect Live Demo</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                        "{milestone.submission.notes}"
                      </p>

                      {/* Files list */}
                      {milestone.submission.fileNames.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {milestone.submission.fileNames.map((file, fIdx) => (
                            <span
                              key={fIdx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>{file}</span>
                              <Download className="w-3 h-3 text-slate-400 hover:text-slate-900 cursor-pointer" />
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Revision Feedback alert if any */}
                      {milestone.submission.revisionFeedback && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Client Revision Notes:</span>
                            <span>{milestone.submission.revisionFeedback}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Contract Collaboration Hub: Live Chat & Activity Audit Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Quick Chat & Communication Thread */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-black text-slate-900">Contract Discussion</h4>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                End-to-End Logged
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.isClient ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-600">{msg.sender}</span>
                    <span>• {msg.time}</span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl max-w-xs sm:max-w-sm text-xs leading-relaxed ${
                      msg.isClient
                        ? "bg-slate-100 text-slate-800 rounded-tl-none"
                        : "bg-emerald-600 text-white rounded-tr-none shadow-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                placeholder={
                  activeRole === "client"
                    ? `Message ${contract.freelancer.name}...`
                    : `Message ${contract.client.name}...`
                }
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs transition-transform active:scale-95"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>

          {/* Activity Log & Immutable Escrow Audit Trail */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-black text-slate-900">Audit Trail & Escrow Events</h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Bangladesh Bank Aligned
              </span>
            </div>

            {/* Activity Stream */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5">
              {contract.activityLogs.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                    {act.badgeType === "ESCROW" ? (
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    ) : act.badgeType === "PAYOUT" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : act.badgeType === "REVISION" ? (
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    ) : act.badgeType === "SUBMISSION" ? (
                      <Upload className="w-3.5 h-3.5 text-sky-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{act.action}</span>
                      <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{act.details}</p>
                    {act.trxId && (
                      <span className="inline-block text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {act.trxId}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer verification statement */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>All escrow transactions audited under Bangladesh ICT Act 2006/2018</span>
            </div>
          </div>

        </div>

      </main>

      <Footer lang={lang} />

      {/* =========================================================================
          MODAL 1: Freelancer Submit Work Drawer
         ========================================================================= */}
      {selectedMilestoneForSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-slate-900">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Milestone #{selectedMilestoneForSubmit.order} Deliverable
                </span>
                <h3 className="text-base font-black text-slate-900">Submit Work for Client Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedMilestoneForSubmit(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubmitWork} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deliverable Title</label>
                <input
                  type="text"
                  required
                  value={submitTitle}
                  onChange={(e) => setSubmitTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Live Demo / Repository URL</label>
                <div className="relative">
                  <ExternalLink className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    value={submitDemoUrl}
                    onChange={(e) => setSubmitDemoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Notes for Client</label>
                <textarea
                  rows={4}
                  required
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* Attachments preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attached Deliverable Files</label>
                <div className="space-y-1.5">
                  {submitFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        {file}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Ready</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedMilestoneForSubmit(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Deliverable to Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: Client Approve Work & Release Payment
         ========================================================================= */}
      {selectedMilestoneForApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-slate-900">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Approve Milestone Deliverable</h3>
                  <p className="text-[11px] text-slate-500">Release BDT Escrow to Freelancer</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMilestoneForApproval(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Release Amount</span>
                <span className="text-2xl font-black text-slate-900 block">
                  ৳{selectedMilestoneForApproval.amountBdt.toLocaleString()} BDT
                </span>
                <span className="text-xs text-emerald-700 font-semibold block">
                  Will be credited to {contract.freelancer.name}'s {contract.freelancer.payoutMethod} Wallet
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                <div className="flex justify-between">
                  <span>Gross Milestone Amount:</span>
                  <span className="font-bold text-slate-900">৳{selectedMilestoneForApproval.amountBdt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>MuktoKormo Platform Fee (7%):</span>
                  <span className="font-bold text-rose-600">-৳{Math.round(selectedMilestoneForApproval.amountBdt * 0.07).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-200 font-bold text-slate-900">
                  <span>Freelancer Take-Home:</span>
                  <span className="text-emerald-700">৳{Math.round(selectedMilestoneForApproval.amountBdt * 0.93).toLocaleString()} BDT</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                By approving, you verify that the freelancer has met all deliverables for this milestone. This transaction is final and irreversible.
              </p>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedMilestoneForApproval(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm Release & Pay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Client Request Revision
         ========================================================================= */}
      {selectedMilestoneForRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-slate-900">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Request Revision</h3>
                  <p className="text-[11px] text-slate-500">Provide constructive feedback to {contract.freelancer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMilestoneForRevision(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRevision} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Revision Specifics</label>
                <textarea
                  rows={4}
                  required
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Detail what needs to be changed or fixed..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Escrow funds remain securely locked until revisions are approved.</span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedMilestoneForRevision(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-full cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Revision Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
