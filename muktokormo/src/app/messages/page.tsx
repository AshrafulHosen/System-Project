"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  CheckSquare,
  Briefcase,
  Search,
  Users,
  UserCheck,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Phone,
  Calendar,
  PanelRight,
  SlidersHorizontal,
  MoreHorizontal,
  Eye,
  Plus,
  Paperclip,
  Clock,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { fetchUserContracts } from "@/lib/data/contracts";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import {
  TALKJS_APP_ID,
  TalkUserDef,
  formatTalkUser,
  buildStableTalkUserId,
  DEFAULT_TALK_AVATAR,
} from "@/lib/talkjs";
import type { WorkspaceContract } from "@/types";

// Dynamically import TalkJSChat on client side (SSR false)
const TalkJSChat = dynamic(() => import("@/components/chat/TalkJSChat"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex flex-col items-center justify-center bg-[#FAF9F6] text-[#6B7278] p-8">
      <div className="w-8 h-8 border-2 border-[#0F6E50] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-medium text-[#6B7278]">Loading conversation...</p>
    </div>
  ),
});

interface ConversationItem {
  id: string;
  contractId?: string;
  proposalId?: string;
  subject: string;
  partner: TalkUserDef;
  budgetBdt?: number;
  escrowBdt?: number;
  milestoneTitle?: string;
  status: string;
}

