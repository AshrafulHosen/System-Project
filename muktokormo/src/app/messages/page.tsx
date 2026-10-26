"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckCheck,
  Check,
  Search,
  Sparkles,
  ShieldCheck,
  Handshake,
  Lock,
  ChevronRight,
  ExternalLink,
  Wifi,
  WifiOff,
  Clock,
  MoreVertical,
  User,
  Building,
  Smartphone,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { formatBdt } from "@/lib/format";

import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { INITIAL_WORKSPACE_CONTRACTS } from "@/data/mockContracts";
import { useWorkspaceSocket, ChatMessage, WorkspaceUser } from "@/lib/socket";

interface ConversationThread {
  id: string;
  contractId: string;
  participantName: string;
  participantTitle: string;
  participantAvatar: string;
  participantRole: "client" | "freelancer";
  online: boolean;
  contractTitle: string;
  budgetBdt: number;
  escrowBdt: number;
  milestoneTitle: string;
  milestoneStatus: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  initialMessages: ChatMessage[];
}

const MOCK_CONVERSATIONS: ConversationThread[] = [
  {
    id: "conv-ctr-8842",
    contractId: "ctr-8842",
    participantName: "Tanvir Rahman",
    participantTitle: "Senior Full-Stack Next.js & MFS Engineer",
    participantAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    participantRole: "freelancer",
    online: true,
    contractTitle: "Full-Stack Next.js E-Commerce Website with bKash/Nagad Payment",
    budgetBdt: 42000,
    escrowBdt: 20000,
    milestoneTitle: "Milestone 1: Frontend Storefront & Product Catalogue Responsive UI",
    milestoneStatus: "IN_PROGRESS",
    lastMessage: "I pushed the updated navbar and bKash webhook integration to the preview URL.",
    lastMessageTime: "10:45 AM",
    unreadCount: 1,
    initialMessages: [
      {
        id: "msg-1",
        sender: "Ahad A (Client)",
        time: "Yesterday, 02:40 PM",
        text: "Hello Tanvir! Welcome to the project workspace. Milestone 1 is funded and secured in MuktoKormo Escrow safe.",
        isClient: true,
      },
      {
        id: "msg-2",
        sender: "Tanvir Rahman",
        time: "Yesterday, 03:00 PM",
        text: "Thanks Ahad! I have set up the Next.js 14 App Router project and connected the Tailwind CSS design system.",
        isClient: false,
      },
      {
        id: "msg-3",
        sender: "Tanvir Rahman",
        time: "Today, 10:45 AM",
        text: "I pushed the updated navbar and bKash webhook integration to the preview URL.",
        isClient: false,
        attachments: [
          {
            name: "preview_v1_storefront.png",
            url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
            size: "1.4 MB",
            type: "image",
          },
        ],
      },
    ],
  },
  {
    id: "conv-ctr-9120",
    contractId: "ctr-9120",
    participantName: "Mahmudul Hasan",
    participantTitle: "Full Stack Engineer & PostgreSQL Specialist",
    participantAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    participantRole: "freelancer",
    online: false,
    contractTitle: "Mobile Banking MFS Gateway & SMS OTP Integration",
    budgetBdt: 35000,
    escrowBdt: 17500,
    milestoneTitle: "Milestone 1: Merchant Webhook Architecture",
    milestoneStatus: "SUBMITTED",
    lastMessage: "Submitted code deliverables for Milestone 1. Please review when ready.",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    initialMessages: [
      {
        id: "msg-m1",
        sender: "Mahmudul Hasan",
        time: "Oct 14, 04:15 PM",
        text: "Submitted code deliverables for Milestone 1. Please review when ready.",
        isClient: false,
      },
    ],
  },
  {
    id: "conv-fav-1",
    contractId: "ctr-8842",
    participantName: "Farhana Yasmin",
    participantTitle: "Senior Performance Marketer",
    participantAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    participantRole: "freelancer",
    online: true,
    contractTitle: "Meta CAPI & Conversion Optimization Project",
    budgetBdt: 25000,
    escrowBdt: 12500,
    milestoneTitle: "Milestone 1: Server-Side Pixel Setup",
    milestoneStatus: "PLANNING",
    lastMessage: "Looking forward to starting after the contract terms are finalized.",
    lastMessageTime: "Oct 12",
    unreadCount: 0,
    initialMessages: [
      {
        id: "msg-f1",
        sender: "Farhana Yasmin",
        time: "Oct 12, 11:20 AM",
        text: "Looking forward to starting after the contract terms are finalized.",
        isClient: false,
      },
    ],
  },
];

function MessagesHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role: userRole } = useCurrentUser();

  useEffect(() => {
    if (userRole === "freelancer") {
      router.replace("/dashboard/freelancer#messages");
    } else {
      router.replace("/dashboard/client#messages");
    }
  }, [userRole, router]);

  const [lang, setLang] = useState<"en" | "bn">("en");
  const toggleLang = () => setLang((prev) => (prev === "en" ? "bn" : "en"));

  const [activeRole, setActiveRole] = useState<"client" | "freelancer">("client");
  const [activeThreadId, setActiveThreadId] = useState<string>("conv-ctr-8842");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "ACTIVE" | "UNREAD">("ALL");

  const activeThread = useMemo(() => {
    return MOCK_CONVERSATIONS.find((c) => c.id === activeThreadId) || MOCK_CONVERSATIONS[0];
  }, [activeThreadId]);

  const currentUser: WorkspaceUser = useMemo(
    () => ({
      id: activeRole === "client" ? "client-user-1" : "freelancer-user-1",
      name: activeRole === "client" ? "Ahad A (Apex Lifestyle)" : "Tanvir Rahman",
      role: activeRole,
    }),
    [activeRole]
  );

  // Real-Time Socket.IO Hook
  const {
    messages,
    sendMessage,
    sendTyping,
    isConnected,
    typingUsers,
    onlineMembers,
  } = useWorkspaceSocket({
    roomId: `conversation:${activeThread.id}`,
    currentUser,
    initialMessages: activeThread.initialMessages,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText("");
  };

  const handleAttachQuickDemo = () => {
    sendMessage("Shared updated deliverable link: https://storefront-demo.muktokormo.bd", [
      {
        name: "muktokormo_ecom_v2.png",
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
        size: "2.1 MB",
        type: "image",
      },
    ]);
  };

  const filteredThreads = MOCK_CONVERSATIONS.filter((t) => {
    const matchesSearch =
      t.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contractTitle.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === "UNREAD") return t.unreadCount > 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenPostJob={() => {}}
        lang={lang}
        onToggleLang={toggleLang}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Real-Time Socket Connection Banner & Perspective Selector */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{lang === "en" ? "Socket.IO Live Connected (ws://localhost:3001)" : "সকেট কানেকশন সক্রিয় (পোর্ট ৩০০১)"}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  <span>{lang === "en" ? "Connecting to Socket.IO..." : "সকেটে সংযুক্ত হচ্ছে..."}</span>
                </>
              )}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              {lang === "en" ? "Real-time bi-directional message exchange & milestone sync" : "রিয়েল-টাইম বার্তা ও মাইলস্টোন সিঙ্ক"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {lang === "en" ? "Switch View:" : "ভিউ পরিবর্তন:"}
            </span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveRole("client")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeRole === "client" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
                }`}
              >
                {lang === "en" ? "Client View" : "ক্লায়েন্ট ভিউ"}
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("freelancer")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeRole === "freelancer" ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-900"
                }`}
              >
                {lang === "en" ? "Freelancer View" : "ফ্রিল্যান্সার ভিউ"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Messaging Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Workspace Hub Container */}
        <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[640px]">
          
          {/* ------------------------------------------------------------- */}
          {/* COLUMN 1: CONVERSATIONS LIST (LEFT SIDEBAR)                   */}
          {/* ------------------------------------------------------------- */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col bg-slate-50/50">
            {/* Header & Search */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      {lang === "en" ? "Workspace Messages" : "মেসেজিং হাব"}
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      {lang === "en" ? "Live Socket.IO Rooms" : "লাইভ সকেট রুম"}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  {MOCK_CONVERSATIONS.length} {lang === "en" ? "Active" : "সক্রিয়"}
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={lang === "en" ? "Search conversations..." : "কথোপকথন খুঁজুন..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-emerald-500 font-medium"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 text-[10px] font-bold text-slate-600">
                <button
                  onClick={() => setFilterType("ALL")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filterType === "ALL" ? "bg-slate-900 text-white" : "hover:bg-slate-200/60"
                  }`}
                >
                  {lang === "en" ? "All" : "সকল"}
                </button>
                <button
                  onClick={() => setFilterType("UNREAD")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filterType === "UNREAD" ? "bg-slate-900 text-white" : "hover:bg-slate-200/60"
                  }`}
                >
                  {lang === "en" ? "Unread" : "অপঠিত"}
                </button>
              </div>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredThreads.map((thread) => {
                const isSelected = thread.id === activeThreadId;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected ? "bg-white shadow-xs border-l-4 border-l-emerald-600" : "hover:bg-white/60"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={thread.participantAvatar}
                        alt={thread.participantName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100"
                      />
                      {thread.online && (
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
                          title="Online now via Socket.IO"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {thread.participantName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{thread.lastMessageTime}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mb-1">{thread.contractTitle}</p>

                      <p className="text-[11px] text-slate-600 line-clamp-1 italic font-sans">
                        "{thread.lastMessage}"
                      </p>
                    </div>

                    {thread.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* COLUMN 2: ACTIVE CHAT STREAM (CENTER)                         */}
          {/* ------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={activeThread.participantAvatar}
                    alt={activeThread.participantName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">{activeThread.participantName}</h3>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {activeThread.participantRole === "freelancer"
                        ? lang === "en"
                          ? "Freelancer"
                          : "ফ্রিল্যান্সার"
                        : lang === "en"
                        ? "Client"
                        : "ক্লায়েন্ট"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>
                      {onlineMembers.length > 1
                        ? lang === "en"
                          ? `${onlineMembers.length} active in workspace room`
                          : `${onlineMembers.length} জন সক্রিয় রুমে`
                        : lang === "en"
                        ? "Online on Socket.IO"
                        : "সকেটে সক্রিয়"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/contracts/${activeThread.contractId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Handshake className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === "en" ? "Open Contract Workspace" : "কন্ট্রাক্ট ওয়ার্কস্পেস"}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* Messages Scroll Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              <div className="text-center my-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200">
                  {lang === "en" ? "Real-Time Socket.IO Workspace Room Connected" : "রিয়েল-টাইম সকেট রুম সংযুক্ত"}
                </span>
              </div>

              {messages.map((msg) => {
                const isOwn =
                  (activeRole === "client" && msg.isClient) ||
                  (activeRole === "freelancer" && !msg.isClient);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-700">{msg.sender}</span>
                      <span>• {msg.time}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl max-w-sm sm:max-w-md text-xs leading-relaxed space-y-2 shadow-2xs ${
                        isOwn
                          ? "bg-emerald-600 text-white rounded-tr-none"
                          : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                      }`}
                    >
                      <p>{msg.text}</p>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="pt-2 space-y-1.5 border-t border-white/20">
                          {msg.attachments.map((att, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded-xl flex items-center justify-between gap-2 ${
                                isOwn ? "bg-white/10" : "bg-slate-100"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <ImageIcon className="w-4 h-4 shrink-0 text-emerald-400" />
                                <span className="text-[11px] font-mono truncate">{att.name}</span>
                              </div>
                              <span className="text-[10px] font-bold opacity-80 shrink-0">{att.size}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
                      <CheckCheck className="w-3 h-3 text-emerald-600" />
                      <span>{lang === "en" ? "Delivered via Socket.IO" : "বিতরণকৃত"}</span>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500 italic py-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    {typingUsers.map((u) => u.name).join(", ")} {lang === "en" ? "is typing..." : "লিখছেন..."}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Presets Bar */}
            <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] font-medium text-slate-600">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                {lang === "en" ? "Quick Replies:" : "দ্রুত বার্তা:"}
              </span>
              <button
                type="button"
                onClick={() => sendMessage("Milestone deliverable ready for inspection.")}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 whitespace-nowrap cursor-pointer transition-colors"
              >
                {lang === "en" ? "Deliverable ready" : "কাজের ডেলিভারি প্রস্তুত"}
              </button>
              <button
                type="button"
                onClick={() => sendMessage("Reviewing submitted files now.")}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 whitespace-nowrap cursor-pointer transition-colors"
              >
                {lang === "en" ? "Reviewing files" : "ফাইল পর্যালোচনা করছি"}
              </button>
              <button
                type="button"
                onClick={() => sendMessage("Approved! Releasing milestone funds from bKash escrow.")}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 whitespace-nowrap cursor-pointer transition-colors"
              >
                {lang === "en" ? "Releasing milestone" : "মাইলস্টোন ফান্ড মুক্ত"}
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 flex items-center gap-3">
              <button
                type="button"
                onClick={handleAttachQuickDemo}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title={lang === "en" ? "Attach deliverable file" : "ফাইল সংযুক্ত করুন"}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder={
                  lang === "en"
                    ? `Type a real-time message to ${activeThread.participantName}...`
                    : `${activeThread.participantName}-কে বার্তা লিখুন...`
                }
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  sendTyping();
                }}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-emerald-500 font-medium"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  inputText.trim()
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{lang === "en" ? "Send" : "পাঠান"}</span>
              </button>
            </form>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* COLUMN 3: CONTRACT & WORKSPACE SUMMARY (RIGHT DRAWER)         */}
          {/* ------------------------------------------------------------- */}
          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50/50 p-5 space-y-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                {lang === "en" ? "Associated Contract" : "চুক্তি সংক্রান্ত তথ্য"}
              </span>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                {activeThread.contractTitle}
              </h4>
            </div>

            {/* Milestone Escrow Status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {lang === "en" ? "Escrow Status" : "এসক্রো অবস্থা"}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  {lang === "en" ? "Funded" : "জমা সম্পন্ন"}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800">{activeThread.milestoneTitle}</p>
                <p className="text-base font-black text-slate-900 mt-1">
                  {formatBdt(activeThread.escrowBdt)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {lang === "en" ? "Protected in MuktoKormo MFS safe" : "মুক্তকর্ম এমএফএস এসক্রোতে সুরক্ষিত"}
                </p>
              </div>

              <Link
                href={`/contracts/${activeThread.contractId}`}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>{lang === "en" ? "Manage Milestones" : "মাইলস্টোন পরিচালনা"}</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Collaboration Protocol Guidelines */}
            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lang === "en" ? "Escrow Payment Rules" : "পেমেন্ট নীতিমালা"}</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {lang === "en"
                  ? "Always keep communications and file deliverables inside MuktoKormo workspace to protect milestone escrow coverage."
                  : "এসক্রো সুরক্ষার জন্য সমস্ত আলোচনা ও ফাইল আদান-প্রদান মুক্তকর্মেই সম্পন্ন করুন।"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesHubPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Real-Time Messaging Hub...</div>}>
      <MessagesHubContent />
    </Suspense>
  );
}
