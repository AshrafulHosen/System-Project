"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Building,
  HelpCircle,
  ChevronDown,
  ChevronUp,
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

  const [calculatorBudget, setCalculatorBudget] = useState<number>(35000);
  const [calculatorRole, setCalculatorRole] = useState<"client" | "freelancer">(
    "client"
  );
  const [activeStep, setActiveStep] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const platformFee = Math.round(calculatorBudget * 0.07);
  const netEarnings = calculatorBudget - platformFee;

  const steps = [
    {
      num: 1,
      title:
        lang === "en"
          ? "Fund Milestone in Escrow"
          : "এসক্রোতে মাইলস্টোন ফান্ড জমা",
      desc:
        lang === "en"
          ? "Client deposits milestone funds using bKash, Nagad, Rocket, or local bank card via SSLCOMMERZ into MuktoKormo's secured escrow vault."
          : "ক্লায়েন্ট বিকাশ, নগদ, রকেট বা ব্যাংক কার্ডের মাধ্যমে মাইলস্টোন পেমেন্ট মুক্তকর্মের নিরাপদ এসক্রো ভল্টে জমা রাখেন।",
      badge: lang === "en" ? "Step 01 • Deposit" : "ধাপ ১ • তহবিল জমা",
      icon: Lock,
    },
    {
      num: 2,
      title: lang === "en" ? "Confident Execution" : "নিশ্চিন্তে কাজ শুরু",
      desc:
        lang === "en"
          ? "Freelancer works knowing 100% of the milestone funds are safely recorded in BDT escrow. No unpaid invoice anxiety."
          : "ফ্রিল্যান্সার নিশ্চিত থাকেন যে শতভাগ টাকা এসক্রোতে জমা রয়েছে। কাজ শেষে টাকা না পাওয়ার কোনো ঝুঁকি থাকে না।",
      badge: lang === "en" ? "Step 02 • Active" : "ধাপ ২ • কাজ চলমান",
      icon: Clock,
    },
    {
      num: 3,
      title:
        lang === "en"
          ? "Deliverable Submission & Review"
          : "ডেলিভারি জমা ও যাচাই",
      desc:
        lang === "en"
          ? "Freelancer submits deliverables, live demo URLs, and assets in the Contract Workspace. Client inspects work and requests revisions if needed."
          : "ফ্রিল্যান্সার প্রজেক্ট ওয়ার্কস্পেসে কাজের লিংক ও ফাইল জমা দেন। ক্লায়েন্ট লাইভ ডেমো দেখে গুণমান যাচাই করেন।",
      badge: lang === "en" ? "Step 03 • Inspection" : "ধাপ ৩ • রিভিউ",
      icon: RotateCcw,
    },
    {
      num: 4,
      title:
        lang === "en"
          ? "Approval & Automated Payout"
          : "অনুমোদনে পেমেন্ট ছাড়",
      desc:
        lang === "en"
          ? "Once client approves deliverables, escrow funds release immediately to the freelancer's wallet for direct bKash, Nagad, or bank cashout."
          : "ক্লায়েন্ট কাজ সন্তোষজনক পেয়ে 'Approve' করলে এসক্রো টাকা ফ্রিল্যান্সারের ওয়ালেটে রিলিজ হয়।",
      badge: lang === "en" ? "Step 04 • Settlement" : "ধাপ ৪ • পেমেন্ট খালাস",
      icon: CheckCircle2,
    },
    {
      num: 5,
      title:
        lang === "en"
          ? "Fair Dispute Mediation"
          : "নিরপেক্ষ বিরোধ নিষ্পত্তি",
      desc:
        lang === "en"
          ? "In case of disagreement, MuktoKormo's mediation team audits the original brief, chat context, and deliverables to issue a fair resolution."
          : "কোনো মতবিরোধ দেখা দিলে মুক্তকর্মের নিরপেক্ষ আর্বিট্রেশন টিম কাজের চুক্তি ও ডেলিভারি পর্যালোচনা করে সমাধান দেয়।",
      badge: lang === "en" ? "Step 05 • Protection" : "ধাপ ৫ • সুরক্ষা",
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
          ? "As a client, your funds never release to the freelancer before you inspect and approve deliverables. If work is abandoned, escrowed funds can be refunded."
          : "ক্লায়েন্ট হিসেবে আপনার টাকা কাজ যাচাই ও অনুমোদন না করা পর্যন্ত ফ্রিল্যান্সারের কাছে পৌঁছায় না।",
    },
    {
      q:
        lang === "en"
          ? "How does Escrow guarantee payment for Bangladeshi freelancers?"
          : "এসক্রো কীভাবে বাংলাদেশি ফ্রিল্যান্সারদের পারিশ্রমিক নিশ্চিত করে?",
      a:
        lang === "en"
          ? "Before starting work, you verify funded status directly in the contract workspace. Client must review, approve, or send clear revision notes against milestone criteria."
          : "কোনো কাজ শুরু করার আগেই আপনি দেখতে পাবেন ক্লায়েন্ট টাকা এসক্রোতে জমা রেখেছেন কি না।",
    },
    {
      q:
        lang === "en"
          ? "Which payment methods are supported for escrow deposits?"
          : "এসক্রো ডিপোজিটের জন্য কোন কোন পেমেন্ট মাধ্যম সমর্থিত?",
      a:
        lang === "en"
          ? "Clients can fund contracts natively in BDT via SSLCOMMERZ (bKash, Nagad, Rocket, and local Visa / Mastercard / bank rails) with zero USD conversion fees."
          : "ক্লায়েন্টরা বিকাশ, নগদ, রকেট এবং যেকোনো বাংলাদেশি ব্যাংক কার্ড দিয়ে সরাসরি বিডিটি-তে পেমেন্ট করতে পারেন।",
    },
    {
      q:
        lang === "en"
          ? "What happens if a client is unresponsive after submission?"
          : "ডেলিভারি জমা দেওয়ার পর ক্লায়েন্ট উত্তর না দিলে কী হবে?",
      a:
        lang === "en"
          ? "Contracts preserve full submission timestamps and allow admin mediation escalation if a client becomes unreachable."
          : "প্রতিটি ডেলিভারি টাইমলাইন সংরক্ষিত থাকে এবং ক্লায়েন্ট সাড়া না দিলে সাপোর্ট ও আর্বিট্রেশনের মাধ্যমে নিষ্পত্তি করা যায়।",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111315] flex flex-col font-sans selection:bg-[#0F6E50] selection:text-white">
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenPostJob={() => setIsPostJobOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-14 pb-20 bg-[#0B3B2E] text-[#FAF9F6] border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,224,184,0.18),transparent)]" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#7CE0B8] text-[11px] font-semibold tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {lang === "en"
                  ? "MUKTOKORMO BDT ESCROW ARCHITECTURE"
                  : "মুক্তকর্ম ১০০% বিডিটি এসক্রো হেফাজত"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white">
              {lang === "en" ? (
                <>
                  100% BDT Escrow Custody.{" "}
                  <br className="hidden sm:inline" />
                  <span className="font-serif italic font-normal text-[#7CE0B8]">
                    Zero settlement anxiety.
                  </span>
                </>
              ) : (
                <>
                  ১০০% নিরাপদ বিডিটি এসক্রো। <br className="hidden sm:inline" />
                  ক্লায়েন্ট ও ফ্রিল্যান্সার উভয়ের জন্যই{" "}
                  <span className="font-serif italic font-normal text-[#7CE0B8]">
                    সম্পূর্ণ ঝুঁকিমুক্ত
                  </span>
                </>
              )}
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/75 leading-relaxed">
              {lang === "en"
                ? "Financial clarity for Bangladesh's digital economy. Clients fund milestones upfront, inspect deliverables safely, and release net Taka upon explicit approval."
                : "বাংলাদেশের ফ্রিল্যান্সিংয়ে পেমেন্ট সুরক্ষার সর্বোচ্চ মান। ক্লায়েন্ট কাজ পছন্দ ও অনুমোদন করলেই কেবল পেমেন্ট ছাড়া হয়।"}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/post-job"
                className="px-6 py-3.5 rounded-xl bg-[#0F6E50] hover:bg-[#0B5940] text-white font-semibold text-sm shadow-lg transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {lang === "en"
                    ? "Post a Job with Escrow"
                    : "এসক্রো সুরক্ষায় কাজ পোস্ট করুন"}
                </span>
              </Link>
              <Link
                href="/#jobs-section"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 transition-all inline-flex items-center gap-2"
              >
                <Handshake className="w-4 h-4 text-[#7CE0B8]" />
                <span>
                  {lang === "en" ? "Browse Open Briefs" : "চলমান কাজগুলো দেখুন"}
                </span>
              </Link>
            </div>

            {/* 4 Pillars Strip */}
            <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-4xl mx-auto text-left">
              {[
                {
                  val: "BDT Only",
                  title: lang === "en" ? "Native Taka Ledger" : "দেশীয় মুদ্রায় হিসাব",
                  sub: lang === "en" ? "No dual-currency barrier" : "কোনো ডাবল কারেন্সি নেই",
                },
                {
                  val: "0% FX",
                  title: lang === "en" ? "Zero Conversion Loss" : "রূপান্তর ক্ষতি শূন্য",
                  sub: lang === "en" ? "Keep full BDT earnings" : "শতভাগ মূল্য রক্ষা",
                },
                {
                  val: "SSLCOMMERZ",
                  title: lang === "en" ? "Local Payment Rails" : "স্থানীয় পেমেন্ট",
                  sub: "bKash, Nagad, Rocket, Cards",
                },
                {
                  val: "Porichoy",
                  title: lang === "en" ? "NID Identity Verification" : "এনআইডি যাচাইকৃত",
                  sub: lang === "en" ? "Vetted counterparties" : "বিশ্বস্ত প্রোফাইল",
                },
              ].map((card) => (
                <div
                  key={card.val}
                  className="p-4 rounded-2xl bg-white/8 border border-white/12 space-y-1"
                >
                  <div className="font-mono text-[#7CE0B8] font-bold text-base sm:text-lg">
                    {card.val}
                  </div>
                  <p className="text-xs font-semibold text-white">{card.title}</p>
                  <p className="text-[11px] text-white/60">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive 5-Step Lifecycle */}
        <section className="py-18 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] bg-[#EAF5F0] text-[#0B3B2E] border border-[#C3E3D5]">
              {lang === "en" ? "Escrow Workflow" : "এসক্রো কীভাবে কাজ করে"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#111315] tracking-tight">
              {lang === "en"
                ? "5 Transparent Steps from Deposit to Payout"
                : "ডিপোজিট থেকে পেমেন্ট খালাস — ৫টি স্বচ্ছ ধাপ"}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {steps.map((s) => {
              const IconComp = s.icon;
              const isActive = activeStep === s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveStep(s.num)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                    isActive
                      ? "bg-[#0B3B2E] text-white border-[#0B3B2E] shadow-md"
                      : "bg-white hover:bg-[#F4F2EC] text-[#111315] border-[rgba(17,19,21,0.09)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center ${
                        isActive
                          ? "bg-white/15 text-[#7CE0B8]"
                          : "bg-[#EAF5F0] text-[#0B3B2E]"
                      }`}
                    >
                      {s.num}
                    </span>
                    <IconComp
                      className={`w-4 h-4 ${
                        isActive ? "text-[#7CE0B8]" : "text-[#0F6E50]"
                      }`}
                    />
                  </div>
                  <p className="text-xs font-semibold line-clamp-1">{s.title}</p>
                </button>
              );
            })}
          </div>

          {(() => {
            const current = steps.find((s) => s.num === activeStep) || steps[0];
            return (
              <div className="mk-dark-card p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#7CE0B8]/15 text-[#7CE0B8] border border-[#7CE0B8]/25 text-[11px] font-semibold">
                    {current.badge}
                  </span>
                  <h3 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
                    {current.title}
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed">
                    {current.desc}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-white/65">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#7CE0B8]" />
                      {lang === "en" ? "Audit Trail Preserved" : "অডিট লগ"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#7CE0B8]" />
                      {lang === "en" ? "Porichoy NID Verified" : "এনআইডি নিশ্চিত"}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white/6 border border-white/12 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                    <span className="text-white/65">
                      {lang === "en" ? "Escrow Ledger Status" : "এসক্রো লেজার"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#7CE0B8]/15 text-[#7CE0B8]">
                      ACTIVE CUSTODY
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-white/65">
                      <span>{lang === "en" ? "Currency:" : "মুদ্রা:"}</span>
                      <span className="font-semibold text-white">
                        Bangladeshi Taka (BDT ৳)
                      </span>
                    </div>
                    <div className="flex justify-between text-white/65">
                      <span>{lang === "en" ? "Gateway:" : "গেটওয়ে:"}</span>
                      <span className="font-semibold text-white">
                        SSLCOMMERZ / bKash / Nagad
                      </span>
                    </div>
                    <div className="flex justify-between text-white/65">
                      <span>{lang === "en" ? "Release Trigger:" : "অনুমোদন:"}</span>
                      <span className="font-semibold text-[#7CE0B8]">
                        Client Approval
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Role Perspectives */}
        <section className="py-16 bg-[#F4F2EC]/75 border-y border-[rgba(17,19,21,0.08)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111315] tracking-tight">
                {lang === "en"
                  ? "Balanced Protection for Both Parties"
                  : "উভয় পক্ষের জন্যই নিশ্চিন্ত আর্থিক নিরাপত্তা"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[rgba(17,19,21,0.09)] shadow-[0_1px_2px_rgba(17,19,21,0.03)] space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF4FC] text-[#1D5A96] border border-[#C9DCF2] text-xs font-semibold">
                    <Building className="w-3.5 h-3.5" />
                    <span>
                      {lang === "en"
                        ? "For Clients & Organizations"
                        : "ক্লায়েন্ট ও প্রতিষ্ঠানের জন্য"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#111315]">
                    {lang === "en"
                      ? "Release Funds Only Upon Approval"
                      : "কাজ সন্তোষজনক হলেই পেমেন্ট"}
                  </h3>
                  <ul className="space-y-2.5 text-xs text-[#3E434A]">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#0F6E50] shrink-0 mt-0.5" />
                      <span>
                        Inspect live URLs, repositories, and uploaded files before
                        payout release.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#0F6E50] shrink-0 mt-0.5" />
                      <span>
                        Request structured revisions inside the shared Contract
                        Workspace.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#0F6E50] shrink-0 mt-0.5" />
                      <span>
                        Full refund request workflow with admin moderation review.
                      </span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/post-job"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6E50] hover:underline pt-4 border-t border-[rgba(17,19,21,0.07)]"
                >
                  <span>
                    {lang === "en"
                      ? "Hire with Escrow Protection"
                      : "এসক্রো সুরক্ষায় কাজ পোস্ট করুন"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[rgba(17,19,21,0.09)] shadow-[0_1px_2px_rgba(17,19,21,0.03)] space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5F0] text-[#0B3B2E] border border-[#C3E3D5] text-xs font-semibold">
                    <Award className="w-3.5 h-3.5 text-[#0F6E50]" />
                    <span>
                      {lang === "en"
                        ? "For Independent Freelancers"
                        : "ফ্রিল্যান্সারদের জন্য"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#111315]">
                    {lang === "en"
                      ? "Guaranteed Payout Before You Build"
                      : "কাজের পারিশ্রমিকের নিশ্চয়তা"}
                  </h3>
                  <ul className="space-y-2.5 text-xs text-[#3E434A]">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#0F6E50] shrink-0 mt-0.5" />
                      <span>
                        Verify locked escrow funding in your contract ledger before
                        starting development.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#0F6E50] shrink-0 mt-0.5" />
                      <span>
                        Transparent fee & net earnings breakdown calculated directly in
                        BDT.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#0F6E50] shrink-0 mt-0.5" />
                      <span>
                        Direct payout methods including bKash, Nagad, Rocket, and local
                        banks.
                      </span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/#jobs-section"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6E50] hover:underline pt-4 border-t border-[rgba(17,19,21,0.07)]"
                >
                  <span>
                    {lang === "en"
                      ? "Find Escrow Protected Jobs"
                      : "এসক্রো সুরক্ষিত কাজ খুঁজুন"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Calculator */}
        <section className="py-18 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] bg-[#EAF5F0] text-[#0B3B2E] border border-[#C3E3D5]">
              {lang === "en" ? "Transparent Economics" : "স্বচ্ছ ফি ক্যালকুলেটর"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#111315] tracking-tight">
              {lang === "en"
                ? "Interactive BDT Escrow Calculator"
                : "এসক্রো ও পারিশ্রমিক হিসাব করুন"}
            </h2>
          </div>

          <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 sm:p-10 shadow-[0_8px_24px_-6px_rgba(17,19,21,0.06)] space-y-6">
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1 bg-[#F4F2EC] rounded-xl border border-[rgba(17,19,21,0.08)]">
                <button
                  type="button"
                  onClick={() => setCalculatorRole("client")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    calculatorRole === "client"
                      ? "bg-white text-[#111315] shadow-xs"
                      : "text-[#686E78] hover:text-[#111315]"
                  }`}
                >
                  {lang === "en" ? "Client View" : "ক্লায়েন্ট ভিউ"}
                </button>
                <button
                  type="button"
                  onClick={() => setCalculatorRole("freelancer")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    calculatorRole === "freelancer"
                      ? "bg-white text-[#111315] shadow-xs"
                      : "text-[#686E78] hover:text-[#111315]"
                  }`}
                >
                  {lang === "en" ? "Freelancer View" : "ফ্রিল্যান্সার ভিউ"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#3E434A]">
                {lang === "en"
                  ? "Select or slide Project Escrow Amount (BDT):"
                  : "প্রজেক্টের এসক্রো পরিমাণ নির্বাচন করুন (টাকা):"}
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {[15000, 30000, 50000, 75000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCalculatorBudget(amt)}
                    className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border mk-tabular ${
                      calculatorBudget === amt
                        ? "bg-[#0B3B2E] text-white border-[#0B3B2E]"
                        : "bg-[#FAF9F6] hover:bg-[#F4F2EC] text-[#3E434A] border-[rgba(17,19,21,0.1)]"
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
                  className="w-full h-2 bg-[#EAE7DF] rounded-lg appearance-none cursor-pointer accent-[#0F6E50]"
                />
                <div className="flex justify-between font-mono text-[10px] text-[#686E78] mt-1">
                  <span>৳5,000</span>
                  <span>৳1,00,000</span>
                  <span>৳2,00,000</span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-[#FAF9F6] rounded-xl border border-[rgba(17,19,21,0.09)] space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#3E434A]">
                  {lang === "en"
                    ? "Total Escrow Deposit (BDT):"
                    : "এসক্রোতে জমাকৃত মোট অর্থ:"}
                </span>
                <span className="font-mono font-bold text-[#111315] text-base mk-tabular">
                  {formatBdt(calculatorBudget)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#3E434A]">
                  {lang === "en"
                    ? "Estimated Service Fee Preview (7%):"
                    : "মুক্তকর্ম প্ল্যাটফর্ম ফি (৭%):"}
                </span>
                <span className="font-mono font-semibold text-[#3E434A] mk-tabular">
                  -{formatBdt(platformFee)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#3E434A]">
                  {lang === "en" ? "Foreign Exchange Loss:" : "মুদ্রা রূপান্তর ক্ষতি:"}
                </span>
                <span className="font-semibold text-[#0F6E50]">
                  ৳0 (Native BDT)
                </span>
              </div>

              <div className="pt-3 border-t border-[rgba(17,19,21,0.09)] flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#111315]">
                    {lang === "en"
                      ? "Net Freelancer Release Preview:"
                      : "ফ্রিল্যান্সার পাবেন:"}
                  </p>
                  <p className="text-[11px] text-[#686E78]">
                    {lang === "en"
                      ? "Direct Taka payout to bKash / Nagad / Bank"
                      : "বিকাশ বা নগদ ওয়ালেটে সরাসরি জমা"}
                  </p>
                </div>
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[#0F6E50] mk-tabular">
                  {formatBdt(netEarnings)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-[#F4F2EC]/75 border-t border-[rgba(17,19,21,0.08)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111315] tracking-tight">
                {lang === "en"
                  ? "Why MuktoKormo BDT Escrow Leads"
                  : "কেন মুক্তকর্ম বিডিটি এসক্রো এগিয়ে?"}
              </h2>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl border border-[rgba(17,19,21,0.09)] shadow-[0_1px_2px_rgba(17,19,21,0.03)]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[rgba(17,19,21,0.08)] bg-[#FAF9F6] text-[#686E78] uppercase tracking-[0.06em] text-[10px]">
                    <th className="p-4 font-semibold">Feature</th>
                    <th className="p-4 font-bold text-[#0B3B2E] bg-[#EAF5F0]/70">
                      MuktoKormo Escrow
                    </th>
                    <th className="p-4 font-medium">Foreign Marketplaces</th>
                    <th className="p-4 font-medium">Informal Social Hiring</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(17,19,21,0.07)] text-[#3E434A]">
                  <tr>
                    <td className="p-4 font-semibold text-[#111315]">
                      Currency & FX Fees
                    </td>
                    <td className="p-4 font-bold text-[#0F6E50] bg-[#EAF5F0]/35">
                      100% BDT (0% FX loss)
                    </td>
                    <td className="p-4">USD Only (~5–8% FX spread)</td>
                    <td className="p-4">BDT</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#111315]">
                      Funding Channel
                    </td>
                    <td className="p-4 font-bold text-[#0F6E50] bg-[#EAF5F0]/35">
                      bKash, Nagad, Rocket, Local Cards
                    </td>
                    <td className="p-4">Dual-Currency Card Only</td>
                    <td className="p-4">Unprotected P2P Transfer</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#111315]">
                      Payment Custody
                    </td>
                    <td className="p-4 font-bold text-[#0F6E50] bg-[#EAF5F0]/35">
                      Structured Milestone Escrow
                    </td>
                    <td className="p-4">Milestone Escrow</td>
                    <td className="p-4 text-[#BE123C] font-semibold">
                      None (Non-payment risk)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-[#111315]">
                      Identity Trust
                    </td>
                    <td className="p-4 font-bold text-[#0F6E50] bg-[#EAF5F0]/35">
                      Porichoy NID Verification
                    </td>
                    <td className="p-4">Passport / International KYC</td>
                    <td className="p-4 text-[#BE123C] font-semibold">
                      Unverified profiles
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-18 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0F6E50] uppercase tracking-[0.08em]">
              <HelpCircle className="w-4 h-4" />
              <span>{lang === "en" ? "Common Questions" : "সাধারণ প্রশ্নোত্তর"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111315] tracking-tight">
              {lang === "en"
                ? "Escrow Architecture FAQs"
                : "এসক্রো সম্পর্কিত প্রশ্নাবলী"}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[rgba(17,19,21,0.09)] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF9F6] transition-colors"
                  >
                    <span className="font-semibold text-xs sm:text-sm text-[#111315]">
                      {faq.q}
                    </span>
                    <span className="p-1.5 rounded-lg bg-[#F4F2EC] text-[#686E78] shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 text-xs text-[#3E434A] leading-relaxed border-t border-[rgba(17,19,21,0.07)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 bg-[#0B3B2E] text-white border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              {lang === "en"
                ? "Launch your next milestone with BDT Escrow"
                : "নিরাপদ এসক্রো গ্যারান্টিতে শুরু করুন আপনার প্রজেক্ট"}
            </h2>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/post-job"
                className="px-6 py-3 rounded-xl bg-[#0F6E50] hover:bg-[#0B5940] text-white font-semibold text-xs sm:text-sm transition-all"
              >
                {lang === "en"
                  ? "Post a Job with Escrow"
                  : "এসক্রো সুরক্ষায় কাজ পোস্ট করুন"}
              </Link>
              <Link
                href="/workspaces"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/16 text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all inline-flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-[#7CE0B8]" />
                <span>
                  {lang === "en"
                    ? "Explore Delivery Workspaces"
                    : "ওয়ার্কস্পেস দেখুন"}
                </span>
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