function MessagesHubContent() {
  const searchParams = useSearchParams();
  const urlConvId = searchParams.get("conversationId");
  const urlContractId = searchParams.get("contractId");
  const urlPartnerId = searchParams.get("partnerId");
  const urlPartnerName = searchParams.get("partnerName");
  const urlPartnerRole = searchParams.get("partnerRole");
  const urlPartnerAvatar = searchParams.get("partnerAvatar");
  const urlSubject = searchParams.get("subject");

  const supabase = useMemo(() => createClient(), []);
  const {
    userId,
    clientId,
    freelancerId,
    name: currentUserName,
    email: currentUserEmail,
    role: userRole,
    avatarUrl: currentUserAvatar,
  } = useCurrentUser();

  const [lang, setLang] = useState<"en" | "bn">("en");
  const toggleLang = () => setLang((prev) => (prev === "en" ? "bn" : "en"));
  const [searchQuery, setSearchQuery] = useState("");
  const [contracts, setContracts] = useState<WorkspaceContract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);

  // Selected conversation thread ID (null falls back to URL / first conversation)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // View mode: 'chatbox' (workspace view with context sidebars) vs 'inbox' (TalkJS native full inbox)
  const [viewMode, setViewMode] = useState<"chatbox" | "inbox">("chatbox");
  const [mobilePane, setMobilePane] = useState<"list" | "chat" | "info">(() =>
    urlPartnerId || urlContractId || urlConvId ? "chat" : "list"
  );
  const [showContractContext, setShowContractContext] = useState(true);
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

  // Load user contracts dynamically from Supabase
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoadingContracts(true);
      try {
        const data = await fetchUserContracts(supabase, {
          role: userRole === "client" || userRole === "freelancer" ? userRole : undefined,
          userId: userId || undefined,
          entityId: (userRole === "client" ? clientId : freelancerId) || undefined,
        });
        if (!isCancelled) {
          setContracts(data);
        }
      } catch (err) {
        console.error("Failed to fetch messaging contracts:", err);
      } finally {
        if (!isCancelled) {
          setLoadingContracts(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [supabase, userRole, userId, clientId, freelancerId]);

  // Transform dynamic contracts and URL params into real 1-to-1 conversation items
  const conversations: ConversationItem[] = useMemo(() => {
    const isClient = userRole === "client";
    const items: ConversationItem[] = contracts.map((c) => {
      const partnerData = isClient ? c.freelancer : c.client;
      const partnerRole = isClient ? ("freelancer" as const) : ("client" as const);
      const partnerTitle = isClient ? c.freelancer.title || "Freelancer" : c.client.company || "Client Enterprise";
      const partnerUserId = isClient ? c.freelancer.userId : c.client.userId;
      const stablePartnerId = buildStableTalkUserId({
        userId: partnerUserId || partnerData.id,
        role: partnerRole,
        name: partnerData.name,
      });

      const activeMilestone =
        c.milestones?.find((m) => m.status === "IN_PROGRESS" || m.status === "SUBMITTED") ||
        c.milestones?.[0];

      return {
        id: c.id,
        contractId: c.id,
        proposalId: c.proposalId,
        subject: c.title,
        partner: formatTalkUser({
          id: stablePartnerId,
          name: partnerData.name,
          role: partnerRole,
          photoUrl: partnerData.avatar || DEFAULT_TALK_AVATAR,
          welcomeMessage: "Looking forward to working together.",
          headerTitle: partnerTitle,
        }),
        budgetBdt: c.totalBdt,
        escrowBdt: c.escrowHeldBdt,
        milestoneTitle: activeMilestone?.title || "Milestone 1",
        status: c.stage || "ACTIVE",
      };
    });

    // If a partner was provided via URL query params (e.g., from profile or bid modal "Contact"),
    // inject this 1-to-1 thread at the top if not already present
    if (urlPartnerId && urlPartnerName) {
      const directId = urlConvId || `direct-${urlPartnerId}`;
      if (!items.some((i) => i.id === directId)) {
        items.unshift({
          id: directId,
          contractId: urlContractId || undefined,
          subject: urlSubject || `Discussion with ${urlPartnerName}`,
          partner: formatTalkUser({
            id: urlPartnerId,
            name: urlPartnerName,
            role: urlPartnerRole || "default",
            photoUrl: urlPartnerAvatar || DEFAULT_TALK_AVATAR,
            welcomeMessage: "Hello! Let's discuss the project requirements.",
            headerTitle: urlPartnerRole === "client" ? "Verified Client" : "Verified Freelancer",
          }),
          status: "DIRECT",
        });
      }
    }

    return items;
  }, [contracts, userRole, urlPartnerId, urlPartnerName, urlPartnerRole, urlPartnerAvatar, urlSubject, urlConvId, urlContractId]);

  // Derive active conversation thread (respecting explicit user click, URL params, or first conversation)
  const activeConvId = useMemo(() => {
    if (selectedConvId && conversations.some((c) => c.id === selectedConvId)) {
      return selectedConvId;
    }
    if (urlConvId && conversations.some((c) => c.id === urlConvId)) {
      return urlConvId;
    }
    if (urlContractId) {
      const match = conversations.find(
        (c) => c.contractId === urlContractId || c.id === urlContractId || c.id === `conv-${urlContractId}`
      );
      if (match) return match.id;
    }
    return conversations[0]?.id ?? null;
  }, [selectedConvId, conversations, urlConvId, urlContractId]);

  // Selected conversation item
  const activeConversation = useMemo(() => {
    if (!activeConvId || conversations.length === 0) return null;
    return conversations.find((c) => c.id === activeConvId) || conversations[0];
  }, [conversations, activeConvId]);

  // Construct current user TalkJS profile
  const currentUser: TalkUserDef = useMemo(() => {
    const cleanRole = userRole || "client";
    const cleanName = currentUserName || (cleanRole === "client" ? "Client User" : "Freelancer User");
    const stableId = buildStableTalkUserId({
      userId,
      role: cleanRole,
      name: cleanName,
    });

    return formatTalkUser({
      id: stableId,
      name: cleanName,
      email: currentUserEmail,
      role: cleanRole,
      photoUrl: currentUserAvatar || DEFAULT_TALK_AVATAR,
      welcomeMessage:
        cleanRole === "client"
          ? "Hello! Welcome to the MuktoKormo contract workspace."
          : "Hello! Ready to collaborate on project deliverables.",
      headerTitle: cleanRole === "client" ? "Verified Client" : "Verified Specialist",
    });
  }, [userId, currentUserName, currentUserEmail, userRole, currentUserAvatar]);

  // Filter conversations in sidebar
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.partner.name.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#111315] flex flex-col selection:bg-[#0F6E50] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenPostJob={() => {}}
        lang={lang}
        onToggleLang={toggleLang}
        searchQuery=""
        onSearchChange={() => {}}
      />

      {/* Minimalist Architectural Sub-Header */}
      <div className="bg-white border-b border-[rgba(17,19,21,0.09)] px-4 sm:px-8 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold text-[#111315]">
              {lang === "en" ? "Messages" : "বার্তা"}
            </h1>
            {conversations.length > 0 && (
              <span className="text-xs font-mono mk-tabular font-bold px-2.5 py-0.5 rounded-full bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/20">
                {conversations.length}
              </span>
            )}
          </div>

          {/* View switcher */}
          <div className="flex items-center bg-[#F4F2EC] border border-[rgba(17,19,21,0.08)] p-1 rounded-xl text-xs font-medium text-[#6B7278]">
            <button
              type="button"
              onClick={() => setViewMode("chatbox")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === "chatbox"
                  ? "bg-white text-[#111315] shadow-2xs font-bold"
                  : "hover:text-[#111315]"
              }`}
            >
              {lang === "en" ? "Workspace" : "ওয়ার্কস্পেস"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("inbox")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === "inbox"
                  ? "bg-white text-[#111315] shadow-2xs font-bold"
                  : "hover:text-[#111315]"
              }`}
            >
              {lang === "en" ? "All Messages" : "ইনবক্স"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Messaging Interface */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-6 flex-1 flex flex-col min-h-0">
        {/* View Selection: Native Full Inbox or Workspace Chatbox View */}
        {viewMode === "inbox" ? (
          /* FULL INBOX VIEW */
          <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1 h-[calc(100vh-170px)] min-h-[600px]">
            <TalkJSChat
              mode="inbox"
              conversationId={activeConversation?.contractId || activeConversation?.id}
              currentUser={currentUser}
              otherUser={activeConversation?.partner}
              subject={activeConversation?.subject}
              height="100%"
              className="h-full flex-1 min-h-[580px]"
            />
          </div>
        ) : loadingContracts ? (
          /* Loading State */
          <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-12 flex flex-col items-center justify-center flex-1">
            <div className="w-8 h-8 border-2 border-[#0F6E50] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium text-[#6B7278]">
              {lang === "en" ? "Loading conversations..." : "কথোপকথন লোড হচ্ছে..."}
            </p>
          </div>
        ) : conversations.length === 0 ? (
          /* Empty State when no conversations or contracts exist */
          <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-12 flex flex-col items-center justify-center text-center flex-1 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF5F0] border border-[#0F6E50]/20 flex items-center justify-center text-[#0F6E50] mb-3 shadow-2xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#111315] mb-1">
              {lang === "en" ? "No Active Conversations Yet" : "এখনও কোনো সক্রিয় বার্তালাপ নেই"}
            </h3>
            <p className="text-xs text-[#6B7278] max-w-md mb-5 leading-relaxed">
              {lang === "en"
                ? "When you hire a freelancer or start a project contract, a private 1-to-1 messaging channel with escrow audit will appear here automatically."
                : "আপনি কাউকে নিয়োগ দিলে বা প্রজেক্ট চুক্তি শুরু করলে, এখানে স্বয়ংক্রিয়ভাবে একটি নিরাপদ ১-অন-১ লাইভ চ্যাট তৈরি হবে।"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setViewMode("inbox")}
                className="px-4 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                {lang === "en" ? "Open Inbox" : "ইনবক্স খুলুন"}
              </button>
              <Link
                href="/contracts"
                className="px-4 py-2 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] hover:bg-[#F4F2EC] text-[#111315] font-bold text-xs shadow-2xs transition-colors"
              >
                {lang === "en" ? "Browse Contracts" : "কন্ট্রাক্ট দেখুন"}
              </Link>
            </div>
          </div>
        ) : (
          /* WORKSPACE CHATBOX VIEW WITH 1-TO-1 THREADS SIDEBAR */
          <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-xs overflow-hidden flex flex-col lg:flex-row flex-1 h-[calc(100vh-170px)] min-h-[600px]">
            {/* COLUMN 1: Left Conversations Sidebar */}
            <div
              className={`w-full lg:w-80 xl:w-[340px] shrink-0 lg:border-r border-[rgba(17,19,21,0.09)] flex-col bg-[#FAF9F6] h-full overflow-hidden ${
                mobilePane === "list" ? "flex" : "hidden lg:flex"
              }`}
            >
              {/* Messages Header */}
              <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-[#111315] tracking-tight">
                  {lang === "en" ? "Conversations" : "বার্তা"}
                </h2>
                <button
                  type="button"
                  title="Options"
                  className="w-8 h-8 rounded-full border border-[rgba(17,19,21,0.12)] bg-white flex items-center justify-center text-[#6B7278] hover:text-[#111315] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-4 pb-3 shrink-0">
                <div className="relative rounded-xl bg-white border border-[rgba(17,19,21,0.10)] focus-within:border-[#0F6E50] focus-within:ring-2 focus-within:ring-[#0F6E50]/15 flex items-center px-3.5 py-2 gap-2 transition-all">
                  <Search className="w-4 h-4 text-[#8B9094] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === "en" ? "Search conversations" : "অনুসন্ধান করুন"}
                    className="w-full bg-transparent text-xs text-[#111315] placeholder-[#8B9094] focus:outline-none"
                  />
                  <button
                    type="button"
                    title="Filter conversations"
                    className="text-[#8B9094] hover:text-[#111315] shrink-0 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto px-3 space-y-1.5 pb-3">
                {filteredConversations.map((conv) => {
                  const isSelected = conv.id === activeConvId;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        setSelectedConvId(conv.id);
                        setMobilePane("chat");
                      }}
                      className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer flex items-start gap-3 relative border ${
                        isSelected
                          ? "bg-[#0B3B2E] border-[#0B3B2E] text-white shadow-xs"
                          : "bg-white border-[rgba(17,19,21,0.08)] hover:border-[#0F6E50]/35 text-[#111315]"
                      }`}
                    >
                      <div className="relative shrink-0 mt-0.5">
                        <img
                          src={conv.partner.photoUrl}
                          alt={conv.partner.name}
                          className={`w-10 h-10 rounded-full object-cover ${
                            isSelected ? "ring-2 ring-white/80" : "ring-1 ring-[rgba(17,19,21,0.10)]"
                          }`}
                        />
                        <span
                          className={`absolute top-0 left-0 w-2.5 h-2.5 rounded-full ${
                            isSelected
                              ? "bg-[#43D69E] ring-2 ring-[#0B3B2E]"
                              : "bg-[#0F6E50] ring-2 ring-white"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <ArrowUpRight
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? "text-[#43D69E]" : "text-[#8B9094]"
                              }`}
                            />
                            <h4
                              className={`text-xs font-bold truncate ${
                                isSelected ? "text-white" : "text-[#111315]"
                              }`}
                            >
                              {conv.partner.name}
                            </h4>
                          </div>
                          <span
                            className={`text-[10px] font-mono mk-tabular font-semibold uppercase shrink-0 ${
                              isSelected ? "text-[#43D69E]" : "text-[#6B7278]"
                            }`}
                          >
                            {conv.status}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] font-medium truncate mb-0.5 ${
                            isSelected ? "text-white/90" : "text-[#3F4448]"
                          }`}
                        >
                          {conv.subject}
                        </p>
                        {typeof conv.budgetBdt === "number" && conv.budgetBdt > 0 ? (
                          <p
                            className={`text-[11px] font-mono mk-tabular truncate ${
                              isSelected ? "text-white/75" : "text-[#6B7278]"
                            }`}
                          >
                            ৳{conv.budgetBdt.toLocaleString()} BDT · {conv.milestoneTitle || "Escrow"}
                          </p>
                        ) : (
                          <p
                            className={`text-[11px] truncate ${
                              isSelected ? "text-white/75" : "text-[#8B9094]"
                            }`}
                          >
                            {conv.partner.headerTitle || "Direct 1-to-1 Thread"}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: Center Middle Chat Column */}
            <div
              className={`flex-1 flex-col min-w-0 bg-white h-full overflow-hidden lg:border-r border-[rgba(17,19,21,0.09)] ${
                mobilePane === "chat" ? "flex" : "hidden lg:flex"
              }`}
            >
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="px-4 sm:px-6 py-3.5 border-b border-[rgba(17,19,21,0.08)] flex items-center justify-between gap-3 bg-white shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setMobilePane("list")}
                        className="lg:hidden p-1.5 rounded-lg border border-[rgba(17,19,21,0.12)] text-[#3F4448] hover:text-[#111315] hover:bg-[#FAF9F6] cursor-pointer shrink-0"
                        title="All conversations"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-[#111315] truncate">
                          {activeConversation.partner.name}
                        </h2>
                        <p className="text-[11px] text-[#6B7278] truncate">
                          {activeConversation.subject}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        title="Audio Call"
                        className="hidden sm:flex w-9 h-9 rounded-full border border-[rgba(17,19,21,0.12)] items-center justify-center text-[#6B7278] hover:text-[#111315] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Schedule Meeting"
                        className="hidden sm:flex w-9 h-9 rounded-full border border-[rgba(17,19,21,0.12)] items-center justify-center text-[#6B7278] hover:text-[#111315] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      {/* Mobile Inspector button */}
                      <button
                        type="button"
                        onClick={() => setMobilePane("info")}
                        title="Contract details"
                        className="lg:hidden w-9 h-9 rounded-full border border-[rgba(17,19,21,0.12)] flex items-center justify-center text-[#0B3B2E] bg-[#EAF5F0] cursor-pointer"
                      >
                        <PanelRight className="w-4 h-4" />
                      </button>
                      {/* Desktop Inspector toggle */}
                      <button
                        type="button"
                        onClick={() => setShowContractContext(!showContractContext)}
                        title={showContractContext ? "Hide right panel" : "Show right panel"}
                        className={`hidden lg:flex w-9 h-9 rounded-full border items-center justify-center transition-colors cursor-pointer ${
                          showContractContext
                            ? "border-[#0F6E50] text-[#0B3B2E] bg-[#EAF5F0]"
                            : "border-[rgba(17,19,21,0.12)] text-[#6B7278] hover:text-[#111315] hover:bg-[#FAF9F6]"
                        }`}
                      >
                        <PanelRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* TalkJS Chatbox Mounted Component */}
                  <div className="flex-1 flex flex-col min-h-[480px] w-full h-full overflow-hidden">
                    <TalkJSChat
                      mode="chatbox"
                      conversationId={activeConversation.proposalId || activeConversation.contractId || activeConversation.id}
                      currentUser={currentUser}
                      otherUser={activeConversation.partner}
                      subject={activeConversation.subject}
                      height="100%"
                      className="h-full flex-1 min-h-[480px]"
                      customData={
                        activeConversation.contractId
                          ? {
                              contractId: activeConversation.contractId,
                              budgetBdt: String(activeConversation.budgetBdt || 0),
                            }
                          : undefined
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[#6B7278] text-xs p-6">
                  {lang === "en" ? "Select a direct conversation to start messaging" : "বার্তা আদান-প্রদান করতে একটি কথোপকথন বেছে নিন"}
                </div>
              )}
            </div>

            {/* COLUMN 3: Right Inspector Sidebar */}
            {activeConversation && (
              <div
                className={`w-full lg:w-72 xl:w-80 shrink-0 bg-[#FAF9F6] p-4 flex-col gap-4 overflow-y-auto ${
                  mobilePane === "info" ? "flex" : "hidden"
                } ${showContractContext ? "lg:flex" : "lg:hidden"}`}
              >
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-[rgba(17,19,21,0.09)] p-4">
                  <div className="flex items-center justify-between mb-1">
                    <button
                      type="button"
                      onClick={() => setMobilePane("chat")}
                      className="lg:hidden inline-flex items-center gap-1 text-xs font-bold text-[#0F6E50] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to chat</span>
                    </button>
                    <span className="hidden lg:inline-block text-[10px] font-bold uppercase tracking-wider text-[#6B7278]">
                      Thread Inspector
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowContractContext(false)}
                      className="hidden lg:inline-flex text-[#6B7278] hover:text-[#111315] p-1 rounded-md transition-colors cursor-pointer"
                      title="Collapse details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <div className="relative inline-block mx-auto mb-2">
                      <img
                        src={activeConversation.partner.photoUrl}
                        alt={activeConversation.partner.name}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-[#0F6E50]/20"
                      />
                      <span className="absolute top-0 left-0 w-3 h-3 rounded-full bg-[#0F6E50] ring-2 ring-white" />
                    </div>

                    <h3 className="text-base font-bold text-[#111315] leading-tight">
                      {activeConversation.partner.name}
                    </h3>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-[#6B7278] mt-1">
                      <Building2 className="w-3.5 h-3.5 text-[#8B9094]" />
                      <span>{activeConversation.partner.headerTitle || "Partner Enterprise"}</span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-xs font-mono mk-tabular text-[#6B7278] mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#8B9094]" />
                      <span>{currentTime} (local time)</span>
                    </div>

                    {activeConversation.contractId && (
                      <Link
                        href={`/contracts/${activeConversation.contractId}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EAF5F0] border border-[#0F6E50]/20 text-xs font-bold text-[#0B3B2E] hover:bg-[#0B3B2E] hover:text-white mt-3 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === "en" ? "View contract" : "কন্ট্রাক্ট দেখুন"}</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Activity Timeline Card */}
                <div className="rounded-2xl border border-[rgba(17,19,21,0.09)] p-4 bg-white space-y-3">
                  <button
                    type="button"
                    onClick={() => setTimelineOpen(!timelineOpen)}
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0F6E50]" />
                      <span className="text-xs font-bold text-[#111315]">
                        {lang === "en" ? "Activity timeline" : "অ্যাক্টিভিটি টাইমলাইন"}
                      </span>
                    </div>
                    {timelineOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#6B7278]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6B7278]" />
                    )}
                  </button>

                  {timelineOpen && (
                    <div className="pt-2 space-y-1">
                      {/* Step 1: Contract Starts */}
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0F6E50] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-[#111315] leading-snug">
                            {lang === "en" ? "Contract active" : "চুক্তি শুরু"}
                          </p>
                          <p className="text-[11px] font-mono mk-tabular text-[#6B7278]">
                            Status: {activeConversation.status}
                          </p>
                        </div>
                      </div>

                      {/* Connecting Line */}
                      <div className="w-0.5 h-4 bg-[rgba(17,19,21,0.10)] ml-2 my-0.5" />

                      {/* Step 2: Milestone & Escrow */}
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0F6E50] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111315] leading-snug">
                            {activeConversation.milestoneTitle || "Milestone 1"}
                          </p>
                          <p className="text-[11px] text-[#6B7278] leading-tight mt-0.5">
                            {lang === "en"
                              ? "Escrow-protected contract deliverable."
                              : "এসক্রো-সুরক্ষিত মাইলস্টোন ডেলিভারেবল।"}
                          </p>
                          {typeof activeConversation.budgetBdt === "number" && activeConversation.budgetBdt > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-xs font-mono mk-tabular font-bold text-[#111315]">
                                ৳{activeConversation.budgetBdt.toLocaleString()}
                              </span>
                              {typeof activeConversation.escrowBdt === "number" && activeConversation.escrowBdt > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono mk-tabular font-bold bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/20">
                                  ৳{activeConversation.escrowBdt.toLocaleString()} Escrow
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Connecting Line */}
                      <div className="w-0.5 h-4 bg-[rgba(17,19,21,0.10)] ml-2 my-0.5" />

                      {/* Step 3: Manage milestone in workspace */}
                      {activeConversation.contractId && (
                        <>
                          <div className="flex items-center gap-2.5 py-1">
                            <div className="w-4 h-4 rounded-full border border-dashed border-[#0F6E50] flex items-center justify-center text-[#0F6E50] shrink-0">
                              <Plus className="w-3 h-3" />
                            </div>
                            <Link
                              href={`/contracts/${activeConversation.contractId}`}
                              className="text-xs font-bold text-[#0F6E50] hover:text-[#0B3B2E] hover:underline"
                            >
                              {lang === "en" ? "Open milestone actions" : "মাইলস্টোন পরিচালনা করুন"}
                            </Link>
                          </div>
                          <div className="w-0.5 h-4 bg-[rgba(17,19,21,0.10)] ml-2 my-0.5" />
                        </>
                      )}

                      {/* Step 4: Contract ends */}
                      <div className="flex items-center gap-2.5">
                        <CheckSquare className="w-4 h-4 text-[#8B9094] shrink-0" />
                        <span className="text-xs font-medium text-[#6B7278]">
                          {lang === "en" ? "Final delivery & settlement" : "চুক্তি সমাপ্তি"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 1: Search Messages */}
                <div className="rounded-xl border border-[rgba(17,19,21,0.09)] overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="w-full p-3 flex items-center justify-between text-xs font-semibold text-[#111315] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#6B7278]" />
                      <span>{lang === "en" ? "Search messages" : "বার্তা খুঁজুন"}</span>
                    </div>
                    {searchOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#6B7278]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6B7278]" />
                    )}
                  </button>
                  {searchOpen && (
                    <div className="p-3 pt-0 border-t border-[rgba(17,19,21,0.07)]">
                      <input
                        type="text"
                        placeholder="Type to filter..."
                        className="w-full text-xs p-2 rounded-lg bg-[#FAF9F6] border border-[rgba(17,19,21,0.10)] focus:outline-none focus:ring-1 focus:ring-[#0F6E50]"
                      />
                    </div>
                  )}
                </div>

                {/* Accordion 2: People */}
                <div className="rounded-xl border border-[rgba(17,19,21,0.09)] overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setPeopleOpen(!peopleOpen)}
                    className="w-full p-3 flex items-center justify-between text-xs font-semibold text-[#111315] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#6B7278]" />
                      <span>{lang === "en" ? "People" : "সদস্য"}</span>
                    </div>
                    {peopleOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#6B7278]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6B7278]" />
                    )}
                  </button>
                  {peopleOpen && (
                    <div className="p-3 pt-2 border-t border-[rgba(17,19,21,0.07)] space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={currentUser.photoUrl}
                          alt="You"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-semibold text-[#111315] truncate">{currentUser.name} (You)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src={activeConversation.partner.photoUrl}
                          alt={activeConversation.partner.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-semibold text-[#111315] truncate">
                          {activeConversation.partner.name} ({activeConversation.partner.role})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 3: Files and links */}
                <div className="rounded-xl border border-[rgba(17,19,21,0.09)] overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setFilesOpen(!filesOpen)}
                    className="w-full p-3 flex items-center justify-between text-xs font-semibold text-[#111315] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-[#6B7278]" />
                      <span>{lang === "en" ? "Files and links" : "ফাইল ও লিংক"}</span>
                    </div>
                    {filesOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#6B7278]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6B7278]" />
                    )}
                  </button>
                  {filesOpen && (
                    <div className="p-3 pt-2 border-t border-[rgba(17,19,21,0.07)] text-xs text-[#6B7278]">
                      <p className="py-1">No shared files in this conversation yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MessagesHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0F6E50] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MessagesHubContent />
    </Suspense>
  );
}
