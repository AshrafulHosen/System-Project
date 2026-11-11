"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  CheckSquare,
  Clock,
  Briefcase,
  Users,
  Building2,
  Phone,
  Calendar,
  PanelRight,
  SlidersHorizontal,
  MoreHorizontal,
  ArrowUpRight,
  Eye,
  Plus,
  Paperclip,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchUserContracts } from "@/lib/data/contracts";
import {
  TALKJS_APP_ID,
  TalkUserDef,
  formatTalkUser,
  buildStableTalkUserId,
  DEFAULT_TALK_AVATAR,
} from "@/lib/talkjs";
import type { WorkspaceContract, WorkspaceMilestone } from "@/types";

// Dynamically load TalkJSChat on client side (SSR false)
const TalkJSChat = dynamic(() => import("@/components/chat/TalkJSChat"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-500">Loading conversation...</p>
    </div>
  ),
});

export interface ConversationThread {
  id: string;
  contractId: string;
  proposalId?: string;
  participantId?: string;
  participantUserId?: string;
  participantName: string;
  participantTitle: string;
  participantAvatar: string;
  participantRole: "client" | "freelancer";
  contractTitle: string;
  budgetBdt: number;
  escrowBdt: number;
  milestoneTitle: string;
  milestoneStatus: string;
  deliveryDays?: number;
  bidStatus: "ACCEPTED" | "PENDING";
  createdAt?: string;
  milestones?: WorkspaceMilestone[];
  partnerLocation?: string;
}

interface WorkspaceMessagesSectionProps {
  role: "client" | "freelancer";
  lang?: "en" | "bn";
  currentUserId?: string | null;
  currentEntityId?: string | null;
  currentUserName: string;
  currentUserAvatar?: string;
  initialThreadId?: string;
}

