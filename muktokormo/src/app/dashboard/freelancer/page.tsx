"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send,
  Handshake,
  Wallet,
  Search,
  TrendingUp,
  ArrowRight,
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
  Info,
  Lock,
  ExternalLink,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import WorkspaceMessagesSection from "@/components/dashboard/WorkspaceMessagesSection";
import WorkspaceSection from "@/components/dashboard/WorkspaceSection";
import { SectionHeading, StatCard, OnboardingChecklist } from "@/components/dashboard/Primitives";
import {
  ProposalTracker,
  ProfileStrength,
  RecommendedSkills,
} from "@/components/dashboard/FreelancerWidgets";
import PaymentHistoryTable from "@/components/payments/PaymentHistoryTable";
import PaymentDetailModal from "@/components/payments/PaymentDetailModal";
import {
  FREELANCER_NAV,
  FREELANCER_ONBOARDING_TASKS,
} from "@/data/dashboardData";
import { formatBdt } from "@/lib/format";
import {
  PayoutMethod,
  fetchLivePayoutMethods,
  saveLivePayoutMethod,
  removeLivePayoutMethod,
  setPrimaryLivePayoutMethod,
} from "@/lib/data/wallet";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import { fetchOpenJobs } from "@/lib/data/jobs";
import { fetchMyProposals, submitProposal } from "@/lib/data/proposals";
import { fetchUserContracts } from "@/lib/data/contracts";
import {
  DEFAULT_PLATFORM_FEE_PCT,
  calculateContractFeeBreakdown,
} from "@/lib/payments/constants";
import {
  ESCROW_SIMULATION_DISCLAIMER,
  ESCROW_SIMULATION_DISCLAIMER_BN,
  getPaymentStatusMeta,
  getWorkStatusMeta,
} from "@/lib/payments/escrow";
import { Job, TrackedProposal, WorkspaceContract } from "@/types";
import type {
  FreelancerPaymentDashboardPayload,
  PaymentDashboardItem,
} from "@/types/payment";

