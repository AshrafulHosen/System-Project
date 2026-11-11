"use client";

import React, { useState } from "react";
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
  Eye,
  FileText,
  UserCheck,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Building,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostJobModal from "@/components/PostJobModal";
import { formatBdt } from "@/lib/format";

export default function WorkspacesOverviewPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const toggleLang = () => setLang((prev) => (prev === "en" ? "bn" : "en"));

  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive Tour Tab State
  const [activeTourTab, setActiveTourTab] = useState<
    "milestones" | "submit" | "approve" | "chat" | "audit"
  >("milestones");

  // Perspective Tab State
  const [activePerspective, setActivePerspective] = useState<"client" | "freelancer">("client");

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const tourTabs = [
    {
      id: "milestones" as const,
      label: lang === "en" ? "Milestone Tracking" : "মাইলস্টোন ট্র্যাকিং",
      desc: lang === "en" ? "Visual stage progress & escrow custody" : "চলমান মাইলস্টোন ও এসক্রো ট্র্যাকিং",
      icon: Layers,
    },
    {
      id: "submit" as const,
      label: lang === "en" ? "Work Submission" : "ডেলিভারি ও লাইভ ডেমো",
      desc: lang === "en" ? "Submit demo links, code & file assets" : "লাইভ প্রিভিউ লিংক ও ফাইল আপলোড",
      icon: Upload,
    },
    {
      id: "approve" as const,
      label: lang === "en" ? "Review & Revisions" : "রিভিউ ও অনুমোদন",
      desc: lang === "en" ? "1-click escrow payout or revision notes" : "১ ক্লিকে টাকা ছাড় বা রিভিশন অনুরোধ",
      icon: CheckCircle2,
    },
    {
      id: "chat" as const,
      label: lang === "en" ? "1-to-1 Live Messages" : "লাইভ চ্যাট মেসেজিং",
      desc: lang === "en" ? "Built-in TalkJS real-time communication" : "চুক্তি সহকারে সরাসরি ১-টু-১ চ্যাট",
      icon: MessageSquare,
    },
    {
      id: "audit" as const,
      label: lang === "en" ? "Activity Audit Log" : "অডিট ও টাইমলাইন",
      desc: lang === "en" ? "Immutable timeline of every action" : "প্রতিটি কাজের সময়ানুক্রমিক রেকর্ড",
      icon: Clock,
    },
  ];

  const workflowSteps = [
    {
      step: 1,
      title: lang === "en" ? "Contract Initialization" : "চুক্তি ও মাইলস্টোন বরাদ্দ",
      desc:
        lang === "en"
          ? "Client accepts freelancer's bid proposal. The project workspace is automatically created with agreed milestones, deadlines, and BDT escrow custody."
          : "ক্লায়েন্ট ফ্রিল্যান্সারের বিড অনুমোদন করার সাথে সাথেই চুক্তির ওয়ার্কস্পেস স্বয়ংক্রিয়ভাবে তৈরি হয় এবং মাইলস্টোনের টাকা এসক্রোতে জমা থাকে।",
      badge: lang === "en" ? "Phase 1 • Kickoff" : "পর্যায় ১ • শুরু",
    },
    {
      step: 2,
      title: lang === "en" ? "Execution & Direct Messaging" : "কাজ বাস্তবায়ন ও লাইভ মেসেজ",
      desc:
        lang === "en"
          ? "Freelancer develops the milestone deliverables. Both parties stay perfectly synchronized via the integrated 1-to-1 TalkJS chat right inside the workspace."
          : "ফ্রিল্যান্সার মাইলস্টোনের কাজ সম্পন্ন করেন। কাজের কোনো প্রশ্নে ওয়ার্কস্পেসের ভেতরে থাকা ১-টু-১ TalkJS চ্যাটের মাধ্যমে তৎক্ষণাৎ কথা বলতে পারেন।",
      badge: lang === "en" ? "Phase 2 • Active Work" : "পর্যায় ২ • কাজ চলমান",
    },
    {
      step: 3,
      title: lang === "en" ? "Deliverable Submission & Demos" : "লাইভ ডেমো ও ডেলিভারি জমা",
      desc:
        lang === "en"
          ? "Freelancer submits deliverables with live preview URLs (Vercel, Figma, YouTube), GitHub repos, zip attachments, and completion summary notes."
          : "ফ্রিল্যান্সার লাইভ ডেমো লিংক (ভার্সেল, ফিগমা বা ইউটিউব), গিটহাব রিপোজিটরি, ফাইল ও প্রয়োজনীয় নোট লিখে ডেলিভারি জমা দেন।",
      badge: lang === "en" ? "Phase 3 • Review Ready" : "পর্যায় ৩ • ডেলিভারি সাবমিট",
    },
    {
      step: 4,
      title: lang === "en" ? "Approval & Instant Escrow Payout" : "অনুমোদন ও তাৎক্ষণিক পেমেন্ট রিলিজ",
      desc:
        lang === "en"
          ? "Client tests the deliverable. With a single click, client approves the milestone and funds release immediately to freelancer's bKash/Nagad wallet."
          : "ক্লায়েন্ট কাজ যাচাই করে ১ ক্লিকেই অনুমোদন দেন এবং সাথে সাথে এসক্রো টাকা ফ্রিল্যান্সারের বিকাশ/নগদ ওয়ালেটে চলে যায়।",
      badge: lang === "en" ? "Phase 4 • Payout" : "পর্যায় ৪ • পেমেন্ট সম্পন্ন",
    },
  ];

  const faqs = [
    {
      q:
        lang === "en"
          ? "Where do I access my active Workspaces?"
          : "আমার প্রজেক্ট ওয়ার্কস্পেস কোথায় দেখতে পাব?",
      a:
        lang === "en"
          ? "You can access your workspaces anytime from your dashboard. Simply click on the 'Workspace' (ওয়ার্কস্পেস) tab in the left sidebar of either your Client Dashboard or Freelancer Dashboard. It lists all your ongoing and completed projects with real-time milestone controls."
          : "আপনার ক্লায়েন্ট বা ফ্রিল্যান্সার ড্যাশবোর্ডের বাম পাশের সাইডবারে 'Workspace' (ওয়ার্কস্পেস) মেনুতে ক্লিক করলেই আপনার সমস্ত সক্রিয় এবং সম্পন্ন চুক্তির তালিকা ও কন্ট্রোল দেখতে পাবেন।",
    },
    {
      q:
        lang === "en"
          ? "Can a contract have multiple milestones in the Workspace?"
          : "একটি প্রজেক্ট চুক্তিতে কি একাধিক মাইলস্টোন থাকতে পারে?",
      a:
        lang === "en"
          ? "Yes! Projects can be divided into multiple milestones (e.g., Milestone 1: UI Prototype, Milestone 2: Frontend & API Integration, Milestone 3: Testing & Deployment). Each milestone has its own due date, deliverable submission, and escrow release."
          : "হ্যাঁ! একটি প্রজেক্টকে বিভিন্ন ধাপে বা মাইলস্টোনে ভাগ করা যায়। প্রতিটি মাইলস্টোনের নিজস্ব বাজেট, ডেলিভারি ডেডলাইন, জমা দেওয়ার ফর্ম এবং আলাদা এসক্রো রিলিজ থাকে।",
    },
    {
      q:
        lang === "en"
          ? "How does the freelancer submit live demo URLs?"
          : "ফ্রিল্যান্সার কীভাবে লাইভ ডেমো লিংক জমা দেন?",
      a:
        lang === "en"
          ? "Inside the Workspace, the freelancer clicks 'Submit Deliverable'. A modal opens where they can enter live preview links (e.g., Vercel, Netlify, Staging server), attach downloadable asset files, and write completion notes for the client."
          : "ওয়ার্কস্পেসে 'Submit Deliverable' বাটনে ক্লিক করলে একটি মডাল খুলে যেখানে লাইভ প্রিভিউ লিংক (ভার্সেল, স্ট্যাজিং ইত্যাদি), ফাইল ও কাজের বিবরণ লিখে জমা দেওয়া যায়।",
    },
    {
      q:
        lang === "en"
          ? "What happens if a client requests revisions?"
          : "ক্লায়েন্ট রিভিশন চাইলে কী ঘটে?",
      a:
        lang === "en"
          ? "If changes are needed, the client clicks 'Request Revision' and provides clear feedback. The milestone status updates to 'REVISION_REQUESTED', the freelancer receives instant notification, and escrow funds remain safely locked until updated work is submitted and approved."
          : "কাজে কোনো পরিবর্তন লাগলে ক্লায়েন্ট 'Request Revision' বাটনে ক্লিক করে পরিবর্তনের তালিকা লিখে দেন। ফ্রিল্যান্সার সাথে সাথে নোটিফিকেশন পান এবং নতুন কাজ জমা দেওয়া পর্যন্ত টাকা এসক্রোতে সুরক্ষিত থাকে।",
    },
    {
      q:
        lang === "en"
          ? "How does the integrated 1-to-1 messaging work?"
          : "ওয়ার্কস্পেসের সাথে লাইভ মেসেজিং কীভাবে যুক্ত থাকে?",
      a:
        lang === "en"
          ? "Every contract in the workspace features a 'Chat with Partner' button. Clicking it instantly launches the integrated 1-to-1 TalkJS messenger with the complete contract context (total value, escrow held, milestone progress) visible alongside the conversation."
          : "ওয়ার্কস্পেসের প্রতিটি চুক্তির পাশে 'Chat' বাটন রয়েছে। সেখানে ক্লিক করলে চুক্তির সম্পূর্ণ বিবরণ ও এসক্রো স্ট্যাটাস সহকারে ১-টু-১ TalkJS চ্যাটবক্স উন্মুক্ত হয়।",
    },
    {
      q:
        lang === "en"
          ? "Is the activity log permanent and auditable?"
          : "এক্টিভিটি লগ কি স্থায়ী এবং অডিটযোগ্য?",
      a:
        lang === "en"
          ? "Yes. Every contract initialization, deliverable submission, revision request, and escrow release is permanently timestamped with actor identities in the immutable Activity Audit Log, ensuring complete transparency."
          : "হ্যাঁ। চুক্তি তৈরি, ফাইল জমা, রিভিশন চাওয়া এবং টাকা ছাড়ের প্রতিটি পদক্ষেপ স্বয়ংক্রিয়ভাবে সময় ও নাম সহকারে অডিট লগে স্থায়ীভাবে সংরক্ষিত হয়।",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenPostJob={() => setIsPostJobOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION                                                             */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white border-b border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_-10%,rgba(16,185,129,0.22),rgba(0,0,0,0))]" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide shadow-xs">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>{lang === "en" ? "MUKTOKORMO CONTRACT WORKSPACES" : "মুক্তকর্ম কন্ট্রাক্ট ডেলিভারি ওয়ার্কস্পেস"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              {lang === "en" ? (
                <>
                  Contract Delivery Workspaces. <br className="hidden sm:inline" />
                  Built for <span className="text-emerald-400">Frictionless Collaboration</span>.
                </>
              ) : (
                <>
                  প্রজেক্ট ডেলিভারি ওয়ার্কস্পেস। <br className="hidden sm:inline" />
                  ক্লায়েন্ট ও ফ্রিল্যান্সারের <span className="text-emerald-400">নিখুঁত কাজের কেন্দ্রবিন্দু</span>।
                </>
              )}
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {lang === "en"
                ? "The dedicated project management suite where work actually gets done. Track milestones, submit deliverables, test demo URLs, request revisions, and release escrow funds—all in one place."
                : "যেখানে প্রজেক্ট বাস্তবায়িত হয়। মাইলস্টোন ট্র্যাক করুন, লাইভ ডেমো লিংক ও ফাইল জমা দিন, রিভিশন রিভিউ করুন এবং নিরাপদ এসক্রো পেমেন্ট রিলিজ করুন—সবকিছু একই জায়গায়।"}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <Layers className="w-4 h-4" />
                <span>{lang === "en" ? "Open Your Workspace" : "আপনার ওয়ার্কস্পেসে প্রবেশ করুন"}</span>
              </Link>
              <Link
                href="/escrow"
                className="px-6 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 shadow-xs transition-all flex items-center gap-2 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{lang === "en" ? "How Escrow Protects Work" : "এসক্রো পলিসি জানুন"}</span>
              </Link>
            </div>

            {/* Metrics Ribbon */}
            <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
              <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 shadow-xs space-y-1">
                <div className="text-emerald-400 font-black text-lg sm:text-xl">
                  <span>৪,৫০০+</span>
                </div>
                <p className="text-[11px] font-bold text-white">
                  {lang === "en" ? "Milestones Delivered" : "সম্পন্ন মাইলস্টোন"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {lang === "en" ? "Across web, design & marketing" : "আইটি, ডিজাইন ও মার্কেটিংয়ে"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 shadow-xs space-y-1">
                <div className="text-emerald-400 font-black text-lg sm:text-xl">
                  <span>৯৯.৪%</span>
                </div>
                <p className="text-[11px] font-bold text-white">
                  {lang === "en" ? "On-Time Completion" : "সময়মতো ডেলিভারির হার"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {lang === "en" ? "Structured milestones & deadlines" : "নির্দিষ্ট সময়সীমার মধ্যে"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 shadow-xs space-y-1">
                <div className="text-emerald-400 font-black text-lg sm:text-xl">
                  <span>TalkJS 1-to-1</span>
                </div>
                <p className="text-[11px] font-bold text-white">
                  {lang === "en" ? "Contextual Messaging" : "চুক্তি সহকারে মেসেজিং"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {lang === "en" ? "Chat directly in workspace" : "সরাসরি প্রজেক্ট চ্যাট"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 shadow-xs space-y-1">
                <div className="text-emerald-400 font-black text-lg sm:text-xl">
                  <span>100% Audit</span>
                </div>
                <p className="text-[11px] font-bold text-white">
                  {lang === "en" ? "Tamper-Proof Logs" : "অপরিবর্তনীয় অডিট লগ"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {lang === "en" ? "Every deposit, note & release" : "প্রতিটি অ্যাকশনের প্রমাণ"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE WORKSPACE FEATURE TOUR                                        */}
        {/* ========================================================================= */}
        <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              {lang === "en" ? "Inside the Workspace" : "ওয়ার্কস্পেস ইন্টারফেস ট্যুর"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              {lang === "en"
                ? "Experience the Most Intuitive Delivery Environment"
                : "কাজের অগ্রগতির সম্পূর্ণ নিয়ন্ত্রণ আপনার হাতে"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              {lang === "en"
                ? "Click through the tabs below to explore how clients and freelancers interact, deliver, and release escrow funds inside MuktoKormo."
                : "নিচের ফিচার ট্যাবে ক্লিক করে দেখে নিন কীভাবে ক্লায়েন্ট ও ফ্রিল্যান্সার কাজের ফাইল জমা দেন এবং নিরাপদে পেমেন্ট পরিচালনা করেন।"}
            </p>
          </div>

          {/* Tour Tabs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {tourTabs.map((t) => {
              const IconComp = t.icon;
              const isActive = activeTourTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTourTab(t.id)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                    isActive
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <IconComp className={`w-4 h-4 ${isActive ? "text-white" : "text-emerald-600"}`} />
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      FEATURE
                    </span>
                  </div>
                  <p className="text-xs font-bold line-clamp-1">{t.label}</p>
                  <p className={`text-[10px] line-clamp-1 ${isActive ? "text-emerald-100" : "text-slate-400"}`}>
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Interactive Mock Workspace View */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
            {/* Top Bar simulating browser/workspace window */}
            <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-800 text-white text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                  workspace.muktokormo.bd/contracts/MK-CTR-8842
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ESCROW ACTIVE • ৳45,000 BDT
                </span>
              </div>
            </div>

            {/* Tour Tab Content Simulator */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Tab 1: Milestones */}
              {activeTourTab === "milestones" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        CONTRACT MK-CTR-8842
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                        E-Commerce Storefront & bKash Gateway Integration
                      </h3>
                      <p className="text-xs text-slate-500">
                        Client: Apex Lifestyle BD Ltd. • Specialist: Mahmudul Hasan
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-[11px] text-slate-400">Total Contract Value</p>
                        <p className="text-lg font-black text-slate-900">৳45,000</p>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div>
                        <p className="text-[11px] text-emerald-600 font-bold">Secured in Escrow</p>
                        <p className="text-lg font-black text-emerald-600">৳25,000</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Milestones Cards */}
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          1
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">UI Prototype & Responsive Design</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                              APPROVED & RELEASED
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Completed and paid via bKash escrow</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-700">৳15,000</span>
                        <p className="text-[10px] text-slate-400">Released Oct 28</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          2
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">bKash Merchant Checkout & Cart System</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 animate-pulse">
                              IN PROGRESS • LOCKED IN ESCROW
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Freelancer working on webhook integration</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">৳20,000</span>
                        <p className="text-[10px] text-emerald-600 font-bold">100% Escrow Funded</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-80">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                          3
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-700">Final QA, Security Audit & Cloud Deploy</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-600">
                              UPCOMING
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">Funds to be locked upon milestone 2 release</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-600">৳10,000</span>
                        <p className="text-[10px] text-slate-400">Due Nov 15</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Work Submission */}
              {activeTourTab === "submit" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {lang === "en"
                        ? "Freelancer Deliverable Submission Interface: Freelancers submit live URLs and assets, automatically alerting the client for inspection."
                        : "ফ্রিল্যান্সার ডেলিভারি ফর্ম: লাইভ ডেমো লিংক, গিটহাব পিআর ও ফাইল আপলোড করে এক ক্লিকে ক্লায়েন্টকে নোটিফাই করুন।"}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        {lang === "en" ? "Live Demo URL (Vercel, Staging, Figma, etc.):" : "লাইভ প্রিভিউ লিংক:"}
                      </label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-emerald-700 font-mono">
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>https://apex-storefront-demo.vercel.app</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        {lang === "en" ? "Deliverable Completion Summary & Notes:" : "কাজের বিবরণ ও স্পেসিফিকেশন:"}
                      </label>
                      <div className="p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 leading-relaxed">
                        Implemented full bKash payment gateway sandbox flow. Tested with multiple numbers, simulated successful callback, error handling, and order confirmation invoice generation.
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        {lang === "en" ? "Attached Asset Deliverables:" : "সংযুক্ত ফাইল:"}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-emerald-600" />
                          <span>bkash_api_integration_docs.pdf</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-emerald-600" />
                          <span>source_code_snapshot_v2.zip</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{lang === "en" ? "Submit Milestone Deliverable" : "ডেলিভারি জমা দিন"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Review & Revisions */}
              {activeTourTab === "approve" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <span>
                      {lang === "en"
                        ? "Client Inspection & Escrow Decision Modal: The client reviews the submitted work and can either approve & release escrow immediately or request structured revisions."
                        : "ক্লায়েন্ট রিভিউ ইন্টারফেস: কাজ দেখে সন্তুষ্ট হলে ১ ক্লিকে টাকা ছাড় করুন, অথবা কোনো পরিবর্তনের প্রয়োজন হলে রিভিশন নোট পাঠান।"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Approve Action Simulation */}
                    <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-xs font-bold text-emerald-950">Option A: Approve & Release Escrow</h4>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Funds (৳20,000) are released from escrow directly into the freelancer&apos;s wallet. Freelancer can cash out via bKash/Nagad immediately.
                      </p>
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Approve & Release ৳20,000</span>
                      </button>
                    </div>

                    {/* Revision Action Simulation */}
                    <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-amber-600" />
                        <h4 className="text-xs font-bold text-amber-950">Option B: Request Revision</h4>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Need tweaks? Specify adjustments in detail. The milestone updates to &apos;Revision Requested&apos;, and funds remain locked in escrow.
                      </p>
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Revisions</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: 1-to-1 Live Messages */}
              {activeTourTab === "chat" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {lang === "en"
                        ? "Contextual 1-to-1 Messaging: Never switch between WhatsApp or messy email threads. TalkJS live chat is embedded right with contract parameters."
                        : "চুক্তির সাথে সরাসরি মেসেজিং: কোনো হোয়াটসঅ্যাপ বা ইমেইলের বিশৃঙ্খলা নেই। সরাসরি ওয়ার্কস্পেসেই প্রজেক্ট চ্যাট করুন।"}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-3 bg-slate-900 text-white text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold">Mahmudul Hasan (Senior Full-Stack)</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Milestone 2 • ৳20,000 Escrow Held</span>
                    </div>

                    <div className="p-4 bg-slate-50 space-y-3 text-xs">
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                          C
                        </div>
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs max-w-md">
                          <p className="text-slate-800 font-medium">
                            Looking forward to reviewing the bKash checkout flow! Have you tested the refund webhook callback?
                          </p>
                          <span className="text-[9px] text-slate-400 mt-1 block">10:45 AM</span>
                        </div>
                      </div>

                      <div className="flex gap-2.5 justify-end">
                        <div className="bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-none shadow-xs max-w-md">
                          <p className="font-medium">
                            Yes! Just deployed to the Vercel preview link. Both success and refund callbacks are tested and working smoothly.
                          </p>
                          <span className="text-[9px] text-emerald-200 mt-1 block text-right">10:48 AM ✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Activity Audit Log */}
              {activeTourTab === "audit" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {lang === "en"
                        ? "Immutable Activity Audit Log: Every action taken by client, freelancer, or escrow gateway is permanently timestamped for full accountability."
                        : "অপরিবর্তনীয় অডিট লগ: ডিপোজিট, ফাইল জমা, রিভিশন চাওয়া ও পেমেন্ট রিলিজের প্রতিটি পদক্ষেপ সময়সহ সংরক্ষিত থাকে।"}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div>
                          <p className="font-bold text-slate-800">Milestone 1 Approved & ৳15,000 Released</p>
                          <p className="text-[11px] text-slate-400">Actor: Client (Apex Lifestyle) • MFS Trx ID: 8X92KM10</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">Oct 28, 4:15 PM</span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        <div>
                          <p className="font-bold text-slate-800">Deliverable Submitted for Milestone 1</p>
                          <p className="text-[11px] text-slate-400">Actor: Freelancer • Demo URL attached</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">Oct 27, 8:30 PM</span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div>
                          <p className="font-bold text-slate-800">Contract MK-CTR-8842 Initialized</p>
                          <p className="text-[11px] text-slate-400">Actor: MuktoKormo Escrow Gateway • ৳45,000 allocated</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">Oct 25, 11:00 AM</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4-PHASE DELIVERY WORKFLOW                                                 */}
        {/* ========================================================================= */}
        <section className="py-16 bg-slate-50 border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-slate-800 border border-slate-200">
                {lang === "en" ? "Standardized Process" : "কাজের ৪টি সুশৃঙ্খল পর্যায়"}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
                {lang === "en"
                  ? "From Contract Kickoff to Final Approval"
                  : "চুক্তি শুরু থেকে চূড়ান্ত অনুমোদন পর্যন্ত"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowSteps.map((ws) => (
                <div
                  key={ws.step}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-sm flex items-center justify-center border border-emerald-200">
                        {ws.step}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{ws.badge}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{ws.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{ws.desc}</p>
                  </div>
                  <div className="pt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{lang === "en" ? "Escrow Protected" : "এসক্রো সুরক্ষিত"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CLIENT VS FREELANCER PERSPECTIVE CARDS                                    */}
        {/* ========================================================================= */}
        <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {lang === "en" ? "Tailored for Both Roles" : "ক্লায়েন্ট ও ফ্রিল্যান্সার উভয়ের সুবিধার্থে"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {lang === "en"
                ? "See how Contract Workspaces eliminate miscommunication and streamline delivery."
                : "জেনে নিন কীভাবে ওয়ার্কস্পেস ভুল বোঝাবুঝি দূর করে কাজে গতি আনে।"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Client Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
                <Building className="w-3.5 h-3.5" />
                <span>{lang === "en" ? "For Clients" : "ক্লায়েন্টদের সুবিধা"}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {lang === "en" ? "Complete Oversight & Inspection" : "কাজের পূর্ণ নিয়ন্ত্রণ ও তদারকি"}
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Inspect live preview URLs before paying a single Taka</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Manage all hired talent and active milestones from one dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Request organized revisions with feedback history</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Download official PDF invoices and payment receipts</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/dashboard/client"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Go to Client Dashboard Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Freelancer Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>{lang === "en" ? "For Freelancers" : "ফ্রিল্যান্সারদের সুবিধা"}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {lang === "en" ? "Professional Delivery & Guaranteed Payout" : "পেশাদার ডেলিভারি ও দ্রুত পেমেন্ট"}
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Clear milestone scope prevents unpaid scope creep</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Submit demo URLs, code repositories, and asset files seamlessly</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant notification when client approves or sends feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Immediate cashout to bKash or Nagad upon milestone approval</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/dashboard/freelancer"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Go to Freelancer Dashboard Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FAQS ACCORDION                                                            */}
        {/* ========================================================================= */}
        <section className="py-16 sm:py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide">
              <HelpCircle className="w-4 h-4" />
              <span>{lang === "en" ? "Workspace Q&A" : "ওয়ার্কস্পেস প্রশ্নোত্তর"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {lang === "en" ? "Frequently Asked Questions About Workspaces" : "ওয়ার্কস্পেস সম্পর্কিত সাধারণ প্রশ্নাবলী"}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{faq.q}</span>
                    <span className="p-1 rounded-full bg-slate-100 text-slate-500 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* BOTTOM CALL TO ACTION BANNER                                              */}
        {/* ========================================================================= */}
        <section className="py-16 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,rgba(16,185,129,0.25),rgba(0,0,0,0))]" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {lang === "en" ? "Ready to Collaborate?" : "সহজ প্রজেক্ট ম্যানেজমেন্টের অভিজ্ঞতা নিন"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {lang === "en"
                ? "Start Delivering Projects with Guaranteed Escrow"
                : "এসক্রো সুরক্ষায় শুরু করুন পেশাদার প্রজেক্ট ডেলিভারি"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              {lang === "en"
                ? "Manage milestones, deliverables, live chat, and instant payouts—all within MuktoKormo's dedicated workspaces."
                : "মাইলস্টোন অগ্রগতি, ডেলিভারি, লাইভ চ্যাট ও তাৎক্ষণিক পেমেন্ট রিলিজ পরিচালনা করুন মুক্তকর্ম ওয়ার্কস্পেসে।"}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>{lang === "en" ? "Access Dashboard Workspaces" : "ড্যাশবোর্ড ওয়ার্কস্পেস খুলুন"}</span>
              </Link>
              <Link
                href="/escrow"
                className="px-6 py-3 rounded-2xl bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{lang === "en" ? "Explore Escrow Protection" : "এসক্রো পলিসি দেখুন"}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Post Job Modal */}
      {isPostJobOpen && (
        <PostJobModal
          isOpen={isPostJobOpen}
          onClose={() => setIsPostJobOpen(false)}
          onJobCreated={() => setIsPostJobOpen(false)}
          lang={lang}
        />
      )}
    </div>
  );
}
