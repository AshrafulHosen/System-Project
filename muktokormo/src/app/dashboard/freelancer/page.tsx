"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Send,
  Handshake,
  Wallet,
  Search,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Star,
  ShieldCheck,
  Clock,
  Plus,
<<<<<<< HEAD
=======
  CheckCircle2,
  X,
  Smartphone,
  Building,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SectionHeading, StatCard, OnboardingChecklist } from "@/components/dashboard/Primitives";
import { ContractCard, LedgerList, ResourceGrid } from "@/components/dashboard/Widgets";
import {
  ProposalTracker,
  ProfileStrength,
  RecommendedSkills,
} from "@/components/dashboard/FreelancerWidgets";
import {
  FREELANCER_NAV,
  FREELANCER_ONBOARDING_TASKS,
  FREELANCER_CONTRACTS,
  FREELANCER_PROPOSALS,
  FREELANCER_LEDGER,
  FREELANCER_RESOURCES,
} from "@/data/dashboardData";
import { INITIAL_JOBS } from "@/data/mockData";
import { formatBdt } from "@/lib/format";
<<<<<<< HEAD

export default function FreelancerDashboardPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [pickedSkills, setPickedSkills] = useState<string[]>([]);

  const earned = FREELANCER_CONTRACTS.reduce((s, c) => s + c.releasedBdt, 0);
  const inEscrow = FREELANCER_CONTRACTS.reduce((s, c) => s + c.escrowHeldBdt, 0);
  const available = 87500;
=======
import { Job, WalletEntry } from "@/types";

export default function FreelancerDashboardPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [pickedSkills, setPickedSkills] = useState<string[]>([]);
  const [available, setAvailable] = useState<number>(87500);
  const [ledgerEntries, setLedgerEntries] = useState<WalletEntry[]>(FREELANCER_LEDGER);

  // MFS Withdrawal Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(25000);
  const [withdrawGateway, setWithdrawGateway] = useState<"BKASH" | "NAGAD" | "BANK">("BKASH");
  const [withdrawAccount, setWithdrawAccount] = useState("+8801712-345678");
  const [withdrawStep, setWithdrawStep] = useState<"FORM" | "PROCESSING" | "SUCCESS">("FORM");
  const [trxIdResult, setTrxIdResult] = useState<string>("");

  // Job proposal fast modal
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [applyBidAmount, setApplyBidAmount] = useState<number>(15000);
  const [applyDays, setApplyDays] = useState<number>(5);
  const [applyCoverNote, setApplyCoverNote] = useState<string>("I have extensive Next.js and API integration experience with bKash/Nagad gateways.");
  const [applySuccess, setApplySuccess] = useState(false);

  const earned = FREELANCER_CONTRACTS.reduce((s, c) => s + c.releasedBdt, 0);
  const inEscrow = FREELANCER_CONTRACTS.reduce((s, c) => s + c.escrowHeldBdt, 0);
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
  const successRate = 100;

  const missingProfile = [
    "Add your employment history",
    "Add education details",
    "Add Bangla language proficiency",
    "Add a portfolio link",
  ];
  const missingProfileBn = [
    "আপনার কর্মজীবনের ইতিহাস যোগ করুন",
    "শিক্ষাগত তথ্য যোগ করুন",
    "বাংলা ভাষার দক্ষতা যোগ করুন",
    "পোর্টফোলিও লিংক যোগ করুন",
  ];

  const handlePickSkill = (skill: string) => {
    setPickedSkills((prev) => (prev.includes(skill) ? prev : [...prev, skill]));
  };

