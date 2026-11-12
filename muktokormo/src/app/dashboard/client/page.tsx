"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  Send,
  Handshake,
  Wallet,
  Users,
  Video,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Lock,
  Smartphone,
  CreditCard,
  Building,
  AlertCircle,
  X,
  RefreshCw,
  Bookmark,
  Gavel,
  MessageSquare,
  Plus,
  Trash2,
  Check,
  Receipt,
  ExternalLink,
  Printer,
  Edit3,
  Info,
  RotateCcw,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import WorkspaceMessagesSection from "@/components/dashboard/WorkspaceMessagesSection";
import WorkspaceSection from "@/components/dashboard/WorkspaceSection";
import { SectionHeading, StatCard, OnboardingChecklist } from "@/components/dashboard/Primitives";
import { DraftJobsTable } from "@/components/dashboard/Widgets";
import PaymentHistoryTable from "@/components/payments/PaymentHistoryTable";
import PaymentDetailModal from "@/components/payments/PaymentDetailModal";
import {
  CLIENT_NAV,
  CLIENT_ONBOARDING_TASKS,
  CLIENT_DRAFT_JOBS,
  CLIENT_CONTRACTS,
  CLIENT_LEDGER,
} from "@/data/dashboardData";
import { formatBdt } from "@/lib/format";
import { WalletEntry, DraftJob, WorkspaceContract } from "@/types";
import type {
  ClientPaymentDashboardPayload,
  PaymentDashboardItem,
} from "@/types/payment";
import {
  ESCROW_SIMULATION_DISCLAIMER,
  ESCROW_SIMULATION_DISCLAIMER_BN,
  getPaymentStatusMeta,
  getWorkStatusMeta,
} from "@/lib/payments/escrow";
import {
  DEFAULT_PLATFORM_FEE_PCT,
  calculateContractFeeBreakdown,
} from "@/lib/payments/constants";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import { fetchClientProjects } from "@/lib/data/jobs";
import { createContractFromProposal, fetchUserContracts } from "@/lib/data/contracts";
import { fetchSavedTalent, unsaveTalent } from "@/lib/data/freelancers";
import {
  fetchClientProposals,
  ClientProposal,
  updateProposalStatus,
} from "@/lib/data/proposals";
import {
  PayoutMethod,
  fetchLivePayoutMethods,
  saveLivePayoutMethod,
  removeLivePayoutMethod,
  setPrimaryLivePayoutMethod,
} from "@/lib/data/wallet";

type ClientLedgerEntry = WalletEntry & { trxId?: string };

const STATUS_TONE_CLASSES: Record<string, string> = {
  emerald: "bg-[#EAF5F0] text-[#0B3B2E] border-[#0F6E50]/25",
  sky: "bg-[#EEF5FA] text-[#1E5B88] border-[#1E5B88]/20",
  amber: "bg-[#FEF6E6] text-[#A87224] border-[#A87224]/25",
  rose: "bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/20",
  indigo: "bg-[#F3EFFA] text-[#5B3E96] border-[#5B3E96]/20",
  slate: "bg-[#F4F2EC] text-[#3F4448] border-black/10",
};

const CONSULTANTS = [
  {
    name: "Abul Kalam Saju",
    country: "Dhaka, Bangladesh",
    jobs: 14,
    rate: 25,
    success: 100,
    specialty: "Full Stack & Next.js Architecture",
    blurb:
      "The job isn't complete until my client is fully satisfied. Skilled web design and bKash payment systems expert.",
    price: 30,
  },
  {
    name: "Nabila Tabassum",
    country: "Chattogram, Bangladesh",
    jobs: 19,
    rate: 20,
    success: 98,
    specialty: "UI/UX, Figma & Brand Systems",
    blurb:
      "Specialized in high-conversion e-commerce storefronts and mobile apps for Bangladeshi retail brands.",
    price: 35,
  },
  {
    name: "Tanzimul Islam",
    country: "Sylhet, Bangladesh",
    jobs: 11,
    rate: 30,
    success: 100,
    specialty: "Digital Marketing, SEO & Ads",
    blurb:
      "I help businesses scale ROAS on Meta and TikTok with server-side CAPI tracking and high-converting copy.",
    price: 40,
  },
];

const MOCK_PROPOSALS = [
  {
    id: "prop-1",
    jobTitle: "Full-Stack Next.js E-Commerce Website with bKash/Nagad Payment",
    jobTitleBn: "বিকাশ/নগদ পেমেন্ট গেটওয়ে সহ নেক্সট.জেএস ই-কমার্স ওয়েবসাইট",
    freelancerName: "Tanvir Rahman",
    freelancerNameBn: "তানভীর রহমান",
    freelancerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    freelancerTitle: "Senior Next.js & MFS Gateway Engineer",
    freelancerTitleBn: "সিনিয়র নেক্সট.জেএস ও এমএফএস গেটওয়ে ইঞ্জিনিয়ার",
    rating: 4.95,
    reviews: 42,
    bidBdt: 42000,
    deliveryDays: 14,
    coverNote: "I have integrated bKash and Nagad payment merchant webhooks for 8+ Bangladeshi e-commerce startups. Ready to start immediately.",
    coverNoteBn: "আমি বাংলাদেশের ৮টির বেশি ই-কমার্স স্টার্টআপের জন্য বিকাশ ও নগদ পেমেন্ট ওয়েবহুক সফলভাবে ইন্টিগ্রেট করেছি। এখনই কাজ শুরু করতে প্রস্তুত।",
    isShortlisted: true,
  },
  {
    id: "prop-2",
    jobTitle: "Full-Stack Next.js E-Commerce Website with bKash/Nagad Payment",
    jobTitleBn: "বিকাশ/নগদ পেমেন্ট গেটওয়ে সহ নেক্সট.জেএস ই-কমার্স ওয়েবসাইট",
    freelancerName: "Mahmudul Hasan",
    freelancerNameBn: "মাহমুদুল হাসান",
    freelancerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    freelancerTitle: "Full Stack Developer",
    freelancerTitleBn: "ফুল-স্ট্যাক ডেভেলপার",
    rating: 4.88,
    reviews: 29,
    bidBdt: 38000,
    deliveryDays: 18,
    coverNote: "Experienced in Next.js 14 App router, Tailwind CSS, PostgreSQL Prisma, and SSLCommerz.",
    coverNoteBn: "নেক্সট.জেএস ১৪ অ্যাপ রাউটার, পোস্টগ্রেএসকিউএল প্রিজমা এবং এসএসএলকমার্স বাস্তবায়নে অভিজ্ঞ।",
    isShortlisted: false,
  },
];

const SAVED_TALENT = [
  {
    id: "fav-1",
    name: "Farhana Yasmin",
    nameBn: "ফারহানা ইয়াসমিন",
    title: "Senior Performance Marketer",
    titleBn: "সিনিয়র পারফরম্যান্স মার্কেটার",
    location: "Gulshan, Dhaka",
    locationBn: "গুলশান, ঢাকা",
    rating: 4.95,
    rateBdt: 1500,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80",
    skills: ["Meta Ads", "TikTok Ads", "CAPI", "Copywriting"],
  },
  {
    id: "fav-2",
    name: "Sabbir Ahmed",
    nameBn: "সাব্বir আহমেদ",
    title: "Brand Identity & Packaging Specialist",
    titleBn: "ব্র্যান্ড আইডেন্টিটি ও প্যাকেজিং বিশেষজ্ঞ",
    location: "Agrabad, Chattogram",
    locationBn: "আগ্রাবাদ, চট্টগ্রাম",
    rating: 4.92,
    rateBdt: 1200,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    skills: ["Figma", "Branding", "Packaging", "Illustration"],
  },
];

const DEFAULT_CLIENT_METHODS: PayoutMethod[] = [
  {
    id: "cpm-1",
    type: "BKASH",
    accountType: "Merchant",
    accountNumber: "+880 1819-987654",
    accountHolder: "Apex Lifestyle Corporate",
    isPrimary: true,
    status: "VERIFIED",
  },
  {
    id: "cpm-2",
    type: "BANK",
    accountType: "Merchant",
    bankName: "BRAC Bank PLC",
    branchName: "Gulshan Corporate Branch",
    accountNumber: "1501 2039 4810 2001",
    accountHolder: "Apex Lifestyle BD Ltd.",
    routingNumber: "060261345",
    isPrimary: false,
    status: "VERIFIED",
  },
];

