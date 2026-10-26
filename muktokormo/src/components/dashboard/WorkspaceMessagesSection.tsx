"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Search,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Lock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useWorkspaceSocket, ChatMessage, WorkspaceUser } from "@/lib/socket";

export interface ConversationThread {
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
  bidStatus: "ACCEPTED" | "PENDING";
  deliveryDays?: number;
  coverNote?: string;
}

const CLIENT_INITIAL_THREADS: ConversationThread[] = [
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
    milestoneTitle: "Milestone 1: Storefront & Product Catalogue Responsive UI",
    milestoneStatus: "IN_PROGRESS",
    lastMessage: "I pushed the updated navbar and bKash webhook integration to the preview URL.",
    lastMessageTime: "10:45 AM",
    unreadCount: 1,
    bidStatus: "ACCEPTED",
    deliveryDays: 14,
    coverNote: "I have integrated bKash and Nagad payment merchant webhooks for 8+ startups. Ready to deliver high performance.",
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
        text: "Thanks Ahad! I have set up the Next.js App Router project and connected the Tailwind CSS design system.",
        isClient: false,
      },
      {
        id: "msg-3",
        sender: "Tanvir Rahman",
        time: "Today, 10:45 AM",
        text: "I pushed the updated navbar and bKash webhook integration to the preview URL.",
        isClient: false,
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
    milestoneStatus: "PENDING_ACCEPTANCE",
    lastMessage: "Bid submitted: ৳35,000 BDT (14 days delivery). Awaiting bid acceptance.",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    bidStatus: "PENDING",
    deliveryDays: 14,
    coverNote: "Experienced in Next.js 14 App router, Tailwind CSS, PostgreSQL Prisma, and bKash/Nagad Merchant APIs.",
    initialMessages: [
      {
        id: "msg-m-prop",
        sender: "System",
        time: "Yesterday, 04:15 PM",
        text: "Mahmudul Hasan submitted a proposal bid of ৳35,000 BDT. Real-time messaging will unlock once you accept this bid.",
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
    milestoneStatus: "PENDING_ACCEPTANCE",
    lastMessage: "Bid submitted: ৳25,000 BDT (7 days delivery). Awaiting bid acceptance.",
    lastMessageTime: "Oct 12",
    unreadCount: 0,
    bidStatus: "PENDING",
    deliveryDays: 7,
    coverNote: "I specialize in scaling ROAS on Meta and TikTok with server-side CAPI tracking and high-converting copy.",
    initialMessages: [
      {
        id: "msg-f-prop",
        sender: "System",
        time: "Oct 12, 11:20 AM",
        text: "Farhana Yasmin submitted a proposal bid of ৳25,000 BDT. Accept the bid to unlock collaboration.",
        isClient: false,
      },
    ],
  },
];

const FREELANCER_INITIAL_THREADS: ConversationThread[] = [
  {
    id: "conv-ctr-8842",
    contractId: "ctr-8842",
    participantName: "Ahad A (Apex Lifestyle BD)",
    participantTitle: "Hiring Manager · Verified Client (Dhaka)",
    participantAvatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=150&q=80",
    participantRole: "client",
    online: true,
    contractTitle: "Full-Stack Next.js E-Commerce Website with bKash/Nagad Payment",
    budgetBdt: 42000,
    escrowBdt: 20000,
    milestoneTitle: "Milestone 1: Storefront & Product Catalogue Responsive UI",
    milestoneStatus: "IN_PROGRESS",
    lastMessage: "Hello Tanvir! Welcome to the project workspace. Milestone 1 is funded and secured.",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    bidStatus: "ACCEPTED",
    deliveryDays: 14,
    initialMessages: [
      {
        id: "fmsg-1",
        sender: "Ahad A (Client)",
        time: "Yesterday, 02:40 PM",
        text: "Hello! Welcome to the workspace. Your bid of ৳42,000 was accepted. Milestone 1 is locked in escrow.",
        isClient: true,
      },
      {
        id: "fmsg-2",
        sender: "Tanvir Rahman",
        time: "Yesterday, 03:00 PM",
        text: "Thanks Ahad! I have initiated the project structure and began implementing the responsive product cards.",
        isClient: false,
      },
    ],
  },
  {
    id: "conv-client-2",
    contractId: "ctr-9120",
    participantName: "Rafiqul Islam (FinTech Ltd)",
    participantTitle: "CTO, FinTech Solutions Ltd",
    participantAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    participantRole: "client",
    online: true,
    contractTitle: "Mobile Banking MFS Gateway & SMS OTP Integration",
    budgetBdt: 35000,
    escrowBdt: 17500,
    milestoneTitle: "Milestone 1: Merchant Webhook Architecture",
    milestoneStatus: "SUBMITTED",
    lastMessage: "We are reviewing the staging demo now.",
    lastMessageTime: "2:15 PM",
    unreadCount: 1,
    bidStatus: "ACCEPTED",
    deliveryDays: 12,
    initialMessages: [
      {
        id: "fmsg-r1",
        sender: "Rafiqul Islam (Client)",
        time: "Today, 02:15 PM",
        text: "Your bid was accepted and we are reviewing the staging demo now. The callback handlers look solid!",
        isClient: true,
      },
    ],
  },
  {
    id: "conv-client-pending",
    contractId: "ctr-glow",
    participantName: "Tanvir Hossain (GlowBangla)",
    participantTitle: "Managing Director, GlowBangla D2C",
    participantAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    participantRole: "client",
    online: false,
    contractTitle: "Meta & TikTok Ads Campaign Manager for Local D2C Cosmetics",
    budgetBdt: 22000,
    escrowBdt: 0,
    milestoneTitle: "Milestone 1: Campaign Strategy & Pixel Verification",
    milestoneStatus: "PENDING_ACCEPTANCE",
    lastMessage: "Your proposal of ৳22,000 has been submitted. Awaiting client bid acceptance.",
    lastMessageTime: "4 hours ago",
    unreadCount: 0,
    bidStatus: "PENDING",
    deliveryDays: 10,
    initialMessages: [
      {
        id: "fmsg-pending",
        sender: "System",
        time: "Today, 04:00 PM",
        text: "Your bid of ৳22,000 BDT is submitted. Messaging with Tanvir Hossain will unlock automatically once your bid is accepted.",
        isClient: true,
      },
    ],
  },
];

interface WorkspaceMessagesSectionProps {
  role: "client" | "freelancer";
  lang?: "en" | "bn";
  currentUserName: string;
  currentUserAvatar?: string;
  initialThreadId?: string;
}

export default function WorkspaceMessagesSection({
  role,
  lang = "en",
  currentUserName,
  currentUserAvatar,
  initialThreadId,
}: WorkspaceMessagesSectionProps) {
  const initialList = role === "client" ? CLIENT_INITIAL_THREADS : FREELANCER_INITIAL_THREADS;
  const [threads, setThreads] = useState<ConversationThread[]>(initialList);
  const [activeThreadId, setActiveThreadId] = useState<string>(initialThreadId || initialList[0]?.id || "conv-ctr-8842");
  const [searchFilter, setSearchFilter] = useState("");
  const [inputText, setInputText] = useState("");
  const [showContractInfo, setShowContractInfo] = useState(true);
  const [acceptingBid, setAcceptingBid] = useState(false);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || threads[0],
    [threads, activeThreadId]
  );

  const currentSocketUser: WorkspaceUser = useMemo(
    () => ({
      id: currentUserName.replace(/\s+/g, "-").toLowerCase(),
      name: currentUserName,
      role: role,
      avatar: currentUserAvatar || (role === "client" 
        ? "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=150&q=80" 
        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"),
    }),
    [currentUserName, role, currentUserAvatar]
  );

  const handleBidAcceptedEvent = (data: any) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === data.threadId ? { ...t, bidStatus: "ACCEPTED" as const } : t))
    );
  };

  const {
    messages,
    sendMessage: socketSendMessage,
    sendTyping: socketSendTyping,
    acceptBid: socketAcceptBid,
    isConnected,
    typingUsers,
  } = useWorkspaceSocket({
    roomId: `conversation:${activeThread.id}`,
    currentUser: currentSocketUser,
    initialMessages: activeThread.initialMessages,
    onBidAccepted: handleBidAcceptedEvent,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || activeThread.bidStatus !== "ACCEPTED") return;
    socketSendMessage(inputText.trim());
    setInputText("");
  };

  const handleAcceptBid = () => {
    setAcceptingBid(true);
    setTimeout(() => {
      // 1. Emit live socket event
      socketAcceptBid(activeThread.id, activeThread.budgetBdt, activeThread.participantName);

      // 2. Locally update thread status to ACCEPTED
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                bidStatus: "ACCEPTED" as const,
                lastMessage: `Bid accepted (৳${t.budgetBdt.toLocaleString()}). Real-time messaging unlocked.`,
              }
            : t
        )
      );
      setAcceptingBid(false);
    }, 600);
  };

  const filteredThreads = useMemo(() => {
    if (!searchFilter.trim()) return threads;
    return threads.filter(
      (t) =>
        t.participantName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.contractTitle.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [threads, searchFilter]);

  const quickReplies = role === "client"
    ? [
        lang === "en" ? "Looking at the updates now!" : "এখনই আপডেট দেখছি!",
        lang === "en" ? "Funded next milestone in bKash escrow." : "পরবর্তী মাইলস্টোন bKash এসক্রোতে ফান্ড করেছি।",
        lang === "en" ? "Looks great, please proceed." : "দারুণ হয়েছে, পরবর্তী কাজ শুরু করুন।",
      ]
    : [
        lang === "en" ? "Uploaded the deliverables for review." : "রিভিউ এর জন্য কাজ আপলোড করেছি।",
        lang === "en" ? "Working on the feedback now." : "আপনার ফিডব্যাক অনুযায়ী কাজ করছি।",
        lang === "en" ? "Preview link is live and tested." : "প্রিভিউ লিঙ্ক রেডি এবং টেস্ট করা হয়েছে।",
      ];

  const isBidAccepted = activeThread.bidStatus === "ACCEPTED";

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[720px]">
      {/* Top Banner / Socket Status Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">
                {lang === "en" ? "Workspace Real-Time Messaging" : "ওয়ার্কস্পেস রিয়েল-টাইম বার্তা"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Socket.IO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === "en"
                ? "Direct messaging is unlocked after bid acceptance for secure contract collaboration"
                : "নিরাপদ চুক্তি পরিচালনার জন্য বিড অনুমোদনের পর সরাসরি বার্তা সক্রিয় হয়"}
            </p>
          </div>
        </div>

        {/* Live Socket Connection Badge & Actions */}
        <div className="flex items-center gap-2.5">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              isConnected
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400"
                : "bg-amber-950/80 border-amber-500/40 text-amber-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span>
              {isConnected
                ? (lang === "en" ? "Socket Connected :3001" : "সকেট কানেক্টেড :৩০০১")
                : (lang === "en" ? "Connecting to Socket..." : "কানেক্ট হচ্ছে...")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowContractInfo(!showContractInfo)}
            className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            {showContractInfo
              ? (lang === "en" ? "Hide Context" : "লুকান")
              : (lang === "en" ? "Show Context" : "দেখুন")}
          </button>
        </div>
      </div>

      {/* Main 3-Column Messaging Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Conversations Thread List */}
        <div className="w-80 shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3.5 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={lang === "en" ? "Search discussions..." : "কথোপকথন খুঁজুন..."}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100/80 border border-transparent focus:bg-white focus:border-emerald-500 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredThreads.map((thread) => {
              const isSelected = thread.id === activeThread.id;
              const isAccepted = thread.bidStatus === "ACCEPTED";

              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50/70 border-l-4 border-l-emerald-600"
                      : "hover:bg-white"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={thread.participantAvatar}
                      alt={thread.participantName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-xs"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                        thread.online ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isSelected ? "text-emerald-950 font-black" : "text-slate-900"
                        }`}
                      >
                        {thread.participantName}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {thread.lastMessageTime}
                      </span>
                    </div>

                    {/* Bid Status Pill */}
                    <div className="mb-1">
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{lang === "en" ? "Bid Accepted · Live" : "বিড গৃহীত · লাইভ"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                          <Lock className="w-2.5 h-2.5 text-amber-600" />
                          <span>{lang === "en" ? "Bid Pending Review" : "বিড অপেক্ষমাণ"}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mb-1">
                      {thread.contractTitle}
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                      "{thread.lastMessage}"
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Live Chat Feed */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Active Conversation Header */}
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 bg-white/80 backdrop-blur-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={activeThread.participantAvatar}
                  alt={activeThread.participantName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                    activeThread.online ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900 truncate">
                    {activeThread.participantName}
                  </h4>
                  {isBidAccepted ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>{lang === "en" ? "Bid Accepted · Messaging Unlocked" : "বিড গৃহীত · মেসেজিং সক্রিয়"}</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>{lang === "en" ? "Bid Pending · Messaging Locked" : "বিড অপেক্ষমাণ · মেসেজিং লকড"}</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-emerald-700 font-semibold truncate flex items-center gap-1">
                  <span>{activeThread.contractTitle}</span>
                </p>
              </div>
            </div>

            {isBidAccepted ? (
              <Link
                href={`/contracts/${activeThread.contractId}`}
                className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0"
              >
                <span>{lang === "en" ? "Contract Workspace" : "চুক্তি ওয়ার্কস্পেস"}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : role === "client" ? (
              <button
                type="button"
                onClick={handleAcceptBid}
                disabled={acceptingBid}
                className="flex items-center gap-1 text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-full shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{acceptingBid ? (lang === "en" ? "Accepting..." : "অনুমোদন হচ্ছে...") : (lang === "en" ? "Accept Bid & Unlock" : "বিড অনুমোদন ও আনলক")}</span>
              </button>
            ) : null}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
            {/* If Bid is NOT accepted: Show prominent Banner & Unlock Action */}
            {!isBidAccepted && (
              <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-200/90 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      {lang === "en" ? "Messaging Locked Until Bid Acceptance" : "বিড অনুমোদনের পূর্বে মেসেজিং লকড"}
                    </h4>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      {role === "client"
                        ? (lang === "en"
                            ? `To safeguard client privacy and maintain verified hiring records, real-time messaging is only unlocked after you accept ${activeThread.participantName}'s bid.`
                            : `ক্লায়েন্টদের নিরাপত্তা ও বিশ্বস্ত নিয়োগের স্বার্থে ${activeThread.participantName}-এর বিড অনুমোদনের পর সরাসরি মেসেজিং আনলক হবে।`)
                        : (lang === "en"
                            ? `Your bid proposal has been submitted to ${activeThread.participantName}. Direct real-time messaging will unlock automatically once the client accepts your bid.`
                            : `আপনার বিড প্রস্তাবটি ক্লায়েন্ট ${activeThread.participantName}-এর কাছে জমা হয়েছে। ক্লায়েন্ট বিড অনুমোদন করার সাথে সাথে মেসেজিং আনলক হবে।`)}
                    </p>
                  </div>
                </div>

                {/* Bid Details Summary Box */}
                <div className="p-3.5 rounded-2xl bg-white border border-amber-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {lang === "en" ? "Proposed Bid Amount" : "প্রস্তাবিত বিড"}
                    </span>
                    <p className="text-sm font-black text-slate-900">৳{activeThread.budgetBdt.toLocaleString()} BDT</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {lang === "en" ? "Delivery Time" : "ডেলিভারি সময়"}
                    </span>
                    <p className="text-xs font-bold text-slate-700">{activeThread.deliveryDays || 14} {lang === "en" ? "Days" : "দিন"}</p>
                  </div>

                  {role === "client" ? (
                    <button
                      type="button"
                      onClick={handleAcceptBid}
                      disabled={acceptingBid}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {acceptingBid
                          ? (lang === "en" ? "Unlocking Messaging..." : "আনলক হচ্ছে...")
                          : (lang === "en" ? `Accept Bid & Unlock Chat` : "বিড অনুমোদন ও চ্যাট শুরু")}
                      </span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 ml-auto">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{lang === "en" ? "Awaiting Client Acceptance" : "ক্লায়েন্ট অনুমোদনের অপেক্ষায়"}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Safety Notice when Bid is Accepted */}
            {isBidAccepted && (
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-800 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === "en"
                    ? "Bid accepted! Real-time communication is live and protected under MuktoKormo Escrow terms."
                    : "বিড অনুমোদিত! রিয়েল-টাইম আলোচনা সক্রিয় এবং মুক্তকর্ম এসক্রো শর্তানুযায়ী সুরক্ষিত।"}
                </span>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg: any) => {
              const isMine =
                (role === "client" && msg.isClient) ||
                (role === "freelancer" && !msg.isClient);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-700">{msg.sender}</span>
                    <span>• {msg.time}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-sm sm:max-w-md text-xs leading-relaxed shadow-xs ${
                      msg.isSystem
                        ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl font-semibold text-center w-full max-w-lg mx-auto"
                        : isMine
                        ? "bg-emerald-600 text-white rounded-tr-none font-medium"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator (Only active when bid accepted) */}
            {isBidAccepted && typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
                <span>
                  {activeThread.participantName} {lang === "en" ? "is typing..." : "লিখছেন..."}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Chips (Only if Bid Accepted) */}
          {isBidAccepted ? (
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
                {lang === "en" ? "Quick:" : "দ্রুত:"}
              </span>
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    socketSendMessage(reply);
                  }}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200/80 px-2.5 py-1 rounded-full text-slate-600 shrink-0 transition-colors cursor-pointer"
                >
                  {reply}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 border-t border-amber-100 bg-amber-50/60 flex items-center justify-between gap-2 text-[11px] text-amber-800">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === "en" ? "Accept the bid above to enable quick replies and live messaging." : "দ্রুত মেসেজ ও চ্যাট করতে উপরের বিডটি অনুমোদন করুন।"}</span>
              </span>
              {role === "client" && (
                <button
                  type="button"
                  onClick={handleAcceptBid}
                  className="text-[11px] font-bold text-emerald-700 underline hover:text-emerald-800 cursor-pointer"
                >
                  {lang === "en" ? "Accept Bid Now" : "এখনই বিড অনুমোদন করুন"}
                </button>
              )}
            </div>
          )}

          {/* Message Input Box */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              disabled={!isBidAccepted}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (isBidAccepted) socketSendTyping();
              }}
              placeholder={
                !isBidAccepted
                  ? (lang === "en"
                      ? "🔒 Real-time messaging will unlock once the freelancer's bid is accepted."
                      : "🔒 ফ্রিল্যান্সারের বিড অনুমোদনের পর মেসেজিং চালু হবে।")
                  : (lang === "en"
                      ? `Write a real-time message to ${activeThread.participantName}...`
                      : `${activeThread.participantName}-কে বার্তা লিখুন...`)
              }
              className={`flex-1 px-4 py-2.5 border rounded-2xl text-xs transition-all ${
                !isBidAccepted
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed placeholder:text-slate-400"
                  : "bg-slate-50 text-slate-900 border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              }`}
            />
            <button
              type="submit"
              disabled={!isBidAccepted || !inputText.trim()}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                !isBidAccepted || !inputText.trim()
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 cursor-pointer"
              }`}
            >
              {!isBidAccepted ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Locked" : "লকড"}</span>
                </>
              ) : (
                <>
                  <span>{lang === "en" ? "Send" : "পাঠান"}</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Contract Context Drawer */}
        {showContractInfo && (
          <div className="w-72 shrink-0 border-l border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {lang === "en" ? "Contract Context" : "চুক্তি বিবরণ"}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isBidAccepted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isBidAccepted ? "Active Contract" : "Bid Under Review"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
                <p className="text-xs font-bold text-slate-900 line-clamp-2">
                  {activeThread.contractTitle}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === "en" ? "Bid / Budget" : "বিড / বাজেট"}</p>
                    <p className="text-xs font-black text-slate-900">৳{activeThread.budgetBdt.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50/60">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">{lang === "en" ? "Escrow" : "এসক্রো"}</p>
                    <p className="text-xs font-black text-emerald-700">
                      {isBidAccepted ? `৳${activeThread.escrowBdt.toLocaleString()}` : "Pending"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {lang === "en" ? "Milestone Status" : "মাইলস্টোন অবস্থা"}
                </p>
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-slate-900">{activeThread.milestoneTitle}</p>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {isBidAccepted
                        ? (lang === "en" ? "Funds in Escrow safe" : "এসক্রোতে নিরাপদ")
                        : (lang === "en" ? "Escrow unlocks upon bid acceptance" : "বিড গ্রহণে এসক্রো সক্রিয়")}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              {isBidAccepted ? (
                <Link
                  href={`/contracts/${activeThread.contractId}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span>{lang === "en" ? "Open Contract Workspace" : "ওয়ার্কস্পেস খুলুন"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : role === "client" ? (
                <button
                  type="button"
                  onClick={handleAcceptBid}
                  disabled={acceptingBid}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Accept Bid Now" : "বিড অনুমোদন করুন"}</span>
                </button>
              ) : (
                <div className="text-center py-2 text-xs font-bold text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                  {lang === "en" ? "Awaiting Client Acceptance" : "ক্লায়েন্ট অনুমোদনের অপেক্ষায়"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