<<<<<<< HEAD
=======
  // Cashout calculation
  const mfsFee = Math.round(withdrawAmount * 0.015);
  const netReceived = withdrawAmount - mfsFee;

  const handleExecuteWithdrawal = () => {
    if (withdrawAmount <= 0 || withdrawAmount > available) return;
    setWithdrawStep("PROCESSING");

    setTimeout(() => {
      const generatedTrx = `TRX-${withdrawGateway === "BKASH" ? "BK" : withdrawGateway === "NAGAD" ? "NG" : "BNK"}${Math.floor(100000 + Math.random() * 900000)}`;
      setTrxIdResult(generatedTrx);
      setAvailable((prev) => prev - withdrawAmount);

      const newEntry: WalletEntry = {
        id: `tx-${Date.now()}`,
        label: `Instant Payout to ${withdrawGateway === "BKASH" ? "bKash" : withdrawGateway === "NAGAD" ? "Nagad" : "Bank"} (${withdrawAccount})`,
        labelBn: `${withdrawGateway === "BKASH" ? "বিকাশ" : withdrawGateway === "NAGAD" ? "নগদ" : "ব্যাংক"}-এ তাৎক্ষণিক উত্তোলন (${withdrawAccount})`,
        method: withdrawGateway === "BKASH" ? "BKASH" : withdrawGateway === "NAGAD" ? "NAGAD" : "BANK",
        amountBdt: -withdrawAmount,
        status: "COMPLETED",
        createdLabel: "Just now",
      };

      setLedgerEntries((prev) => [newEntry, ...prev]);
      setWithdrawStep("SUCCESS");
    }, 1200);
  };

  const handleApplyToJob = (e: React.FormEvent) => {
    e.preventDefault();
    setApplySuccess(true);
    setTimeout(() => {
      setSelectedJobToApply(null);
      setApplySuccess(false);
    }, 1500);
  };