export default function WorkspaceMessagesSection({
  role,
  lang = "en",
  currentUserId,
  currentEntityId,
  currentUserName,
  currentUserAvatar,
  initialThreadId,
}: WorkspaceMessagesSectionProps) {
  const supabase = useMemo(() => createClient(), []);
  const [contracts, setContracts] = useState<WorkspaceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId || null);
  const [searchFilter, setSearchFilter] = useState("");
  const [showContractInfo, setShowContractInfo] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("6:41 PM BST");

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        setCurrentTime(
          now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + " BST"
        );
      } catch {}
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real contracts from Supabase / workspace store
  useEffect(() => {
    let isCancelled = false;

    async function loadContracts() {
      setLoading(true);
      try {
        const loaded = await fetchUserContracts(supabase, {
          role,
          userId: currentUserId,
          entityId: currentEntityId,
        });
        if (!isCancelled) {
          setContracts(loaded);
          if (loaded.length > 0) {
            if (initialThreadId) {
              const matched = loaded.find(
                (c) =>
                  c.id === initialThreadId ||
                  c.proposalId === initialThreadId ||
                  c.jobId === initialThreadId ||
                  c.id === `ctr-${initialThreadId}`
              );
              if (matched) {
                setActiveThreadId(matched.id);
                return;
              }
            }
            if (!activeThreadId) {
              setActiveThreadId(loaded[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load workspace contracts for messaging:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadContracts();

    return () => {
      isCancelled = true;
    };
  }, [supabase, role, currentUserId, currentEntityId, initialThreadId]);

  // Map real contracts into 1-to-1 conversation threads
  const threads: ConversationThread[] = useMemo(() => {
    return contracts.map((c) => {
      const isClient = role === "client";
      const partner = isClient ? c.freelancer : c.client;
      const partnerRole = isClient ? ("freelancer" as const) : ("client" as const);
      const partnerTitle = isClient
        ? c.freelancer.title || "Freelancer"
        : c.client.company || "Client Enterprise";

      const activeMilestone =
        c.milestones?.find((m) => m.status === "IN_PROGRESS" || m.status === "SUBMITTED") ||
        c.milestones?.[0];

      return {
        id: c.id,
        contractId: c.id,
        proposalId: c.proposalId,
        participantId: partner.id,
        participantUserId: partner.userId,
        participantName: partner.name || (isClient ? "Freelancer Partner" : "Client Partner"),
        participantTitle: partnerTitle,
        participantAvatar: partner.avatar || DEFAULT_TALK_AVATAR,
        participantRole: partnerRole,
        contractTitle: c.title,
        budgetBdt: c.totalBdt,
        escrowBdt: c.escrowHeldBdt,
        milestoneTitle: activeMilestone?.title || "Milestone 1",
        milestoneStatus: activeMilestone?.status || "IN_PROGRESS",
        bidStatus: "ACCEPTED" as const,
        deliveryDays: 14,
        createdAt: c.startedAt,
        milestones: c.milestones || [],
        partnerLocation: isClient ? "Dhaka, Bangladesh" : c.client.location || "Dhaka, Bangladesh",
      };
    });
  }, [contracts, role]);

  // Selected active thread
  const activeThread = useMemo(() => {
    if (threads.length === 0) return null;
    return threads.find((t) => t.id === activeThreadId) || threads[0];
  }, [threads, activeThreadId]);

  // TalkJS user representation for current user
  const talkMe: TalkUserDef = useMemo(() => {
    const cleanName = currentUserName || (role === "client" ? "Client User" : "Freelancer User");
    const stableId = buildStableTalkUserId({
      userId: currentUserId || currentEntityId,
      role: role,
      name: cleanName,
    });
    return formatTalkUser({
      id: stableId,
      name: cleanName,
      role: role,
      photoUrl: currentUserAvatar,
      welcomeMessage:
        role === "client"
          ? "Hello! Welcome to the MuktoKormo contract workspace."
          : "Hello! I am ready to collaborate on project deliverables.",
      headerTitle: role === "client" ? "Verified Client" : "Verified Specialist",
    });
  }, [role, currentUserId, currentEntityId, currentUserName, currentUserAvatar]);

  // TalkJS user representation for partner in the 1-to-1 conversation
  const talkOther: TalkUserDef | null = useMemo(() => {
    if (!activeThread) return null;
    const stablePartnerId = buildStableTalkUserId({
      userId: activeThread.participantUserId || activeThread.participantId,
      role: activeThread.participantRole,
      name: activeThread.participantName,
    });
    return formatTalkUser({
      id: stablePartnerId,
      name: activeThread.participantName,
      role: activeThread.participantRole,
      photoUrl: activeThread.participantAvatar,
      welcomeMessage: "Looking forward to working together.",
      headerTitle: activeThread.participantTitle,
    });
  }, [activeThread]);

  const filteredThreads = useMemo(() => {
    if (!searchFilter.trim()) return threads;
    const q = searchFilter.toLowerCase();
    return threads.filter(
      (t) =>
        t.participantName.toLowerCase().includes(q) ||
        t.contractTitle.toLowerCase().includes(q)
    );
  }, [threads, searchFilter]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[780px]">
      {/* Main Upwork 3-Column Messaging Layout */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
          <div className="w-8 h-8 border-2 border-[#14a800] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium text-slate-500">
            {lang === "en" ? "Loading messages..." : "মেসেজ লোড হচ্ছে..."}
          </p>
        </div>
      ) : threads.length === 0 ? (
        /* Empty State when no contracts exist */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#14a800] mb-3 shadow-xs">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            {lang === "en" ? "No Active Conversations Yet" : "এখনও কোনো চলমান কথোপকথন নেই"}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mb-5 leading-relaxed">
            {lang === "en"
              ? "Once a proposal is accepted and a contract begins, you and your project partner can communicate directly here in real-time."
              : "একটি বিড বা প্রস্তাব গৃহীত হলে এবং চুক্তি শুরু হলে, আপনি ও আপনার সহকর্মী এখানে সরাসরি রিয়েল-টাইমে যোগাযোগ করতে পারবেন।"}
          </p>
          <div className="flex items-center gap-2.5">
            <Link
              href="/messages"
              className="px-4 py-2 rounded-lg bg-[#14a800] hover:bg-[#108a00] text-white font-medium text-xs shadow-xs transition-colors"
            >
              {lang === "en" ? "Open Messages Inbox" : "মেসেজ ইনবক্স খুলুন"}
            </Link>
            <Link
              href="/contracts"
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-xs transition-colors"
            >
              {lang === "en" ? "View Contracts" : "কন্ট্রাক্ট দেখুন"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* COLUMN 1: Upwork-Style Left Messages Sidebar */}
          <div className="w-80 lg:w-[320px] xl:w-[340px] shrink-0 border-r border-slate-200 flex flex-col bg-white h-full overflow-hidden">
            {/* Messages Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {lang === "en" ? "Messages" : "বার্তা"}
              </h2>
              <button
                type="button"
                title="Options"
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Pill Search Bar */}
            <div className="px-4 pb-3 shrink-0">
              <div className="relative rounded-full bg-slate-100 hover:bg-slate-200/70 focus-within:bg-white border border-transparent focus-within:border-slate-300 flex items-center px-3.5 py-2 gap-2 transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={lang === "en" ? "Search" : "অনুসন্ধান করুন"}
                  className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  title="Filter conversations"
                  className="text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Conversation Cards List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1.5 pb-3">
              {filteredThreads.map((thread) => {
                const isSelected = activeThread?.id === thread.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? "bg-[#14a800] text-white shadow-xs"
                        : "hover:bg-slate-100/80 text-slate-800"
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <img
                        src={thread.participantAvatar}
                        alt={thread.participantName}
                        className={`w-10 h-10 rounded-full object-cover ${
                          isSelected ? "ring-2 ring-white" : ""
                        }`}
                      />
                      <span
                        className={`absolute top-0 left-0 w-2.5 h-2.5 rounded-full ${
                          isSelected
                            ? "bg-emerald-300 ring-2 ring-[#14a800]"
                            : "bg-[#14a800] ring-2 ring-white"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <ArrowUpRight
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? "text-white" : "text-slate-400"
                            }`}
                          />
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {thread.participantName}
                          </h4>
                        </div>
                        <span
                          className={`text-[11px] font-medium shrink-0 ${
                            isSelected ? "text-emerald-100" : "text-slate-400"
                          }`}
                        >
                          6:28 PM
                        </span>
                      </div>

                      <p
                        className={`text-[11px] font-medium truncate mb-0.5 ${
                          isSelected ? "text-emerald-50" : "text-slate-600"
                        }`}
                      >
                        {thread.contractTitle}
                      </p>

                      <p
                        className={`text-[11px] truncate ${
                          isSelected ? "text-emerald-100/90" : "text-slate-400"
                        }`}
                      >
                        {isSelected
                          ? "You: Let me know if that works"
                          : "Looking forward to collaborating..."}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMN 2: Center Middle Chat Column */}
          <div className="flex-1 flex flex-col min-w-0 bg-white h-full overflow-hidden border-r border-slate-200">
            {activeThread && talkOther ? (
              <>
                {/* Header matching Upwork: Name + Phone + Calendar + Panel Toggle */}
                <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
                  <h2 className="text-xl font-bold text-slate-900 truncate">
                    {activeThread.participantName}
                  </h2>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      title="Audio Call"
                      className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Schedule Meeting"
                      className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContractInfo(!showContractInfo)}
                      title={showContractInfo ? "Hide right panel" : "Show right panel"}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                        showContractInfo
                          ? "border-[#14a800] text-[#14a800] bg-emerald-50/50"
                          : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <PanelRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* TalkJS Chatbox Mounted Component */}
                <div className="flex-1 flex flex-col min-h-[500px] w-full h-full overflow-hidden">
                  <TalkJSChat
                    mode="chatbox"
                    conversationId={activeThread.proposalId || activeThread.contractId || activeThread.id}
                    currentUser={talkMe}
                    otherUser={talkOther}
                    subject={activeThread.contractTitle}
                    height="100%"
                    className="h-full flex-1 min-h-[500px]"
                    customData={{
                      contractId: activeThread.contractId,
                      budgetBdt: String(activeThread.budgetBdt),
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                {lang === "en" ? "Select a conversation to begin chatting" : "চ্যাট শুরু করতে একটি কথোপকথন নির্বাচন করুন"}
              </div>
            )}
          </div>

          {/* COLUMN 3: Right Sidebar (Upwork Profile & Activity Timeline) */}
          {showContractInfo && activeThread && (
            <div className="w-72 lg:w-80 shrink-0 bg-white p-4 flex flex-col gap-4 overflow-y-auto">
              {/* Profile Card */}
              <div className="relative pt-1">
                <div className="flex justify-end mb-1">
                  <button
                    type="button"
                    onClick={() => setShowContractInfo(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                    title="Collapse details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center">
                  <div className="relative inline-block mx-auto mb-2">
                    <img
                      src={activeThread.participantAvatar}
                      alt={activeThread.participantName}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <span className="absolute top-0 left-0 w-3 h-3 rounded-full bg-[#14a800] ring-2 ring-white" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {activeThread.participantName}
                  </h3>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeThread.participantTitle || "Partner Enterprise"}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentTime} (local time)</span>
                  </div>

                  <Link
                    href={`/contracts/${activeThread.contractId}`}
                    className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-[#14a800] hover:underline mt-2.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{lang === "en" ? "View contract" : "কন্ট্রাক্ট দেখুন"}</span>
                  </Link>
                </div>
              </div>

              {/* Activity Timeline Card */}
              <div className="rounded-2xl border border-slate-200/90 p-4 bg-white shadow-2xs space-y-3">
                <button
                  type="button"
                  onClick={() => setTimelineOpen(!timelineOpen)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      {lang === "en" ? "Activity timeline" : "অ্যাক্টিভিটি টাইমলাইন"}
                    </span>
                  </div>
                  {timelineOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {timelineOpen && (
                  <div className="pt-2 space-y-1">
                    {/* Step 1: Contract Starts */}
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-snug">
                          {lang === "en" ? "Contract starts" : "চুক্তি শুরু"}
                        </p>
                        <p className="text-[11px] text-slate-400">May 14</p>
                      </div>
                    </div>

                    {/* Connecting Line */}
                    <div className="w-0.5 h-5 bg-slate-200 ml-2.5 my-0.5" />

                    {/* Step 2: Milestone completed or funded */}
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 leading-snug">
                          {activeThread.milestoneTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                          {lang === "en"
                            ? "Milestone has been approved and paid."
                            : "মাইলস্টোন অনুমোদিত ও পরিশোধিত।"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-slate-900">
                            ৳{activeThread.budgetBdt.toLocaleString()}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Paid
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">May 20</p>
                      </div>
                    </div>

                    {/* Connecting Line */}
                    <div className="w-0.5 h-5 bg-slate-200 ml-2.5 my-0.5" />

                    {/* Step 3: Add a new milestone */}
                    <div className="flex items-center gap-2.5 py-1">
                      <div className="w-5 h-5 rounded-full border border-dashed border-[#14a800] flex items-center justify-center text-[#14a800] shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <Link
                        href={`/contracts/${activeThread.contractId}`}
                        className="text-xs font-semibold text-[#14a800] hover:underline"
                      >
                        {lang === "en" ? "Add a new milestone" : "নতুন মাইলস্টোন যোগ করুন"}
                      </Link>
                    </div>

                    {/* Connecting Line */}
                    <div className="w-0.5 h-5 bg-slate-200 ml-2.5 my-0.5" />

                    {/* Step 4: Contract ends */}
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="w-5 h-5 text-slate-400 shrink-0" />
                      <span className="text-xs font-medium text-slate-600">
                        {lang === "en" ? "Contract ends" : "চুক্তি সমাপ্তি"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 1: Search Messages */}
              <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="w-full p-3 flex items-center justify-between text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-500" />
                    <span>{lang === "en" ? "Search messages" : "বার্তা খুঁজুন"}</span>
                  </div>
                  {searchOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {searchOpen && (
                  <div className="p-3 pt-0 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Type to filter..."
                      className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#14a800]"
                    />
                  </div>
                )}
              </div>

              {/* Accordion 2: People */}
              <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setPeopleOpen(!peopleOpen)}
                  className="w-full p-3 flex items-center justify-between text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>{lang === "en" ? "People" : "সদস্য"}</span>
                  </div>
                  {peopleOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {peopleOpen && (
                  <div className="p-3 pt-0 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={currentUserAvatar || DEFAULT_TALK_AVATAR}
                        alt="You"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-800">{currentUserName} (You)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src={activeThread.participantAvatar}
                        alt={activeThread.participantName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-800">
                        {activeThread.participantName} ({activeThread.participantRole})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Files and links */}
              <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setFilesOpen(!filesOpen)}
                  className="w-full p-3 flex items-center justify-between text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    <span>{lang === "en" ? "Files and links" : "ফাইল ও লিংক"}</span>
                  </div>
                  {filesOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {filesOpen && (
                  <div className="p-3 pt-0 border-t border-slate-100 text-xs text-slate-500">
                    <p className="py-1">No shared files in this conversation yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
