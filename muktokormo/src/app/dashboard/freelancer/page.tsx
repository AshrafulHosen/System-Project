"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send,
  Handshake,
  Wallet,
  Search,
  TrendingUp,
  ArrowRight,
  Star,
  ShieldCheck,
  Clock,
  Plus,
  CheckCircle2,
  X,
  Smartphone,
  Building,
  Trash2,
  CreditCard,
  Check,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SectionHeading, StatCard, OnboardingChecklist } from "@/components/dashboard/Primitives";
import { ContractCard, LedgerList } from "@/components/dashboard/Widgets";
import {
  ProposalTracker,
  ProfileStrength,
  RecommendedSkills,
} from "@/components/dashboard/FreelancerWidgets";
import {
  FREELANCER_NAV,
  FREELANCER_ONBOARDING_TASKS,
  FREELANCER_CONTRACTS,
  FREELANCER_LEDGER,
} from "@/data/dashboardData";
import { formatBdt } from "@/lib/format";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import { fetchOpenJobs } from "@/lib/data/jobs";
import { fetchMyProposals, submitProposal } from "@/lib/data/proposals";
import { Job, WalletEntry, TrackedProposal } from "@/types";
import { PLATFORM_FEE_PCT } from "@/lib/data/mappers";

function FreelancerDashboardContent() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const deniedFrom = searchParams ? searchParams.get("denied") : null;
  const { name, email, role, freelancerId, title, avatarUrl, loading: userLoading } = useCurrentUser();
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [pickedSkills, setPickedSkills] = useState<string[]>([]);
  const [available, setAvailable] = useState<number>(87500);
  const [ledgerEntries, setLedgerEntries] = useState<WalletEntry[]>(FREELANCER_LEDGER);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [myProposals, setMyProposals] = useState<TrackedProposal[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const live = await fetchOpenJobs(supabase);
      if (!cancelled) setRecommendedJobs(live.slice(0, 3));
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!freelancerId) return;
    let cancelled = false;
    (async () => {
      const live = await fetchMyProposals(supabase, freelancerId);
      if (!cancelled) setMyProposals(live);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, freelancerId]);

  useEffect(() => {
    if (!userLoading) {
      if (!email) {
        router.replace("/login?next=/dashboard/freelancer");
      } else if (role === "client") {
        router.replace("/dashboard/client?denied=freelancer");
      } else if (role === "admin") {
        router.replace("/dashboard/admin");
      }
    }
  }, [userLoading, role, email, router]);

  const displayName = name.trim() || (lang === "en" ? "Freelancer" : "ফ্রিল্যান্সার");
  const firstName = displayName.split(" ")[0];
  const displayAvatar = avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  // Payout Methods State
  interface PayoutMethod {
    id: string;
    type: "BKASH" | "NAGAD" | "ROCKET" | "BANK";
    accountType?: "Personal" | "Merchant";
    accountNumber: string;
    accountHolder: string;
    bankName?: string;
    branchName?: string;
    routingNumber?: string;
    isPrimary: boolean;
    status: "VERIFIED" | "PENDING";
  }

  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([
    {
      id: "pm-1",
      type: "BKASH",
      accountType: "Personal",
      accountNumber: "+880 1712-345678",
      accountHolder: displayName || "Tanvir Rahman",
      isPrimary: true,
      status: "VERIFIED",
    },
    {
      id: "pm-2",
      type: "BANK",
      bankName: "BRAC Bank PLC",
      branchName: "Gulshan Branch",
      accountNumber: "1501 2039 4810 2001",
      accountHolder: displayName || "Tanvir Rahman",
      routingNumber: "060261345",
      isPrimary: false,
      status: "VERIFIED",
    },
  ]);

  const [addMethodModalOpen, setAddMethodModalOpen] = useState(false);
  const [newMethodType, setNewMethodType] = useState<"BKASH" | "NAGAD" | "ROCKET" | "BANK">("BKASH");
  const [newAccountType, setNewAccountType] = useState<"Personal" | "Merchant">("Personal");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolder, setNewAccountHolder] = useState(displayName || "");
  const [newBankName, setNewBankName] = useState("BRAC Bank PLC");
  const [newBranchName, setNewBranchName] = useState("");
  const [newRoutingNumber, setNewRoutingNumber] = useState("");
  const [newIsPrimary, setNewIsPrimary] = useState(false);
  const [addMethodSuccess, setAddMethodSuccess] = useState(false);

  const handleSetPrimaryMethod = (id: string) => {
    setPayoutMethods((prev) =>
      prev.map((m) => ({
        ...m,
        isPrimary: m.id === id,
      }))
    );
  };

  const handleRemoveMethod = (id: string) => {
    setPayoutMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSavePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountNumber.trim()) return;

    const newId = `pm-${Date.now()}`;
    const newMethod: PayoutMethod = {
      id: newId,
      type: newMethodType,
      accountType: newMethodType !== "BANK" ? newAccountType : undefined,
      accountNumber: newAccountNumber.trim(),
      accountHolder: newAccountHolder.trim() || displayName || "Account Holder",
      bankName: newMethodType === "BANK" ? newBankName : undefined,
      branchName: newMethodType === "BANK" ? newBranchName : undefined,
      routingNumber: newMethodType === "BANK" ? newRoutingNumber : undefined,
      isPrimary: newIsPrimary || payoutMethods.length === 0,
      status: "VERIFIED",
    };

    setPayoutMethods((prev) => {
      if (newMethod.isPrimary) {
        return [...prev.map((m) => ({ ...m, isPrimary: false })), newMethod];
      }
      return [...prev, newMethod];
    });

    setAddMethodSuccess(true);
    setTimeout(() => {
      setAddMethodSuccess(false);
      setAddMethodModalOpen(false);
      setNewAccountNumber("");
      setNewBranchName("");
      setNewRoutingNumber("");
      setNewIsPrimary(false);
    }, 1000);
  };

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

  const handleApplyToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobToApply) return;

    if (freelancerId) {
      const platformFee = Math.round(applyBidAmount * PLATFORM_FEE_PCT);
      await submitProposal(supabase, {
        jobId: selectedJobToApply.id,
        freelancerId,
        bidAmountBdt: applyBidAmount,
        platformFeeBdt: platformFee,
        netEarnedBdt: applyBidAmount - platformFee,
        deliveryDays: applyDays,
        biddingType: "PROJECT",
        coverLetter: applyCoverNote,
        payoutMethod: "BKASH",
        payoutAccount: "",
      });
      const refreshed = await fetchMyProposals(supabase, freelancerId);
      setMyProposals(refreshed);
    }

    setApplySuccess(true);
    setTimeout(() => {
      setSelectedJobToApply(null);
      setApplySuccess(false);
    }, 1500);
  };

  return (
    <DashboardShell
      role="freelancer"
      nav={FREELANCER_NAV}
      userName={displayName}
      userMeta={email}
      avatar={displayAvatar}
      walletBdt={available}
      walletLabel={lang === "en" ? "available" : "উত্তোলনযোগ্য"}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      lang={lang}
      onToggleLang={() => setLang((prev) => (prev === "en" ? "bn" : "en"))}
      action={{
        label: "Find Work",
        labelBn: "কাজ খুঁজুন",
        onAction: () => setActiveTab("find-work"),
      }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {deniedFrom === "client" && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-black">!</span>
              <span>
                {lang === "en"
                  ? "Access Restricted: You are signed in as a Freelancer. Only Employer / Client accounts can access the Client Hiring dashboard."
                  : "অ্যাক্সেস সংরক্ষিত: আপনি ফ্রিল্যান্সার হিসেবে লগইন করেছেন। শুধুমাত্র নিয়োগদাতা অ্যাকাউন্টই ক্লায়েন্ট ড্যাশবোর্ডে প্রবেশ করতে পারে।"}
              </span>
            </div>
            <button onClick={() => router.replace("/dashboard/freelancer")} className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
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
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {lang === "en" ? (
                <>
                  Welcome back, <span className="text-emerald-600">{firstName}</span>
                </>
              ) : (
                <>
                  স্বাগতম, <span className="text-emerald-600">{firstName}</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {email || (lang === "en" ? "Freelancer Account" : "ফ্রিল্যান্সার অ্যাকাউন্ট")}
              <span className="text-slate-300">•</span>
              {lang === "en"
                ? "NID verified · 4.98 rating · Dhaka, Bangladesh"
                : "এনআইডি যাচাইকৃত · ৪.৯৮ রেটিং · ঢাকা, বাংলাদেশ"}
            </p>
          </div>


        </div>



        {/* Stats Grid (Only on Overview) */}
        {activeTab === "overview" && (
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

        {/* Profile completeness (Shown in overview and profile, without wallet card) */}
        {(activeTab === "overview" || activeTab === "profile") && (
          <div>
            <ProfileStrength
              pct={72}
              missing={missingProfile}
              missingBn={missingProfileBn}
              lang={lang}
            />
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
                  <button
                    onClick={() => setActiveTab("find-work")}
                    className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{lang === "en" ? "Browse All Jobs" : "মার্কেটপ্লেস দেখুন"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                }
              />
              <div className="space-y-2.5">
                {recommendedJobs.length === 0 ? (
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-500">
                      {lang === "en" ? "No open jobs yet. Check back soon!" : "এখনো কোনো কাজ নেই, শীঘ্রই যোগ হবে!"}
                    </p>
                  </div>
                ) : recommendedJobs.map((job) => (
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
                          <Link href={`/jobs/${job.id}`} className="hover:text-emerald-700 hover:underline transition-colors">
                            {lang === "en" ? job.title : (job.titleBn || job.title)}
                          </Link>
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
              lang={lang}
              action={
                <button
                  onClick={() => setActiveTab("find-work")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Bid on Jobs" : "নতুন আবেদন"}</span>
                </button>
              }
            />
            <ProposalTracker proposals={myProposals} lang={lang} />
          </div>
        )}

        {/* Wallet Section (Only shown in wallet tab) */}
        {activeTab === "wallet" && (
          <div id="wallet" className="space-y-6">
            {/* MFS Payout Wallet Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 rounded-2xl p-6 text-white shadow-sm border border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {lang === "en" ? "MFS Payout Wallet" : "এমএফএস ওয়ালেট"}
                    </span>
                  </div>
                  <p className="text-3xl font-black tracking-tight">{formatBdt(available)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === "en" ? "Available for instant transfer" : "তাৎক্ষণিক উত্তোলনের জন্য প্রস্তুত"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {lang === "en" ? "In Escrow" : "এসক্রোতে"}
                    </p>
                    <p className="text-sm font-black text-amber-300">{formatBdt(inEscrow)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {lang === "en" ? "Lifetime Earned" : "সর্বমোট আয়"}
                    </p>
                    <p className="text-sm font-black text-emerald-300">{formatBdt(earned)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setWithdrawStep("FORM");
                      setWithdrawModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{lang === "en" ? "Withdraw to bKash / Nagad" : "বিকাশ বা নগদে ক্যাশআউট"}</span>
                  </button>
                </div>
              </div>
            </div>

                        {/* Payout & Payment Methods Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span>{lang === "en" ? "Payout & Payment Methods" : "উত্তোলন ও পেমেন্ট মাধ্যম"}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === "en"
                      ? "Manage verified Bangladeshi MFS and local bank accounts for instant earnings withdrawal."
                      : "আপনার ভেরিফাইড বিকাশ, নগদ ও লোকাল ব্যাংক হিসাবসমূহ ব্যবস্থাপনা করুন।"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddMethodModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{lang === "en" ? "Add Payment Method" : "নতুন মাধ্যম যোগ করুন"}</span>
                </button>
              </div>

              {/* Methods Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {payoutMethods.map((m) => {
                  const isBkash = m.type === "BKASH";
                  const isNagad = m.type === "NAGAD";
                  const isRocket = m.type === "ROCKET";
                  const isBank = m.type === "BANK";

                  return (
                    <div
                      key={m.id}
                      className={`relative rounded-2xl p-4.5 border transition-all flex flex-col justify-between ${
                        m.isPrimary
                          ? "bg-white border-emerald-500/80 shadow-sm ring-2 ring-emerald-500/20"
                          : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <div>
                        {/* Card Header: Type Badge & Primary Pill */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            {isBkash && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-pink-50 text-pink-700 border border-pink-200">
                                <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                                bKash
                              </span>
                            )}
                            {isNagad && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-orange-50 text-orange-700 border border-orange-200">
                                <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                                Nagad
                              </span>
                            )}
                            {isRocket && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                                Rocket
                              </span>
                            )}
                            {isBank && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-sky-50 text-sky-700 border border-sky-200">
                                <Building className="w-3.5 h-3.5 text-sky-600" />
                                Bank (NPSB)
                              </span>
                            )}

                            {m.accountType && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {m.accountType}
                              </span>
                            )}
                          </div>

                          {m.isPrimary ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3 stroke-[3]" />
                              {lang === "en" ? "Primary" : "প্রধান"}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryMethod(m.id)}
                              className="text-[11px] font-bold text-slate-400 hover:text-emerald-700 hover:underline cursor-pointer"
                            >
                              {lang === "en" ? "Make Primary" : "প্রধান করুন"}
                            </button>
                          )}
                        </div>

                        {/* Account Details */}
                        <div className="space-y-1">
                          {isBank ? (
                            <>
                              <h4 className="text-sm font-black text-slate-900 leading-tight">
                                {m.bankName || "Bank Account"}
                              </h4>
                              {m.branchName && (
                                <p className="text-[11px] text-slate-500 font-medium">{m.branchName}</p>
                              )}
                              <p className="text-xs font-mono font-bold text-slate-700 pt-1">
                                A/C: {m.accountNumber}
                              </p>
                              {m.routingNumber && (
                                <p className="text-[10px] font-mono text-slate-400">
                                  Routing: {m.routingNumber}
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-mono font-black text-slate-900 tracking-wide">
                                {m.accountNumber}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {m.accountHolder}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Status and Delete */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{lang === "en" ? "Verified for Cashout" : "উত্তোলনের জন্য প্রস্তুত"}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveMethod(m.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={lang === "en" ? "Remove method" : "মাধ্যমটি মুছুন"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add New Method Dashed Button Card */}
                <button
                  type="button"
                  onClick={() => setAddMethodModalOpen(true)}
                  className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 p-5 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group min-h-[160px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 block">
                      {lang === "en" ? "Add New Payment Method" : "নতুন মাধ্যম যোগ করুন"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {lang === "en"
                        ? "bKash, Nagad, Rocket or local Bangladeshi Bank"
                        : "বিকাশ, নগদ, রকেট বা যেকোনো বাংলাদেশি ব্যাংক"}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
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


      </div>

      {/* Add Payment Method Modal */}
      {addMethodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {lang === "en" ? "Add Payment Method" : "পেমেন্ট মাধ্যম যোগ করুন"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === "en" ? "Link an account for instant withdrawals" : "তাৎক্ষণিক উত্তোলনের জন্য অ্যাকাউন্ট যুক্ত করুন"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddMethodModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addMethodSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  {lang === "en" ? "Payment Method Added!" : "পেমেন্ট মাধ্যম যুক্ত হয়েছে!"}
                </h4>
                <p className="text-xs text-slate-500">
                  {lang === "en"
                    ? "Your payout method has been verified and saved."
                    : "আপনার উত্তোলনের মাধ্যম সফলভাবে সংরক্ষিত ও যাচাই করা হয়েছে।"}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSavePaymentMethod} className="space-y-4">
                {/* Method Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-2">
                    {lang === "en" ? "Select Gateway" : "গেটওয়ে নির্বাচন করুন"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["BKASH", "NAGAD", "ROCKET", "BANK"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewMethodType(type)}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                          newMethodType === type
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {type === "BANK" ? (lang === "en" ? "Bank" : "ব্যাংক") : type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Type for MFS */}
                {newMethodType !== "BANK" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900">
                      {lang === "en" ? "Account Type" : "অ্যাকাউন্টের ধরন"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Personal", "Merchant"] as const).map((at) => (
                        <button
                          key={at}
                          type="button"
                          onClick={() => setNewAccountType(at)}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            newAccountType === at
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {at === "Personal" ? (lang === "en" ? "Personal" : "ব্যক্তিগত") : (lang === "en" ? "Merchant / Agent" : "মার্চেন্ট")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bank Fields */}
                {newMethodType === "BANK" ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-900">
                        {lang === "en" ? "Bank Name" : "ব্যাংকের নাম"}
                      </label>
                      <select
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {[
                          "BRAC Bank PLC",
                          "Dutch-Bangla Bank PLC",
                          "The City Bank PLC",
                          "Eastern Bank PLC",
                          "Islami Bank Bangladesh PLC",
                          "Prime Bank PLC",
                          "Mutual Trust Bank PLC",
                        ].map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-900">
                        {lang === "en" ? "Branch Name" : "শাখার নাম"}
                      </label>
                      <input
                        type="text"
                        required
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="e.g. Gulshan, Banani, Motijheel"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-900">
                        {lang === "en" ? "Bank Account Number" : "ব্যাংক হিসাব নম্বর"}
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                        placeholder="1501 2039 4810 2001"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-900">
                        {lang === "en" ? "Routing Number (Optional)" : "রাউটিং নম্বর (ঐচ্ছিক)"}
                      </label>
                      <input
                        type="text"
                        value={newRoutingNumber}
                        onChange={(e) => setNewRoutingNumber(e.target.value)}
                        placeholder="9-digit routing code"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900">
                      {newMethodType} {lang === "en" ? "Mobile Number" : "মোবাইল নম্বর"}
                    </label>
                    <input
                      type="text"
                      required
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      placeholder="+880 1XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {/* Account Holder Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900">
                    {lang === "en" ? "Account Holder Name (as on NID)" : "অ্যাকাউন্টধারীর নাম (এনআইডি অনুযায়ী)"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccountHolder}
                    onChange={(e) => setNewAccountHolder(e.target.value)}
                    placeholder="e.g. Tanvir Rahman"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Make Primary Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newIsPrimary}
                    onChange={(e) => setNewIsPrimary(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    {lang === "en"
                      ? "Set as primary withdrawal method"
                      : "প্রধান উত্তোলনের মাধ্যম হিসেবে সেট করুন"}
                  </span>
                </label>

                {/* Submit button */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAddMethodModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    {lang === "en" ? "Cancel" : "বাতিল"}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    {lang === "en" ? "Save Method" : "সংরক্ষণ করুন"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      
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
              </div>
            )}
          </div>
        </div>
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
    </DashboardShell>
  );
}


export default function FreelancerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-96 bg-white border border-slate-200/90 rounded-3xl shadow-xl animate-pulse" />
        </div>
      }
    >
      <FreelancerDashboardContent />
    </Suspense>
  );
}