>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
  return (
    <DashboardShell
      role="freelancer"
      nav={FREELANCER_NAV}
      userName="Arifur Rahman"
<<<<<<< HEAD
      userMeta={lang === "en" ? "Freelancer" : "ফ্রিল্যান্সার"}
      avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
      walletBdt={available}
      walletLabel={lang === "en" ? "available" : "উত্তোলনযোগ্য"}
      action={{
        label: "Find Work",
        labelBn: "কাজ খুঁজুন",
        href: "#find-work",
      }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
=======
      userMeta={lang === "en" ? "Top-Rated Freelancer" : "টপ-রেটেড ফ্রিল্যান্সার"}
      avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
      walletBdt={available}
      walletLabel={lang === "en" ? "available" : "উত্তোলনযোগ্য"}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      lang={lang}
      onToggleLang={() => setLang((prev) => (prev === "en" ? "bn" : "en"))}
      action={{
        label: "Find Work",
        labelBn: "কাজ খুঁজুন",
        href: "/#jobs-section",
      }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                {lang === "en" ? "Freelancer Command Center" : "ফ্রিল্যান্সার ড্যাশবোর্ড"}
              </span>
              <span className="text-slate-300">•</span>
              <Link
                href="/contracts"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>{lang === "en" ? "Active Workspaces" : "চলতি কন্ট্রাক্ট"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {lang === "en" ? (
                <>
                  Welcome back, <span className="text-emerald-600">Arifur</span>
                </>
              ) : (
                <>
                  স্বাগতম, <span className="text-emerald-600">আরিফুর</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {lang === "en"
                ? "NID verified · 4.98 rating · Dhaka, Bangladesh"
                : "এনআইডি যাচাইকৃত · ৪.৯৮ রেটিং · ঢাকা, বাংলাদেশ"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
<<<<<<< HEAD
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              {lang === "en" ? "বাংলা" : "English"}
            </button>
            <Link
              href="#find-work"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              {lang === "en" ? "Find Work" : "কাজ খুঁজুন"}
=======
              onClick={() => {
                setWithdrawStep("FORM");
                setWithdrawModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "en" ? "Withdraw Cash" : "টাকা উত্তোলন"}</span>
            </button>
            <Link
              href="/#jobs-section"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "Find Work" : "কাজ খুঁজুন"}</span>
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
            </Link>
          </div>
        </div>

<<<<<<< HEAD
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            icon={Wallet}
            label="Available to withdraw"
            labelBn="উত্তোলনযোগ্য"
            value={formatBdt(available)}
            delta="+৳23,250"
            lang={lang}
            accent="emerald"
          />
          <StatCard
            icon={TrendingUp}
            label="Earned this month"
            labelBn="এই মাসে আয়"
            value={formatBdt(earned)}
            delta="+18%"
            lang={lang}
            accent="sky"
          />
          <StatCard
            icon={Handshake}
            label="Active contracts"
            labelBn="সক্রিয় চুক্তি"
            value={String(FREELANCER_CONTRACTS.filter((c) => c.stage === "ACTIVE").length)}
            lang={lang}
            accent="violet"
          />
          <StatCard
            icon={Star}
            label="Job success score"
            labelBn="কাজ সফলতার স্কোর"
            value={`${successRate}%`}
            lang={lang}
            accent="amber"
          />
        </div>

        {/* Wallet summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-sm lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {lang === "en" ? "Wallet" : "ওয়ালেট"}
              </span>
            </div>
            <p className="text-3xl font-black tracking-tight">{formatBdt(available)}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === "en" ? "Ready to withdraw" : "উত্তোলনের জন্য প্রস্তুত"}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  {lang === "en" ? "In escrow" : "এসক্রোতে"}
                </p>
                <p className="text-sm font-black text-amber-300">{formatBdt(inEscrow)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  {lang === "en" ? "Lifetime" : "সর্বমোট"}
                </p>
                <p className="text-sm font-black text-emerald-300">{formatBdt(earned)}</p>
              </div>
            </div>

            <button className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer">
              <ArrowRight className="w-3.5 h-3.5" />
              {lang === "en" ? "Withdraw to bKash" : "বিকাশে উত্তোলন"}
            </button>
          </div>

          <div className="lg:col-span-2">
            <ProfileStrength
              pct={72}
              missing={missingProfile}
              missingBn={missingProfileBn}
              lang={lang}
            />
          </div>
        </div>

        {/* Profile strength */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div>
            <SectionHeading
              title="Recommended for you"
              titleBn="আপনার জন্য প্রস্তাবিত"
              subtitle="Jobs that match your skills and rate"
              subtitleBn="আপনার দক্ষতা ও রেটিংয়ের সাথে মেলে এমন কাজ"
=======
        {/* Tab Quick Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "overview", label: "Overview", labelBn: "সংক্ষিপ্ত বিবরণ" },
            { id: "find-work", label: "Recommended Jobs", labelBn: "প্রস্তাবিত কাজ" },
            { id: "proposals", label: "My Proposals", labelBn: "আমার আবেদন" },
            { id: "contracts", label: "Contracts & Delivery", labelBn: "চুক্তি ও ডেলিভারি" },
            { id: "wallet", label: "Wallet & Cashout", labelBn: "ওয়ালেট ও ক্যাশআউট" },
            { id: "profile", label: "Profile Strength", labelBn: "প্রোফাইল পূর্ণতা" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {lang === "en" ? tab.label : tab.labelBn}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        {(activeTab === "overview" || activeTab === "wallet") && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              icon={Wallet}
              label="Available to withdraw"
              labelBn="উত্তোলনযোগ্য"
              value={formatBdt(available)}
              delta="+৳23,250"
              lang={lang}
              accent="emerald"
            />
            <StatCard
              icon={TrendingUp}
              label="Earned this month"
              labelBn="এই মাসে আয়"
              value={formatBdt(earned)}
              delta="+18%"
              lang={lang}
              accent="sky"
            />
            <StatCard
              icon={Handshake}
              label="Active contracts"
              labelBn="সক্রিয় চুক্তি"
              value={String(FREELANCER_CONTRACTS.filter((c) => c.stage === "ACTIVE").length)}
              lang={lang}
              accent="violet"
            />
            <StatCard
              icon={Star}
              label="Job success score"
              labelBn="কাজ সফলতার স্কোর"
              value={`${successRate}%`}
              lang={lang}
              accent="amber"
            />
          </div>
        )}

        {/* Wallet summary & Profile completeness */}
        {(activeTab === "overview" || activeTab === "wallet" || activeTab === "profile") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 rounded-2xl p-6 text-white shadow-sm lg:col-span-1 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {lang === "en" ? "MFS Payout Wallet" : "এমএফএস ওয়ালেট"}
                </span>
              </div>
              <p className="text-3xl font-black tracking-tight">{formatBdt(available)}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {lang === "en" ? "Available for instant transfer" : "তাৎক্ষণিক উত্তোলনের জন্য প্রস্তুত"}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {lang === "en" ? "In Escrow" : "এসক্রোতে"}
                  </p>
                  <p className="text-sm font-black text-amber-300">{formatBdt(inEscrow)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {lang === "en" ? "Lifetime Earned" : "সর্বমোট আয়"}
                  </p>
                  <p className="text-sm font-black text-emerald-300">{formatBdt(earned)}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setWithdrawStep("FORM");
                  setWithdrawModalOpen(true);
                }}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{lang === "en" ? "Withdraw to bKash / Nagad" : "বিকাশ বা নগদে ক্যাশআউট"}</span>
              </button>
            </div>

            <div className="lg:col-span-2">
              <ProfileStrength
                pct={72}
                missing={missingProfile}
                missingBn={missingProfileBn}
                lang={lang}
              />
            </div>
          </div>
        )}

        {/* Recommended Jobs & Skill Recommendations */}
        {(activeTab === "overview" || activeTab === "find-work") && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5" id="find-work">
            <div>
              <SectionHeading
                title="Recommended for you"
                titleBn="আপনার জন্য প্রস্তাবিত কাজ"
                subtitle="Jobs matching your Next.js, API & mobile skills"
                subtitleBn="আপনার দক্ষতার সাথে মেলে এমন কাজসমূহ"
                lang={lang}
                action={
                  <Link
                    href="/#jobs-section"
                    className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <span>{lang === "en" ? "Browse Marketplace" : "মার্কেটপ্লেস দেখুন"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="space-y-2.5">
                {INITIAL_JOBS.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 mb-1 block">
                          {job.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {lang === "en" ? job.title : (job.titleBn || job.title)}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-500">
                          <span className="font-bold text-slate-800">
                            {formatBdt(job.budgetBdt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {job.deadlineDays}d delivery
                          </span>
                          <span className="flex items-center gap-1">
                            <Send className="w-2.5 h-2.5" />
                            {job.proposalsCount} bids
                          </span>
                          <span className="font-bold text-emerald-600">
                            {job.clientVerified ? "✓ Verified Client" : "Client"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedJobToApply(job);
                          setApplyBidAmount(job.budgetBdt);
                          setApplyDays(job.deadlineDays);
                        }}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        {lang === "en" ? "Quick Bid" : "বিড করুন"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <RecommendedSkills lang={lang} onPick={handlePickSkill} />

              {pickedSkills.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 animate-in fade-in duration-200">
                  <h4 className="text-xs font-black text-emerald-900">
                    {lang === "en" ? "Ready to add to profile" : "প্রোফাইলে যোগ করার জন্য প্রস্তুত"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {pickedSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/contracts"
                    className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    {lang === "en" ? "Save to Freelancer Profile" : "প্রোফাইলে সেভ করুন"}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contracts Section */}
        {(activeTab === "overview" || activeTab === "contracts") && (
          <div id="contracts" className="space-y-4">
            <SectionHeading
              title="Active contracts & deliveries"
              titleBn="সক্রিয় চুক্তি ও ডেলিভারি"
              subtitle="Milestones currently locked in escrow custody"
              subtitleBn="এসক্রোতে জমা থাকা চলমান কাজের মাইলস্টোন"
              lang={lang}
              action={
                <Link
                  href="/contracts"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all"
                >
                  <Handshake className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === "en" ? "All Contracts Hub" : "সকল কন্ট্রাক্ট"}</span>
                </Link>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {FREELANCER_CONTRACTS.map((c) => (
                <ContractCard key={c.id} contract={c} perspective="freelancer" lang={lang} />
              ))}
            </div>
          </div>
        )}

        {/* Proposals Section */}
        {(activeTab === "overview" || activeTab === "proposals") && (
          <div id="proposals" className="space-y-4">
            <SectionHeading
              title="My submitted proposals"
              titleBn="আমার আবেদনসমূহ"
              subtitle="Track your bid amounts and client hiring responses"
              subtitleBn="আপনার দেওয়া বিড ও ক্লায়েন্টের নিয়োগ প্রতিক্রিয়া ট্র্যাক করুন"
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
              lang={lang}
              action={
                <Link
                  href="/#jobs-section"
<<<<<<< HEAD
                  className="text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  {lang === "en" ? "View all" : "সব দেখুন"}
                </Link>
              }
            />
            <div className="space-y-2.5">
              {INITIAL_JOBS.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">
                        {job.category}
                      </p>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {lang === "en" ? job.title : (job.titleBn || job.title)}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-slate-500">
                        <span className="font-bold text-slate-800">
                          {formatBdt(job.budgetBdt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {job.deadlineDays}d
                        </span>
                        <span className="flex items-center gap-1">
                          <Send className="w-2.5 h-2.5" />
                          {job.proposalsCount}
                        </span>
                        <span className="font-bold text-emerald-600">
                          {job.clientVerified ? "Verified client" : "Client"}
                        </span>
                      </div>
                    </div>

                    <button className="shrink-0 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all cursor-pointer">
                      {lang === "en" ? "Apply" : "আবেদন"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <RecommendedSkills lang={lang} onPick={handlePickSkill} />

            {pickedSkills.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 animate-in fade-in duration-200">
                <h4 className="text-xs font-black text-emerald-900">
                  {lang === "en" ? "Ready to add" : "যোগ করার জন্য প্রস্তুত"}
                </h4>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {pickedSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <a
                  href="/signup?step=skills"
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  {lang === "en" ? "Add to my profile" : "প্রোফাইলে যোগ করুন"}
                  <ArrowRight className="w-3 h-3" />
                </a>
=======
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Bid on Jobs" : "নতুন আবেদন"}</span>
                </Link>
              }
            />
            <ProposalTracker proposals={FREELANCER_PROPOSALS} lang={lang} />
          </div>
        )}

        {/* Wallet ledger */}
        {(activeTab === "overview" || activeTab === "wallet") && (
          <div id="wallet" className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeading
                title="Wallet transactions"
                titleBn="ওয়ালেট লেনদেন বিবরণী"
                subtitle="Milestone releases, service fees and MFS withdrawals"
                subtitleBn="মাইলস্টোন মুক্তি, সার্ভিস ফি এবং বিকাশ/নগদ উত্তোলন"
                lang={lang}
              />
              <button
                onClick={() => {
                  setWithdrawStep("FORM");
                  setWithdrawModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
              >
                + {lang === "en" ? "New Withdrawal" : "নতুন উত্তোলন"}
              </button>
            </div>
            <LedgerList
              entries={ledgerEntries}
              lang={lang}
              emptyLabel="No wallet activity yet"
              emptyLabelBn="এখনো কোনো লেনদেন নেই"
            />
          </div>
        )}

        {/* Profile Verification */}
        {(activeTab === "overview" || activeTab === "profile") && (
          <div id="profile" className="space-y-4">
            <SectionHeading
              title="Identity & verification tasks"
              titleBn="পরিচয় ও ভেরিফিকেশন কাজ"
              subtitle="Verified talent win 3x more milestone contracts"
              subtitleBn="যাচাইকৃত ফ্রিল্যান্সাররা ৩ গুণ বেশি কাজ পান"
              lang={lang}
            />
            <OnboardingChecklist tasks={FREELANCER_ONBOARDING_TASKS} lang={lang} />
          </div>
        )}

        {/* Resources */}
        {activeTab === "overview" && (
          <div id="resources" className="space-y-4">
            <SectionHeading
              title="Bangladeshi freelancer guides"
              titleBn="বাংলাদেশি ফ্রিল্যান্সারদের গাইড"
              subtitle="Taxes, MFS transfers, English client communication & dispute handling"
              subtitleBn="ট্যাক্স, এমএফএস লেনদেন, ইংরেজি ক্লায়েন্ট যোগাযোগ ও বিরোধ নিষ্পত্তি"
              lang={lang}
            />
            <ResourceGrid resources={FREELANCER_RESOURCES} lang={lang} />
          </div>
        )}
      </div>

      {/* Interactive MFS Cashout Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === "en" ? "Withdraw Freelancer Earnings" : "ফ্রিল্যান্সার আয় উত্তোলন"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === "en" ? "Available Balance: " : "উত্তোলনযোগ্য ব্যালেন্স: "}
                    <span className="font-bold text-slate-700">৳{available.toLocaleString()} BDT</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWithdrawModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawStep === "FORM" && (
              <div className="space-y-4">
                {/* Method selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {lang === "en" ? "Select Payout Gateway" : "পেমেন্ট গেটওয়ে নির্বাচন করুন"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawGateway("BKASH");
                        setWithdrawAccount("+8801712-345678");
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        withdrawGateway === "BKASH"
                          ? "bg-pink-50 border-pink-500 text-pink-700 font-bold shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mx-auto mb-1 text-pink-600" />
                      <span className="text-xs">bKash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawGateway("NAGAD");
                        setWithdrawAccount("+8801819-876543");
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        withdrawGateway === "NAGAD"
                          ? "bg-orange-50 border-orange-500 text-orange-700 font-bold shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                      <span className="text-xs">Nagad</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawGateway("BANK");
                        setWithdrawAccount("City Bank AC # 205118920");
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        withdrawGateway === "BANK"
                          ? "bg-sky-50 border-sky-500 text-sky-700 font-bold shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Building className="w-4 h-4 mx-auto mb-1 text-sky-600" />
                      <span className="text-xs">Bank NPSB</span>
                    </button>
                  </div>
                </div>

                {/* Account number */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === "en" ? "Recipient Account Number" : "গ্রাহক একাউন্ট নম্বর"}
                  </label>
                  <input
                    type="text"
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Amount input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {lang === "en" ? "Withdrawal Amount (BDT)" : "উত্তোলনের পরিমাণ (টাকা)"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(available)}
                      className="text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      {lang === "en" ? "Withdraw All" : "সব উত্তোলন"}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1000"
                    max={available}
                    step="500"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base font-black text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[10000, 25000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawAmount(Math.min(amt, available))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                      >
                        ৳{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Requested Amount:</span>
                    <span className="font-bold text-slate-800">৳{withdrawAmount.toLocaleString()} BDT</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>MFS Cashout Fee (1.5%):</span>
                    <span className="font-bold text-rose-600">-৳{mfsFee.toLocaleString()} BDT</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                    <span>Net Credited to Wallet:</span>
                    <span>৳{netReceived.toLocaleString()} BDT</span>
                  </div>
                </div>

                <button
                  onClick={handleExecuteWithdrawal}
                  disabled={withdrawAmount <= 0 || withdrawAmount > available}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {lang === "en"
                      ? `Confirm Transfer of ৳${withdrawAmount.toLocaleString()} BDT`
                      : `৳${withdrawAmount.toLocaleString()} টাকা ট্রান্সফার নিশ্চিত করুন`}
                  </span>
                </button>
              </div>
            )}

            {withdrawStep === "PROCESSING" && (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">
                  {lang === "en" ? "Processing MFS Cashout Transfer..." : "এমএফএস ট্রান্সফার প্রক্রিয়াধীন..."}
                </h4>
                <p className="text-xs text-slate-500">
                  Communicating with Bangladesh MFS Settlement Network.
                </p>
              </div>
            )}

            {withdrawStep === "SUCCESS" && (
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  {lang === "en" ? "Funds Transferred Successfully!" : "টাকা সফলভাবে পাঠানো হয়েছে!"}
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  ৳{netReceived.toLocaleString()} BDT has been credited to your {withdrawGateway} account ({withdrawAccount}).
                </p>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 font-bold">
                  TrxID: {trxIdResult}
                </div>
                <button
                  onClick={() => setWithdrawModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  {lang === "en" ? "Back to Dashboard" : "ড্যাশবোর্ডে ফিরুন"}
                </button>
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
              </div>
            )}
          </div>
        </div>
<<<<<<< HEAD

        {/* Contracts */}
        <div id="contracts">
          <SectionHeading
            title="My contracts"
            titleBn="আমার চুক্তি"
            subtitle="Milestones in escrow and released to you"
            subtitleBn="এসক্রোতে থাকা ও মুক্ত হওয়া মাইলস্টোন"
            lang={lang}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {FREELANCER_CONTRACTS.map((c) => (
              <ContractCard key={c.id} contract={c} perspective="freelancer" lang={lang} />
            ))}
          </div>
        </div>

        {/* Proposals */}
        <div id="proposals">
          <SectionHeading
            title="My proposals"
            titleBn="আমার আবেদন"
            subtitle="Track every bid you've submitted"
            subtitleBn="আপনার দেওয়া প্রতিটি বিড ট্র্যাক করুন"
            lang={lang}
            action={
              <Link
                href="#find-work"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                {lang === "en" ? "New proposal" : "নতুন আবেদন"}
              </Link>
            }
          />
          <ProposalTracker proposals={FREELANCER_PROPOSALS} lang={lang} />
        </div>

        {/* Wallet ledger */}
        <div id="wallet">
          <SectionHeading
            title="Wallet activity"
            titleBn="ওয়ালেট লেনদেন"
            subtitle="Milestone releases, fees and payouts"
            subtitleBn="মাইলস্টোন মুক্তি, ফি ও উত্তোলন"
            lang={lang}
          />
          <LedgerList
            entries={FREELANCER_LEDGER}
            lang={lang}
            emptyLabel="No wallet activity yet"
            emptyLabelBn="এখনো কোনো লেনদেন নেই"
          />
        </div>

        {/* Onboarding */}
        <div id="profile">
          <SectionHeading
            title="Get fully verified"
            titleBn="সম্পূর্ণ যাচাই করুন"
            subtitle="Verified freelancers get more proposals and higher rates"
            subtitleBn="যাচাইকৃত ফ্রিল্যান্সাররা বেশি আবেদন ও উচ্চ রেট পান"
            lang={lang}
          />
          <OnboardingChecklist tasks={FREELANCER_ONBOARDING_TASKS} lang={lang} />
        </div>

        {/* Resources */}
        <div id="resources">
          <SectionHeading
            title="Help and resources"
            titleBn="সহায়তা ও রিসোর্স"
            subtitle="Grow your profile, your proposals and your earnings"
            subtitleBn="প্রোফাইল, আবেদন ও আয় বাড়ানোর গাইড"
            lang={lang}
          />
          <ResourceGrid resources={FREELANCER_RESOURCES} lang={lang} />
        </div>

        {/* Value props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[
            {
              icon: Search,
              title: "Find clients and remote jobs",
              titleBn: "ক্লায়েন্ট ও রিমোট কাজ খুঁজুন",
              body: "Thousands of verified Bangladeshi businesses post work daily.",
              bodyBn: "প্রতিদিন হাজারো যাচাইকৃত দেশীয় প্রতিষ্ঠান কাজ পোস্ট করে।",
            },
            {
              icon: Send,
              title: "Submit proposals for work",
              titleBn: "কাজের জন্য আবেদন পাঠান",
              body: "Stand out with milestone-based bids and a clear cover letter.",
              bodyBn: "মাইলস্টোন-ভিত্তিক বিড ও স্পষ্ট কভার লেটারে নজর দিন।",
            },
            {
              icon: Wallet,
              title: "Get paid as you deliver work",
              titleBn: "কাজ করার সাথে সাথেই টাকা নিন",
              body: "Withdraw to bKash, Nagad, Rocket or NPSB bank in 24 hours.",
              bodyBn: "২৪ ঘণ্টায় বিকাশ, নগদ, রকেট বা এনপিএসবিতে উত্তোলন।",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs"
            >
              <item.icon className="w-5 h-5 text-emerald-600 mb-2.5" />
              <h4 className="text-xs font-black text-slate-900">
                {lang === "en" ? item.title : item.titleBn}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {lang === "en" ? item.body : item.bodyBn}
              </p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap items-center gap-2 pt-2 pb-4">
          {[
            { icon: MessageSquare, label: "Messages", labelBn: "বার্তা" },
            { icon: Sparkles, label: "Skill tests", labelBn: "স্কিল টেস্ট" },
            { icon: ShieldCheck, label: "Disputes", labelBn: "বিরোধ" },
          ].map((l) => (
            <button
              key={l.label}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <l.icon className="w-3.5 h-3.5 text-slate-400" />
              {lang === "en" ? l.label : l.labelBn}
            </button>
          ))}
        </div>
      </div>
=======
      )}

      {/* Quick Job Bid Modal */}
      {selectedJobToApply && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {selectedJobToApply.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === "en" ? selectedJobToApply.title : (selectedJobToApply.titleBn || selectedJobToApply.title)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobToApply(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {applySuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Proposal Submitted!</h4>
                <p className="text-xs text-slate-500">Client will be notified of your competitive proposal.</p>
              </div>
            ) : (
              <form onSubmit={handleApplyToJob} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Your Bid (BDT)</label>
                    <input
                      type="number"
                      value={applyBidAmount}
                      onChange={(e) => setApplyBidAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Delivery Time (Days)</label>
                    <input
                      type="number"
                      value={applyDays}
                      onChange={(e) => setApplyDays(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Proposal Pitch</label>
                  <textarea
                    rows={3}
                    value={applyCoverNote}
                    onChange={(e) => setApplyCoverNote(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobToApply(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700"
                  >
                    Submit Proposal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
    </DashboardShell>
  );
}
