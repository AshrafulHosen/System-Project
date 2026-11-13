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
  Upload,
  Sparkles,
  Send,
  RotateCcw,
  FileText,
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

export default function WorkspacesOverviewPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const toggleLang = () => setLang((prev) => (prev === "en" ? "bn" : "en"));

  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTourTab, setActiveTourTab] = useState<
    "milestones" | "submit" | "approve" | "chat" | "audit"
  >("milestones");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const tourTabs = [
    {
      id: "milestones" as const,
      label: lang === "en" ? "Milestone Tracking" : "মাইলস্টোন ট্র্যাকিং",
      desc:
        lang === "en"
          ? "Visual stage progress & escrow custody"
          : "চলমান মাইলস্টোন ও এসক্রো ট্র্যাকিং",
      icon: Layers,
    },
    {
      id: "submit" as const,
      label: lang === "en" ? "Work Submission" : "ডেলিভারি ও লাইভ ডেমো",
      desc:
        lang === "en"
          ? "Submit demo links, code & assets"
          : "লাইভ প্রিভিউ লিংক ও ফাইল আপলোড",
      icon: Upload,
    },
    {
      id: "approve" as const,
      label: lang === "en" ? "Review & Revisions" : "রিভিউ ও অনুমোদন",
      desc:
        lang === "en"
          ? "1-click escrow release or revisions"
          : "১ ক্লিকে টাকা ছাড় বা রিভিশন অনুরোধ",
      icon: CheckCircle2,
    },
    {
      id: "chat" as const,
      label: lang === "en" ? "1-to-1 Live Messages" : "লাইভ চ্যাট মেসেজিং",
      desc:
        lang === "en"
          ? "Built-in TalkJS real-time chat"
          : "চুক্তি সহকারে সরাসরি ১-টু-১ চ্যাট",
      icon: MessageSquare,
    },
    {
      id: "audit" as const,
      label: lang === "en" ? "Activity Audit Log" : "অডিট ও টাইমলাইন",
      desc:
        lang === "en"
          ? "Timestamped record of every action"
          : "প্রতিটি কাজের সময়ানুক্রমিক রেকর্ড",
      icon: Clock,
    },
  ];

  const workflowSteps = [
    {
      step: 1,
      title: lang === "en" ? "Contract Initialization" : "চুক্তি ও মাইলস্টোন",
      desc:
        lang === "en"
          ? "Accepting a proposal automatically provisions the contract workspace with agreed deadlines and BDT escrow parameters."
          : "ক্লায়েন্ট ফ্রিল্যান্সারের বিড অনুমোদন করার সাথে সাথেই চুক্তির ওয়ার্কস্পেস তৈরি হয়।",
      badge: lang === "en" ? "Phase 01" : "পর্যায় ১",
    },
    {
      step: 2,
      title: lang === "en" ? "Execution & TalkJS Chat" : "কাজ ও লাইভ চ্যাট",
      desc:
        lang === "en"
          ? "Collaborate cleanly inside embedded 1-to-1 TalkJS threads attached directly to your contract context."
          : "কাজের কোনো প্রশ্নে ওয়ার্কস্পেসের ভেতরে থাকা ১-টু-১ TalkJS চ্যাটে কথা বলুন।",
      badge: lang === "en" ? "Phase 02" : "পর্যায় ২",
    },
    {
      step: 3,
      title: lang === "en" ? "Deliverable & Demo Links" : "লাইভ ডেমো জমা",
      desc:
        lang === "en"
          ? "Freelancers submit staging links, GitHub URLs, asset lists, and handoff notes cleanly."
          : "ফ্রিল্যান্সার লাইভ ডেমো লিংক, ফাইল ও প্রয়োজনীয় নোট লিখে ডেলিভারি জমা দেন।",
      badge: lang === "en" ? "Phase 03" : "পর্যায় ৩",
    },
    {
      step: 4,
      title: lang === "en" ? "Approval & Payout Release" : "অনুমোদন ও পেমেন্ট",
      desc:
        lang === "en"
          ? "Client tests the submission and authorizes escrow release directly to the freelancer's settlement ledger."
          : "ক্লায়েন্ট কাজ যাচাই করে অনুমোদন দিলে এসক্রো থেকে টাকা ছাড় করা হয়।",
      badge: lang === "en" ? "Phase 04" : "পর্যায় ৪",
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
          ? "Open the Workspace tab inside your Client or Freelancer dashboard, or navigate directly to /contracts to manage every active agreement."
          : "আপনার ক্লায়েন্ট বা ফ্রিল্যান্সার ড্যাশবোর্ডের সাইডবারে 'Workspace' মেনুতে ক্লিক করলেই আপনার সমস্ত সক্রিয় ও সম্পন্ন চুক্তি দেখতে পাবেন।",
    },
    {
      q:
        lang === "en"
          ? "How does TalkJS real-time messaging integrate with contracts?"
          : "ওয়ার্কস্পেসের সাথে লাইভ মেসেজিং কীভাবে যুক্ত থাকে?",
      a:
        lang === "en"
          ? "Every contract links straight to /messages with your partner thread and milestone context alongside a live TalkJS chat panel."
          : "প্রতিটি চুক্তির পাশে মেসেজ বাটন রয়েছে যা সরাসরি চুক্তির বিবরণসহ ১-টু-১ TalkJS চ্যাট উন্মুক্ত করে।",
    },
    {
      q:
        lang === "en"
          ? "What happens if a client requests revisions?"
          : "ক্লায়েন্ট রিভিশন চাইলে কী ঘটে?",
      a:
        lang === "en"
          ? "The client submits structured revision feedback, keeping escrow safely locked while the freelancer prepares an updated submission."
          : "ক্লায়েন্ট সুনির্দিষ্ট রিভিশন নোট পাঠান এবং নতুন ডেলিভারি অনুমোদন হওয়া পর্যন্ত টাকা এসক্রোতে সুরক্ষিত থাকে।",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans selection:bg-brand selection:text-white">
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenPostJob={() => setIsPostJobOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-14 pb-20 bg-navy text-canvas border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_75%_at_50%_-15%,rgba(148,187,228,0.2),transparent)]" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-brand-light border border-white/15 text-[11px] font-semibold tracking-wider">
              <Layers className="w-4 h-4" />
              <span>
                {lang === "en"
                  ? "MUKTOKORMO CONTRACT WORKSPACES"
                  : "মুক্তকর্ম কন্ট্রাক্ট ডেলিভারি ওয়ার্কস্পেস"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-tight leading-[1.1]">
              {lang === "en" ? (
                <>
                  Contract Delivery Workspaces.{" "}
                  <br className="hidden sm:inline" />
                  Built for{" "}
                  <span className="font-normal text-brand-light">
                    frictionless execution.
                  </span>
                </>
              ) : (
                <>
                  প্রজেক্ট ডেলিভারি ওয়ার্কস্পেস।{" "}
                  <br className="hidden sm:inline" />
                  ক্লায়েন্ট ও ফ্রিল্যান্সারের{" "}
                  <span className="font-normal text-brand-light">
                    নিখুঁত কাজের কেন্দ্রবিন্দু
                  </span>
                </>
              )}
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/75 leading-relaxed">
              {lang === "en"
                ? "Manage milestones, inspect live preview URLs, request structured revisions, chat via TalkJS, and release escrow funds — unified inside one clean workspace."
                : "মাইলস্টোন ট্র্যাক করুন, লাইভ ডেমো লিংক জমা দিন, রিভিশন রিভিউ করুন এবং নিরাপদ এসক্রো পেমেন্ট রিলিজ করুন — সবকিছু একই জায়গায়।"}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-sm shadow-lg transition-all inline-flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>
                  {lang === "en"
                    ? "Open Your Workspace"
                    : "আপনার ওয়ার্কস্পেসে প্রবেশ করুন"}
                </span>
              </Link>
              <Link
                href="/escrow"
                className="px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 transition-all inline-flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-brand-light" />
                <span>
                  {lang === "en"
                    ? "Explore Escrow Protection"
                    : "এসক্রো পলিসি জানুন"}
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Interactive Feature Tour */}
        <section className="py-18 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5">
            <span className="px-3 py-1 rounded-full mk-eyebrow bg-brand-soft text-navy border border-brand-border">
              {lang === "en"
                ? "Interactive Preview"
                : "ওয়ার্কস্পেস ইন্টারফেস ট্যুর"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-semibold text-ink tracking-tight">
              {lang === "en"
                ? "Inside Your Delivery Environment"
                : "কাজের অগ্রগতির সম্পূর্ণ নিয়ন্ত্রণ"}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {tourTabs.map((t) => {
              const IconComp = t.icon;
              const isActive = activeTourTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTourTab(t.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                    isActive
                      ? "bg-navy text-white border-navy shadow-md"
                      : "bg-white hover:bg-subtle text-ink border-line"
                  }`}
                >
                  <IconComp
                    className={`w-4 h-4 ${
                      isActive ? "text-brand-light" : "text-brand"
                    }`}
                  />
                  <p className="text-xs font-semibold line-clamp-1">{t.label}</p>
                  <p
                    className={`text-[10px] line-clamp-1 ${
                      isActive ? "text-white/70" : "text-ink-3"
                    }`}
                  >
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Interactive Browser Frame */}
          <div className="bg-white rounded-xl border border-line shadow-[var(--mk-shadow-elevated)] overflow-hidden">
            <div className="bg-navy px-5 py-3.5 flex items-center justify-between border-b border-white/10 text-white text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
                </div>
                <span className="text-white/70 font-mono text-[11px] hidden sm:inline">
                  muktokormo/contracts/MK-CTR-8842
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full mk-eyebrow bg-brand-light/15 text-brand-light">
                ESCROW FUNDED • ৳45,000 BDT
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {activeTourTab === "milestones" && (
                <div className="space-y-5 mk-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
                    <div>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-navy bg-brand-soft px-2.5 py-0.5 rounded-full border border-brand-border">
                        CONTRACT MK-CTR-8842
                      </span>
                      <h3 className="text-lg sm:text-xl font-semibold text-ink mt-1.5">
                        E-Commerce Storefront & SSLCOMMERZ Integration
                      </h3>
                      <p className="text-xs text-ink-3">
                        Client: Apex Lifestyle BD Ltd. • Specialist: Mahmudul Hasan
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[11px] text-ink-3">Total Contract</p>
                        <p className="font-mono text-lg font-semibold text-ink mk-tabular">
                          ৳45,000
                        </p>
                      </div>
                      <div className="h-8 w-px bg-[rgba(16,24,40,0.1)]" />
                      <div>
                        <p className="text-[11px] text-brand font-semibold">
                          In Escrow
                        </p>
                        <p className="font-mono text-lg font-semibold text-brand mk-tabular">
                          ৳20,000
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-brand-soft/70 border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center font-mono font-semibold text-xs shrink-0">
                          1
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-semibold text-ink">
                              UI Prototype & Responsive Design
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-brand border border-brand-border">
                              RELEASED
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-2 mt-0.5">
                            Approved and settled in BDT
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-brand mk-tabular">
                        ৳15,000
                      </span>
                    </div>

                    <div className="p-4 rounded-lg bg-white border-2 border-brand flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-navy text-white flex items-center justify-center font-mono font-semibold text-xs shrink-0">
                          2
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-semibold text-ink">
                              Payment Checkout & Order Pipeline
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-soft text-accent-strong border border-accent-border">
                              LOCKED IN ESCROW
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-3 mt-0.5">
                            Webhook verification in progress
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-ink mk-tabular">
                        ৳20,000
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTourTab === "submit" && (
                <div className="space-y-4 mk-fade-in">
                  <div className="p-4 rounded-lg bg-brand-soft border border-brand-border text-xs text-navy flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <span>
                      Freelancers attach live preview URLs, completion summaries, and
                      asset filenames inside the structured submission modal.
                    </span>
                  </div>
                  <div className="border border-line rounded-lg p-5 space-y-4 bg-canvas">
                    <div>
                      <span className="block mk-eyebrow text-ink-3 mb-1">
                        Live Preview URL
                      </span>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-line rounded-lg text-xs text-brand font-mono">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>https://apex-storefront-demo.vercel.app</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-lg bg-white border border-line text-[11px] font-semibold text-ink inline-flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-brand" />
                        checkout_spec_v2.pdf
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-white border border-line text-[11px] font-semibold text-ink inline-flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-brand" />
                        source_snapshot.zip
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <span className="px-4 py-2 rounded-lg bg-brand text-white font-semibold text-xs inline-flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        Submit Deliverable
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTourTab === "approve" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mk-fade-in">
                  <div className="p-5 rounded-lg bg-brand-soft/75 border border-brand-border space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-brand" />
                      <h4 className="text-xs font-semibold text-navy">
                        Approve & Release Escrow
                      </h4>
                    </div>
                    <p className="text-xs text-ink-2 leading-relaxed">
                      Authorize release immediately once deliverables satisfy the brief.
                    </p>
                    <div className="py-2.5 rounded-lg bg-brand text-white text-center font-semibold text-xs">
                      Approve & Release ৳20,000
                    </div>
                  </div>

                  <div className="p-5 rounded-lg bg-accent-soft border border-accent-border space-y-3">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-accent-strong" />
                      <h4 className="text-xs font-semibold text-accent-strong">
                        Request Structured Revisions
                      </h4>
                    </div>
                    <p className="text-xs text-ink-2 leading-relaxed">
                      Specify requested changes while escrow remains protected in full.
                    </p>
                    <div className="py-2.5 rounded-lg bg-accent-strong text-white text-center font-semibold text-xs">
                      Send Revision Feedback
                    </div>
                  </div>
                </div>
              )}

              {activeTourTab === "chat" && (
                <div className="border border-line rounded-lg overflow-hidden mk-fade-in">
                  <div className="p-3.5 bg-navy text-white text-xs flex items-center justify-between">
                    <span className="font-semibold inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-light" />
                      Mahmudul Hasan — Full-Stack Specialist
                    </span>
                    <span className="text-[11px] text-white/65">
                      TalkJS Real-Time Channel
                    </span>
                  </div>
                  <div className="p-4 bg-canvas space-y-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-line max-w-md">
                      Looking forward to reviewing the checkout preview!
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-navy text-white p-3 rounded-lg max-w-md">
                        Deployed on Vercel staging — success and validation callbacks
                        are ready to inspect.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTourTab === "audit" && (
                <div className="space-y-2.5 text-xs mk-fade-in">
                  {[
                    {
                      title: "Milestone 1 Approved & ৳15,000 Released",
                      meta: "Client Approval • Ledger Entry Recorded",
                      time: "Oct 28, 4:15 PM",
                    },
                    {
                      title: "Deliverable Submitted for Milestone 1",
                      meta: "Freelancer • Demo URL verified",
                      time: "Oct 27, 8:30 PM",
                    },
                    {
                      title: "Contract MK-CTR-8842 Initialized",
                      meta: "Escrow Gateway • ৳45,000 total contract",
                      time: "Oct 25, 11:00 AM",
                    },
                  ].map((log) => (
                    <div
                      key={log.title}
                      className="p-3.5 bg-canvas border border-line rounded-lg flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-semibold text-ink">{log.title}</p>
                        <p className="text-[11px] text-ink-3">{log.meta}</p>
                      </div>
                      <span className="font-mono text-[10px] text-ink-3 shrink-0">
                        {log.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4-Phase Workflow */}
        <section className="py-16 bg-subtle/75 border-y border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
                {lang === "en"
                  ? "From Contract Kickoff to Final Payout"
                  : "চুক্তি শুরু থেকে চূড়ান্ত অনুমোদন পর্যন্ত"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {workflowSteps.map((ws) => (
                <div
                  key={ws.step}
                  className="bg-white rounded-xl p-6 border border-line flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-lg bg-brand-soft text-navy font-mono font-semibold text-xs flex items-center justify-center border border-brand-border">
                        0{ws.step}
                      </span>
                      <span className="mk-eyebrow text-ink-3">
                        {ws.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-ink">{ws.title}</h3>
                    <p className="text-xs text-ink-3 leading-relaxed">{ws.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Role Cards */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-xl bg-white border border-line space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand-strong border border-brand-border text-xs font-semibold">
                <Building className="w-3.5 h-3.5" />
                For Clients
              </span>
              <h3 className="text-lg font-semibold text-ink">
                Complete Oversight & Inspection
              </h3>
              <ul className="space-y-2.5 text-xs text-ink-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>Inspect live preview URLs before authorizing payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>Track deliverables and revisions cleanly in one dashboard</span>
                </li>
              </ul>
              <Link
                href="/dashboard/client"
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 pt-2"
              >
                <span>Open Client Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6 sm:p-8 rounded-xl bg-white border border-line space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-navy border border-brand-border text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-brand" />
                For Freelancers
              </span>
              <h3 className="text-lg font-semibold text-ink">
                Structured Delivery & Escrow Certainty
              </h3>
              <ul className="space-y-2.5 text-xs text-ink-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>Submit live demos, notes, and deliverable files</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>Real-time updates via TalkJS and notifications</span>
                </li>
              </ul>
              <Link
                href="/dashboard/freelancer"
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 pt-2"
              >
                <span>Open Freelancer Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-14 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand uppercase tracking-[0.08em]">
              <HelpCircle className="w-4 h-4" />
              <span>Workspace Q&A</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-line overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-canvas"
                  >
                    <span className="font-semibold text-xs sm:text-sm text-ink">
                      {faq.q}
                    </span>
                    <span className="p-1.5 rounded-lg bg-subtle text-ink-3 shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 text-xs text-ink-2 leading-relaxed border-t border-line">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 bg-navy text-white border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight">
              {lang === "en"
                ? "Start Delivering Projects Inside Your Workspace"
                : "এসক্রো সুরক্ষায় শুরু করুন পেশাদার প্রজেক্ট ডেলিভারি"}
            </h2>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Access Dashboard Workspace</span>
              </Link>
              <Link
                href="/escrow"
                className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/16 text-white font-semibold text-xs sm:text-sm border border-white/15 inline-flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-brand-light" />
                <span>Explore Escrow Protection</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer lang={lang} />

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
