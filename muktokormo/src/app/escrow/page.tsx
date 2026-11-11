"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Smartphone,
  CreditCard,
  Building,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Handshake,
  Clock,
  RotateCcw,
  Scale,
  Award,
  Layers,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostJobModal from "@/components/PostJobModal";
import { formatBdt } from "@/lib/format";

export default function EscrowProtectionPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const toggleLang = () => setLang((prev) => (prev === "en" ? "bn" : "en"));

  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive Calculator State
  const [calculatorBudget, setCalculatorBudget] = useState<number>(35000);
  const [calculatorRole, setCalculatorRole] = useState<"client" | "freelancer">("client");

  // Interactive Step State
  const [activeStep, setActiveStep] = useState<number>(1);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  // Fee calculation (flat 7% platform fee)
  const platformFee = Math.round(calculatorBudget * 0.07);
  const netEarnings = calculatorBudget - platformFee;

  const steps = [
    {
      num: 1,
      title: lang === "en" ? "Fund Milestone in Escrow" : "এসক্রোতে মাইলস্টোন ফান্ড জমা",
      desc:
        lang === "en"
          ? "Client deposits milestone funds using bKash, Nagad, Rocket, or local bank card into MuktoKormo's secured escrow vault. Freelancer is immediately notified."
          : "ক্লায়েন্ট বিকাশ, নগদ, রকেট বা ব্যাংক কার্ডের মাধ্যমে মাইলস্টোন পেমেন্ট মুক্তকর্মের নিরাপদ এসক্রো ভল্টে জমা রাখেন। ফ্রিল্যান্সার সাথে সাথে নোটিফিকেশন পান।",
      badge: lang === "en" ? "Step 1 • Deposit" : "ধাপ ১ • তহবিল জমা",
      icon: Lock,
    },
    {
      num: 2,
      title: lang === "en" ? "Confident Execution" : "নিশ্চিন্তে কাজ শুরু",
      desc:
        lang === "en"
          ? "Freelancer works knowing that 100% of the milestone funds are safely locked in BDT escrow. No more fear of unpaid invoices or client vanishing."
          : "ফ্রিল্যান্সার নিশ্চিত থাকেন যে শতভাগ টাকা এসক্রোতে জমা রয়েছে। কাজ শেষে টাকা না পাওয়ার কোনো ঝুঁকি থাকে না।",
      badge: lang === "en" ? "Step 2 • In Progress" : "ধাপ ২ • কাজ চলমান",
      icon: Clock,
    },
    {
      num: 3,
      title: lang === "en" ? "Deliverable Submission & Inspection" : "ডেলিভারি জমা ও যাচাই",
      desc:
        lang === "en"
          ? "Freelancer submits deliverables, live demo URLs, and assets in the Contract Workspace. Client inspects work, tests live links, and requests revisions if necessary."
          : "ফ্রিল্যান্সার প্রজেক্ট ওয়ার্কস্পেসে কাজের লিংক ও ফাইল জমা দেন। ক্লায়েন্ট লাইভ ডেমো দেখে কাজের গুণমান যাচাই করেন এবং প্রয়োজনে রিভিশন চান।",
      badge: lang === "en" ? "Step 3 • Review" : "ধাপ ৩ • রিভিউ ও ফিডব্যাক",
      icon: RotateCcw,
    },
    {
      num: 4,
      title: lang === "en" ? "Instant Automated Payout" : "অনুমোদনে তাৎক্ষণিক পেমেন্ট ছাড়",
      desc:
        lang === "en"
          ? "Once client is fully satisfied and clicks 'Approve', escrow funds are immediately credited to the freelancer's wallet for instant cashout to bKash or Nagad."
          : "ক্লায়েন্ট কাজ সন্তোষজনক পেয়ে 'Approve' বাটনে ক্লিক করা মাত্রই এসক্রো টাকা ফ্রিল্যান্সারের ওয়ালেটে চলে যায় এবং বিকাশ/নগদে ক্যাশআউট করা যায়।",
      badge: lang === "en" ? "Step 4 • Release" : "ধাপ ৪ • পেমেন্ট খালাস",
      icon: CheckCircle2,
    },
    {
      num: 5,
      title: lang === "en" ? "Fair Dispute Mediation" : "নিরপেক্ষ বিরোধ নিষ্পত্তি",
      desc:
        lang === "en"
          ? "In the rare event of an impasse, MuktoKormo's dedicated dispute team audits the original project brief and deliverables to issue a fair, binding resolution."
          : "কোনো মতবিরোধ দেখা দিলে মুক্তকর্মের নিরপেক্ষ আর্বিট্রেশন টিম আসল কাজের চুক্তি ও ডেলিভারি পর্যালোচনা করে ন্যায্য সমাধান দেয়।",
      badge: lang === "en" ? "Step 5 • Mediation" : "ধাপ ৫ • নিরাপত্তা সুরক্ষা",
      icon: Scale,
    },
  ];

  const faqs = [
    {
      q:
        lang === "en"
          ? "How does MuktoKormo BDT Escrow protect clients?"
          : "মুক্তকর্ম বিডিটি এসক্রো কীভাবে ক্লায়েন্টকে সুরক্ষা দেয়?",
      a:
        lang === "en"
          ? "As a client, your funds never go directly to the freelancer before you inspect and approve their completed deliverable. If a freelancer fails to deliver or abandons the project, the escrowed funds are refunded to your MuktoKormo wallet or original payment source."
          : "ক্লায়েন্ট হিসেবে আপনার টাকা কাজ যাচাই ও অনুমোদন না করা পর্যন্ত ফ্রিল্যান্সারের কাছে পৌঁছায় না। ফ্রিল্যান্সার কাজ শেষ করতে ব্যর্থ হলে বা কাজ ফেলে চলে গেলে এসক্রোর টাকা আপনার ওয়ালেটে রিফান্ড করা হয়।",
    },
    {
      q:
        lang === "en"
          ? "How does Escrow guarantee payment for Bangladeshi freelancers?"
          : "এসক্রো কীভাবে বাংলাদেশি ফ্রিল্যান্সারদের পারিশ্রমিক নিশ্চিত করে?",
      a:
        lang === "en"
          ? "Before you write a single line of code or design an asset, you can see that the client has funded the milestone in escrow. Once you complete the agreed milestone requirements, the client must either approve the release or provide specific revision notes within the contract workspace."
          : "কোনো কাজ শুরু করার আগেই আপনি দেখতে পাবেন ক্লায়েন্ট টাকা এসক্রোতে জমা রেখেছেন কি না। কাজ সম্পন্ন হওয়ার পর চুক্তি অনুযায়ী ক্লায়েন্ট হয় পেমেন্ট রিলিজ করবেন, না হয় সুনির্দিষ্ট রিভিশন নোট প্রদান করবেন।",
    },
    {
      q:
        lang === "en"
          ? "Which payment methods are supported for escrow deposits?"
          : "এসক্রো ডিপোজিটের জন্য কোন কোন পেমেন্ট মাধ্যম সমর্থিত?",
      a:
        lang === "en"
          ? "Clients can fund escrows in Bangladeshi Taka (BDT) via bKash Merchant Checkout, Nagad, Rocket, or local Visa / Mastercard / UnionPay bank cards. There are zero foreign exchange conversion losses."
          : "ক্লায়েন্টরা বিকাশ মার্চেন্ট পেমেন্ট, নগদ, রকেট এবং যেকোনো বাংলাদেশি ভিসা/মাস্টারকার্ড দিয়ে সরাসরি বিডিটি (BDT)-তে এসক্রো ফান্ড জমা করতে পারেন। কোনো ডলার কনভার্সন ফি লাগে না।",
    },
    {
      q:
        lang === "en"
          ? "What are the platform fees for escrow contracts?"
          : "এসক্রো চুক্তির জন্য প্ল্যাটফর্ম ফি কত?",
      a:
        lang === "en"
          ? "MuktoKormo charges a flat, transparent 7% platform fee deducted only when funds are released to the freelancer. There are no monthly subscription fees, no bidding credit purchase requirements, and no hidden payment gateway markups."
          : "মুক্তকর্ম মাত্র ৭% সমতল ও স্বচ্ছ প্ল্যাটফর্ম ফি নেয়, যা কাজ অনুমোদনের পর ফ্রিল্যান্সারের আয় থেকে কর্তন করা হয়। কোনো মাসিক সাবস্ক্রিপশন ফি বা হিডেন চার্জ নেই।",
    },
    {
      q:
        lang === "en"
          ? "What happens if a client is unresponsive after I submit my deliverable?"
          : "ডেলিভারি জমা দেওয়ার পর ক্লায়েন্ট উত্তর না দিলে কী হবে?",
      a:
        lang === "en"
          ? "MuktoKormo provides a 14-day automated review window. If a client does not request revisions or respond within 14 calendar days after deliverable submission, the locked milestone funds are automatically approved and released to the freelancer."
          : "মুক্তকর্মের রয়েছে ১৪ দিনের অটোমেটিক রিভিউ উইন্ডো। ডেলিভারি জমা দেওয়ার পর ১৪ দিনের মধ্যে ক্লায়েন্ট কোনো রিভিশন না চাইলে বা সাড়া না দিলে এসক্রো টাকা স্বয়ংক্রিয়ভাবে ফ্রিল্যান্সারের জন্য রিলিজ হয়ে যায়।",
    },
    {
      q:
        lang === "en"
          ? "How does the dispute arbitration process work?"
          : "বিরোধ নিষ্পত্তি বা ডিসপিউট কীভাবে কাজ করে?",
      a:
        lang === "en"
          ? "Either party can raise a dispute in the workspace. Our mediation specialists examine the project scope, submitted deliverables, chat logs, and milestone requirements to issue a binding, fair verdict within 48 to 72 hours."
          : "যেকোনো পক্ষ ওয়ার্কস্পেস থেকে বিরোধ উত্থাপন করতে পারেন। আমাদের বিশেষজ্ঞ মধ্যস্থতাকারী দল কাজের চুক্তি, জমা দেওয়া ফাইল ও মেসেজ অডিট করে ৪৮ থেকে ৭২ ঘণ্টার মধ্যে নিরপেক্ষ ও ন্যায্য রায় দেন।",
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
        <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-emerald-50/50 via-slate-50 to-white border-b border-slate-200/80">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />
          
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold tracking-wide shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>{lang === "en" ? "MUKTOKORMO BDT ESCROW CUSTODY" : "মুক্তকর্ম ১০০% বিডিটি এসক্রো হেফাজত"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
              {lang === "en" ? (
                <>
                  100% BDT Escrow Protection. <br className="hidden sm:inline" />
                  <span className="text-emerald-600">Zero Risk</span> for Clients & Talent.
                </>
              ) : (
                <>
                  ১০০% নিরাপদ বিডিটি এসক্রো। <br className="hidden sm:inline" />
                  ক্লায়েন্ট ও ফ্রিল্যান্সার উভয়ের জন্যই <span className="text-emerald-600">সম্পূর্ণ ঝুঁকিমুক্ত</span>।
                </>
              )}
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              {lang === "en"
                ? "The gold standard of payment safety in Bangladesh. Clients only pay when milestones are satisfied and approved. Freelancers are guaranteed full payment with funds locked before work begins."
                : "বাংলাদেশের ফ্রিল্যান্সিংয়ে পেমেন্ট সুরক্ষার সর্বোচ্চ মান। ক্লায়েন্ট কাজ পছন্দ ও অনুমোদন করলেই কেবল পেমেন্ট ছাড়া হয়, আর ফ্রিল্যান্সার কাজ শুরুর আগেই এসক্রোতে টাকা জমা দেখে নিশ্চিন্ত হন।"}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/post-job"
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{lang === "en" ? "Post a Job with Escrow" : "এসক্রো সুরক্ষায় কাজ পোস্ট করুন"}</span>
              </Link>
              <Link
                href="/#jobs-section"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs hover:border-slate-400 transition-all flex items-center gap-2 active:scale-95"
              >
                <Handshake className="w-4 h-4 text-emerald-600" />
                <span>{lang === "en" ? "Browse Guaranteed Bids" : "চলমান কাজগুলো দেখুন"}</span>
              </Link>
            </div>

            {/* Trust Highlights Strip */}
            <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-lg sm:text-xl">
                  <span>৳২.৮+ কোটি</span>
                </div>
                <p className="text-[11px] font-bold text-slate-800">
                  {lang === "en" ? "Protected in Escrow" : "এসক্রোতে লেনদেনকৃত"}
                </p>
                <p className="text-[10px] text-slate-500">
                  {lang === "en" ? "Across 5,000+ local milestones" : "৫,০০০+ সফল মাইলস্টোনে"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-lg sm:text-xl">
                  <span>0%</span>
                </div>
                <p className="text-[11px] font-bold text-slate-800">
                  {lang === "en" ? "Unpaid Invoices" : "বকেয়া থাকার ঝুঁকি শূন্য"}
                </p>
                <p className="text-[10px] text-slate-500">
                  {lang === "en" ? "Funds secured before kickoff" : "কাজ শুরুর আগেই ফান্ড লকড"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-lg sm:text-xl">
                  <span>bKash / নগদ</span>
                </div>
                <p className="text-[11px] font-bold text-slate-800">
                  {lang === "en" ? "Instant Local MFS" : "সহজ স্থানীয় পেমেন্ট"}
                </p>
                <p className="text-[10px] text-slate-500">
                  {lang === "en" ? "Zero dollar exchange fee" : "কোনো মুদ্রা রূপান্তর ক্ষতি নেই"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-lg sm:text-xl">
                  <span>Porichoy NID</span>
                </div>
                <p className="text-[11px] font-bold text-slate-800">
                  {lang === "en" ? "Verified Accounts" : "এনআইডি যাচাইকৃত"}
                </p>
                <p className="text-[10px] text-slate-500">
                  {lang === "en" ? "100% genuine identity check" : "ভুয়া বা নকল অ্যাকাউন্ট রোধ"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* HOW ESCROW WORKS: INTERACTIVE 5-STEP VISUAL LIFECYCLE                     */}
        {/* ========================================================================= */}
        <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
              {lang === "en" ? "The Escrow Workflow" : "এসক্রো কীভাবে কাজ করে"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              {lang === "en"
                ? "5 Transparent Steps from Deposit to Instant Payout"
                : "ডিপোজিট থেকে পেমেন্ট খালাস—সহজ ৫টি স্বচ্ছ ধাপ"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              {lang === "en"
                ? "Both parties are protected at every juncture. Click each milestone step below to see how funds are secured."
                : "কাজের প্রতিটি পদক্ষেপে উভয় পক্ষের স্বার্থ শতভাগ সুরক্ষিত থাকে। বিস্তারিত জানতে নিচের প্রতিটি ধাপে ক্লিক করুন।"}
            </p>
          </div>

          {/* Interactive Steps Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {steps.map((s) => {
              const IconComp = s.icon;
              const isActive = activeStep === s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveStep(s.num)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                    isActive
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                        isActive ? "bg-white text-emerald-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {s.num}
                    </span>
                    <IconComp className={`w-4 h-4 ${isActive ? "text-white" : "text-emerald-600"}`} />
                  </div>
                  <p className="text-xs font-bold line-clamp-1">{s.title}</p>
                </button>
              );
            })}
          </div>

          {/* Active Step Feature Box */}
          {(() => {
            const current = steps.find((s) => s.num === activeStep) || steps[0];
            return (
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in zoom-in-95 duration-200">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                    <span>{current.badge}</span>
                  </div>
                  <h3 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                    {current.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {current.desc}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{lang === "en" ? "Bank-Grade Encryption" : "ব্যাংক গ্রেড এনক্রিপশন"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{lang === "en" ? "Porichoy NID Verified" : "পরিচয় এনআইডি নিশ্চিত"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{lang === "en" ? "Instant Automated Receipts" : "স্বয়ংক্রিয় ডিজিটাল রিসিট"}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <span className="text-slate-400 font-medium">
                      {lang === "en" ? "Escrow Vault Status" : "এসক্রো ভল্ট স্ট্যাটাস"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      SECURED & VERIFIED
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>{lang === "en" ? "Contract Currency:" : "লেনদেনের মুদ্রা:"}</span>
                      <span className="font-bold text-white">Bangladeshi Taka (BDT ৳)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{lang === "en" ? "Deposit Gateways:" : "ডিপোজিট মাধ্যম:"}</span>
                      <span className="font-bold text-white">bKash, Nagad, Rocket, Card</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{lang === "en" ? "Release Authorization:" : "পেমেন্ট ছাড়ের অনুমতি:"}</span>
                      <span className="font-bold text-emerald-400">Client Explicit Approval</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{lang === "en" ? "Auto-Release Timer:" : "অটো-রিলিজ সময়সীমা:"}</span>
                      <span className="font-bold text-white">14 Days of Inactivity</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {lang === "en"
                        ? "100% of deposited funds remain locked in escrow until the client reviews and releases them or arbitration decides."
                        : "ক্লায়েন্ট কাজ যাচাই করে ছাড় না দেওয়া বা বিরোধ নিষ্পত্তি না হওয়া পর্যন্ত এসক্রোর টাকা শতভাগ সুরক্ষিত থাকে।"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* ========================================================================= */}
        {/* DUAL PERSPECTIVES: FOR CLIENTS VS FOR FREELANCERS                         */}
        {/* ========================================================================= */}
        <section className="py-16 bg-slate-50 border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
                {lang === "en"
                  ? "Guaranteed Protection for Both Sides of the Market"
                  : "উভয় পক্ষের জন্যই নিশ্চিন্ত আর্থিক নিরাপত্তা"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                {lang === "en"
                  ? "Traditional freelance transactions are fraught with mistrust. MuktoKormo BDT Escrow creates alignment and mutual trust."
                  : "সাধারণ লেনদেনের অবিশ্বাস দূর করে মুক্তকর্ম এসক্রো তৈরি করে পেশাদার আস্থার পরিবেশ।"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Client Box */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
                    <Building className="w-3.5 h-3.5" />
                    <span>{lang === "en" ? "For Clients & Employers" : "ক্লায়েন্ট ও নিয়োগদাতাদের জন্য"}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {lang === "en" ? "Pay Only When Deliverables Satisfy You" : "কাজ সন্তোষজনক হলেই কেবল পেমেন্ট"}
                  </h3>

                  <ul className="space-y-3 text-xs text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>{lang === "en" ? "Zero Upfront Risk: " : "শূন্য আর্থিক ঝুঁকি: "}</strong>
                        {lang === "en"
                          ? "Never worry about paying upfront only for the talent to disappear without finishing."
                          : "টাকা দিয়ে ফ্রিল্যান্সার কাজ শেষ না করে উধাও হয়ে যাওয়ার কোনো ভয় নেই।"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>{lang === "en" ? "Inspect Before Release: " : "যাচাইয়ের পরেই ছাড়: "}</strong>
                        {lang === "en"
                          ? "Test demo URLs, review GitHub PRs, and check Figma prototypes before clicking approve."
                          : "লাইভ ডেমো লিংক ও ফাইল ভালোভাবে পরীক্ষা করে তবেই পেমেন্ট রিলিজ করবেন।"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>{lang === "en" ? "Multi-Milestone Funding: " : "ধাপে ধাপে মাইলস্টোন বরাদ্দ: "}</strong>
                        {lang === "en"
                          ? "Break large projects into manageable milestones (e.g. 25% UI, 50% Backend, 25% Launch)."
                          : "পুরো প্রজেক্টের টাকা একবারে না দিয়ে বিভিন্ন মাইলস্টোনে ভাগ করে জমা রাখুন।"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>{lang === "en" ? "Official Corporate Receipts: " : "অফিসিয়াল কর ও ডিজিটাল ভাউচার: "}</strong>
                        {lang === "en"
                          ? "Download audit-ready PDF invoices for corporate tax and accounting records in Bangladesh."
                          : "কোম্পানির হিসাব ও ট্যাক্স ফাইলিংয়ের জন্য তাৎক্ষণিক ডাউনলোডযোগ্য ইনভয়েস পান।"}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href="/post-job"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <span>{lang === "en" ? "Hire with Escrow Protection" : "এসক্রো সুরক্ষায় কাজ পোস্ট করুন"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Freelancer Box */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    <Award className="w-3.5 h-3.5" />
                    <span>{lang === "en" ? "For Independent Freelancers" : "ফ্রিল্যান্সারদের জন্য"}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {lang === "en" ? "Guaranteed Compensation for Every Deliverable" : "কাজের শতভাগ পারিশ্রমিকের গ্যারান্টি"}
                  </h3>

                  <ul className="space-y-3 text-xs text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>{lang === "en" ? "Guaranteed Funding Before Starting: " : "কাজ শুরুর আগেই পেমেন্ট নিশ্চিত: "}</strong>
                        {lang === "en"
                          ? "Never work on empty promises. Verify that money is deposited in escrow before writing code."
                          : "কোনো মৌখিক আশ্বাসে নয়, এসক্রোতে টাকা জমা দেখে নিশ্চিন্তে কোডিং বা ডিজাইন শুরু করুন।"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>{lang === "en" ? "Instant Mobile Cashout: " : "বিকাশ ও নগদে তাৎক্ষণিক ক্যাশআউট: "}</strong>
                        {lang === "en"
                          ? "Funds land in your MuktoKormo wallet and withdraw directly to your personal bKash/Nagad within minutes."
                          : "অনুমোদনের সাথে সাথে টাকা ওয়ালেটে আসে এবং বিকাশ/নগদে ক্যাশআউট হয়ে যায়।"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>{lang === "en" ? "Protection from Unreasonable Scope Creep: " : "অতিরিক্ত ফ্রি কাজের দাবি থেকে সুরক্ষা: "}</strong>
                        {lang === "en"
                          ? "Milestone descriptions bind the scope. Clients cannot demand extra features without funding a new milestone."
                          : "মাইলস্টোনের চুক্তির বাইরে ক্লায়েন্ট অতিরিক্ত কোনো কাজ দাবি করতে পারেন না।"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>{lang === "en" ? "Automated 14-Day Release: " : "১৪ দিনের অটো-রিলিজ সুরক্ষা: "}</strong>
                        {lang === "en"
                          ? "If a client disappears or becomes unresponsive after you submit valid work, funds release automatically."
                          : "ডেলিভারির পর ক্লায়েন্ট নিরুদ্দেশ হলে ১৪ দিন পর স্বয়ংক্রিয়ভাবে পেমেন্ট পেয়ে যাবেন।"}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href="/#jobs-section"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <span>{lang === "en" ? "Find Escrow Protected Jobs" : "এসক্রো সুরক্ষিত কাজ খুঁজুন"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE ESCROW FEE CALCULATOR                                         */}
        {/* ========================================================================= */}
        <section className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              {lang === "en" ? "Transparent Economics" : "স্বচ্ছ ফি ক্যালকুলেটর"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              {lang === "en" ? "Interactive Escrow & Fee Calculator" : "এসক্রো ও পারিশ্রমিক হিসাব করুন"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {lang === "en"
                ? "Flat 7% platform fee. No hidden foreign exchange markups, no credit card processing penalties."
                : "মাত্র ৭% ফ্ল্যাট ফি। কোনো গোপন কারেন্সি কনভার্সন চার্জ বা আন্তর্জাতিক ব্যাংকিং ফি নেই।"}
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-md space-y-6">
            {/* Role switch */}
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCalculatorRole("client")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    calculatorRole === "client"
                      ? "bg-white text-emerald-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {lang === "en" ? "I am a Client" : "আমি ক্লায়েন্ট"}
                </button>
                <button
                  type="button"
                  onClick={() => setCalculatorRole("freelancer")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    calculatorRole === "freelancer"
                      ? "bg-white text-emerald-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {lang === "en" ? "I am a Freelancer" : "আমি ফ্রিল্যান্সার"}
                </button>
              </div>
            </div>

            {/* Budget Presets */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {lang === "en" ? "Select or Enter Project Escrow Amount (BDT):" : "প্রজেক্টের এসক্রো পরিমাণ নির্বাচন করুন (টাকা):"}
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {[15000, 30000, 50000, 75000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCalculatorBudget(amt)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      calculatorBudget === amt
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    ৳{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="relative pt-2">
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="5000"
                  value={calculatorBudget}
                  onChange={(e) => setCalculatorBudget(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>৳৫,০০০</span>
                  <span>৳১,০০,০০০</span>
                  <span>৳২,০০,০০০</span>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown Card */}
            <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {lang === "en" ? "Total Escrow Locked in BDT:" : "এসক্রোতে জমাকৃত মোট অর্থ:"}
                </span>
                <span className="font-black text-slate-900 text-base">{formatBdt(calculatorBudget)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {lang === "en" ? "MuktoKormo Platform Service (7%):" : "মুক্তকর্ম প্ল্যাটফর্ম ফি (৭%):"}
                </span>
                <span className="font-bold text-slate-700">-{formatBdt(platformFee)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {lang === "en" ? "Client Deposit Processing Fee:" : "ক্লায়েন্ট ডিপোজিট প্রসেসিং ফি:"}
                </span>
                <span className="font-bold text-emerald-600">৳0 (Free via bKash/Nagad)</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {lang === "en" ? "Net Freelancer Payout:" : "ফ্রিল্যান্সার পাবেন (নিট পারিশ্রমিক):"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {lang === "en" ? "Instant transfer to bKash / Nagad wallet" : "বিকাশ বা নগদ ওয়ালেটে সরাসরি জমা"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                    {formatBdt(netEarnings)}
                  </span>
                </div>
              </div>
            </div>

            {/* Comparison vs Upwork callout */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {lang === "en"
                    ? "Save up to 13% compared to International Platforms"
                    : "আন্তর্জাতিক প্ল্যাটফর্মের চেয়ে ১৩% বেশি সাশ্রয় করুন"}
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  {lang === "en"
                    ? "Upwork charges 10% platform fee plus ~5% dollar conversion loss. MuktoKormo transactions are 100% in BDT with zero forex penalties."
                    : "আপওয়ার্কে ১০% প্ল্যাটফর্ম ফি ছাড়াও ৫% এর বেশি ডলার কনভার্সনে ক্ষতি হয়। মুক্তকর্মে শতভাগ লেনদেন দেশীয় টাকায় হওয়ায় আপনার টাকা আপনার কাছেই থাকে।"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* COMPARISON TABLE: MUKTOKORMO VS UPWORK/FIVERR VS DIRECT P2P               */}
        {/* ========================================================================= */}
        <section className="py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                {lang === "en" ? "Why MuktoKormo BDT Escrow Wins" : "কেন মুক্তকর্ম বিডিটি এসক্রো এগিয়ে?"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {lang === "en"
                  ? "Comparing safety, fees, and speed against international and informal channels."
                  : "আন্তর্জাতিক মার্কেটপ্লেস ও সরাসরি লেনদেনের সাথে তুলনামূলক চিত্র।"}
              </p>
            </div>

            <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700">
                    <th className="p-4 font-bold">Feature</th>
                    <th className="p-4 font-bold text-emerald-800 bg-emerald-50/60">MuktoKormo Escrow</th>
                    <th className="p-4 font-medium text-slate-500">Upwork / Fiverr</th>
                    <th className="p-4 font-medium text-slate-500">Direct Facebook/Bank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Currency & FX Fees</td>
                    <td className="p-4 font-bold text-emerald-700 bg-emerald-50/30">100% BDT (0% FX loss)</td>
                    <td className="p-4">USD Only (Loss of ~5-8% conversion)</td>
                    <td className="p-4">BDT</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Deposit Channel</td>
                    <td className="p-4 font-bold text-emerald-700 bg-emerald-50/30">bKash, Nagad, Local Cards</td>
                    <td className="p-4">Dual-Currency Credit Card only</td>
                    <td className="p-4">Manual P2P send</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Platform Fee</td>
                    <td className="p-4 font-bold text-emerald-700 bg-emerald-50/30">Flat 7%</td>
                    <td className="p-4">10% - 20%</td>
                    <td className="p-4">0% (but high fraud risk)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Payment Safety</td>
                    <td className="p-4 font-bold text-emerald-700 bg-emerald-50/30">100% Milestone Escrow</td>
                    <td className="p-4">Escrow Protected</td>
                    <td className="p-4 text-rose-600 font-bold">None (High risk of non-payment)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Withdrawal Speed</td>
                    <td className="p-4 font-bold text-emerald-700 bg-emerald-50/30">Instant to bKash / Nagad</td>
                    <td className="p-4">5-7 Business Days (SWIFT Bank wire)</td>
                    <td className="p-4">Immediate if client actually pays</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Dispute Mediation</td>
                    <td className="p-4 font-bold text-emerald-700 bg-emerald-50/30">Local Dhaka-based Arbitration</td>
                    <td className="p-4">International automated ticket</td>
                    <td className="p-4 text-rose-600 font-bold">No recourse available</td>
                  </tr>
                </tbody>
              </table>
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
              <span>{lang === "en" ? "Common Questions" : "সাধারণ প্রশ্নোত্তর"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {lang === "en" ? "Frequently Asked Questions About Escrow" : "এসক্রো সম্পর্কে প্রায়শই জিজ্ঞাসিত প্রশ্ন"}
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
              {lang === "en" ? "Ready to Start Protected Work?" : "সুরক্ষিত কাজ শুরু করতে প্রস্তুত?"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {lang === "en"
                ? "Never Risk Your Hard-Earned Money Again"
                : "আপনার কষ্টার্জিত অর্থ আর কখনোই ঝুঁকির মুখে ফেলবেন না"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              {lang === "en"
                ? "Join thousands of Bangladeshi entrepreneurs, startups, and top independent specialists working securely under MuktoKormo BDT Escrow."
                : "হাজারো উদ্যোক্তা ও দক্ষ ফ্রিল্যান্সারের সাথে যুক্ত হোন। নিরাপদ এসক্রো গ্যারান্টিতে শুরু করুন আপনার পরবর্তী প্রজেক্ট।"}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/post-job"
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                {lang === "en" ? "Post a Job with Escrow Protection" : "এসক্রো সুরক্ষায় কাজ পোস্ট করুন"}
              </Link>
              <Link
                href="/workspaces"
                className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>{lang === "en" ? "Explore Contract Workspaces" : "ওয়ার্কস্পেস সম্পর্কে জানুন"}</span>
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