function FreelancerDashboardContent() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const deniedFrom = searchParams ? searchParams.get("denied") : null;
  const { userId, name, email, role, freelancerId, avatarUrl, loading: userLoading } = useCurrentUser();
  const [lang, setLang] = useState<"en" | "bn">("en");
  const tabParam = searchParams ? searchParams.get("tab") : null;
  const threadParam = searchParams ? (searchParams.get("threadId") || searchParams.get("proposalId") || searchParams.get("contractId")) : null;
  const initialTab = tabParam === "contracts" ? "workspace" : (tabParam || (threadParam ? "messages" : "overview"));
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedMessageThreadId, setSelectedMessageThreadId] = useState<string | null>(threadParam || null);

  useEffect(() => {
    const applyRouteState = () => {
      if (tabParam) {
        setActiveTab(tabParam === "contracts" ? "workspace" : tabParam);
      } else if (threadParam) {
        setActiveTab("messages");
      } else if (typeof window !== "undefined") {
        const rawHash = window.location.hash.replace("#", "");
        const hash = rawHash === "contracts" ? "workspace" : rawHash;
        if (hash && ["overview", "find-work", "proposals", "workspace", "messages", "wallet", "profile"].includes(hash)) {
          setActiveTab(hash);
        }
      }

      if (threadParam) {
        setSelectedMessageThreadId(threadParam);
      }
    };

    const timerId = window.setTimeout(applyRouteState, 0);

    const handleHashChange = () => {
      if (typeof window !== "undefined") {
        const rawHash = window.location.hash.replace("#", "");
        const hash = rawHash === "contracts" ? "workspace" : rawHash;
        if (hash && ["overview", "find-work", "proposals", "workspace", "messages", "wallet", "profile"].includes(hash)) {
          setActiveTab(hash);
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [tabParam, threadParam]);

  const [pickedSkills, setPickedSkills] = useState<string[]>([]);
  const [isAvailableForWork, setIsAvailableForWork] = useState<boolean>(true);
  const [updatingAvailability, setUpdatingAvailability] = useState<boolean>(false);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [myProposals, setMyProposals] = useState<TrackedProposal[]>([]);
  const [contracts, setContracts] = useState<WorkspaceContract[]>([]);

  // Live Supabase Earnings & Escrow Dashboard State
  const [paymentDashboard, setPaymentDashboard] = useState<FreelancerPaymentDashboardPayload | null>(null);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDashboardItem | null>(null);
  const [paymentRefreshTick, setPaymentRefreshTick] = useState<number>(0);

  useEffect(() => {
    if (!freelancerId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("freelancers")
        .select("available")
        .eq("id", freelancerId)
        .maybeSingle();
      if (!cancelled && data && typeof data.available === "boolean") {
        setIsAvailableForWork(data.available);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, freelancerId]);

  const handleToggleAvailability = async () => {
    const nextVal = !isAvailableForWork;
    setIsAvailableForWork(nextVal);
    if (!freelancerId) return;
    setUpdatingAvailability(true);
    try {
      await supabase
        .from("freelancers")
        .update({ available: nextVal })
        .eq("id", freelancerId);
    } finally {
      setUpdatingAvailability(false);
    }
  };

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
    if (!freelancerId && !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const live = await fetchUserContracts(supabase, {
          role: "freelancer",
          userId,
          entityId: freelancerId,
        });
        if (!cancelled) setContracts(live || []);
      } catch (err) {
        console.error("Failed to load freelancer contracts:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, freelancerId, paymentRefreshTick]);

  const fetchFreelancerPayments = useCallback(async (): Promise<FreelancerPaymentDashboardPayload> => {
    const response = await fetch("/api/payments/dashboard?role=freelancer", {
      cache: "no-store",
    });
    const data = (await response.json()) as
      | FreelancerPaymentDashboardPayload
      | { ok?: false; error?: string };

    if (!response.ok || !data || !("ok" in data) || !data.ok) {
      throw new Error(
        (data as { error?: string })?.error ||
          "Unable to load freelancer payment records."
      );
    }
    return data;
  }, []);

  useEffect(() => {
    if (!userId || role !== "freelancer") return;
    let cancelled = false;
    fetchFreelancerPayments()
      .then((payload) => {
        if (cancelled) return;
        setPaymentDashboard(payload);
        setPaymentsError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setPaymentsError(
          err instanceof Error
            ? err.message
            : "Failed to load freelancer payment telemetry."
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingPayments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, role, paymentRefreshTick, fetchFreelancerPayments]);

  const handleRefreshPayments = () => {
    setLoadingPayments(true);
    setPaymentRefreshTick((t) => t + 1);
  };

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

  // Saved Payout Preferences State
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const live = await fetchLivePayoutMethods(supabase, userId || null);
      if (!cancelled && live) {
        setPayoutMethods(live);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

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

  const handleSetPrimaryMethod = async (id: string) => {
    const updated = await setPrimaryLivePayoutMethod(supabase, id);
    setPayoutMethods(updated);
  };

  const handleRemoveMethod = async (id: string) => {
    const updated = await removeLivePayoutMethod(supabase, id);
    setPayoutMethods(updated);
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
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

    const updated = await saveLivePayoutMethod(supabase, newMethod, userId || null);
    setPayoutMethods(updated);

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

  // Simulated Payout Request Preview Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawGateway, setWithdrawGateway] = useState<"BKASH" | "NAGAD" | "BANK">("BKASH");
  const [withdrawAccount, setWithdrawAccount] = useState("+8801712-345678");
  const [withdrawStep, setWithdrawStep] = useState<"FORM" | "PREVIEWED">("FORM");

  // Job proposal fast modal
  const [selectedJobToApply, setSelectedJobToApply] = useState<Job | null>(null);
  const [applyBidAmount, setApplyBidAmount] = useState<number>(15000);
  const [applyDays, setApplyDays] = useState<number>(5);
  const [applyCoverNote, setApplyCoverNote] = useState<string>("I have extensive Next.js and API integration experience with SSLCOMMERZ and local payment workflows.");
  const [applySuccess, setApplySuccess] = useState(false);

  // Strict Supabase-derived earnings & contract metrics
  const earningsSummary = paymentDashboard?.summary;
  const totalEarningsBdt = earningsSummary?.totalEarningsBdt ?? contracts.reduce((s, c) => s + (c.releasedBdt || 0), 0);
  const releasedEarningsBdt = earningsSummary?.releasedEarningsBdt ?? contracts.reduce((s, c) => s + (c.releasedBdt || 0), 0);
  const releasedGrossBdt = earningsSummary?.releasedGrossBdt ?? 0;
  const platformFeesDeductedBdt = earningsSummary?.platformFeesDeductedBdt ?? 0;
  const pendingEarningsBdt = earningsSummary?.pendingEarningsBdt ?? contracts.reduce((s, c) => s + (c.escrowHeldBdt || 0), 0);
  const pendingEscrowGrossBdt = earningsSummary?.pendingEscrowGrossBdt ?? 0;
  const availableEarningsSimulatedBdt = earningsSummary?.availableEarningsSimulatedBdt ?? releasedEarningsBdt;
  const activeFundedContracts = paymentDashboard?.activeFundedContracts ?? [];
  const completedReleasedCount = earningsSummary?.completedReleasedCount ?? 0;
  const activeContractsCount = contracts.filter((c) => c.stage === "ACTIVE").length;
  const refundRequests = useMemo(
    () => paymentDashboard?.refundRequests ?? [],
    [paymentDashboard]
  );
  const openRefundContractIds = useMemo(
    () =>
      new Set(
        refundRequests
          .filter((r) => r.status === "PENDING" || r.status === "GATEWAY_INITIATED")
          .map((r) => r.contract_id)
      ),
    [refundRequests]
  );

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

  // Simulated Cashout Preview Calculation
  const clampedPreviewAmount = Math.max(0, Math.min(withdrawAmount, availableEarningsSimulatedBdt));
  const mfsFee = Math.round(clampedPreviewAmount * 0.015);
  const netReceived = Math.max(0, clampedPreviewAmount - mfsFee);

  const handlePreviewSimulatedPayout = () => {
    if (clampedPreviewAmount <= 0 || availableEarningsSimulatedBdt <= 0) return;
    setWithdrawStep("PREVIEWED");
  };

  const handleApplyToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobToApply) return;

    if (freelancerId) {
      const breakdown = calculateContractFeeBreakdown(
        applyBidAmount,
        DEFAULT_PLATFORM_FEE_PCT
      );
      await submitProposal(supabase, {
        jobId: selectedJobToApply.id,
        freelancerId,
        bidAmountBdt: breakdown.grossAmount,
        platformFeeBdt: breakdown.platformFeeAmount,
        netEarnedBdt: breakdown.freelancerPayableAmount,
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
      walletBdt={availableEarningsSimulatedBdt}
      walletLabel={lang === "en" ? "simulated earnings" : "সিমুলেটেড আয়"}
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
          <div className="p-4 rounded-2xl bg-[#FEF6E6] border border-[#A87224]/25 text-[#6B4712] text-xs font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#A87224]/20 text-[#A87224] flex items-center justify-center font-bold">!</span>
              <span>
                {lang === "en"
                  ? "Access Restricted: You are signed in as a Freelancer. Only Employer / Client accounts can access the Client Hiring dashboard."
                  : "অ্যাক্সেস সংরক্ষিত: আপনি ফ্রিল্যান্সার হিসেবে লগইন করেছেন। শুধুমাত্র নিয়োগদাতা অ্যাকাউন্টই ক্লায়েন্ট ড্যাশবোর্ডে প্রবেশ করতে পারে।"}
              </span>
            </div>
            <button onClick={() => router.replace("/dashboard/freelancer")} className="text-[#8E9599] hover:text-[#111315] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Welcome Header (Only on Overview) */}
        {activeTab === "overview" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/20">
                  {lang === "en" ? "Freelancer Command Center" : "ফ্রিল্যান্সার ড্যাশবোর্ড"}
                </span>
                <span className="text-[#8E9599]">•</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("workspace")}
                  className="text-xs font-semibold text-[#0F6E50] hover:text-[#0B3B2E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{lang === "en" ? "Active Workspaces" : "চলতি ওয়ার্কস্পেস"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#111315]">
                {lang === "en" ? (
                  <>
                    Welcome back,{" "}
                    <span className="font-serif italic font-semibold text-[#0F6E50]">
                      {firstName}
                    </span>
                  </>
                ) : (
                  <>
                    স্বাগতম,{" "}
                    <span className="font-semibold text-[#0F6E50]">{firstName}</span>
                  </>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-[#61676B] mt-1 flex flex-wrap items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F6E50]" />
                {email || (lang === "en" ? "Freelancer Account" : "ফ্রিল্যান্সার অ্যাকাউন্ট")}
                <span className="text-[#8E9599]">•</span>
                {lang === "en"
                  ? "NID verified · 4.98 rating · Dhaka, Bangladesh"
                  : "এনআইডি যাচাইকৃত · ৪.৯৮ রেটিং · ঢাকা, বাংলাদেশ"}
              </p>
            </div>

            {/* Live Availability Status Toggle */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl px-3.5 py-2.5 shadow-2xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isAvailableForWork ? "bg-[#0F6E50] animate-pulse" : "bg-[#A87224]"
                }`}
              />
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#61676B] block">
                  {lang === "en" ? "Directory Status" : "ডিরেক্টরি স্ট্যাটাস"}
                </span>
                <span className="text-xs font-bold text-[#111315]">
                  {isAvailableForWork
                    ? lang === "en"
                      ? "Available for Work"
                      : "কাজের জন্য উপলব্ধ"
                    : lang === "en"
                      ? "Busy / Hidden"
                      : "ব্যস্ত / লুকানো"}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isAvailableForWork}
                disabled={updatingAvailability}
                onClick={handleToggleAvailability}
                className={`ml-2 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAvailableForWork ? "bg-[#0F6E50]" : "bg-[#D5D1C8]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isAvailableForWork ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}



        {/* Stats Grid (Only on Overview) */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <StatCard
                icon={TrendingUp}
                label="Total earnings (Net)"
                labelBn="মোট আয় (নিট)"
                value={formatBdt(totalEarningsBdt)}
                delta={
                  lang === "en"
                    ? `${completedReleasedCount} released (Simulated)`
                    : `${completedReleasedCount}টি রিলিজড (সিমুলেটেড)`
                }
                lang={lang}
                accent="emerald"
              />
              <StatCard
                icon={Clock}
                label="Pending earnings"
                labelBn="অপেক্ষমান আয় (এসক্রো)"
                value={formatBdt(pendingEarningsBdt)}
                delta={
                  lang === "en"
                    ? `${activeFundedContracts.length} funded in escrow`
                    : `${activeFundedContracts.length}টি এসক্রোতে ফান্ডেড`
                }
                lang={lang}
                accent="sky"
              />
              <StatCard
                icon={Wallet}
                label="Available (Simulated)"
                labelBn="সিমুলেটেড উপলব্ধ আয়"
                value={formatBdt(availableEarningsSimulatedBdt)}
                delta={
                  lang === "en"
                    ? "Internal Ledger Balance"
                    : "অভ্যন্তরীণ লেজার ব্যালেন্স"
                }
                lang={lang}
                accent="violet"
              />
              <StatCard
                icon={Handshake}
                label="Active funded contracts"
                labelBn="সক্রিয় ফান্ডেড চুক্তি"
                value={String(activeFundedContracts.length)}
                delta={
                  lang === "en"
                    ? `${activeContractsCount} total active`
                    : `মোট ${activeContractsCount}টি সক্রিয়`
                }
                lang={lang}
                accent="amber"
              />
            </div>

            {activeFundedContracts.length > 0 && (
              <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#111315] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0F6E50]" />
                      <span>
                        {lang === "en"
                          ? "Active Funded Contracts"
                          : "সক্রিয় ফান্ডেড চুক্তিসমূহ"}
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#61676B]">
                      {lang === "en"
                        ? "Escrow-funded milestones ready for work submission and client approval."
                        : "কাজ জমা ও ক্লায়েন্ট অনুমোদনের জন্য প্রস্তুত ফান্ডেড চুক্তি।"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("wallet")}
                    className="text-xs font-semibold text-[#0F6E50] hover:text-[#0B3B2E] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      {lang === "en" ? "Open Earnings & Escrow" : "আয় ও এসক্রো দেখুন"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeFundedContracts.slice(0, 4).map((ct) => {
                    const workMeta = getWorkStatusMeta(ct.workStatus);
                    return (
                      <div
                        key={ct.id}
                        className="p-3.5 rounded-xl border border-[rgba(17,19,21,0.08)] bg-[#FAF9F6] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/contracts/${ct.id}`}
                            className="text-xs font-bold text-[#111315] hover:text-[#0F6E50] hover:underline line-clamp-1"
                          >
                            {ct.title}
                          </Link>
                          <p className="text-[11px] text-[#61676B] font-mono mk-tabular truncate mt-0.5">
                            {ct.counterpartyName} · {ct.contractCode}
                          </p>
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF5FA] text-[#1E5B88] border border-[#1E5B88]/20">
                            {lang === "en" ? workMeta.label : workMeta.labelBn}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold font-mono mk-tabular text-[#0B3B2E]">
                            {formatBdt(ct.netEarningsBdt)}
                          </p>
                          <p className="text-[10px] font-mono mk-tabular text-[#61676B]">
                            Net 90% of {formatBdt(ct.totalBdt)}
                          </p>
                          <Link
                            href={`/contracts/${ct.id}`}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F6E50] hover:underline"
                          >
                            <span>{lang === "en" ? "Workspace" : "ওয়ার্কস্পেস"}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                    className="text-[11px] font-semibold text-[#0F6E50] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{lang === "en" ? "Browse All Jobs" : "মার্কেটপ্লেস দেখুন"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                }
              />
              <div className="space-y-2.5">
                {recommendedJobs.length === 0 ? (
                  <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-8 text-center">
                    <Search className="w-8 h-8 text-[#8E9599] mx-auto mb-3" />
                    <p className="text-xs font-semibold text-[#61676B]">
                      {lang === "en" ? "No open jobs yet. Check back soon!" : "এখনো কোনো কাজ নেই, শীঘ্রই যোগ হবে!"}
                    </p>
                  </div>
                ) : recommendedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-4 shadow-xs hover:border-[#0F6E50]/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#61676B] mb-1 block">
                          {job.category}
                        </span>
                        <h4 className="text-xs font-bold text-[#111315] leading-snug">
                          <Link href={`/jobs/${job.id}`} className="hover:text-[#0F6E50] hover:underline transition-colors">
                            {lang === "en" ? job.title : (job.titleBn || job.title)}
                          </Link>
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono mk-tabular text-[#61676B]">
                          <span className="font-bold text-[#111315]">
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
                          <span className="font-sans font-semibold text-[#0F6E50]">
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
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
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
                <div className="bg-[#EAF5F0] border border-[#0F6E50]/20 rounded-2xl p-5 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold text-[#0B3B2E]">
                    {lang === "en" ? "Ready to add to profile" : "প্রোফাইলে যোগ করার জন্য প্রস্তুত"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {pickedSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#0F6E50]/20 text-[11px] font-semibold text-[#0B3B2E]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/signup?step=profile"
                    className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0F6E50] hover:underline"
                  >
                    {lang === "en" ? "Save to Freelancer Profile" : "প্রোফাইলে সেভ করুন"}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
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
                  type="button"
                  onClick={() => setActiveTab("find-work")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] text-xs font-semibold border border-[rgba(17,19,21,0.08)] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Bid on Jobs" : "নতুন আবেদন"}</span>
                </button>
              }
            />
            <ProposalTracker
              proposals={myProposals}
              lang={lang}
              onOpenChat={(id) => {
                setSelectedMessageThreadId(id);
                setActiveTab("messages");
              }}
            />
          </div>
        )}

        {/* ----------------------------------------------------------------------------- */}
        {/* FREELANCER WORKSPACE & MILESTONE DELIVERIES / ESCROW                          */}
        {/* ----------------------------------------------------------------------------- */}
        {activeTab === "workspace" && (
          <div id="workspace" className="space-y-4">
            <WorkspaceSection
              role="freelancer"
              lang={lang}
              currentUserId={userId}
              currentEntityId={freelancerId}
              currentUserName={displayName}
              onOpenChat={(contractId) => {
                setSelectedMessageThreadId(contractId);
                setActiveTab("messages");
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </div>
        )}

        {/* Real-Time Messages Section (Only shown in messages tab) */}
        {activeTab === "messages" && (
          <div id="messages" className="space-y-4">
            <WorkspaceMessagesSection
              role="freelancer"
              lang={lang}
              currentUserId={userId}
              currentEntityId={freelancerId}
              currentUserName={displayName}
              currentUserAvatar={displayAvatar}
              initialThreadId={selectedMessageThreadId || undefined}
            />
          </div>
        )}

        {/* Earnings, Simulated Escrow & Payouts Section (Only shown in wallet tab) */}
        {activeTab === "wallet" && (
          <div id="wallet" className="space-y-6">
            {paymentsError && (
              <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#DC2626]/20 text-[#991B1B] text-xs font-semibold flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>{paymentsError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshPayments}
                  className="px-3 py-1 rounded-lg bg-white border border-[#DC2626]/20 text-[#B91C1C] font-bold hover:bg-[#FEF2F2] cursor-pointer"
                >
                  {lang === "en" ? "Retry" : "আবার চেষ্টা করুন"}
                </button>
              </div>
            )}

            {/* Academic Simulation Disclaimer */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#FEF6E6] border border-[#A87224]/25 text-xs text-[#6B4712]">
              <Info className="w-4 h-4 text-[#A87224] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {lang === "en"
                  ? ESCROW_SIMULATION_DISCLAIMER
                  : ESCROW_SIMULATION_DISCLAIMER_BN}
              </p>
            </div>

            {/* Simulated Freelancer Earnings Card */}
            <div className="mk-dark-card rounded-2xl p-6 text-white shadow-sm space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-emerald-300" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      {lang === "en"
                        ? "Freelancer Earnings Ledger"
                        : "ফ্রিল্যান্সার আয় ও এসক্রো লেজার"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-200 border border-amber-400/30">
                      {lang === "en"
                        ? "Simulated Internal Ledger"
                        : "সিমুলেটেড অভ্যন্তরীণ লেজার"}
                    </span>
                  </div>
                  <p className="text-3xl font-bold font-mono mk-tabular tracking-tight text-white">
                    {formatBdt(availableEarningsSimulatedBdt)}
                  </p>
                  <p className="text-[11px] text-white/70 mt-1">
                    {lang === "en"
                      ? "Available earnings (simulated) credited from released escrow contracts after 10% platform commission."
                      : "১০% প্ল্যাটফর্ম কমিশন বাদ দিয়ে রিলিজ হওয়া এসক্রো চুক্তি থেকে সিমুলেটেড উপলব্ধ আয়।"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleRefreshPayments}
                    disabled={loadingPayments}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        loadingPayments ? "animate-spin" : ""
                      }`}
                    />
                    <span>{lang === "en" ? "Sync Ledger" : "রিফ্রেশ"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawAmount(availableEarningsSimulatedBdt);
                      setWithdrawStep("FORM");
                      setWithdrawModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F6E50] hover:bg-emerald-600 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>
                      {lang === "en"
                        ? "Simulated Payout Preview"
                        : "সিমুলেটেড উত্তোলন প্রিভিউ"}
                    </span>
                  </button>
                </div>
              </div>

              {/* 4 Earnings KPIs derived from Supabase */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-white/10">
                <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-[10px] font-bold text-white/65 uppercase">
                    {lang === "en" ? "Total Earnings (Net)" : "মোট আয় (নিট)"}
                  </p>
                  <p className="text-base font-bold font-mono mk-tabular text-white mt-0.5">
                    {formatBdt(totalEarningsBdt)}
                  </p>
                  <p className="text-[10px] font-mono mk-tabular text-white/65 mt-0.5">
                    Gross {formatBdt(releasedGrossBdt)}
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-[10px] font-bold text-white/65 uppercase">
                    {lang === "en"
                      ? "Pending Earnings (Escrow)"
                      : "অপেক্ষমান আয় (এসক্রো)"}
                  </p>
                  <p className="text-base font-bold font-mono mk-tabular text-amber-200 mt-0.5">
                    {formatBdt(pendingEarningsBdt)}
                  </p>
                  <p className="text-[10px] font-mono mk-tabular text-white/65 mt-0.5">
                    Gross held {formatBdt(pendingEscrowGrossBdt)}
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-[10px] font-bold text-white/65 uppercase">
                    {lang === "en"
                      ? "Released Earnings (90%)"
                      : "রিলিজড আয় (৯০%)"}
                  </p>
                  <p className="text-base font-bold font-mono mk-tabular text-emerald-200 mt-0.5">
                    {formatBdt(releasedEarningsBdt)}
                  </p>
                  <p className="text-[10px] font-mono mk-tabular text-white/65 mt-0.5">
                    {completedReleasedCount}{" "}
                    {lang === "en" ? "released payments" : "টি রিলিজড পেমেন্ট"}
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-[10px] font-bold text-white/65 uppercase">
                    {lang === "en"
                      ? "Platform Fees (10%)"
                      : "প্ল্যাটফর্ম ফি (১০%)"}
                  </p>
                  <p className="text-base font-bold font-mono mk-tabular text-sky-200 mt-0.5">
                    {formatBdt(platformFeesDeductedBdt)}
                  </p>
                  <p className="text-[10px] text-white/65 mt-0.5">
                    {lang === "en"
                      ? "Deducted on ledger release"
                      : "রিলিজের সময় কর্তনকৃত"}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Funded Contracts */}
            <div className="space-y-3">
              <SectionHeading
                title="Active funded contracts"
                titleBn="সক্রিয় ফান্ডেড চুক্তিসমূহ"
                subtitle="Contracts funded in SSLCOMMERZ Sandbox and held in simulated escrow awaiting work completion"
                subtitleBn="SSLCOMMERZ স্যান্ডবক্সে ফান্ড করা এবং কাজ সম্পন্ন হওয়ার অপেক্ষায় থাকা চুক্তি"
                lang={lang}
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab("workspace")}
                    className="text-xs font-semibold text-[#0F6E50] hover:text-[#0B3B2E] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      {lang === "en" ? "Go to Workspace" : "ওয়ার্কস্পেসে যান"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                }
              />

              {activeFundedContracts.length === 0 ? (
                <div className="bg-white border border-dashed border-[rgba(17,19,21,0.14)] rounded-2xl p-8 text-center space-y-2">
                  <Lock className="w-7 h-7 text-[#8E9599] mx-auto" />
                  <p className="text-xs font-bold text-[#111315]">
                    {lang === "en"
                      ? "No active funded contracts right now"
                      : "বর্তমানে কোনো ফান্ডেড চুক্তি নেই"}
                  </p>
                  <p className="text-xs text-[#61676B] max-w-md mx-auto">
                    {lang === "en"
                      ? "Once a client funds a contract via SSLCOMMERZ Sandbox, it will appear here so you can submit work and earn simulated escrow release."
                      : "ক্লায়েন্ট SSLCOMMERZ স্যান্ডবক্সের মাধ্যমে চুক্তি ফান্ড করলে তা এখানে দেখা যাবে।"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {activeFundedContracts.map((ct) => {
                    const workMeta = getWorkStatusMeta(ct.workStatus);
                    const payMeta = getPaymentStatusMeta(ct.paymentStatus);
                    return (
                      <div
                        key={ct.id}
                        className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono mk-tabular text-[10px] text-[#61676B]">
                              {ct.contractCode}
                            </p>
                            <Link
                              href={`/contracts/${ct.id}`}
                              className="text-sm font-bold text-[#111315] hover:text-[#0F6E50] hover:underline line-clamp-1"
                            >
                              {ct.title}
                            </Link>
                            <p className="text-xs text-[#61676B] mt-0.5">
                              Client: {ct.counterpartyName}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold font-mono mk-tabular text-[#0B3B2E]">
                              {formatBdt(ct.netEarningsBdt)}
                            </p>
                            <p className="text-[10px] font-mono mk-tabular text-[#61676B]">
                              Net 90% of {formatBdt(ct.totalBdt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[rgba(17,19,21,0.07)]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF5FA] text-[#1E5B88] border border-[#1E5B88]/20">
                              {lang === "en" ? payMeta.label : payMeta.labelBn}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4F2EC] text-[#3F4448] border border-[rgba(17,19,21,0.08)]">
                              {lang === "en" ? workMeta.label : workMeta.labelBn}
                            </span>
                            {openRefundContractIds.has(ct.id) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF6E6] text-[#A87224] border border-[#A87224]/25">
                                {lang === "en" ? "Refund Pending Review" : "রিফান্ড পর্যালোচনাধীন"}
                              </span>
                            )}
                          </div>

                          <Link
                            href={`/contracts/${ct.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-[11px] font-semibold transition-colors"
                          >
                            <span>
                              {lang === "en"
                                ? "Open & Submit Work"
                                : "কাজ জমা দিন"}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Freelancer Payment History (Settled / Funded / Released / Refunded) */}
            <div className="space-y-3">
              <SectionHeading
                title="Payment history"
                titleBn="পেমেন্ট ইতিহাস"
                subtitle="Escrow-settled and released contract payments recorded in Supabase (click any transaction ID for details)"
                subtitleBn="সুপাবেজে সংরক্ষিত এসক্রো ও রিলিজড পেমেন্টসমূহ (বিস্তারিত দেখতে ট্রানজেকশন আইডিতে ক্লিক করুন)"
                lang={lang}
              />
              <PaymentHistoryTable
                payments={paymentDashboard?.payments ?? []}
                viewerRole="freelancer"
                lang={lang}
                loading={loadingPayments}
                onViewDetails={setSelectedPayment}
                emptyTitle={
                  lang === "en"
                    ? "No funded or released contract payments yet"
                    : "এখনো কোনো ফান্ডেড বা রিলিজড পেমেন্ট নেই"
                }
                emptySubtitle={
                  lang === "en"
                    ? "Settled client escrow deposits and released milestone payouts will appear here automatically."
                    : "ক্লায়েন্ট এসক্রো ফান্ড করলে এবং পেমেন্ট রিলিজ হলে তা এখানে দেখা যাবে।"
                }
              />
            </div>

            {/* Refund & Dispute Status Updates */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <SectionHeading
                  title="Refund & escrow dispute updates"
                  titleBn="রিফান্ড ও এসক্রো বিরোধ অবস্থা"
                  subtitle="Track any client refund requests moderated by Muktokormo Admin on your contracts"
                  subtitleBn="আপনার চুক্তির যেকোনো রিফান্ড অনুরোধ ও অ্যাডমিন সিদ্ধান্ত দেখুন"
                  lang={lang}
                />
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-full font-mono mk-tabular bg-[#F4F2EC] text-[#3F4448] border border-[rgba(17,19,21,0.08)]">
                    {refundRequests.length}{" "}
                    {lang === "en" ? "requests" : "টি অনুরোধ"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full font-mono mk-tabular bg-[#F3EFFA] text-[#5B3E96] border border-[#5B3E96]/20">
                    {earningsSummary?.refundedCount ?? 0}{" "}
                    {lang === "en" ? "refunded" : "টি রিফান্ডেড"}
                  </span>
                </div>
              </div>

              {refundRequests.length === 0 ? (
                <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 text-xs text-[#61676B] flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-[#8E9599] shrink-0" />
                  <span>
                    {lang === "en"
                      ? "No refund requests or escrow disputes have been filed on your contracts."
                      : "আপনার চুক্তিসমূহে কোনো রিফান্ড বা বিরোধ অনুরোধ নেই।"}
                  </span>
                </div>
              ) : (
                <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl divide-y divide-[rgba(17,19,21,0.07)] shadow-xs overflow-hidden">
                  {refundRequests.map((req) => {
                    const statusClass =
                      req.status === "COMPLETED"
                        ? "bg-[#EAF5F0] text-[#0B3B2E] border-[#0F6E50]/25"
                        : req.status === "REJECTED" || req.status === "FAILED"
                          ? "bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/20"
                          : req.status === "GATEWAY_INITIATED"
                            ? "bg-[#EEF5FA] text-[#1E5B88] border-[#1E5B88]/20"
                            : "bg-[#FEF6E6] text-[#A87224] border-[#A87224]/25";
                    return (
                      <div
                        key={req.id}
                        className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold font-mono mk-tabular text-[#111315]">
                              {formatBdt(req.amount)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}
                            >
                              {req.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F4F2EC] text-[#3F4448] border border-[rgba(17,19,21,0.08)]">
                              {req.refund_mode}
                            </span>
                            {req.gateway_status && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#F4F2EC] text-[#3F4448]">
                                GW: {req.gateway_status}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#3F4448]">{req.reason}</p>
                          {req.admin_notes && (
                            <p className="text-[11px] text-[#61676B]">
                              {lang === "en" ? "Admin note:" : "অ্যাডমিন নোট:"}{" "}
                              {req.admin_notes}
                            </p>
                          )}
                        </div>
                        <div className="text-left sm:text-right shrink-0 text-[10px] text-[#61676B] font-mono mk-tabular space-y-1">
                          <div>
                            {new Intl.DateTimeFormat("en-BD", {
                              dateStyle: "medium",
                            }).format(new Date(req.created_at))}
                          </div>
                          {req.gateway_refund_ref_id && (
                            <div>Ref: {req.gateway_refund_ref_id}</div>
                          )}
                          <div>
                            <Link
                              href={`/contracts/${req.contract_id}`}
                              className="font-sans text-[11px] font-semibold text-[#0F6E50] hover:underline"
                            >
                              {lang === "en" ? "Open Contract →" : "চুক্তি দেখুন →"}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Simulated Internal Escrow Ledger Entries */}
            <div className="space-y-3">
              <SectionHeading
                title="Simulated internal escrow ledger"
                titleBn="সিমুলেটেড অভ্যন্তরীণ এসক্রো খতিয়ান"
                subtitle="Database-tracked FUND, RELEASE (10% fee / 90% net), and REFUND ledger entries"
                subtitleBn="ডাটাবেসে সংরক্ষিত ফান্ড, রিলিজ এবং রিফান্ড লেজার এন্ট্রি"
                lang={lang}
              />
              <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-xs overflow-hidden">
                {(paymentDashboard?.ledgerEntries ?? []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#61676B]">
                    {lang === "en"
                      ? "No internal escrow ledger entries recorded yet."
                      : "এখনো কোনো অভ্যন্তরীণ এসক্রো লেজার এন্ট্রি নেই।"}
                  </div>
                ) : (
                  <div className="divide-y divide-[rgba(17,19,21,0.07)]">
                    {(paymentDashboard?.ledgerEntries ?? []).map((entry) => (
                      <div
                        key={entry.id}
                        className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF9F6]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                entry.entry_type === "RELEASE"
                                  ? "bg-[#EAF5F0] text-[#0B3B2E] border-[#0F6E50]/25"
                                  : entry.entry_type === "REFUND"
                                    ? "bg-[#F3EFFA] text-[#5B3E96] border-[#5B3E96]/20"
                                    : "bg-[#EEF5FA] text-[#1E5B88] border-[#1E5B88]/20"
                              }`}
                            >
                              {entry.entry_type}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FEF6E6] text-[#A87224] border border-[#A87224]/25">
                              Simulated Ledger
                            </span>
                            <span className="text-[11px] font-mono mk-tabular text-[#61676B]">
                              {new Intl.DateTimeFormat("en-BD", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(entry.created_at))}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#111315] mt-1">
                            {entry.description}
                          </p>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-xs font-bold font-mono mk-tabular text-[#111315]">
                            {entry.entry_type === "RELEASE"
                              ? `+${formatBdt(entry.freelancer_net_amount)} Net`
                              : formatBdt(entry.amount)}
                          </p>
                          <p className="text-[10px] font-mono mk-tabular text-[#61676B]">
                            Gross {formatBdt(entry.amount)} · Fee{" "}
                            {formatBdt(entry.platform_fee_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payout Account Preferences (Preview / Profile Setup Only) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[#111315] flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#0F6E50]" />
                    <span>
                      {lang === "en"
                        ? "Saved Payout Preferences"
                        : "সংরক্ষিত উত্তোলন মাধ্যম"}
                    </span>
                  </h3>
                  <p className="text-xs text-[#61676B] mt-0.5">
                    {lang === "en"
                      ? "Store preferred MFS/bank accounts on your profile. Automated live transfers are disabled in academic sandbox mode."
                      : "আপনার প্রোফাইলে পছন্দের বিকাশ/নগদ/ব্যাংক তথ্য সংরক্ষণ করুন। স্যান্ডবক্স মোডে সরাসরি টাকা পাঠানো হয় না।"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddMethodModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
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
                      className={`relative rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                        m.isPrimary
                          ? "bg-white border-[#0F6E50] shadow-xs ring-2 ring-[#0F6E50]/15"
                          : "bg-white border-[rgba(17,19,21,0.09)] hover:border-[rgba(17,19,21,0.2)] shadow-2xs"
                      }`}
                    >
                      <div>
                        {/* Card Header: Type Badge & Primary Pill */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            {isBkash && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
                                <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                                bKash
                              </span>
                            )}
                            {isNagad && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                                Nagad
                              </span>
                            )}
                            {isRocket && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                                Rocket
                              </span>
                            )}
                            {isBank && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EEF5FA] text-[#1E5B88] border border-[#1E5B88]/20">
                                <Building className="w-3.5 h-3.5 text-[#1E5B88]" />
                                Bank (NPSB)
                              </span>
                            )}

                            {m.accountType && (
                              <span className="text-[10px] font-bold text-[#61676B] uppercase">
                                {m.accountType}
                              </span>
                            )}
                          </div>

                          {m.isPrimary ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/20">
                              <Check className="w-3 h-3 stroke-[3]" />
                              {lang === "en" ? "Primary" : "প্রধান"}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryMethod(m.id)}
                              className="text-[11px] font-semibold text-[#61676B] hover:text-[#0F6E50] hover:underline cursor-pointer"
                            >
                              {lang === "en" ? "Make Primary" : "প্রধান করুন"}
                            </button>
                          )}
                        </div>

                        {/* Account Details */}
                        <div className="space-y-1">
                          {isBank ? (
                            <>
                              <h4 className="text-sm font-bold text-[#111315] leading-tight">
                                {m.bankName || "Bank Account"}
                              </h4>
                              {m.branchName && (
                                <p className="text-[11px] text-[#61676B] font-medium">{m.branchName}</p>
                              )}
                              <p className="text-xs font-mono mk-tabular font-bold text-[#3F4448] pt-1">
                                A/C: {m.accountNumber}
                              </p>
                              {m.routingNumber && (
                                <p className="text-[10px] font-mono mk-tabular text-[#61676B]">
                                  Routing: {m.routingNumber}
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-mono mk-tabular font-bold text-[#111315] tracking-wide">
                                {m.accountNumber}
                              </p>
                              <p className="text-[11px] text-[#61676B] font-medium">
                                {m.accountHolder}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Status and Delete */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[rgba(17,19,21,0.07)]">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F6E50]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{lang === "en" ? "Preference Saved" : "সংরক্ষিত"}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveMethod(m.id)}
                          className="p-1.5 rounded-lg text-[#8E9599] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
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
                  className="rounded-2xl border-2 border-dashed border-[rgba(17,19,21,0.14)] hover:border-[#0F6E50] hover:bg-[#EAF5F0]/40 p-5 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group min-h-[160px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F4F2EC] group-hover:bg-[#EAF5F0] text-[#61676B] group-hover:text-[#0B3B2E] flex items-center justify-center transition-colors">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#111315] group-hover:text-[#0B3B2E] block">
                      {lang === "en" ? "Add New Payment Method" : "নতুন মাধ্যম যোগ করুন"}
                    </span>
                    <span className="text-[11px] text-[#61676B] mt-0.5 block">
                      {lang === "en"
                        ? "bKash, Nagad, Rocket or local Bangladeshi Bank"
                        : "বিকাশ, নগদ, রকেট বা যেকোনো বাংলাদেশি ব্যাংক"}
                    </span>
                  </div>
                </button>
              </div>
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
        <div
          className="fixed inset-0 z-50 bg-[#111315]/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setAddMethodModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[rgba(17,19,21,0.1)] space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(17,19,21,0.08)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EAF5F0] text-[#0B3B2E] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111315]">
                    {lang === "en" ? "Add Payment Method" : "পেমেন্ট মাধ্যম যোগ করুন"}
                  </h3>
                  <p className="text-[11px] text-[#61676B]">
                    {lang === "en" ? "Link an account for instant withdrawals" : "তাৎক্ষণিক উত্তোলনের জন্য অ্যাকাউন্ট যুক্ত করুন"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddMethodModalOpen(false)}
                className="text-[#8E9599] hover:text-[#111315] p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addMethodSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#EAF5F0] text-[#0F6E50] flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-[#111315]">
                  {lang === "en" ? "Payment Method Added!" : "পেমেন্ট মাধ্যম যুক্ত হয়েছে!"}
                </h4>
                <p className="text-xs text-[#61676B]">
                  {lang === "en"
                    ? "Your payout method has been verified and saved."
                    : "আপনার উত্তোলনের মাধ্যম সফলভাবে সংরক্ষিত ও যাচাই করা হয়েছে।"}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSavePaymentMethod} className="space-y-4">
                {/* Method Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#111315] mb-2">
                    {lang === "en" ? "Select Gateway" : "গেটওয়ে নির্বাচন করুন"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["BKASH", "NAGAD", "ROCKET", "BANK"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewMethodType(type)}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          newMethodType === type
                            ? "bg-[#0B3B2E] text-white border-[#0B3B2E] shadow-xs"
                            : "bg-[#FAF9F6] hover:bg-[#F4F2EC] text-[#3F4448] border-[rgba(17,19,21,0.1)]"
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
                    <label className="block text-xs font-semibold text-[#111315]">
                      {lang === "en" ? "Account Type" : "অ্যাকাউন্টের ধরন"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Personal", "Merchant"] as const).map((at) => (
                        <button
                          key={at}
                          type="button"
                          onClick={() => setNewAccountType(at)}
                          className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            newAccountType === at
                              ? "bg-[#111315] text-white border-[#111315]"
                              : "bg-white text-[#3F4448] border-[rgba(17,19,21,0.1)] hover:bg-[#FAF9F6]"
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
                      <label className="block text-xs font-semibold text-[#111315]">
                        {lang === "en" ? "Bank Name" : "ব্যাংকের নাম"}
                      </label>
                      <select
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.12)] rounded-xl text-xs font-semibold text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
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
                      <label className="block text-xs font-semibold text-[#111315]">
                        {lang === "en" ? "Branch Name" : "শাখার নাম"}
                      </label>
                      <input
                        type="text"
                        required
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="e.g. Gulshan, Banani, Motijheel"
                        className="w-full px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.12)] rounded-xl text-xs font-medium text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111315]">
                        {lang === "en" ? "Bank Account Number" : "ব্যাংক হিসাব নম্বর"}
                      </label>
                      <input
                        type="text"
                        required
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                        placeholder="1501 2039 4810 2001"
                        className="w-full px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.12)] rounded-xl text-xs font-mono mk-tabular font-medium text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111315]">
                        {lang === "en" ? "Routing Number (Optional)" : "রাউটিং নম্বর (ঐচ্ছিক)"}
                      </label>
                      <input
                        type="text"
                        value={newRoutingNumber}
                        onChange={(e) => setNewRoutingNumber(e.target.value)}
                        placeholder="9-digit routing code"
                        className="w-full px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.12)] rounded-xl text-xs font-mono mk-tabular font-medium text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111315]">
                      {newMethodType} {lang === "en" ? "Mobile Number" : "মোবাইল নম্বর"}
                    </label>
                    <input
                      type="text"
                      required
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      placeholder="+880 1XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.12)] rounded-xl text-xs font-mono mk-tabular font-medium text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
                    />
                  </div>
                )}

                {/* Account Holder Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111315]">
                    {lang === "en" ? "Account Holder Name (as on NID)" : "অ্যাকাউন্টধারীর নাম (এনআইডি অনুযায়ী)"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccountHolder}
                    onChange={(e) => setNewAccountHolder(e.target.value)}
                    placeholder="e.g. Tanvir Rahman"
                    className="w-full px-3.5 py-2.5 bg-white border border-[rgba(17,19,21,0.12)] rounded-xl text-xs font-medium text-[#111315] focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
                  />
                </div>

                {/* Make Primary Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newIsPrimary}
                    onChange={(e) => setNewIsPrimary(e.target.checked)}
                    className="rounded border-[rgba(17,19,21,0.2)] text-[#0F6E50] focus:ring-[#0F6E50]"
                  />
                  <span className="text-xs font-medium text-[#3F4448]">
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
                    className="flex-1 py-2.5 rounded-xl border border-[rgba(17,19,21,0.12)] text-xs font-semibold text-[#61676B] hover:bg-[#FAF9F6] transition-all cursor-pointer"
                  >
                    {lang === "en" ? "Cancel" : "বাতিল"}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    {lang === "en" ? "Save Method" : "সংরক্ষণ করুন"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      
      {/* Simulated Payout Request Preview Modal (Academic Sandbox Mode) */}
      {withdrawModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#111315]/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setWithdrawModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[rgba(17,19,21,0.1)] space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(17,19,21,0.08)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#EAF5F0] text-[#0B3B2E] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111315]">
                    {lang === "en"
                      ? "Simulated Payout Preview"
                      : "সিমুলেটেড উত্তোলন প্রিভিউ"}
                  </h3>
                  <p className="text-[11px] text-[#61676B]">
                    {lang === "en"
                      ? "Simulated Available Balance: "
                      : "সিমুলেটেড উপলব্ধ ব্যালেন্স: "}
                    <span className="font-bold font-mono mk-tabular text-[#111315]">
                      {formatBdt(availableEarningsSimulatedBdt)} BDT
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(false)}
                className="p-1 rounded-full text-[#8E9599] hover:text-[#111315] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FEF6E6] border border-[#A87224]/25 text-[11px] text-[#6B4712]">
              <Info className="w-4 h-4 text-[#A87224] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {lang === "en"
                  ? "Academic Sandbox Notice: Real bKash, Nagad, or bank transfers do not run automatically. This calculator only previews payout breakdown against your Supabase-released earnings."
                  : "একাডেমিক স্যান্ডবক্স বিজ্ঞপ্তি: বাস্তব বিকাশ, নগদ বা ব্যাংক ট্রান্সফার স্বয়ংক্রিয়ভাবে সম্পন্ন হয় না। এটি শুধুমাত্র হিসাব প্রিভিউ প্রদর্শন করে।"}
              </p>
            </div>

            {availableEarningsSimulatedBdt <= 0 ? (
              <div className="py-4 text-center space-y-3">
                <Lock className="w-8 h-8 text-[#8E9599] mx-auto" />
                <p className="text-xs font-bold text-[#111315]">
                  {lang === "en"
                    ? "No released earnings available yet"
                    : "এখনো কোনো রিলিজড আয় নেই"}
                </p>
                <p className="text-xs text-[#61676B]">
                  {lang === "en"
                    ? "Submit completed contract work and receive client approval to credit released earnings in Supabase."
                    : "চুক্তির কাজ জমা দিয়ে ক্লায়েন্টের অনুমোদন পেলে রিলিজড আয় যুক্ত হবে।"}
                </p>
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#0B3B2E] text-white font-semibold text-xs cursor-pointer"
                >
                  {lang === "en" ? "Close" : "বন্ধ করুন"}
                </button>
              </div>
            ) : withdrawStep === "FORM" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#111315] block mb-1.5">
                    {lang === "en" ? "Preferred Payout Channel" : "পছন্দের মাধ্যম"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["BKASH", "NAGAD", "BANK"] as const).map((gw) => (
                      <button
                        key={gw}
                        type="button"
                        onClick={() => setWithdrawGateway(gw)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          withdrawGateway === gw
                            ? "bg-[#EAF5F0] border-[#0F6E50] text-[#0B3B2E] font-bold shadow-2xs"
                            : "border-[rgba(17,19,21,0.1)] text-[#3F4448] hover:bg-[#FAF9F6]"
                        }`}
                      >
                        <span className="text-xs font-bold">
                          {gw === "BANK" ? "Bank NPSB" : gw}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#111315] block mb-1">
                    {lang === "en" ? "Account Reference" : "অ্যাকাউন্ট নম্বর"}
                  </label>
                  <input
                    type="text"
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono mk-tabular font-bold bg-[#FAF9F6] border border-[rgba(17,19,21,0.12)] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[#111315]">
                      {lang === "en" ? "Preview Amount (BDT)" : "প্রিভিউ পরিমাণ (টাকা)"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(availableEarningsSimulatedBdt)}
                      className="text-[11px] font-semibold text-[#0F6E50] hover:underline cursor-pointer"
                    >
                      {lang === "en" ? "Use Max" : "সর্বোচ্চ"}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={availableEarningsSimulatedBdt}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base font-bold font-mono mk-tabular text-[#111315] border border-[rgba(17,19,21,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
                  />
                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)] rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-[#61676B]">
                    <span>Preview Amount:</span>
                    <span className="font-bold font-mono mk-tabular text-[#111315]">
                      {formatBdt(clampedPreviewAmount)} BDT
                    </span>
                  </div>
                  <div className="flex justify-between text-[#61676B]">
                    <span>Estimated MFS Fee (1.5%):</span>
                    <span className="font-bold font-mono mk-tabular text-[#DC2626]">
                      -{formatBdt(mfsFee)} BDT
                    </span>
                  </div>
                  <div className="flex justify-between text-[#0B3B2E] font-bold pt-1 border-t border-[rgba(17,19,21,0.08)]">
                    <span>Estimated Net (Simulated):</span>
                    <span className="font-mono mk-tabular">{formatBdt(netReceived)} BDT</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePreviewSimulatedPayout}
                  disabled={clampedPreviewAmount <= 0}
                  className="w-full py-3 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] disabled:bg-[#D5D1C8] text-white font-semibold text-xs cursor-pointer transition-all"
                >
                  {lang === "en"
                    ? "Preview Payout Summary (Simulated Only)"
                    : "সিমুলেটেড পেআউট সারাংশ দেখুন"}
                </button>
              </div>
            ) : (
              <div className="py-3 text-center space-y-3">
                <div className="w-11 h-11 rounded-full bg-[#FEF6E6] text-[#A87224] flex items-center justify-center mx-auto">
                  <Info className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#111315]">
                  {lang === "en"
                    ? "Simulated Payout Preview Recorded Locally"
                    : "সিমুলেটেড পেআউট প্রিভিউ"}
                </h4>
                <p className="text-xs text-[#61676B] leading-relaxed">
                  {lang === "en"
                    ? `Estimated net ${formatBdt(netReceived)} to ${withdrawGateway} (${withdrawAccount}). No real funds were moved and your Supabase ledger balance remains ${formatBdt(availableEarningsSimulatedBdt)}.`
                    : `${withdrawGateway} (${withdrawAccount})-এর জন্য আনুমানিক ${formatBdt(netReceived)} প্রদর্শিত হয়েছে। কোনো বাস্তব অর্থ স্থানান্তর করা হয়নি।`}
                </p>
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#0B3B2E] text-white font-semibold text-xs cursor-pointer"
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
        <div
          className="fixed inset-0 z-50 bg-[#111315]/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedJobToApply(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[rgba(17,19,21,0.1)] space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#61676B] uppercase tracking-wide">
                  {selectedJobToApply.category}
                </span>
                <h3 className="text-sm font-bold text-[#111315]">
                  {lang === "en" ? selectedJobToApply.title : (selectedJobToApply.titleBn || selectedJobToApply.title)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobToApply(null)}
                className="p-1 rounded-full text-[#8E9599] hover:text-[#111315] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {applySuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#0F6E50] mx-auto" />
                <h4 className="text-sm font-bold text-[#111315]">Proposal Submitted!</h4>
                <p className="text-xs text-[#61676B]">Client will be notified of your competitive proposal.</p>
              </div>
            ) : (
              <form onSubmit={handleApplyToJob} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#111315] block mb-1">Your Bid (BDT)</label>
                    <input
                      type="number"
                      value={applyBidAmount}
                      onChange={(e) => setApplyBidAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono mk-tabular font-bold border border-[rgba(17,19,21,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#111315] block mb-1">Delivery Time (Days)</label>
                    <input
                      type="number"
                      value={applyDays}
                      onChange={(e) => setApplyDays(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono mk-tabular font-bold border border-[rgba(17,19,21,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
                      required
                    />
                  </div>
                </div>

                {(() => {
                  const preview = calculateContractFeeBreakdown(
                    applyBidAmount,
                    DEFAULT_PLATFORM_FEE_PCT
                  );
                  return (
                    <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)] text-[11px] flex items-center justify-between">
                      <span className="text-[#61676B]">
                        Platform commission (<span className="font-mono mk-tabular">{preview.platformFeePct}%</span>):{" "}
                        <strong className="font-mono mk-tabular text-[#111315]">
                          {formatBdt(preview.platformFeeAmount)}
                        </strong>
                      </span>
                      <span className="text-[#0B3B2E] font-bold font-mono mk-tabular">
                        Net Payable: {formatBdt(preview.freelancerPayableAmount)}
                      </span>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-[11px] font-semibold text-[#111315] block mb-1">Proposal Pitch</label>
                  <textarea
                    rows={3}
                    value={applyCoverNote}
                    onChange={(e) => setApplyCoverNote(e.target.value)}
                    className="w-full p-2.5 text-xs border border-[rgba(17,19,21,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F6E50]"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobToApply(null)}
                    className="px-4 py-2 rounded-xl border border-[rgba(17,19,21,0.12)] text-xs font-semibold text-[#3F4448] hover:bg-[#FAF9F6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0B3B2E] text-white text-xs font-semibold shadow-xs hover:bg-[#0F6E50] cursor-pointer"
                  >
                    Submit Proposal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      <PaymentDetailModal
        payment={selectedPayment}
        viewerRole="freelancer"
        lang={lang}
        onClose={() => setSelectedPayment(null)}
      />
    </DashboardShell>
  );
}


export default function FreelancerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-96 bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-sm animate-pulse" />
        </div>
      }
    >
      <FreelancerDashboardContent />
    </Suspense>
  );
}