function ClientDashboardContent() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const toggleLang = () => setLang((prev) => (prev === "en" ? "bn" : "en"));

  const { userId, clientId, name, email, companyName, avatarUrl, role } = useCurrentUser();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [selectedMessageThreadId, setSelectedMessageThreadId] = useState<string | null>(null);

  const isDemo = !userId && (email === "apex@lifestyle.bd" || !email);
  const displayName = name || (isDemo ? "Ahad A" : "Client");
  const displayFirstName = displayName.split(" ")[0] || "Client";
  const displayCompany = companyName || (isDemo ? "Apex Lifestyle BD" : "My Organization");
  const displayMeta = lang === "en" ? `Client (${displayCompany})` : `ক্লায়েন্ট (${displayCompany})`;

  const tabParam = searchParams ? searchParams.get("tab") : null;
  const initialTab = tabParam === "contracts" ? "workspace" : (tabParam || "overview");
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const syncRouteTab = () => {
      if (tabParam) {
        setActiveTab(tabParam === "contracts" ? "workspace" : tabParam);
      } else if (typeof window !== "undefined") {
        const rawHash = window.location.hash.replace("#", "");
        const hash = rawHash === "contracts" ? "workspace" : rawHash;
        if (hash && ["overview", "jobs", "proposals", "workspace", "messages", "payments", "disputes", "saved"].includes(hash)) {
          setActiveTab(hash);
        }
      }
    };

    const timerId = window.setTimeout(syncRouteTab, 0);

    const handleHashChange = () => {
      if (typeof window !== "undefined") {
        const rawHash = window.location.hash.replace("#", "");
        const hash = rawHash === "contracts" ? "workspace" : rawHash;
        if (hash && ["overview", "jobs", "proposals", "workspace", "messages", "payments", "disputes", "saved"].includes(hash)) {
          setActiveTab(hash);
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [tabParam]);

  const [acceptedProposalIds, setAcceptedProposalIds] = useState<string[]>(["prop-1"]);
  const [consultants, setConsultants] = useState(true);
  const [ledgerEntries] = useState<ClientLedgerEntry[]>(isDemo ? CLIENT_LEDGER : []);
  const [ledgerFilter, setLedgerFilter] = useState<"ALL" | "FUND" | "RELEASE" | "REFUND">("ALL");

  // Payment & Billing Preferences State
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>(DEFAULT_CLIENT_METHODS);
  const [addMethodModalOpen, setAddMethodModalOpen] = useState(false);
  const [newMethodType, setNewMethodType] = useState<"BKASH" | "NAGAD" | "ROCKET" | "BANK">("BKASH");
  const [newAccountType, setNewAccountType] = useState<"Personal" | "Merchant">("Merchant");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolder, setNewAccountHolder] = useState(displayCompany || displayName || "");
  const [newBankName, setNewBankName] = useState("BRAC Bank PLC");
  const [newBranchName, setNewBranchName] = useState("");
  const [newRoutingNumber, setNewRoutingNumber] = useState("");
  const [newIsPrimary, setNewIsPrimary] = useState(false);
  const [addMethodSuccess, setAddMethodSuccess] = useState(false);

  // Corporate Billing Profile State
  const [billingProfile, setBillingProfile] = useState({
    companyName: displayCompany || "Apex Lifestyle BD Ltd.",
    binNumber: "002948192-0101",
    tinNumber: "482910394812",
    billingAddress: "Level 7, Simpletree Anarkali, 89 Gulshan Avenue, Dhaka 1212",
    vatStatus: "15% NBR Mushak-6.3 Rebate Compliant",
  });
  const [editBillingModalOpen, setEditBillingModalOpen] = useState(false);

  // Tax Invoice / Receipt Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<ClientLedgerEntry | null>(null);

  // Live SSLCOMMERZ Sandbox Payment Dashboard State
  const [paymentDashboard, setPaymentDashboard] = useState<ClientPaymentDashboardPayload | null>(null);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<{ tone: "emerald" | "rose"; text: string } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDashboardItem | null>(null);
  const [initiatingContractId, setInitiatingContractId] = useState<string | null>(null);
  const [verifyingTranId, setVerifyingTranId] = useState<string | null>(null);
  const [paymentRefreshTick, setPaymentRefreshTick] = useState<number>(0);

  // Contract Funding Selector Modal (Replaces old fake deposit modal)
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedContractIdToFund, setSelectedContractIdToFund] = useState<string>("");

  const [contracts, setContracts] = useState<WorkspaceContract[]>([]);
  const [draftJobs, setDraftJobs] = useState<DraftJob[]>(isDemo ? CLIENT_DRAFT_JOBS : []);
  const [proposals, setProposals] = useState<ClientProposal[]>(isDemo ? (MOCK_PROPOSALS as unknown as ClientProposal[]) : []);
  const [savedTalentList, setSavedTalentList] = useState<
    { id: string; name: string; nameBn?: string; title: string; titleBn?: string; location: string; locationBn?: string; rating: number; rateBdt: number; avatar: string }[]
  >(isDemo ? SAVED_TALENT : []);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);

  const activeContracts = contracts.filter((c) => c.stage === "ACTIVE");
  const totalProposals = proposals.length > 0
    ? proposals.length
    : (isDemo ? 3 : draftJobs.reduce((sum, d) => sum + (d.proposalCount || 0), 0));

  // Real Supabase-derived Client Payment KPIs
  const paymentSummary = paymentDashboard?.summary;
  const fallbackEscrowHeld = contracts.reduce((sum, c) => sum + (c.escrowHeldBdt || 0), 0);
  const fallbackReleasedSpent = contracts.reduce((sum, c) => sum + (c.releasedBdt || 0), 0);
  const inEscrowBdt = userId ? (paymentSummary?.inEscrowBdt ?? fallbackEscrowHeld) : fallbackEscrowHeld;
  const releasedSpendingBdt = userId ? (paymentSummary?.releasedSpendingBdt ?? fallbackReleasedSpent) : fallbackReleasedSpent;
  const totalSpendingBdt = userId ? (paymentSummary?.totalSpendingBdt ?? inEscrowBdt + releasedSpendingBdt) : inEscrowBdt + releasedSpendingBdt;
  const refundedBdt = userId ? (paymentSummary?.refundedBdt ?? 0) : 0;
  const fundedContractsCount = userId ? (paymentSummary?.fundedContractsCount ?? 0) : activeContracts.length;
  const pendingPaymentsCount = userId ? (paymentSummary?.pendingPaymentsCount ?? 0) : 0;
  const pendingPaymentAttemptsCount = userId ? (paymentSummary?.pendingPaymentAttemptsCount ?? 0) : 0;
  const failedOrCancelledCount = userId ? (paymentSummary?.failedOrCancelledCount ?? 0) : 0;
  const refundRequestsCount = userId ? (paymentSummary?.refundRequestsCount ?? 0) : 0;
  const pendingRefundCount = userId ? (paymentSummary?.pendingRefundCount ?? 0) : 0;
  const disputedContractsCount = contracts.filter((c) => c.stage === "DISPUTED").length;

  const fundableContracts = useMemo(
    () =>
      (paymentDashboard?.contracts ?? []).filter(
        (c) => c.canFund || c.canRetry
      ),
    [paymentDashboard]
  );

  const effectiveContractIdToFund = fundableContracts.some(
    (c) => c.id === selectedContractIdToFund
  )
    ? selectedContractIdToFund
    : fundableContracts[0]?.id ?? "";

  const selectedFundableContract =
    fundableContracts.find((c) => c.id === effectiveContractIdToFund) ?? null;

  const latestInvoiceEntry: ClientLedgerEntry | null = useMemo(() => {
    const firstPayment = paymentDashboard?.payments?.[0];
    if (userId && firstPayment) {
      return {
        id: firstPayment.id,
        label: `${firstPayment.contract_title} (${firstPayment.contract_code})`,
        labelBn: `${firstPayment.contract_title} (${firstPayment.contract_code})`,
        method: "ESCROW",
        amountBdt: firstPayment.amount,
        status:
          firstPayment.status === "FAILED" || firstPayment.status === "CANCELLED"
            ? "FAILED"
            : firstPayment.status === "PENDING"
            ? "PENDING"
            : "COMPLETED",
        createdLabel: new Date(firstPayment.created_at).toLocaleDateString("en-BD"),
        trxId: firstPayment.transaction_id,
      };
    }
    return isDemo ? (ledgerEntries[0] ?? null) : null;
  }, [userId, paymentDashboard, isDemo, ledgerEntries]);

  // Fetch live client projects, proposals and contracts
  useEffect(() => {
    if (!clientId && !userId) {
      if (isDemo) {
        Promise.resolve().then(() => {
          setDraftJobs(CLIENT_DRAFT_JOBS);
          setProposals(MOCK_PROPOSALS as unknown as ClientProposal[]);
          setContracts(CLIENT_CONTRACTS as unknown as WorkspaceContract[]);
        });
      }
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingJobs(true);
      setLoadingProposals(true);
      try {
        const [liveProjects, liveProposals, liveContracts, liveSaved] = await Promise.all([
          clientId ? fetchClientProjects(supabase, clientId) : Promise.resolve([]),
          clientId ? fetchClientProposals(supabase, clientId) : Promise.resolve([]),
          fetchUserContracts(supabase, { role: "client", userId, entityId: clientId }),
          clientId ? fetchSavedTalent(supabase, clientId) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          if (liveProjects.length > 0 || !isDemo) {
            setDraftJobs(liveProjects);
          }
          if (liveProposals.length > 0 || !isDemo) {
            setProposals(liveProposals);
            const acceptedIds = liveProposals
              .filter((p) => p.status === "ACCEPTED")
              .map((p) => p.id);
            if (acceptedIds.length > 0) {
              setAcceptedProposalIds((prev) => Array.from(new Set([...prev, ...acceptedIds])));
            }
          }
          if (liveContracts) {
            setContracts(liveContracts);
          }
          if (clientId) {
            setSavedTalentList(
              liveSaved.map((f) => ({
                id: f.id,
                name: f.name,
                title: f.title,
                location: f.location,
                rating: f.rating,
                rateBdt: f.hourlyRateBdt,
                avatar: f.avatar,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load live client jobs, proposals & contracts:", err);
      } finally {
        if (!cancelled) {
          setLoadingJobs(false);
          setLoadingProposals(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, clientId, userId, isDemo, paymentRefreshTick]);

  const fetchClientPayments = useCallback(async (): Promise<ClientPaymentDashboardPayload> => {
    const response = await fetch("/api/payments/dashboard?role=client", {
      cache: "no-store",
    });
    const data = (await response.json()) as
      | ClientPaymentDashboardPayload
      | { ok?: false; error?: string };

    if (!response.ok || !data || !("ok" in data) || !data.ok) {
      throw new Error(
        (data as { error?: string })?.error ||
          "Unable to load client payment records."
      );
    }
    return data;
  }, []);

  useEffect(() => {
    if (!userId || role !== "client") return;
    let cancelled = false;
    fetchClientPayments()
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
            : "Failed to load client payment records."
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingPayments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, role, paymentRefreshTick, fetchClientPayments]);

  const handleRefreshPayments = () => {
    setLoadingPayments(true);
    setPaymentRefreshTick((t) => t + 1);
  };

  const handleInitiatePayment = async (contractId: string) => {
    if (!contractId) return;
    setPaymentNotice(null);
    setInitiatingContractId(contractId);
    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        gatewayPageUrl?: string;
      };

      if (!response.ok || !data.ok || !data.gatewayPageUrl) {
        setPaymentNotice({
          tone: "rose",
          text:
            data.error ||
            "Unable to initialize SSLCOMMERZ Sandbox checkout session.",
        });
        return;
      }

      setPaymentNotice({
        tone: "emerald",
        text:
          lang === "en"
            ? "Redirecting to SSLCOMMERZ Sandbox payment gateway..."
            : "SSLCOMMERZ স্যান্ডবক্স গেটওয়েতে রিডাইরেক্ট করা হচ্ছে...",
      });
      window.location.assign(data.gatewayPageUrl);
    } catch {
      setPaymentNotice({
        tone: "rose",
        text: "Network error contacting /api/payments/initiate.",
      });
    } finally {
      setInitiatingContractId(null);
    }
  };

  const handleVerifyPendingPayment = async (transactionId: string) => {
    if (!transactionId) return;
    setPaymentNotice(null);
    setVerifyingTranId(transactionId);
    try {
      const response = await fetch("/api/payments/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        paymentStatus?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setPaymentNotice({
          tone: "rose",
          text:
            data.error ||
            "Transaction is not verified as successful at SSLCOMMERZ Sandbox yet.",
        });
      } else {
        setPaymentNotice({
          tone: "emerald",
          text:
            lang === "en"
              ? `Payment verified via SSLCOMMERZ Sandbox (Status: ${data.paymentStatus ?? "FUNDED"}).`
              : `SSLCOMMERZ স্যান্ডবক্স দ্বারা যাচাই সম্পন্ন (${data.paymentStatus ?? "FUNDED"})।`,
        });
        setSelectedPayment(null);
      }
      setPaymentRefreshTick((t) => t + 1);
    } catch {
      setPaymentNotice({
        tone: "rose",
        text: "Network error while verifying transaction status.",
      });
    } finally {
      setVerifyingTranId(null);
    }
  };

  const handleAcceptBid = async (proposalId: string) => {
    setAcceptedProposalIds((prev) => Array.from(new Set([...prev, proposalId])));
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: "ACCEPTED" } : p))
    );
    setSelectedMessageThreadId(proposalId);
    if (!proposalId.startsWith("prop-")) {
      try {
        const updated = await updateProposalStatus(supabase, proposalId, "ACCEPTED");
        if (updated) {
          const contract = await createContractFromProposal(supabase, proposalId);
          if (contract) {
            setSelectedMessageThreadId(contract.id);
            setPaymentRefreshTick((t) => t + 1);
          }
        }
      } catch (err) {
        console.error("Failed to update proposal status & create contract in DB:", err);
      }
    }
  };

  // Fetch live payout methods
  useEffect(() => {
    let mounted = true;
    fetchLivePayoutMethods(supabase, userId).then((methods) => {
      if (mounted && methods && methods.length > 0) {
        setPayoutMethods(methods);
      }
    });
    return () => {
      mounted = false;
    };
  }, [supabase, userId]);

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
      accountType: newAccountType,
      accountNumber: newAccountNumber.trim(),
      accountHolder: newAccountHolder.trim() || displayCompany || "Corporate Account",
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

  // Filtered Supabase Escrow Ledger entries (or showcase preview when unauthenticated)
  const supabaseLedgerEntries = paymentDashboard?.ledgerEntries ?? [];
  const filteredSupabaseLedger = supabaseLedgerEntries.filter((entry) => {
    if (ledgerFilter === "ALL") return true;
    return entry.entry_type === ledgerFilter;
  });

  const filteredDemoLedger = ledgerEntries.filter((entry) => {
    if (ledgerFilter === "ALL") return true;
    if (ledgerFilter === "FUND") return entry.label.toLowerCase().includes("escrow");
    if (ledgerFilter === "RELEASE") return entry.label.toLowerCase().includes("released") || entry.label.toLowerCase().includes("disbursed");
    if (ledgerFilter === "REFUND") return entry.label.toLowerCase().includes("refund");
    return true;
  });

  return (
    <DashboardShell
      role="client"
      nav={CLIENT_NAV}
      userName={displayName}
      userMeta={displayMeta}
      avatar={avatarUrl || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&auto=format&fit=crop&q=80"}
      walletBdt={inEscrowBdt}
      walletLabel={lang === "en" ? "in simulated escrow" : "সিমুলেটেড এসক্রোতে"}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      lang={lang}
      onToggleLang={toggleLang}
      action={{
        label: "Post a Job",
        labelBn: "কাজ পোস্ট করুন",
        href: "/post-job",
      }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header (Only on Overview) */}
        {activeTab === "overview" && (
          <div id="overview" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/20">
                  {lang === "en" ? "Client Command Center" : "ক্লায়েন্ট কমান্ড সেন্টার"}
                </span>
                <span className="text-[#8E9599]">•</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("workspace")}
                  className="text-xs font-semibold text-[#0F6E50] hover:text-[#0B3B2E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{lang === "en" ? "Active Workspaces" : "ওয়ার্কস্পেস"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#111315]">
                {lang === "en" ? (
                  <>
                    Welcome back,{" "}
                    <span className="font-serif italic font-semibold text-[#0F6E50]">
                      {displayFirstName}
                    </span>
                  </>
                ) : (
                  <>
                    স্বাগতম,{" "}
                    <span className="font-semibold text-[#0F6E50]">{displayFirstName}</span>
                  </>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-[#61676B] mt-1">
                {lang === "en"
                  ? "Manage your active job postings, evaluate freelancer proposals, and fund secure milestone escrows."
                  : "আপনার পোস্টকৃত কাজ পরিচালনা করুন, ফ্রিল্যান্সারদের আবেদন যাচাই করুন এবং নিরাপদ এসক্রোতে তহবিল রাখুন।"}
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              icon={Briefcase}
              label="Active job posts"
              labelBn="সক্রিয় কাজ"
              value={String(draftJobs.length > 0 ? draftJobs.filter(j => j.status === "LIVE").length : (isDemo ? 3 : 0))}
              delta={lang === "en" ? `${draftJobs.length} total posts` : `মোট ${draftJobs.length}টি পোস্ট`}
              lang={lang}
              accent="emerald"
            />
            <StatCard
              icon={Send}
              label="Proposals received"
              labelBn="প্রাপ্ত আবেদন"
              value={String(totalProposals)}
              delta={lang === "en" ? `${totalProposals} received` : `${totalProposals}টি আবেদন`}
              lang={lang}
              accent="sky"
            />
            <StatCard
              icon={Handshake}
              label="Active contracts"
              labelBn="সক্রিয় চুক্তি"
              value={String(activeContracts.length)}
              lang={lang}
              accent="violet"
            />
            <StatCard
              icon={Wallet}
              label="Total spending"
              labelBn="মোট ব্যয় (এসক্রো ও রিলিজ)"
              value={formatBdt(totalSpendingBdt)}
              delta={
                lang === "en"
                  ? `${fundedContractsCount} funded · ${pendingPaymentsCount} pending`
                  : `${fundedContractsCount} ফান্ডেড · ${pendingPaymentsCount} অপেক্ষমান`
              }
              lang={lang}
              accent="amber"
            />
          </div>
        )}

        {/* Overview Payment & Escrow Quick Summary */}
        {activeTab === "overview" && (
          <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <div className="rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.07)] px-3.5 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#61676B]">
                  {lang === "en" ? "Funded Contracts" : "ফান্ডেড চুক্তি"}
                </p>
                <p className="text-sm font-bold font-mono mk-tabular text-[#0B3B2E] mt-0.5">
                  {fundedContractsCount}
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.07)] px-3.5 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#61676B]">
                  {lang === "en" ? "Simulated Escrow" : "সিমুলেটেড এসক্রো"}
                </p>
                <p className="text-sm font-bold font-mono mk-tabular text-[#111315] mt-0.5">
                  {formatBdt(inEscrowBdt)}
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.07)] px-3.5 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#61676B]">
                  {lang === "en" ? "Released Spending" : "রিলিজকৃত ব্যয়"}
                </p>
                <p className="text-sm font-bold font-mono mk-tabular text-[#111315] mt-0.5">
                  {formatBdt(releasedSpendingBdt)}
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.07)] px-3.5 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#61676B]">
                  {lang === "en" ? "Pending & Refunds" : "অপেক্ষমান ও রিফান্ড"}
                </p>
                <p className="text-xs font-bold font-mono mk-tabular text-[#A87224] mt-1">
                  {pendingPaymentsCount} {lang === "en" ? "pending" : "অপেক্ষমান"}
                  {failedOrCancelledCount > 0
                    ? lang === "en"
                      ? ` · ${failedOrCancelledCount} retryable`
                      : ` · ${failedOrCancelledCount} পুনঃচেষ্টা`
                    : ""}{" "}
                  · {formatBdt(refundedBdt)} {lang === "en" ? "refunded" : "রিফান্ড"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {fundableContracts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {lang === "en"
                      ? `Fund Contract (${fundableContracts.length})`
                      : `চুক্তি ফান্ড করুন (${fundableContracts.length})`}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab("payments")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] text-xs font-semibold border border-[rgba(17,19,21,0.08)] transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-[#0F6E50]" />
                <span>{lang === "en" ? "Payment History & Escrow" : "পেমেন্ট ও এসক্রো"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Onboarding + Guided Consultation */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <OnboardingChecklist tasks={CLIENT_ONBOARDING_TASKS} lang={lang} />
            </div>

            <div className="mk-dark-card rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 text-emerald-300">
                  <Video className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {lang === "en" ? "Guided Expert Consultation" : "বিশেষজ্ঞ পরামর্শ"}
                  </span>
                </div>

                <h3 className="text-base font-bold leading-snug text-white">
                  {lang === "en"
                    ? "Book a 1-on-1 scope & budget review"
                    : "১-অন-১ বাজেট ও কাজের পরিধি পর্যালোচনা"}
                </h3>
                <p className="text-xs text-white/75 mt-2 leading-relaxed">
                  {lang === "en"
                    ? "Review your product specs, BDT budget, and developer milestones with a verified consultant before hiring."
                    : "নিয়োগ করার আগে আপনার প্রজেক্টের বাজেট ও মাইলস্টোন বিশেষজ্ঞের সাথে পর্যালোচনা করুন।"}
                </p>
              </div>

              <button
                onClick={() => setConsultants(!consultants)}
                className="mt-5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-[#0B3B2E] text-xs font-bold hover:bg-[#EAF5F0] transition-all cursor-pointer shadow-xs"
              >
                {lang === "en" ? "Browse Top Consultants" : "পরামর্শদাতাদের তালিকা দেখুন"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Consultants List */}
        {consultants && activeTab === "overview" && (
          <div className="animate-in fade-in duration-200">
            <SectionHeading
              title="Verified project advisors"
              titleBn="যাচাইকৃত প্রজেক্ট উপদেষ্টা"
              subtitle="Hire top engineers to architect your technical scope"
              subtitleBn="প্রজেক্ট আর্কিটেকচার ও স্কোপ নির্ধারণে শীর্ষ প্রকৌশলী"
              lang={lang}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {CONSULTANTS.map((c) => (
                <div
                  key={c.name}
                  className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 shadow-xs hover:border-[#0F6E50]/40 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/15 flex items-center justify-center text-xs font-bold shrink-0">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#111315] truncate">{c.name}</p>
                      <p className="text-[11px] text-[#61676B]">{c.country}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#61676B] leading-relaxed mb-1.5">{c.blurb}</p>
                  <p className="text-[11px] font-semibold text-[#0F6E50] mb-3">{c.specialty}</p>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[rgba(17,19,21,0.07)]">
                    <span className="text-xs font-bold font-mono mk-tabular text-[#111315]">
                      ${c.price}
                      <span className="font-sans font-medium text-[#61676B]"> / 30 min</span>
                    </span>
                    <button className="px-3.5 py-1.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-[11px] font-semibold transition-colors cursor-pointer">
                      {lang === "en" ? "Book Session" : "বুক করুন"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job posts */}
        {(activeTab === "overview" || activeTab === "jobs") && (
          <div id="jobs" className="space-y-4">
            <SectionHeading
              title="Your job posts"
              titleBn="আপনার কাজের পোস্টসমূহ"
              subtitle="Drafts and live posts with candidate proposals"
              subtitleBn="খসড়া ও প্রকাশিত পোস্ট এবং আবেদনকারীর তালিকা"
              lang={lang}
              action={
                <Link
                  href="/post-job"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] text-xs font-semibold border border-[rgba(17,19,21,0.08)] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0F6E50]" />
                  {lang === "en" ? "Post New Job" : "নতুন কাজ পোস্ট"}
                </Link>
              }
            />
            {loadingJobs ? (
              <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-[#0F6E50] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#61676B]">
                  {lang === "en" ? "Loading your job posts..." : "কাজের পোস্ট লোড হচ্ছে..."}
                </p>
              </div>
            ) : (
              <DraftJobsTable drafts={draftJobs} lang={lang} />
            )}
          </div>
        )}

        {/* Candidate Proposals Received Tab */}
        {(activeTab === "overview" || activeTab === "proposals") && (
          <div id="proposals" className="space-y-4">
            <SectionHeading
              title="Talent proposals received"
              titleBn="প্রাপ্ত ফ্রিল্যান্সার আবেদন"
              subtitle="Compare bids, inspect credentials, and hire into escrow"
              subtitleBn="বিড তুলনা করুন, কাজের অভিজ্ঞতা যাচাই করুন এবং নিয়োগ দিন"
              lang={lang}
            />
            {loadingProposals ? (
              <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-[#0F6E50] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#61676B]">
                  {lang === "en" ? "Loading received proposals..." : "প্রাপ্ত আবেদন লোড হচ্ছে..."}
                </p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F4F2EC] text-[#61676B] flex items-center justify-center mx-auto">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#111315]">
                  {lang === "en" ? "No proposals received yet" : "এখনও কোনো আবেদন জমা পড়েনি"}
                </h3>
                <p className="text-xs text-[#61676B] max-w-md mx-auto">
                  {lang === "en"
                    ? "When freelancers submit bids on your posted jobs, their proposals will appear here for you to review and hire."
                    : "আপনার পোস্ট করা কাজে ফ্রিল্যান্সাররা আবেদন করলে তাদের বিড এখানে প্রদর্শিত হবে।"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {proposals.map((prop) => {
                  const isAccepted = acceptedProposalIds.includes(prop.id) || prop.status === "ACCEPTED";
                  return (
                    <div
                      key={prop.id}
                      className="bg-white border border-[rgba(17,19,21,0.09)] hover:border-[#0F6E50]/40 rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <img
                          src={prop.freelancerAvatar}
                          alt={prop.freelancerName}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-[#0F6E50]/15 shrink-0"
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-[#111315]">
                              {lang === "bn" && prop.freelancerNameBn ? prop.freelancerNameBn : prop.freelancerName}
                            </h4>
                            <span className="text-[10px] font-bold font-mono mk-tabular text-[#0B3B2E] bg-[#EAF5F0] px-2 py-0.5 rounded-full">
                              ★ {prop.rating} {prop.reviews > 0 ? `(${prop.reviews})` : ""}
                            </span>
                            {isAccepted ? (
                              <span className="text-[10px] font-bold text-[#0B3B2E] bg-[#EAF5F0] border border-[#0F6E50]/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-[#0F6E50]" />
                                <span>{lang === "en" ? "Bid Accepted · Messaging Live" : "বিড গৃহীত · মেসেজিং সক্রিয়"}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#A87224] bg-[#FEF6E6] border border-[#A87224]/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-[#A87224]" />
                                <span>{lang === "en" ? "Bid Pending Review" : "বিড অপেক্ষমাণ"}</span>
                              </span>
                            )}
                            {prop.isShortlisted && (
                              <span className="text-[10px] font-bold text-[#A87224] bg-[#FEF6E6] px-2 py-0.5 rounded-full">
                                {lang === "en" ? "Shortlisted" : "বাছাইকৃত"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#61676B] font-medium">
                            {lang === "bn" && prop.freelancerTitleBn ? prop.freelancerTitleBn : prop.freelancerTitle}
                          </p>
                          <p className="text-xs text-[#3F4448] line-clamp-2 max-w-xl italic">
                            &ldquo;{lang === "bn" && prop.coverNoteBn ? prop.coverNoteBn : prop.coverNote}&rdquo;
                          </p>
                          <p className="text-[11px] text-[#61676B]">
                            {lang === "en" ? "Applying for: " : "আবেদনকৃত কাজ: "}
                            <span className="font-semibold text-[#111315]">
                              {lang === "bn" && prop.jobTitleBn ? prop.jobTitleBn : prop.jobTitle}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[rgba(17,19,21,0.07)]">
                        <div className="text-left md:text-right">
                          <div className="text-base font-bold font-mono mk-tabular text-[#111315]">
                            ৳{Number(prop.bidBdt || 0).toLocaleString()} <span className="text-xs font-medium text-[#61676B]">BDT</span>
                          </div>
                          <div className="text-[11px] font-mono mk-tabular text-[#61676B]">
                            {lang === "en" ? `Delivery in ${prop.deliveryDays} days` : `${prop.deliveryDays} দিনে ডেলিভারি`}
                          </div>
                        </div>

                        {isAccepted ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMessageThreadId(prop.id);
                                setActiveTab("messages");
                              }}
                              className="px-3.5 py-2 rounded-xl bg-[#EAF5F0] text-[#0B3B2E] hover:bg-[#DCF0E6] border border-[#0F6E50]/20 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#0F6E50]" />
                              <span>{lang === "en" ? "Message Freelancer" : "মেসেজ পাঠান"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab("workspace")}
                              className="px-3.5 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{lang === "en" ? "Workspace" : "ওয়ার্কস্পেস"}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleAcceptBid(prop.id)}
                              className="px-4 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-semibold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{lang === "en" ? "Accept Bid & Unlock Chat" : "বিড অনুমোদন ও চ্যাট আনলক"}</span>
                            </button>
                            <span className="text-[10px] text-[#61676B] flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-[#8E9599]" />
                              <span>{lang === "en" ? "Messaging locked until accepted" : "অনুমোদনের পূর্বে মেসেজিং লকড"}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------------- */}
        {/* CLIENT WORKSPACE & MILESTONE DELIVERY / ESCROW                                */}
        {/* ----------------------------------------------------------------------------- */}
        {activeTab === "workspace" && (
          <div id="workspace" className="space-y-4">
            <WorkspaceSection
              role="client"
              lang={lang}
              currentUserId={userId}
              currentEntityId={clientId}
              currentUserName={displayName}
              onOpenChat={(contractId) => {
                setSelectedMessageThreadId(contractId);
                setActiveTab("messages");
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </div>
        )}

        {/* ----------------------------------------------------------------------------- */}
        {/* CLIENT REAL-TIME MESSAGES & COLLABORATION (TALKJS 1-TO-1)                      */}
        {/* ----------------------------------------------------------------------------- */}
        {activeTab === "messages" && (
          <div id="messages" className="space-y-4">
            <WorkspaceMessagesSection
              role="client"
              lang={lang}
              currentUserId={userId}
              currentEntityId={clientId}
              currentUserName={displayName}
              currentUserAvatar={avatarUrl || undefined}
              initialThreadId={selectedMessageThreadId || undefined}
            />
          </div>
        )}

        {/* ----------------------------------------------------------------------------- */}
        {/* CLIENT ESCROW VAULT & SSLCOMMERZ SANDBOX PAYMENTS SECTION                      */}
        {/* ----------------------------------------------------------------------------- */}
        {activeTab === "payments" && (
          <div id="payments" className="space-y-6">
            {/* Error & Action Notice Banners */}
            {paymentsError && (
              <div className="bg-[#FEF2F2] border border-[#DC2626]/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#991B1B]">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {lang === "en" ? "Unable to refresh live payments" : "লাইভ পেমেন্ট লোড করা যায়নি"}
                    </p>
                    <p className="text-[11px] text-[#B91C1C] mt-0.5">{paymentsError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshPayments}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#DC2626]/20 text-[#B91C1C] font-semibold hover:bg-[#FEF2F2] cursor-pointer shrink-0"
                >
                  {lang === "en" ? "Retry" : "আবার চেষ্টা করুন"}
                </button>
              </div>
            )}

            {paymentNotice && (
              <div
                className={`rounded-2xl p-4 border flex items-center justify-between gap-3 text-xs ${
                  paymentNotice.tone === "emerald"
                    ? "bg-[#EAF5F0] border-[#0F6E50]/25 text-[#0B3B2E]"
                    : "bg-[#FEF2F2] border-[#DC2626]/20 text-[#991B1B]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {paymentNotice.tone === "emerald" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#0F6E50] shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  )}
                  <span className="font-semibold">{paymentNotice.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentNotice(null)}
                  className="p-1 rounded-lg hover:bg-black/5 cursor-pointer shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Academic Sandbox Simulation Disclaimer */}
            <div className="bg-[#FEF6E6] border border-[#A87224]/25 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#A87224] shrink-0 mt-0.5" />
              <div className="text-xs text-[#6B4712] leading-relaxed">
                <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5 text-[#A87224]">
                  {lang === "en"
                    ? "SSLCOMMERZ Sandbox & Simulated Escrow Disclosure"
                    : "SSLCOMMERZ স্যান্ডবক্স ও সিমুলেটেড এসক্রো তথ্য"}
                </span>
                {lang === "en" ? ESCROW_SIMULATION_DISCLAIMER : ESCROW_SIMULATION_DISCLAIMER_BN}
              </div>
            </div>

            {/* Client Escrow & Billing Hero Card */}
            <div className="mk-dark-card rounded-2xl p-6 text-white shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      {lang === "en" ? "Client Escrow & Payment Vault" : "ক্লায়েন্ট এসক্রো ও পেমেন্ট ভল্ট"}
                    </span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight font-mono mk-tabular text-white">
                    {formatBdt(inEscrowBdt)}
                  </p>
                  <p className="text-[11px] text-white/70 mt-1 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-300 shrink-0" />
                    <span>
                      {lang === "en"
                        ? "Currently held in simulated PostgreSQL escrow (SSLCOMMERZ Sandbox)"
                        : "বর্তমানে সিমুলেটেড PostgreSQL এসক্রোতে সুরক্ষিত (SSLCOMMERZ স্যান্ডবক্স)"}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10 text-center">
                    <p className="text-[9px] font-bold text-white/65 uppercase">
                      {lang === "en" ? "Total Spending" : "মোট ব্যয়"}
                    </p>
                    <p className="text-sm font-bold font-mono mk-tabular text-emerald-200">{formatBdt(totalSpendingBdt)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10 text-center">
                    <p className="text-[9px] font-bold text-white/65 uppercase">
                      {lang === "en" ? "Funded Contracts" : "ফান্ডেড চুক্তি"}
                    </p>
                    <p className="text-sm font-bold font-mono mk-tabular text-sky-200">{fundedContractsCount}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10 text-center">
                    <p className="text-[9px] font-bold text-white/65 uppercase">
                      {lang === "en" ? "Pending" : "অপেক্ষমান"}
                    </p>
                    <p className="text-sm font-bold font-mono mk-tabular text-amber-200">
                      {pendingPaymentsCount}
                      {pendingPaymentAttemptsCount > pendingPaymentsCount
                        ? ` (${pendingPaymentAttemptsCount})`
                        : ""}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/10 text-center">
                    <p className="text-[9px] font-bold text-white/65 uppercase">
                      {lang === "en" ? "Refunded" : "রিফান্ডেড"}
                    </p>
                    <p className="text-sm font-bold font-mono mk-tabular text-purple-200">{formatBdt(refundedBdt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDepositModalOpen(true)}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F6E50] hover:bg-emerald-600 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{lang === "en" ? "Fund Contract" : "চুক্তি ফান্ড করুন"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshPayments}
                      disabled={loadingPayments}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-60 text-white text-xs font-semibold transition-all cursor-pointer border border-white/15"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-white/80 ${loadingPayments ? "animate-spin" : ""}`} />
                      <span>{lang === "en" ? "Refresh" : "রিফ্রেশ"}</span>
                    </button>
                    {latestInvoiceEntry && (
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(latestInvoiceEntry)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer border border-white/15"
                      >
                        <Receipt className="w-3.5 h-3.5 text-white/80" />
                        <span>{lang === "en" ? "Statement" : "বিবরণী"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Funding & Payment Status Queue */}
            {userId && (
              <div className="space-y-4">
                <SectionHeading
                  title="Contract funding & escrow status"
                  titleBn="চুক্তি ফান্ডিং ও এসক্রো অবস্থা"
                  subtitle="Fund unpaid contracts via SSLCOMMERZ Sandbox, verify pending checkouts, or retry failed/cancelled sessions"
                  subtitleBn="SSLCOMMERZ স্যান্ডবক্সের মাধ্যমে চুক্তি ফান্ড করুন, অপেক্ষমান পেমেন্ট যাচাই করুন বা ব্যর্থ লেনদেন পুনরায় চেষ্টা করুন"
                  lang={lang}
                />

                {!paymentDashboard?.contracts || paymentDashboard.contracts.length === 0 ? (
                  <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-8 text-center space-y-2">
                    <Handshake className="w-8 h-8 text-[#8E9599] mx-auto" />
                    <p className="text-xs font-bold text-[#111315]">
                      {lang === "en" ? "No client contracts found yet" : "এখনো কোনো চুক্তি তৈরি হয়নি"}
                    </p>
                    <p className="text-xs text-[#61676B]">
                      {lang === "en"
                        ? "Accept a freelancer proposal to generate a contract ready for SSLCOMMERZ Sandbox funding."
                        : "ফ্রিল্যান্সারের আবেদন অনুমোদন করলে ফান্ডিং-যোগ্য চুক্তি এখানে দেখা যাবে।"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentDashboard.contracts.map((c) => {
                      const paymentBadge = getPaymentStatusMeta(c.paymentStatus);
                      const workBadge = getWorkStatusMeta(c.workStatus);
                      const isInitiating = initiatingContractId === c.id;
                      const isVerifying = Boolean(
                        c.latestTransactionId && verifyingTranId === c.latestTransactionId
                      );

                      return (
                        <div
                          key={c.id}
                          className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 shadow-xs space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono mk-tabular font-bold text-[#61676B]">
                                {c.contractCode}
                              </span>
                              <h4 className="text-sm font-bold text-[#111315] truncate mt-0.5">
                                {c.title}
                              </h4>
                              <p className="text-xs text-[#61676B] mt-0.5">
                                {lang === "en" ? "Freelancer:" : "ফ্রিল্যান্সার:"}{" "}
                                <span className="font-semibold text-[#111315]">{c.counterpartyName}</span>
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  STATUS_TONE_CLASSES[paymentBadge.tone] ?? STATUS_TONE_CLASSES.slate
                                }`}
                              >
                                {lang === "en" ? paymentBadge.label : paymentBadge.labelBn}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  STATUS_TONE_CLASSES[workBadge.tone] ?? STATUS_TONE_CLASSES.slate
                                }`}
                              >
                                {lang === "en" ? workBadge.label : workBadge.labelBn}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.07)] p-3 text-xs">
                            <div>
                              <span className="text-[10px] text-[#61676B] font-bold uppercase block">
                                {lang === "en" ? "Contract" : "চুক্তি"}
                              </span>
                              <span className="font-bold font-mono mk-tabular text-[#111315]">{formatBdt(c.totalBdt)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#61676B] font-bold uppercase block">
                                {lang === "en" ? `Fee (${c.platformFeePct}%)` : `ফি (${c.platformFeePct}%)`}
                              </span>
                              <span className="font-semibold font-mono mk-tabular text-[#3F4448]">{formatBdt(c.platformFeeAmount)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#61676B] font-bold uppercase block">
                                {lang === "en" ? "Freelancer Net" : "ফ্রিল্যান্সার নিট"}
                              </span>
                              <span className="font-bold font-mono mk-tabular text-[#0B3B2E]">{formatBdt(c.netEarningsBdt)}</span>
                            </div>
                          </div>

                          {c.latestFailureReason && (
                            <div className="rounded-xl bg-[#FEF2F2] border border-[#DC2626]/20 px-3 py-2 text-[11px] text-[#991B1B] flex items-start gap-2">
                              <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" />
                              <span>{c.latestFailureReason}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[rgba(17,19,21,0.07)]">
                            <div className="flex flex-wrap items-center gap-2">
                              {c.canFund && (
                                <button
                                  type="button"
                                  disabled={isInitiating}
                                  onClick={() => handleInitiatePayment(c.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>
                                    {isInitiating
                                      ? lang === "en"
                                        ? "Starting..."
                                        : "শুরু হচ্ছে..."
                                      : lang === "en"
                                      ? "Fund Contract"
                                      : "চুক্তি ফান্ড করুন"}
                                  </span>
                                </button>
                              )}

                              {!c.canFund && c.canRetry && (
                                <button
                                  type="button"
                                  disabled={isInitiating}
                                  onClick={() => handleInitiatePayment(c.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#A87224] hover:bg-[#8E5E1B] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>
                                    {isInitiating
                                      ? lang === "en"
                                        ? "Retrying..."
                                        : "পুনরায় হচ্ছে..."
                                      : lang === "en"
                                      ? "Retry Payment"
                                      : "পুনরায় পেমেন্ট করুন"}
                                  </span>
                                </button>
                              )}

                              {c.canVerifyPending && c.latestTransactionId && (
                                <button
                                  type="button"
                                  disabled={isVerifying}
                                  onClick={() => handleVerifyPendingPayment(c.latestTransactionId!)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E5B88] hover:bg-[#16466A] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
                                  <span>
                                    {isVerifying
                                      ? lang === "en"
                                        ? "Verifying..."
                                        : "যাচাই হচ্ছে..."
                                      : lang === "en"
                                      ? "Verify Status"
                                      : "স্ট্যাটাস যাচাই"}
                                  </span>
                                </button>
                              )}
                            </div>

                            <Link
                              href={`/contracts/${c.id}`}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] text-xs font-semibold border border-[rgba(17,19,21,0.07)]"
                            >
                              <span>{lang === "en" ? "Open Contract" : "চুক্তি দেখুন"}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SSLCOMMERZ Sandbox Payment History Table */}
            <div className="space-y-4">
              <SectionHeading
                title="SSLCOMMERZ payment history"
                titleBn="SSLCOMMERZ পেমেন্ট ইতিহাস"
                subtitle="Full history of gateway sessions, validation status, platform fee splits, and receipt details"
                subtitleBn="গেটওয়ে সেশন, ভ্যালিডেশন স্ট্যাটাস, প্ল্যাটফর্ম ফি ও রসিদ বিবরণী"
                lang={lang}
              />
              <PaymentHistoryTable
                payments={paymentDashboard?.payments ?? []}
                viewerRole="client"
                lang={lang}
                loading={loadingPayments}
                onViewDetails={setSelectedPayment}
                onRetryPayment={handleInitiatePayment}
                onVerifyPending={handleVerifyPendingPayment}
                retryingContractId={initiatingContractId}
                verifyingTranId={verifyingTranId}
              />
            </div>

            {/* Refund Status & Requests Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <SectionHeading
                  title="Refund status & history"
                  titleBn="রিফান্ড অবস্থা ও ইতিহাস"
                  subtitle="Track submitted refund requests and simulated/sandbox refund outcomes"
                  subtitleBn="জমাকৃত রিফান্ড অনুরোধ এবং রিফান্ড ফলাফল দেখুন"
                  lang={lang}
                />
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-full font-mono mk-tabular bg-[#F4F2EC] text-[#3F4448] border border-[rgba(17,19,21,0.09)]">
                    {lang === "en" ? `${refundRequestsCount} requests` : `${refundRequestsCount}টি অনুরোধ`}
                  </span>
                  <span className="px-2.5 py-1 rounded-full font-mono mk-tabular bg-[#FEF6E6] text-[#A87224] border border-[#A87224]/25">
                    {lang === "en" ? `${pendingRefundCount} pending` : `${pendingRefundCount} অপেক্ষমান`}
                  </span>
                  <span className="px-2.5 py-1 rounded-full font-mono mk-tabular bg-[#F3EFFA] text-[#5B3E96] border border-[#5B3E96]/20">
                    {formatBdt(refundedBdt)} {lang === "en" ? "refunded" : "রিফান্ডেড"}
                  </span>
                </div>
              </div>

              {!paymentDashboard?.refundRequests || paymentDashboard.refundRequests.length === 0 ? (
                <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 text-xs text-[#61676B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <RotateCcw className="w-4 h-4 text-[#8E9599] shrink-0 mt-0.5" />
                    <span>
                      {lang === "en"
                        ? "No refund requests submitted yet. Eligible funded (unreleased) contracts show refund status updates here."
                        : "এখনো কোনো রিফান্ড অনুরোধ জমা হয়নি। ফান্ডেড কিন্তু রিলিজ না হওয়া চুক্তির রিফান্ড তথ্য এখানে প্রদর্শিত হবে।"}
                    </span>
                  </div>
                  <Link
                    href="/dashboard/client?tab=workspace"
                    className="px-3.5 py-2 rounded-xl bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] font-semibold border border-[rgba(17,19,21,0.08)] shrink-0 text-center"
                  >
                    {lang === "en" ? "View Contracts" : "চুক্তিসমূহ দেখুন"}
                  </Link>
                </div>
              ) : (
                <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl divide-y divide-[rgba(17,19,21,0.07)] shadow-xs overflow-hidden">
                  {paymentDashboard.refundRequests.map((req) => {
                    const statusStyle =
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
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle}`}
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
                            {lang === "en" ? "Admin note:" : "অ্যাডমিন নোট:"} {req.admin_notes}
                          </p>
                        )}
                      </div>
                      <div className="text-left sm:text-right shrink-0 text-[10px] text-[#61676B] font-mono mk-tabular space-y-1">
                        <div>{new Date(req.created_at).toLocaleDateString("en-BD")}</div>
                        {req.gateway_refund_ref_id && <div>Ref: {req.gateway_refund_ref_id}</div>}
                        <div>
                          <Link
                            href={`/contracts/${req.contract_id}`}
                            className="font-sans text-[11px] font-semibold text-[#0F6E50] hover:underline"
                          >
                            {lang === "en" ? "View Contract →" : "চুক্তি দেখুন →"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>

            {/* Escrow Ledger Entries (Supabase public.escrow_ledger or Demo Preview) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <SectionHeading
                  title="Simulated escrow ledger"
                  titleBn="সিমুলেটেড এসক্রো খতিয়ান"
                  subtitle="Immutable PostgreSQL ledger of FUND, RELEASE, and REFUND movements"
                  subtitleBn="এসক্রো জমা (FUND), মুক্তি (RELEASE) ও রিফান্ড (REFUND) লেজার রেকর্ড"
                  lang={lang}
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex bg-[#F4F2EC] p-0.5 rounded-xl text-[11px] font-semibold text-[#61676B] border border-[rgba(17,19,21,0.08)]">
                    {(
                      [
                        { id: "ALL", en: "All", bn: "সকল" },
                        { id: "FUND", en: "Fund", bn: "জমা" },
                        { id: "RELEASE", en: "Release", bn: "রিলিজ" },
                        { id: "REFUND", en: "Refund", bn: "রিফান্ড" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setLedgerFilter(f.id)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          ledgerFilter === f.id ? "bg-white text-[#111315] shadow-xs" : "hover:text-[#111315]"
                        }`}
                      >
                        {lang === "en" ? f.en : f.bn}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDepositModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    + {lang === "en" ? "Fund Contract" : "চুক্তি ফান্ড"}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-xs overflow-hidden">
                <div className="divide-y divide-[rgba(17,19,21,0.07)]">
                  {userId ? (
                    filteredSupabaseLedger.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#61676B]">
                        {lang === "en"
                          ? "No escrow ledger entries in this category yet."
                          : "এই ক্যাটাগরিতে এখনো কোনো এসক্রো লেজার এন্ট্রি নেই।"}
                      </div>
                    ) : (
                      filteredSupabaseLedger.map((entry) => (
                        <div
                          key={entry.id}
                          className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                                entry.entry_type === "FUND"
                                  ? "bg-[#EEF5FA] border-[#1E5B88]/20 text-[#1E5B88]"
                                  : entry.entry_type === "RELEASE"
                                  ? "bg-[#EAF5F0] border-[#0F6E50]/20 text-[#0F6E50]"
                                  : "bg-[#F3EFFA] border-[#5B3E96]/20 text-[#5B3E96]"
                              }`}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F2EC] text-[#3F4448]">
                                  {entry.entry_type}
                                </span>
                                <p className="text-xs font-semibold text-[#111315] truncate">
                                  {entry.description}
                                </p>
                              </div>
                              <p className="text-[11px] font-mono mk-tabular text-[#61676B] mt-0.5">
                                {new Date(entry.created_at).toLocaleString("en-BD")} ·{" "}
                                {entry.is_simulated ? "Simulated Escrow Ledger" : "Gateway Settlement"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-xs font-bold font-mono mk-tabular text-[#111315]">
                                {formatBdt(entry.amount)}
                              </p>
                              <p className="text-[10px] font-mono mk-tabular text-[#61676B]">
                                Fee: {formatBdt(entry.platform_fee_amount)} · Net:{" "}
                                {formatBdt(entry.freelancer_net_amount)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedInvoice({
                                  id: entry.id,
                                  label: entry.description,
                                  labelBn: entry.description,
                                  method: "ESCROW",
                                  amountBdt: entry.amount,
                                  status: "COMPLETED",
                                  createdLabel: new Date(entry.created_at).toLocaleDateString("en-BD"),
                                  trxId: entry.payment_id,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Receipt className="w-3 h-3 text-[#61676B]" />
                              <span>{lang === "en" ? "Statement" : "রসিদ"}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  ) : filteredDemoLedger.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#61676B]">
                      {lang === "en" ? "No transactions found in this category" : "এই ক্যাটাগরিতে কোনো লেনদেন পাওয়া যায়নি"}
                    </div>
                  ) : (
                    filteredDemoLedger.map((entry) => {
                      const isCredit = entry.amountBdt > 0;
                      const trxCode = entry.trxId;
                      return (
                        <div
                          key={entry.id}
                          className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                                entry.method === "BKASH"
                                  ? "bg-pink-50 border-pink-200 text-pink-600"
                                  : entry.method === "NAGAD"
                                  ? "bg-orange-50 border-orange-200 text-orange-600"
                                  : entry.method === "BANK"
                                  ? "bg-[#EEF5FA] border-[#1E5B88]/20 text-[#1E5B88]"
                                  : "bg-[#EAF5F0] border-[#0F6E50]/20 text-[#0F6E50]"
                              }`}
                            >
                              {entry.method === "BKASH" || entry.method === "NAGAD" ? (
                                <Smartphone className="w-4 h-4" />
                              ) : entry.method === "BANK" ? (
                                <Building className="w-4 h-4" />
                              ) : (
                                <ShieldCheck className="w-4 h-4" />
                              )}
                            </span>

                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#111315] truncate">
                                {lang === "en" ? entry.label : entry.labelBn || entry.label}
                              </p>
                              <p className="text-[11px] font-mono mk-tabular text-[#61676B] mt-0.5">
                                {entry.createdLabel} · {entry.method} {trxCode ? `· ${trxCode}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(17,19,21,0.07)]">
                            <div className="text-right">
                              <p
                                className={`text-xs font-bold font-mono mk-tabular ${
                                  isCredit ? "text-[#0F6E50]" : "text-[#111315]"
                                }`}
                              >
                                {isCredit ? `+${formatBdt(entry.amountBdt)}` : formatBdt(Math.abs(entry.amountBdt))}
                              </p>
                              <span className="text-[9px] font-bold text-[#0B3B2E] bg-[#EAF5F0] px-1.5 py-0.5 rounded">
                                {entry.status || "COMPLETED"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(entry)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title={lang === "en" ? "View Statement" : "রসিদ দেখুন"}
                            >
                              <Receipt className="w-3 h-3 text-[#61676B]" />
                              <span>{lang === "en" ? "Statement" : "রসিদ"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Payout & Billing Methods Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-[#111315] flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#0F6E50]" />
                    <span>{lang === "en" ? "Saved Billing Preferences" : "সংরক্ষিত বিলিং মাধ্যম"}</span>
                  </h3>
                  <p className="text-xs text-[#61676B] mt-0.5">
                    {lang === "en"
                      ? "Reference MFS and corporate bank billing profiles for your organization (contract checkouts always route through SSLCOMMERZ Sandbox)."
                      : "আপনার প্রতিষ্ঠানের জন্য সংরক্ষিত বিলিং প্রোফাইল (চুক্তির পেমেন্ট সর্বদা SSLCOMMERZ স্যান্ডবক্সের মাধ্যমে সম্পন্ন হয়)।"}
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
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            {isBkash && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
                                <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                                bKash Merchant
                              </span>
                            )}
                            {isNagad && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                                Nagad Direct
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
                                Corporate Bank (NPSB)
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
                              {lang === "en" ? "Default" : "প্রধান"}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryMethod(m.id)}
                              className="text-[11px] font-semibold text-[#61676B] hover:text-[#0F6E50] hover:underline cursor-pointer"
                            >
                              {lang === "en" ? "Make Default" : "ডিফল্ট করুন"}
                            </button>
                          )}
                        </div>

                        <div className="space-y-1">
                          {isBank ? (
                            <>
                              <h4 className="text-sm font-bold text-[#111315] leading-tight">
                                {m.bankName || "Corporate Account"}
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

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[rgba(17,19,21,0.07)]">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F6E50]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{lang === "en" ? "Saved Billing Reference" : "সংরক্ষিত বিলিং প্রোফাইল"}</span>
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
                      {lang === "en" ? "Add New Billing Method" : "নতুন বিলিং মাধ্যম যোগ করুন"}
                    </span>
                    <span className="text-[11px] text-[#61676B] mt-0.5 block">
                      {lang === "en"
                        ? "bKash, Nagad, Rocket or Corporate Bank Account"
                        : "বিকাশ, নগদ, রকেট বা কর্পোরেট ব্যাংক হিসাব"}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Simulated Escrow Protocol Guarantees & Corporate Billing Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[#EAF5F0] border border-[#0F6E50]/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0B3B2E] text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B3B2E]">
                      {lang === "en" ? "Simulated Escrow Release Protocol" : "সিমুলেটেড এসক্রো মুক্তি নীতিমালা"}
                    </h4>
                    <p className="text-[11px] text-[#0F6E50]">
                      {lang === "en"
                        ? "Server-verified SSLCOMMERZ Sandbox checkout with 10% platform commission ledger"
                        : "সার্ভার-যাচাইকৃত SSLCOMMERZ স্যান্ডবক্স চেকআউট ও ১০% প্ল্যাটফর্ম কমিশন হিসাব"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white rounded-xl p-3 border border-[#0F6E50]/15">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#111315] mb-1">
                      <Lock className="w-3.5 h-3.5 text-[#0F6E50]" />
                      <span>{lang === "en" ? "Release Control" : "সম্পূর্ণ নিয়ন্ত্রণ"}</span>
                    </div>
                    <p className="text-[11px] text-[#61676B] leading-snug">
                      {lang === "en"
                        ? "Funds stay in simulated escrow until you approve deliverables."
                        : "আপনার অনুমোদন ছাড়া কোনো তহবিল রিলিজ হবে না।"}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-[#0F6E50]/15">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#111315] mb-1">
                      <Clock className="w-3.5 h-3.5 text-[#0F6E50]" />
                      <span>{lang === "en" ? "Server Validation" : "সার্ভার ভ্যালিডেশন"}</span>
                    </div>
                    <p className="text-[11px] text-[#61676B] leading-snug">
                      {lang === "en"
                        ? "Every SSLCOMMERZ Sandbox callback is verified against Validation API v4."
                        : "প্রতিটি স্যান্ডবক্স কলব্যাক Validation API v4 দ্বারা যাচাই হয়।"}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-[#0F6E50]/15">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#111315] mb-1">
                      <Gavel className="w-3.5 h-3.5 text-[#0F6E50]" />
                      <span>{lang === "en" ? "Refund Governance" : "রিফান্ড পর্যালোচনা"}</span>
                    </div>
                    <p className="text-[11px] text-[#61676B] leading-snug">
                      {lang === "en"
                        ? "Refund requests on funded contracts are tracked and reviewed transparently."
                        : "ফান্ডেড চুক্তির রিফান্ড অনুরোধ স্বচ্ছভাবে পর্যালোচনা করা হয়।"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Billing Profile Card */}
              <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#61676B]">
                      {lang === "en" ? "Corporate Billing Profile" : "প্রাতিষ্ঠানিক বিলিং প্রোফাইল"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditBillingModalOpen(true)}
                      className="text-[11px] font-semibold text-[#0F6E50] hover:text-[#0B3B2E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{lang === "en" ? "Edit" : "সম্পাদনা"}</span>
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-[#111315] leading-tight">
                    {billingProfile.companyName}
                  </h4>
                  <p className="text-[11px] font-mono mk-tabular font-bold text-[#3F4448] mt-1">
                    BIN: {billingProfile.binNumber}
                  </p>
                  <p className="text-[11px] text-[#61676B] mt-0.5 line-clamp-1">
                    {billingProfile.billingAddress}
                  </p>
                </div>

                <div className="pt-2 border-t border-[rgba(17,19,21,0.07)] flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B3B2E] bg-[#EAF5F0] px-2 py-0.5 rounded-full border border-[#0F6E50]/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Mushak-6.3 Profile
                  </span>
                  {latestInvoiceEntry && (
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(latestInvoiceEntry)}
                      className="text-[11px] font-semibold text-[#61676B] hover:text-[#111315] underline cursor-pointer"
                    >
                      {lang === "en" ? "View Latest Statement" : "সর্বশেষ বিবরণী"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dispute & Refund Governance Tab */}
        {(activeTab === "overview" || activeTab === "disputes") && (
          <div id="disputes" className="space-y-4">
            <SectionHeading
              title="Escrow dispute & refund center"
              titleBn="এসক্রো বিরোধ ও রিফান্ড কেন্দ্র"
              subtitle="Track disputed contracts and refund requests protected by MuktoKormo simulated escrow"
              subtitleBn="মুক্তকর্ম সিমুলেটেড এসক্রো দ্বারা সুরক্ষিত বিরোধ ও রিফান্ড অবস্থা দেখুন"
              lang={lang}
            />
            <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    disputedContractsCount > 0 || pendingRefundCount > 0
                      ? "bg-[#FEF6E6] text-[#A87224]"
                      : "bg-[#EAF5F0] text-[#0F6E50]"
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#111315]">
                    {disputedContractsCount === 0 && pendingRefundCount === 0
                      ? lang === "en"
                        ? "Zero Active Disputes"
                        : "কোনো চলমান বিরোধ নেই"
                      : lang === "en"
                      ? `${disputedContractsCount} Disputed Contract(s) · ${pendingRefundCount} Pending Refund(s)`
                      : `${disputedContractsCount}টি বিরোধপূর্ণ চুক্তি · ${pendingRefundCount}টি অপেক্ষমান রিফান্ড`}
                  </h4>
                  <p className="text-xs text-[#61676B] mt-0.5">
                    {disputedContractsCount === 0 && pendingRefundCount === 0
                      ? lang === "en"
                        ? `${refundRequestsCount} historical refund request(s) recorded (${formatBdt(refundedBdt)} refunded).`
                        : `${refundRequestsCount}টি রিফান্ড অনুরোধ নথিভুক্ত (${formatBdt(refundedBdt)} রিফান্ডেড)।`
                      : lang === "en"
                      ? "Inspect contract timelines or review refund status inside the Payments & Workspace tabs."
                      : "পেমেন্ট বা ওয়ার্কস্পেস ট্যাব থেকে চুক্তি ও রিফান্ড অবস্থা পর্যালোচনা করুন।"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("payments")}
                  className="px-4 py-2 rounded-xl bg-[#EAF5F0] hover:bg-[#DCF0E6] text-[#0B3B2E] text-xs font-semibold border border-[#0F6E50]/20 transition-colors cursor-pointer"
                >
                  {lang === "en" ? "View Refund Status" : "রিফান্ড অবস্থা"}
                </button>
                <Link
                  href="/post-job"
                  className="px-4 py-2 rounded-xl bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] text-xs font-semibold border border-[rgba(17,19,21,0.08)] transition-colors"
                >
                  {lang === "en" ? "Post a Protected Job" : "সুরক্ষিত কাজ পোস্ট করুন"}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Saved Talent Tab */}
        {(activeTab === "overview" || activeTab === "saved") && (
          <div id="saved" className="space-y-4">
            <SectionHeading
              title="Saved & bookmarked talent"
              titleBn="সংরক্ষিত পছন্দের ট্যালেন্ট"
              subtitle="Pre-vetted Bangladeshi developers & designers for upcoming projects"
              subtitleBn="পরবর্তী প্রজেক্টের জন্য সংরক্ষিত বাংলাদেশি ডেভেলপার ও ডিজাইনার"
              lang={lang}
              action={
                <Link
                  href="/#freelancers-section"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] text-xs font-semibold border border-[rgba(17,19,21,0.08)] transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-[#0F6E50]" />
                  <span>{lang === "en" ? "Browse Talent" : "ট্যালেন্ট খুঁজুন"}</span>
                </Link>
              }
            />
            {savedTalentList.length === 0 ? (
              <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-8 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#F4F2EC] text-[#61676B] flex items-center justify-center mx-auto border border-[rgba(17,19,21,0.08)]">
                  <Bookmark className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#111315]">
                  {lang === "en" ? "No saved freelancers yet" : "এখনও কোনো ফ্রিল্যান্সার সংরক্ষিত নেই"}
                </h3>
                <p className="text-xs text-[#61676B] max-w-md mx-auto">
                  {lang === "en"
                    ? "Bookmark verified freelancers from the talent directory to quickly invite them to your future projects."
                    : "ভবিষ্যতের প্রজেক্টে দ্রুত আমন্ত্রণ জানাতে ট্যালেন্ট ডিরেক্টরি থেকে পছন্দের ফ্রিল্যান্সার সংরক্ষণ করুন।"}
                </p>
                <Link
                  href="/#freelancers-section"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-semibold shadow-xs"
                >
                  <span>{lang === "en" ? "Explore Verified Talent" : "ভেরিফাইড ট্যালেন্ট দেখুন"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedTalentList.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 hover:border-[#0F6E50]/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-[#0F6E50]/15 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#111315] truncate">
                          {lang === "bn" && t.nameBn ? t.nameBn : t.name}
                        </h4>
                        <p className="text-[11px] text-[#61676B] truncate">
                          {lang === "bn" && t.titleBn ? t.titleBn : t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono mk-tabular text-[#61676B]">
                          <span className="text-[#0F6E50] font-bold">★ {t.rating}</span>
                          <span>• ৳{t.rateBdt.toLocaleString()}/{lang === "en" ? "hr" : "ঘণ্টা"}</span>
                          <span className="font-sans truncate">• {lang === "bn" && t.locationBn ? t.locationBn : t.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {clientId && (
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await unsaveTalent(supabase, clientId, t.id);
                            if (ok) {
                              setSavedTalentList((prev) => prev.filter((item) => item.id !== t.id));
                            }
                          }}
                          title={lang === "en" ? "Remove from saved" : "সরান"}
                          className="p-2 rounded-xl border border-[rgba(17,19,21,0.09)] text-[#8E9599] hover:text-[#DC2626] hover:border-[#DC2626]/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Link
                        href={`/post-job?invite=${t.id}`}
                        className="px-3 py-1.5 rounded-xl bg-[#EAF5F0] hover:bg-[#DCF0E6] text-[#0B3B2E] border border-[#0F6E50]/15 text-xs font-semibold transition-colors"
                      >
                        {lang === "en" ? "Direct Hire" : "সরাসরি নিয়োগ"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------------------- */}
      {/* ADD BILLING / PAYMENT METHOD MODAL (LIKE FREELANCER MODAL)                     */}
      {/* ----------------------------------------------------------------------------- */}
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
                    {lang === "en" ? "Add Billing Method" : "পেমেন্ট মাধ্যম যোগ করুন"}
                  </h3>
                  <p className="text-[11px] text-[#61676B]">
                    {lang === "en" ? "Link verified account for 1-click escrow funding" : "১-ক্লিকে এসক্রো ফান্ড করার মাধ্যম যুক্ত করুন"}
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
                <div className="w-14 h-14 rounded-2xl bg-[#EAF5F0] text-[#0B3B2E] flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-[#111315]">
                  {lang === "en" ? "Billing Method Added!" : "বিলিং মাধ্যম সফলভাবে যুক্ত হয়েছে!"}
                </h4>
                <p className="text-xs text-[#61676B]">
                  {lang === "en"
                    ? "Your account is verified and ready for instant milestone deposits."
                    : "আপনার অ্যাকাউন্ট যাচাইকৃত এবং তাৎক্ষণিক এসক্রো জমার জন্য প্রস্তুত।"}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSavePaymentMethod} className="space-y-4">
                {/* Method Type Selector */}
                <div>
                  <label className="text-xs font-semibold text-[#111315] block mb-1.5">
                    {lang === "en" ? "Payment Channel" : "পেমেন্ট চ্যানেল"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        { type: "BKASH", label: "bKash" },
                        { type: "NAGAD", label: "Nagad" },
                        { type: "ROCKET", label: "Rocket" },
                        { type: "BANK", label: "Bank" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setNewMethodType(t.type)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                          newMethodType === t.type
                            ? "bg-[#0B3B2E] text-white border-[#0B3B2E] shadow-xs"
                            : "bg-[#FAF9F6] text-[#3F4448] border-[rgba(17,19,21,0.1)] hover:bg-[#F4F2EC]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Type (Personal vs Merchant/Corporate) */}
                <div>
                  <label className="text-xs font-semibold text-[#111315] block mb-1.5">
                    {lang === "en" ? "Account Type" : "হিসাবের ধরন"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Merchant", "Personal"] as const).map((at) => (
                      <button
                        key={at}
                        type="button"
                        onClick={() => setNewAccountType(at)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          newAccountType === at
                            ? "bg-[#111315] text-white border-[#111315]"
                            : "bg-[#FAF9F6] text-[#3F4448] border-[rgba(17,19,21,0.1)] hover:bg-[#F4F2EC]"
                        }`}
                      >
                        {at === "Merchant" ? (lang === "en" ? "Corporate / Merchant" : "কর্পোরেট / মার্চেন্ট") : (lang === "en" ? "Personal Account" : "ব্যক্তিগত হিসাব")}
                      </button>
                    ))}
                  </div>
                </div>

                {newMethodType === "BANK" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-[#111315] block mb-1">
                        {lang === "en" ? "Bank Name" : "ব্যাংকের নাম"}
                      </label>
                      <select
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-[rgba(17,19,21,0.12)] bg-white focus:outline-[#0F6E50]"
                      >
                        <option value="BRAC Bank PLC">BRAC Bank PLC</option>
                        <option value="The City Bank Limited">The City Bank Limited</option>
                        <option value="Eastern Bank PLC (EBL)">Eastern Bank PLC (EBL)</option>
                        <option value="Dutch-Bangla Bank PLC">Dutch-Bangla Bank PLC</option>
                        <option value="Prime Bank Limited">Prime Bank Limited</option>
                        <option value="Dhaka Bank Limited">Dhaka Bank Limited</option>
                        <option value="Islami Bank Bangladesh">Islami Bank Bangladesh</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#111315] block mb-1">
                        {lang === "en" ? "Branch Name" : "শাখার নাম"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gulshan Corporate Branch"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-[rgba(17,19,21,0.12)] focus:outline-[#0F6E50]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#111315] block mb-1">
                        {lang === "en" ? "Bank Account Number" : "অ্যাকাউন্ট নম্বর"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1501 2039 4810 0001"
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                        className="w-full text-xs font-mono mk-tabular font-bold px-3 py-2.5 rounded-xl border border-[rgba(17,19,21,0.12)] focus:outline-[#0F6E50]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#111315] block mb-1">
                        {lang === "en" ? "9-Digit Routing Number" : "রাউটিং নম্বর (৯ ডিজিট)"}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 060261345"
                        value={newRoutingNumber}
                        onChange={(e) => setNewRoutingNumber(e.target.value)}
                        className="w-full text-xs font-mono mk-tabular px-3 py-2.5 rounded-xl border border-[rgba(17,19,21,0.12)] focus:outline-[#0F6E50]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-[#111315] block mb-1">
                      {newMethodType} {lang === "en" ? "Mobile Wallet Number" : "মোবাইল নম্বর"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+880 1712-XXXXXX"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      className="w-full text-xs font-mono mk-tabular font-bold px-3 py-2.5 rounded-xl border border-[rgba(17,19,21,0.12)] focus:outline-[#0F6E50]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-[#111315] block mb-1">
                    {lang === "en" ? "Account / Entity Holder Name" : "হিসাবধারীর নাম / প্রতিষ্ঠানের নাম"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Lifestyle BD Ltd."
                    value={newAccountHolder}
                    onChange={(e) => setNewAccountHolder(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-[rgba(17,19,21,0.12)] focus:outline-[#0F6E50]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="setClientPrimaryMethod"
                    checked={newIsPrimary}
                    onChange={(e) => setNewIsPrimary(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F6E50] focus:ring-[#0F6E50] border-[rgba(17,19,21,0.2)]"
                  />
                  <label htmlFor="setClientPrimaryMethod" className="text-xs text-[#3F4448] font-medium cursor-pointer">
                    {lang === "en"
                      ? "Set as default billing method for automatic escrow funding"
                      : "মাইলস্টোন এসক্রো জমার জন্য ডিফল্ট মাধ্যম হিসেবে সেট করুন"}
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[rgba(17,19,21,0.08)]">
                  <button
                    type="button"
                    onClick={() => setAddMethodModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#61676B] hover:bg-[#F4F2EC] cursor-pointer"
                  >
                    {lang === "en" ? "Cancel" : "বাতিল"}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{lang === "en" ? "Save Billing Method" : "সংরক্ষণ করুন"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------------- */}
      {/* CORPORATE BILLING PROFILE MODAL                                               */}
      {/* ----------------------------------------------------------------------------- */}
      {editBillingModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#111315]/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditBillingModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[rgba(17,19,21,0.1)] space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(17,19,21,0.08)]">
              <h3 className="text-sm font-bold text-[#111315]">
                {lang === "en" ? "Edit Corporate Billing Profile" : "প্রাতিষ্ঠানিক বিলিং প্রোফাইল সম্পাদনা"}
              </h3>
              <button onClick={() => setEditBillingModalOpen(false)} className="text-[#8E9599] hover:text-[#111315] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#111315] block mb-1">
                  {lang === "en" ? "Registered Company Name" : "নিবন্ধিত কোম্পানির নাম"}
                </label>
                <input
                  type="text"
                  value={billingProfile.companyName}
                  onChange={(e) => setBillingProfile({ ...billingProfile, companyName: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[rgba(17,19,21,0.12)] focus:outline-[#0F6E50]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#111315] block mb-1">
                  {lang === "en" ? "Business Identification Number (BIN / TIN)" : "বিআইএন / টিআইএন নম্বর"}
                </label>
                <input
                  type="text"
                  value={billingProfile.binNumber}
                  onChange={(e) => setBillingProfile({ ...billingProfile, binNumber: e.target.value })}
                  className="w-full text-xs font-mono mk-tabular font-bold px-3 py-2 rounded-xl border border-[rgba(17,19,21,0.12)] focus:outline-[#0F6E50]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#111315] block mb-1">
                  {lang === "en" ? "Registered Billing Address" : "বিলিং ঠিকানা"}
                </label>
                <textarea
                  rows={2}
                  value={billingProfile.billingAddress}
                  onChange={(e) => setBillingProfile({ ...billingProfile, billingAddress: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-[rgba(17,19,21,0.12)] focus:outline-[#0F6E50]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[rgba(17,19,21,0.08)]">
              <button
                onClick={() => setEditBillingModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-semibold cursor-pointer"
              >
                {lang === "en" ? "Save Changes" : "সংরক্ষণ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------------- */}
      {/* SANDBOX ESCROW STATEMENT / INVOICE MODAL                                      */}
      {/* ----------------------------------------------------------------------------- */}
      {selectedInvoice &&
        (() => {
          const feeSplit = calculateContractFeeBreakdown(
            Math.abs(selectedInvoice.amountBdt),
            DEFAULT_PLATFORM_FEE_PCT
          );
          return (
            <div
              className="fixed inset-0 z-50 bg-[#111315]/55 backdrop-blur-xs flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              onClick={() => setSelectedInvoice(null)}
            >
              <div
                className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[rgba(17,19,21,0.1)] space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(17,19,21,0.08)]">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#0F6E50]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#111315]">
                      {lang === "en"
                        ? "Escrow Payment Statement"
                        : "এসক্রো পেমেন্ট বিবরণী"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="p-1.5 rounded-lg bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{lang === "en" ? "Print" : "প্রিন্ট"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(null)}
                      className="p-1 text-[#8E9599] hover:text-[#111315] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 bg-[#FAF9F6] space-y-4 text-xs font-sans">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#111315]">MuktoKormo Sandbox</h3>
                      <p className="text-[11px] text-[#61676B]">
                        Simulated Escrow &amp; Platform Ledger Statement
                      </p>
                      <p className="text-[10px] text-[#61676B] font-mono mk-tabular mt-0.5">
                        BIN: 001928472-0101 · Academic Sandbox Mode
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EAF5F0] text-[#0B3B2E] border border-[#0F6E50]/25">
                        {selectedInvoice.status || "RECORDED"}
                      </span>
                      <p className="text-[10px] text-[#61676B] font-mono mk-tabular mt-1">
                        REF-{selectedInvoice.id.slice(0, 8)}
                      </p>
                      <p className="text-[10px] text-[#61676B]">{selectedInvoice.createdLabel}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[rgba(17,19,21,0.08)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-[10px] font-bold text-[#61676B] uppercase block">
                        Billed To (Client):
                      </span>
                      <p className="font-bold text-[#111315]">{billingProfile.companyName}</p>
                      <p className="text-[#61676B] font-mono mk-tabular text-[10px]">
                        BIN: {billingProfile.binNumber}
                      </p>
                      <p className="text-[#61676B] text-[10px]">{billingProfile.billingAddress}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#61676B] uppercase block">
                        Gateway / Ledger:
                      </span>
                      <p className="font-bold text-[#111315]">{selectedInvoice.method}</p>
                      <p className="text-[#61676B] font-mono mk-tabular text-[10px] break-all">
                        TrxID: {selectedInvoice.trxId || "SANDBOX-TRX"}
                      </p>
                      <p className="text-[#0F6E50] font-semibold text-[10px]">
                        Platform Split: {DEFAULT_PLATFORM_FEE_PCT}% Fee / 90% Freelancer Net
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-[rgba(17,19,21,0.1)] text-[#61676B] font-bold uppercase text-[9px]">
                          <th className="py-1.5">Description</th>
                          <th className="py-1.5 text-right">Amount (BDT)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(17,19,21,0.06)]">
                        <tr>
                          <td className="py-2 text-[#111315] font-medium">
                            {lang === "en"
                              ? selectedInvoice.label
                              : selectedInvoice.labelBn || selectedInvoice.label}
                          </td>
                          <td className="py-2 text-right font-mono mk-tabular font-bold text-[#111315]">
                            {formatBdt(feeSplit.grossAmount)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 text-[#61676B]">
                            Platform Commission ({feeSplit.platformFeePct}%)
                          </td>
                          <td className="py-1 text-right font-mono mk-tabular text-[#3F4448]">
                            {formatBdt(feeSplit.platformFeeAmount)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 text-[#61676B]">Freelancer Net Allocation (90%)</td>
                          <td className="py-1 text-right font-mono mk-tabular text-[#3F4448]">
                            {formatBdt(feeSplit.freelancerPayableAmount)}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#0B3B2E] font-bold text-[#111315]">
                          <td className="pt-2 text-xs">Gross Contract Amount:</td>
                          <td className="pt-2 text-right font-mono mk-tabular text-sm text-[#0F6E50]">
                            {formatBdt(feeSplit.grossAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="w-full py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white font-semibold text-xs cursor-pointer"
                >
                  {lang === "en" ? "Close Statement" : "বন্ধ করুন"}
                </button>
              </div>
            </div>
          );
        })()}

      {/* ----------------------------------------------------------------------------- */}
      {/* FUND CONTRACT VIA SSLCOMMERZ SANDBOX MODAL                                    */}
      {/* ----------------------------------------------------------------------------- */}
      {depositModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#111315]/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setDepositModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[rgba(17,19,21,0.1)] space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(17,19,21,0.08)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#EAF5F0] text-[#0B3B2E] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111315]">
                    {lang === "en"
                      ? "Fund Contract via SSLCOMMERZ Sandbox"
                      : "SSLCOMMERZ স্যান্ডবক্সে চুক্তি ফান্ড করুন"}
                  </h3>
                  <p className="text-[11px] text-[#61676B]">
                    {lang === "en"
                      ? "Server-verified amount · Simulated escrow custody"
                      : "সার্ভার-যাচাইকৃত পরিমাণ · সিমুলেটেড এসক্রো"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDepositModalOpen(false)}
                className="p-1 rounded-full text-[#8E9599] hover:text-[#111315] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!userId ? (
              <div className="space-y-4 text-center py-4">
                <p className="text-xs text-[#61676B] leading-relaxed">
                  {lang === "en"
                    ? "Sign in with a Client account to initiate a real SSLCOMMERZ Sandbox checkout session for your active contracts."
                    : "সক্রিয় চুক্তির জন্য SSLCOMMERZ স্যান্ডবক্স পেমেন্ট শুরু করতে ক্লায়েন্ট অ্যাকাউন্ট দিয়ে সাইন ইন করুন।"}
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] text-white text-xs font-semibold"
                >
                  <span>{lang === "en" ? "Sign In as Client" : "ক্লায়েন্ট লগইন"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : fundableContracts.length === 0 ? (
              <div className="space-y-4 text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-[#0F6E50] mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#111315]">
                    {lang === "en"
                      ? "No Unpaid or Retryable Contracts"
                      : "ফান্ডিং-যোগ্য কোনো চুক্তি বাকি নেই"}
                  </h4>
                  <p className="text-xs text-[#61676B]">
                    {lang === "en"
                      ? "Accept a freelancer proposal to create a contract ready for SSLCOMMERZ Sandbox funding."
                      : "নতুন চুক্তি তৈরি করতে একটি ফ্রিল্যান্সার প্রস্তাব অনুমোদন করুন।"}
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDepositModalOpen(false);
                      setActiveTab("proposals");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0B3B2E] text-white text-xs font-semibold cursor-pointer"
                  >
                    {lang === "en" ? "Review Proposals" : "আবেদন দেখুন"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDepositModalOpen(false);
                      setActiveTab("workspace");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#F4F2EC] text-[#111315] text-xs font-semibold cursor-pointer"
                  >
                    {lang === "en" ? "Open Workspace" : "ওয়ার্কস্পেস"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#111315] block mb-1.5">
                    {lang === "en"
                      ? "Select Contract to Fund"
                      : "ফান্ড করার জন্য চুক্তি নির্বাচন করুন"}
                  </label>
                  <select
                    value={effectiveContractIdToFund}
                    onChange={(e) => setSelectedContractIdToFund(e.target.value)}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[rgba(17,19,21,0.12)] bg-white focus:outline-[#0F6E50]"
                  >
                    {fundableContracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contractCode} · {c.title} ({formatBdt(c.totalBdt)})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFundableContract && (
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#61676B]">
                        {lang === "en" ? "Freelancer" : "ফ্রিল্যান্সার"}
                      </span>
                      <span className="font-bold text-[#111315]">
                        {selectedFundableContract.counterpartyName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#61676B]">
                        {lang === "en" ? "Contract Amount" : "মোট চুক্তির পরিমাণ"}
                      </span>
                      <span className="font-bold font-mono mk-tabular text-[#111315]">
                        {formatBdt(selectedFundableContract.totalBdt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#61676B]">
                        {lang === "en"
                          ? `Platform Commission (${selectedFundableContract.platformFeePct}%)`
                          : `প্ল্যাটফর্ম কমিশন (${selectedFundableContract.platformFeePct}%)`}
                      </span>
                      <span className="font-semibold font-mono mk-tabular text-[#3F4448]">
                        {formatBdt(selectedFundableContract.platformFeeAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[rgba(17,19,21,0.08)]">
                      <span className="font-bold text-[#111315]">
                        {lang === "en" ? "Freelancer Payable (Net)" : "ফ্রিল্যান্সার প্রাপ্য (নিট)"}
                      </span>
                      <span className="font-bold font-mono mk-tabular text-[#0B3B2E]">
                        {formatBdt(selectedFundableContract.netEarningsBdt)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-[#EAF5F0] rounded-xl space-y-1 text-xs text-[#0B3B2E] border border-[#0F6E50]/20">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#0F6E50]" />
                    <span>
                      {lang === "en"
                        ? "Server-Enforced Checkout Amount"
                        : "সার্ভার-নির্ধারিত চেকআউট পরিমাণ"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#0F6E50] leading-relaxed">
                    {lang === "en"
                      ? "Your payment session is initiated server-side against the contract amount in PostgreSQL and validated via SSLCOMMERZ Sandbox."
                      : "চুক্তির প্রকৃত অর্থের ভিত্তিতে সার্ভার থেকে SSLCOMMERZ স্যান্ডবক্স সেশন তৈরি ও যাচাই করা হবে।"}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!effectiveContractIdToFund || initiatingContractId === effectiveContractIdToFund}
                  onClick={() => handleInitiatePayment(effectiveContractIdToFund)}
                  className="w-full py-3 rounded-xl bg-[#0B3B2E] hover:bg-[#0F6E50] disabled:opacity-60 text-white font-semibold text-xs shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {initiatingContractId === effectiveContractIdToFund
                      ? lang === "en"
                        ? "Creating SSLCOMMERZ Sandbox Session..."
                        : "SSLCOMMERZ সেশন তৈরি হচ্ছে..."
                      : lang === "en"
                      ? `Proceed to SSLCOMMERZ Sandbox${
                          selectedFundableContract
                            ? ` (${formatBdt(selectedFundableContract.totalBdt)})`
                            : ""
                        }`
                      : `SSLCOMMERZ স্যান্ডবক্সে এগিয়ে যান`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        payment={selectedPayment}
        viewerRole="client"
        lang={lang}
        onClose={() => setSelectedPayment(null)}
        onRetryPayment={handleInitiatePayment}
        onVerifyPending={handleVerifyPendingPayment}
        actionLoading={Boolean(initiatingContractId || verifyingTranId)}
      />
    </DashboardShell>
  );
}

export default function ClientDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-96 bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-sm animate-pulse" />
        </div>
      }
    >
      <ClientDashboardContent />
    </Suspense>
  );
}
