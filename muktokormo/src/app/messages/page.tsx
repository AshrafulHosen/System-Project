"use client";

import React, { useState, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Lock,
  CheckCircle2,
  Sparkles,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  CheckCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { formatBdt } from "@/lib/format";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import {
  TALKJS_APP_ID,
  TalkUserDef,
  TalkConversationDef,
  PRESET_CLIENT_AHAD,
  PRESET_CLIENT_RAFIQUL,
  PRESET_FREELANCER_TANVIR,
  PRESET_FREELANCER_MAHMUDUL,
  PRESET_FREELANCER_FARHANA,
  PRESET_CONVERSATIONS,
} from "@/lib/talkjs";

// Dynamically import TalkJSChat on client side (SSR false) to ensure browser-only TalkJS SDK
const TalkJSChat = dynamic(() => import("@/components/chat/TalkJSChat"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex flex-col items-center justify-center bg-slate-50 text-slate-500">
      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-semibold">Loading TalkJS Real-Time Messaging...</p>
    </div>
  ),
});

function MessagesHubContent() {
  const searchParams = useSearchParams();
  const urlConvId = searchParams.get("conversationId") || searchParams.get("contractId");

  const { name: currentUserName, email: currentUserEmail, role: userRole } = useCurrentUser();

  const [lang, setLang] = useState<"en" | "bn">("en");
  const toggleLang = () => setLang((prev) => (prev === "en" ? "bn" : "en"));
  const [searchQuery, setSearchQuery] = useState("");

  // Active view role / identity
  const [selectedRole, setSelectedRole] = useState<"client" | "freelancer">("client");

  // Selected conversation thread
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    if (urlConvId) {
      const match = PRESET_CONVERSATIONS.find(
        (c) => c.id === urlConvId || c.contractId === urlConvId
      );
      if (match) return match.id;
    }
    return PRESET_CONVERSATIONS[0].id;
  });

  // UI display mode: 'chatbox' (with contract sidebar) vs 'inbox' (TalkJS full inbox)
  const [viewMode, setViewMode] = useState<"chatbox" | "inbox">("chatbox");
  const [showContractContext, setShowContractContext] = useState(true);

  // Resolve current active conversation definition
  const activeConversation: TalkConversationDef = useMemo(() => {
    return (
      PRESET_CONVERSATIONS.find((c) => c.id === activeConvId) ||
      PRESET_CONVERSATIONS[0]
    );
  }, [activeConvId]);

  // Construct currentUser TalkJS object based on chosen role and logged-in user if available
  const currentUser: TalkUserDef = useMemo(() => {
    if (selectedRole === "client") {
      if (userRole === "client" && currentUserName) {
        return {
          id: `user-${currentUserName.replace(/\s+/g, "-").toLowerCase()}`,
          name: currentUserName,
          email: currentUserEmail || "client@muktokormo.bd",
          role: "client",
          photoUrl: PRESET_CLIENT_AHAD.photoUrl,
          welcomeMessage: "Hello! Welcome to MuktoKormo contract workspace.",
          headerTitle: "Verified Client",
        };
      }
      return activeConversation.client;
    } else {
      if (userRole === "freelancer" && currentUserName) {
        return {
          id: `user-${currentUserName.replace(/\s+/g, "-").toLowerCase()}`,
          name: currentUserName,
          email: currentUserEmail || "freelancer@muktokormo.bd",
          role: "freelancer",
          photoUrl: PRESET_FREELANCER_TANVIR.photoUrl,
          welcomeMessage: "Hello! I am ready to collaborate on project deliverables.",
          headerTitle: "Freelance Specialist",
        };
      }
      return activeConversation.freelancer;
    }
  }, [selectedRole, userRole, currentUserName, currentUserEmail, activeConversation]);

  // Construct otherUser TalkJS object
  const otherUser: TalkUserDef = useMemo(() => {
    return selectedRole === "client"
      ? activeConversation.freelancer
      : activeConversation.client;
  }, [selectedRole, activeConversation]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenPostJob={() => {}}
        lang={lang}
        onToggleLang={toggleLang}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Real-Time Engine & Identity Switcher Banner */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Engine Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{lang === "en" ? "TalkJS Real-Time Cloud Engine" : "টকজেএস রিয়েল-টাইম ক্লাউড সক্রিয়"}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              App ID: {TALKJS_APP_ID}
            </span>
            <span className="text-xs text-slate-400 hidden md:inline">•</span>
            <span className="text-xs text-slate-600 hidden md:inline">
              {lang === "en"
                ? "Bi-directional browser chat with typing status, attachments, and cloud sync"
                : "দ্বি-মুখী ব্রাউজার চ্যাট, টাইপিং স্ট্যাটাস এবং ক্লাউড মেসেজিং"}
            </span>
          </div>

          {/* Right: Interactive Role & Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Perspective / Role Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 px-2 font-bold hidden sm:inline">
                {lang === "en" ? "Testing As:" : "চ্যাট করুন:"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedRole("client")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedRole === "client"
                    ? "bg-white text-emerald-800 shadow-xs font-black"
                    : "hover:text-slate-900"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{lang === "en" ? "Client View" : "ক্লায়েন্ট"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("freelancer")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedRole === "freelancer"
                    ? "bg-white text-emerald-800 shadow-xs font-black"
                    : "hover:text-slate-900"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>{lang === "en" ? "Freelancer View" : "ফ্রিল্যান্সার"}</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setViewMode("chatbox")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === "chatbox"
                    ? "bg-white text-slate-900 shadow-xs font-black"
                    : "hover:text-slate-900"
                }`}
              >
                {lang === "en" ? "Workspace View" : "ওয়ার্কস্পেস"}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("inbox")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === "inbox"
                    ? "bg-white text-slate-900 shadow-xs font-black"
                    : "hover:text-slate-900"
                }`}
              >
                {lang === "en" ? "Full Inbox" : "ইনবক্স"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Messaging Interface Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col">
        {/* Active Identity Bar */}
        <div className="mb-4 bg-white border border-slate-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser.photoUrl}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">
                  {currentUser.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    selectedRole === "client"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-sky-100 text-sky-800"
                  }`}
                >
                  {selectedRole === "client" ? "Active Client" : "Active Freelancer"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {currentUser.email} • {lang === "en" ? "Real-time presence online" : "অনলাইন উপস্থিতি সক্রিয়"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              {lang === "en" ? "Chatting with:" : "কথোপকথন চলছে:"}
            </span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800">
              <img
                src={otherUser.photoUrl}
                alt={otherUser.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span>{otherUser.name}</span>
            </div>
          </div>
        </div>

        {/* TalkJS Embedded View */}
        {viewMode === "inbox" ? (
          /* FULL INBOX VIEW */
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col flex-1">
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  {lang === "en" ? "MuktoKormo Real-Time Messenger (TalkJS Inbox)" : "মুক্তকর্ম রিয়েল-টাইম ইনবক্স"}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {lang === "en" ? "Select any thread to chat" : "কথোপকথন বেছে নিন"}
              </span>
            </div>
            <div className="flex-1 min-h-[640px]">
              <TalkJSChat
                mode="inbox"
                conversationId={activeConversation.id}
                currentUser={currentUser}
                otherUser={otherUser}
                subject={activeConversation.subject}
                height="680px"
              />
            </div>
          </div>
        ) : (
          /* WORKSPACE CHATBOX VIEW WITH CONTRACT SIDEBAR */
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col lg:flex-row flex-1 min-h-[700px]">
            {/* Left: Contract Threads Selection */}
            <div className="w-full lg:w-80 shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/50">
              <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {lang === "en" ? "Active Contracts" : "চলমান চুক্তি সমূহ"}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {lang === "en" ? "Select conversation to collaborate" : "চুক্তি নির্বাচন করুন"}
                  </p>
                </div>
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                  {PRESET_CONVERSATIONS.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
                {PRESET_CONVERSATIONS.map((conv) => {
                  const isSelected = conv.id === activeConvId;
                  const partner = selectedRole === "client" ? conv.freelancer : conv.client;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setActiveConvId(conv.id)}
                      className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? "bg-white border-2 border-emerald-500 shadow-xs"
                          : "hover:bg-white/80 border border-transparent"
                      }`}
                    >
                      <div className="relative shrink-0 mt-0.5">
                        <img
                          src={partner.photoUrl}
                          alt={partner.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-xs"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h5
                            className={`text-xs font-bold truncate ${
                              isSelected ? "text-emerald-950 font-black" : "text-slate-900"
                            }`}
                          >
                            {partner.name}
                          </h5>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            ৳{conv.budgetBdt.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium truncate mb-1">
                          {conv.subject}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{conv.milestoneTitle.split(":")[0]}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center: Live TalkJS Chatbox */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-white/90 backdrop-blur-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={otherUser.photoUrl}
                      alt={otherUser.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {otherUser.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{lang === "en" ? "TalkJS Live" : "টকজেএস লাইভ"}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {activeConversation.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowContractContext(!showContractContext)}
                    className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {showContractContext
                      ? (lang === "en" ? "Hide Details" : "বিস্তারিত লুকান")
                      : (lang === "en" ? "Show Details" : "বিস্তারিত দেখুন")}
                  </button>
                  <Link
                    href={`/contracts/${activeConversation.contractId}`}
                    className="hidden sm:flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-full shadow-xs transition-all"
                  >
                    <span>{lang === "en" ? "Workspace" : "ওয়ার্কস্পেস"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* TalkJS Chatbox Mounted Container */}
              <div className="flex-1 flex flex-col min-h-[580px]">
                <TalkJSChat
                  mode="chatbox"
                  conversationId={activeConversation.id}
                  currentUser={currentUser}
                  otherUser={otherUser}
                  subject={activeConversation.subject}
                  height="600px"
                  customData={{
                    contractId: activeConversation.contractId,
                    budgetBdt: String(activeConversation.budgetBdt),
                  }}
                />
              </div>
            </div>

            {/* Right: Contract Context & Escrow Safe Drawer */}
            {showContractContext && (
              <div className="w-full lg:w-72 shrink-0 border-l border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      {lang === "en" ? "Contract Escrow" : "চুক্তি এসক্রো"}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Protected
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      {activeConversation.subject}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="p-2 rounded-xl bg-slate-50">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          {lang === "en" ? "Budget" : "বাজেট"}
                        </p>
                        <p className="text-xs font-black text-slate-900">
                          ৳{activeConversation.budgetBdt.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase">
                          {lang === "en" ? "Escrow" : "এসক্রো"}
                        </p>
                        <p className="text-xs font-black text-emerald-700">
                          ৳{activeConversation.escrowBdt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Milestone Card */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {lang === "en" ? "Current Milestone" : "বর্তমান মাইলস্টোন"}
                    </p>
                    <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <p className="font-semibold text-slate-900">
                        {activeConversation.milestoneTitle}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{lang === "en" ? "bKash / Nagad Escrow locked" : "এসক্রোতে লকড"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Escrow Rule Note */}
                  <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === "en" ? "Protected Chat" : "সুরক্ষিত বার্তা"}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      {lang === "en"
                        ? "TalkJS real-time communication is logged for milestone review and dispute resolution."
                        : "মাইলস্টোন রিভিউ ও সুরক্ষার জন্য বার্তা আদান-প্রদান মুক্তকর্মেই সম্পন্ন করুন।"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Link
                    href={`/contracts/${activeConversation.contractId}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <span>{lang === "en" ? "Open Contract Workspace" : "ওয়ার্কস্পেস খুলুন"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading TalkJS Real-Time Messaging...</span>
          </div>
        </div>
      }
    >
      <MessagesHubContent />
    </Suspense>
  );
}
