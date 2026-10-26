"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Send,
  Handshake,
  Wallet,
  Users,
  Video,
  ArrowRight,
  Sparkles,
  Star,
  CheckCircle2,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight,
  Lock,
  Smartphone,
  CreditCard,
  Building,
  PlusCircle,
  Eye,
  AlertCircle,
  X,
  RefreshCw,
  Search,
  Bookmark,
  Gavel,
  MessageSquare,
  Plus,
  Trash2,
  Check,
  Download,
  Receipt,
  ExternalLink,
  Printer,
  Edit3,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import WorkspaceMessagesSection from "@/components/dashboard/WorkspaceMessagesSection";
import { SectionHeading, StatCard, OnboardingChecklist } from "@/components/dashboard/Primitives";
import {
  ContractCard,
  DraftJobsTable,
  LedgerList,
} from "@/components/dashboard/Widgets";
import {
  CLIENT_NAV,
  CLIENT_ONBOARDING_TASKS,
  CLIENT_DRAFT_JOBS,
  CLIENT_CONTRACTS,
  CLIENT_LEDGER,
} from "@/data/dashboardData";
import { formatBdt } from "@/lib/format";
import { WalletEntry } from "@/types";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import {
  PayoutMethod,
  fetchLivePayoutMethods,
  saveLivePayoutMethod,
  removeLivePayoutMethod,
  setPrimaryLivePayoutMethod,
} from "@/lib/data/wallet";

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

  const { userId, name, email, companyName } = useCurrentUser();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const isDemo = email === "apex@lifestyle.bd" || !email;
  const displayName = name || (isDemo ? "Ahad A" : "Client");
  const displayFirstName = displayName.split(" ")[0] || "Client";
  const displayCompany = companyName || (isDemo ? "Apex Lifestyle BD" : "My Organization");
  const displayMeta = lang === "en" ? `Client (${displayCompany})` : `ক্লায়েন্ট (${displayCompany})`;

  const tabParam = searchParams ? searchParams.get("tab") : null;
  const [activeTab, setActiveTab] = useState<string>(tabParam || "overview");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["overview", "jobs", "proposals", "contracts", "messages", "payments", "disputes", "saved"].includes(hash)) {
        setActiveTab(hash);
      }
    }

    const handleHashChange = () => {
      if (typeof window !== "undefined") {
        const hash = window.location.hash.replace("#", "");
        if (hash && ["overview", "jobs", "proposals", "contracts", "messages", "payments", "disputes", "saved"].includes(hash)) {
          setActiveTab(hash);
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [tabParam]);

  const [acceptedProposalIds, setAcceptedProposalIds] = useState<string[]>(["prop-1"]);
  const [consultants, setConsultants] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState<WalletEntry[]>(isDemo ? CLIENT_LEDGER : []);
  const [prefundedBalance, setPrefundedBalance] = useState<number>(15000);
  const [ledgerFilter, setLedgerFilter] = useState<"ALL" | "ESCROW" | "RELEASED" | "DEPOSIT">("ALL");

  // Payment & Billing Methods State
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
  const [selectedInvoice, setSelectedInvoice] = useState<WalletEntry | null>(null);

  // Escrow Deposit Modal
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(20000);
  const [depositGateway, setDepositGateway] = useState<"BKASH" | "NAGAD" | "CARD" | "BANK">("BKASH");
  const [depositStep, setDepositStep] = useState<"FORM" | "PROCESSING" | "SUCCESS">("FORM");
  const [trxResult, setTrxResult] = useState<string>("");

  const contracts = isDemo ? CLIENT_CONTRACTS : [];
  const draftJobs = isDemo ? CLIENT_DRAFT_JOBS : [];
  const activeContracts = contracts.filter((c) => c.stage === "ACTIVE");
  const escrowHeld = contracts.reduce((sum, c) => sum + c.escrowHeldBdt, 0);
  const totalSpent = contracts.reduce((sum, c) => sum + c.releasedBdt, 0);
  const totalProposals = draftJobs.reduce((sum, d) => sum + d.proposalCount, 0) + (isDemo ? 3 : 0);

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

  const handleDepositEscrow = () => {
    if (depositAmount <= 0) return;
    setDepositStep("PROCESSING");

    setTimeout(() => {
      const generatedTrx = `TRX-${depositGateway === "BKASH" ? "BK" : depositGateway === "NAGAD" ? "NG" : depositGateway === "CARD" ? "CRD" : "BNK"}${Math.floor(100000 + Math.random() * 900000)}`;
      setTrxResult(generatedTrx);

      const newEntry: WalletEntry = {
        id: `tx-${Date.now()}`,
        label: `Escrow Funded via ${depositGateway} for Milestone`,
        labelBn: `মাইলস্টোনের জন্য ${depositGateway}-এ এসক্রো ফান্ড জমা`,
        method: (depositGateway === "BKASH" ? "BKASH" : depositGateway === "NAGAD" ? "NAGAD" : "BANK") as any,
        amountBdt: depositAmount,
        status: "COMPLETED",
        createdLabel: "Just now",
      };
      (newEntry as any).trxId = generatedTrx;

      setLedgerEntries((prev) => [newEntry, ...prev]);
      setPrefundedBalance((prev) => prev + depositAmount);
      setDepositStep("SUCCESS");
    }, 1200);
  };

  // Filtered ledger entries
  const filteredLedgerEntries = ledgerEntries.filter((entry) => {
    if (ledgerFilter === "ALL") return true;
    if (ledgerFilter === "ESCROW") return entry.label.toLowerCase().includes("escrow");
    if (ledgerFilter === "RELEASED") return entry.label.toLowerCase().includes("released") || entry.label.toLowerCase().includes("disbursed");
    if (ledgerFilter === "DEPOSIT") return entry.amountBdt > 0 || entry.label.toLowerCase().includes("top-up") || entry.label.toLowerCase().includes("deposit");
    return true;
  });

  return (
    <DashboardShell
      role="client"
      nav={CLIENT_NAV}
      userName={displayName}
      userMeta={displayMeta}
      avatar="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&auto=format&fit=crop&q=80"
      walletBdt={escrowHeld}
      walletLabel={lang === "en" ? "in escrow safe" : "এসক্রোতে সুরক্ষিত"}
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
        {/* Welcome Header */}
        <div id="overview" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                {lang === "en" ? "Client Command Center" : "ক্লায়েন্ট কমান্ড সেন্টার"}
              </span>
              <span className="text-slate-300">•</span>
              <Link
                href="/contracts"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>{lang === "en" ? "Contract Workspaces" : "কন্ট্রাক্ট ওয়ার্কস্পেস"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {lang === "en" ? (
                <>
                  Welcome back, <span className="text-emerald-600">{displayFirstName}</span>
                </>
              ) : (
                <>
                  স্বাগতম, <span className="text-emerald-600">{displayFirstName}</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === "en"
                ? "Manage your active job postings, evaluate freelancer proposals, and fund secure milestone escrows."
                : "আপনার পোস্টকৃত কাজ পরিচালনা করুন, ফ্রিল্যান্সারদের আবেদন যাচাই করুন এবং নিরাপদ এসক্রোতে তহবিল রাখুন।"}
            </p>
          </div>


        </div>

        {/* Stats Grid */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              icon={Briefcase}
              label="Active job posts"
              labelBn="সক্রিয় কাজ"
              value="3"
              delta="+1 this week"
              lang={lang}
              accent="emerald"
            />
            <StatCard
              icon={Send}
              label="Proposals received"
              labelBn="প্রাপ্ত আবেদন"
              value={String(totalProposals)}
              delta="+4 today"
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
              label="Total spent in escrow"
              labelBn="মোট এসক্রো ও ব্যয়"
              value={formatBdt(totalSpent + escrowHeld)}
              delta="-12% vs last month"
              deltaUp={false}
              lang={lang}
              accent="amber"
            />
          </div>
        )}

        {/* Onboarding + Guided Consultation */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <OnboardingChecklist tasks={CLIENT_ONBOARDING_TASKS} lang={lang} />
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {lang === "en" ? "Guided Expert Consultation" : "বিশেষজ্ঞ পরামর্শ"}
                  </span>
                </div>

                <h3 className="text-base font-black leading-snug">
                  {lang === "en"
                    ? "Book a 1-on-1 scope & budget review"
                    : "১-অন-১ বাজেট ও কাজের পরিধি পর্যালোচনা"}
                </h3>
                <p className="text-[11px] text-emerald-50/90 mt-2 leading-relaxed">
                  {lang === "en"
                    ? "Review your product specs, BDT budget, and developer milestones with a verified consultant before hiring."
                    : "নিয়োগ করার আগে আপনার প্রজেক্টের বাজেট ও মাইলস্টোন বিশেষজ্ঞের সাথে পর্যালোচনা করুন।"}
                </p>
              </div>

              <button
                onClick={() => setConsultants(!consultants)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-all cursor-pointer shadow-xs"
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
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700 shrink-0">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.country}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed mb-1.5">{c.blurb}</p>
                  <p className="text-[10px] font-bold text-emerald-700 mb-3">{c.specialty}</p>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-black text-slate-900">
                      ${c.price}
                      <span className="font-semibold text-slate-400"> / 30 min</span>
                    </span>
                    <button className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer">
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
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {lang === "en" ? "Post New Job" : "নতুন কাজ পোস্ট"}
                </Link>
              }
            />
            <DraftJobsTable drafts={draftJobs} lang={lang} />
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
            <div className="grid grid-cols-1 gap-3.5">
              {MOCK_PROPOSALS.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <img
                      src={prop.freelancerAvatar}
                      alt={prop.freelancerName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {lang === "bn" && prop.freelancerNameBn ? prop.freelancerNameBn : prop.freelancerName}
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ★ {prop.rating} ({prop.reviews})
                        </span>
                        {acceptedProposalIds.includes(prop.id) ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{lang === "en" ? "Bid Accepted · Messaging Live" : "বিড গৃহীত · মেসেজিং সক্রিয়"}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-amber-600" />
                            <span>{lang === "en" ? "Bid Pending Review" : "বিড অপেক্ষমাণ"}</span>
                          </span>
                        )}
                        {prop.isShortlisted && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            {lang === "en" ? "Shortlisted" : "বাছাইকৃত"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {lang === "bn" && prop.freelancerTitleBn ? prop.freelancerTitleBn : prop.freelancerTitle}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 max-w-xl italic">
                        "{lang === "bn" && prop.coverNoteBn ? prop.coverNoteBn : prop.coverNote}"
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {lang === "en" ? "Applying for: " : "আবেদনকৃত কাজ: "}
                        <span className="font-semibold text-slate-600">
                          {lang === "bn" && prop.jobTitleBn ? prop.jobTitleBn : prop.jobTitle}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-base font-black text-slate-900">
                        ৳{prop.bidBdt.toLocaleString()} BDT
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {lang === "en" ? `Delivery in ${prop.deliveryDays} days` : `${prop.deliveryDays} দিনে ডেলিভারি`}
                      </div>
                    </div>

                    {acceptedProposalIds.includes(prop.id) ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("messages")}
                          className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === "en" ? "Message Freelancer" : "মেসেজ পাঠান"}</span>
                        </button>
                        <Link
                          href="/contracts/ctr-8842"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{lang === "en" ? "Workspace" : "ওয়ার্কস্পেস"}</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() => setAcceptedProposalIds((prev) => [...prev, prop.id])}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{lang === "en" ? "Accept Bid & Unlock Chat" : "বিড অনুমোদন ও চ্যাট আনলক"}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{lang === "en" ? "Messaging locked until accepted" : "অনুমোদনের পূর্বে মেসেজিং লকড"}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contracts Section */}
        {(activeTab === "overview" || activeTab === "contracts") && (
          <div id="contracts" className="space-y-4">
            <SectionHeading
              title="Active contracts"
              titleBn="সক্রিয় চুক্তি ও প্রজেক্ট"
              subtitle="Milestone-funded work currently in progress"
              subtitleBn="এসক্রোতে জমা থাকা চলমান কাজের মাইলস্টোন"
              lang={lang}
              action={
                <Link
                  href="/contracts"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all"
                >
                  <Handshake className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === "en" ? "All Contracts Hub" : "সকল চুক্তি"}</span>
                </Link>
              }
            />
            {contracts.length === 0 ? (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Handshake className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === "en" ? "No active contracts yet" : "কোনো সক্রিয় চুক্তি নেই"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {lang === "en"
                    ? "Post a job and hire vetted Bangladeshi freelancers with secure milestone escrow."
                    : "সুরক্ষিত এসক্রো চুক্তির মাধ্যমে কাজ সম্পন্ন করতে ট্যালেন্ট নিয়োগ দিন।"}
                </p>
                <Link
                  href="/post-job"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Post a New Job" : "নতুন কাজ পোস্ট করুন"}</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {contracts.map((c) => (
                  <ContractCard key={c.id} contract={c} perspective="client" lang={lang} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------------- */}
        {/* CLIENT REAL-TIME MESSAGES & COLLABORATION (SOCKET.IO)                         */}
        {/* ----------------------------------------------------------------------------- */}
        {activeTab === "messages" && (
          <div id="messages" className="space-y-4">
            <WorkspaceMessagesSection
              role="client"
              lang={lang}
              currentUserName={displayName}
              currentUserAvatar="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&auto=format&fit=crop&q=80"
            />
          </div>
        )}

        {/* ----------------------------------------------------------------------------- */}
        {/* CLIENT WALLET & PAYMENTS SECTION (LIKE FREELANCER WALLET + CLIENT ESSENTIALS)  */}
        {/* ----------------------------------------------------------------------------- */}
        {activeTab === "payments" && (
          <div id="payments" className="space-y-6">
            {/* Client Escrow & Billing Hero Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 rounded-2xl p-6 text-white shadow-sm border border-slate-800">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      {lang === "en" ? "Client Escrow & Billing Vault" : "ক্লায়েন্ট এসক্রো ও বিলিং ভল্ট"}
                    </span>
                  </div>
                  <p className="text-3xl font-black tracking-tight">{formatBdt(escrowHeld)}</p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>
                      {lang === "en"
                        ? "Protected in neutral MuktoKormo milestone escrow"
                        : "নিরপেক্ষ মুক্তকর্ম মাইলস্টোন এসক্রোতে সম্পূর্ণ সুরক্ষিত"}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {lang === "en" ? "Pre-Funded Credits" : "প্রি-ফান্ডেড ক্রেডিট"}
                    </p>
                    <p className="text-sm font-black text-amber-300">{formatBdt(prefundedBalance)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {lang === "en" ? "Lifetime Disbursed" : "সর্বমোট পরিশোধিত"}
                    </p>
                    <p className="text-sm font-black text-emerald-300">{formatBdt(totalSpent)}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        setDepositStep("FORM");
                        setDepositModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>{lang === "en" ? "Fund Escrow / Deposit" : "এসক্রো জমা / ডিপোজিট"}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (ledgerEntries.length > 0) {
                          setSelectedInvoice(ledgerEntries[0]);
                        }
                      }}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-300" />
                      <span>{lang === "en" ? "Tax Statement" : "ট্যাক্স বিবরণী"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout & Billing Methods Section (Matches Freelancer Payout Grid) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span>{lang === "en" ? "Billing & Payment Methods" : "বিলিং ও পেমেন্ট মাধ্যম"}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === "en"
                      ? "Manage verified Bangladeshi MFS (bKash/Nagad) and corporate bank accounts for 1-click milestone funding."
                      : "মাইলস্টোন ফান্ড করার জন্য ভেরিফাইড বিকাশ, নগদ ও লোকাল ব্যাংক অ্যাকাউন্টসমূহ ব্যবস্থাপনা করুন।"}
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
                                bKash Merchant
                              </span>
                            )}
                            {isNagad && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-orange-50 text-orange-700 border border-orange-200">
                                <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                                Nagad Direct
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
                                Corporate Bank (NPSB)
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
                              {lang === "en" ? "Default" : "প্রধান"}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryMethod(m.id)}
                              className="text-[11px] font-bold text-slate-400 hover:text-emerald-700 hover:underline cursor-pointer"
                            >
                              {lang === "en" ? "Make Default" : "ডিফল্ট করুন"}
                            </button>
                          )}
                        </div>

                        {/* Account Details */}
                        <div className="space-y-1">
                          {isBank ? (
                            <>
                              <h4 className="text-sm font-black text-slate-900 leading-tight">
                                {m.bankName || "Corporate Account"}
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
                          <span>{lang === "en" ? "Verified for 1-Click Escrow" : "এসক্রোর জন্য প্রস্তুত"}</span>
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
                      {lang === "en" ? "Add New Billing Method" : "নতুন বিলিং মাধ্যম যোগ করুন"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {lang === "en"
                        ? "bKash, Nagad, Rocket or Corporate Bank Account"
                        : "বিকাশ, নগদ, রকেট বা কর্পোরেট ব্যাংক হিসাব"}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* CLIENT-SPECIFIC ESSENTIALS: Escrow Protection Guarantees & Corporate Tax Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Escrow Guarantee Cards */}
              <div className="lg:col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                      {lang === "en" ? "100% Escrow Protection Protocol" : "১০০% এসক্রো সুরক্ষা নীতিমালা"}
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      {lang === "en"
                        ? "Bangladesh Bank approved framework protecting client capital"
                        : "বাংলাদেশ ব্যাংকের নির্দেশিকা মেনে ক্লায়েন্টের অর্থ সুরক্ষিত"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white/90 rounded-xl p-3 border border-emerald-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === "en" ? "Release Control" : "সম্পূর্ণ নিয়ন্ত্রণ"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {lang === "en"
                        ? "Zero automatic payouts. Funds disburse only when you approve."
                        : "আপনার অনুমোদন ছাড়া কোনো টাকা ফ্রিল্যান্সারের কাছে যাবে না।"}
                    </p>
                  </div>

                  <div className="bg-white/90 rounded-xl p-3 border border-emerald-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === "en" ? "7-Day Inspection" : "৭ দিনের রিভিউ"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {lang === "en"
                        ? "Full 7 days to inspect code & request unlimited revisions."
                        : "কাজ যাচাই করতে ৭ দিন সময় এবং আনলিমিটেড রিভিশন সুবিধা।"}
                    </p>
                  </div>

                  <div className="bg-white/90 rounded-xl p-3 border border-emerald-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                      <Gavel className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === "en" ? "Arbitration" : "মধ্যস্থতা সেবা"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {lang === "en"
                        ? "Dedicated dispute resolution board ensures safe refunds."
                        : "কাজে অমিল থাকলে নিরপেক্ষ সালিশের মাধ্যমে রিফান্ড নিশ্চিত।"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Company VAT & Billing Profile Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {lang === "en" ? "Corporate Billing Profile" : "প্রাতিষ্ঠানিক বিলিং প্রোফাইল"}
                    </span>
                    <button
                      onClick={() => setEditBillingModalOpen(true)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{lang === "en" ? "Edit" : "সম্পাদনা"}</span>
                    </button>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 leading-tight">
                    {billingProfile.companyName}
                  </h4>
                  <p className="text-[11px] font-mono font-bold text-slate-600 mt-1">
                    BIN: {billingProfile.binNumber}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {billingProfile.billingAddress}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Mushak-6.3 VAT Ready
                  </span>
                  <button
                    onClick={() => {
                      if (ledgerEntries.length > 0) setSelectedInvoice(ledgerEntries[0]);
                    }}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    {lang === "en" ? "View Sample VAT Receipt" : "নমুনা ভ্যাট রসিদ"}
                  </button>
                </div>
              </div>
            </div>

            {/* Escrow Transactions & Invoices Ledger */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <SectionHeading
                  title="Recent payments & escrow ledger"
                  titleBn="সাম্প্রতিক পেমেন্ট ও এসক্রো খতিয়ান"
                  subtitle="Escrow deposits, milestones released and MFS transaction records"
                  subtitleBn="এসক্রো জমা, মাইলস্টোন মুক্তি ও বিকাশ/নগদ লেনদেনের বিবরণী"
                  lang={lang}
                />

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold text-slate-600">
                    <button
                      onClick={() => setLedgerFilter("ALL")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        ledgerFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                      }`}
                    >
                      {lang === "en" ? "All" : "সকল"}
                    </button>
                    <button
                      onClick={() => setLedgerFilter("ESCROW")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        ledgerFilter === "ESCROW" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                      }`}
                    >
                      {lang === "en" ? "Escrow" : "এসক্রো"}
                    </button>
                    <button
                      onClick={() => setLedgerFilter("RELEASED")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        ledgerFilter === "RELEASED" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                      }`}
                    >
                      {lang === "en" ? "Released" : "পরিশোধিত"}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setDepositStep("FORM");
                      setDepositModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    + {lang === "en" ? "Deposit Escrow" : "এসক্রো জমা"}
                  </button>
                </div>
              </div>

              {/* Transactions List with Invoice Buttons */}
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {filteredLedgerEntries.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      {lang === "en" ? "No transactions found in this category" : "এই ক্যাটাগরিতে কোনো লেনদেন পাওয়া যায়নি"}
                    </div>
                  ) : (
                    filteredLedgerEntries.map((entry) => {
                      const isCredit = entry.amountBdt > 0;
                      const trxCode = (entry as any).trxId;
                      return (
                        <div
                          key={entry.id}
                          className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                                entry.method === "BKASH"
                                  ? "bg-pink-50 border-pink-200 text-pink-600"
                                  : entry.method === "NAGAD"
                                  ? "bg-orange-50 border-orange-200 text-orange-600"
                                  : entry.method === "BANK"
                                  ? "bg-sky-50 border-sky-200 text-sky-600"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-600"
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
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {lang === "en" ? entry.label : entry.labelBn || entry.label}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {entry.createdLabel} · {entry.method} {trxCode ? `· ${trxCode}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="text-right">
                              <p
                                className={`text-xs font-black ${
                                  isCredit ? "text-emerald-600" : "text-slate-900"
                                }`}
                              >
                                {isCredit ? `+${formatBdt(entry.amountBdt)}` : formatBdt(Math.abs(entry.amountBdt))}
                              </p>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {entry.status || "COMPLETED"}
                              </span>
                            </div>

                            <button
                              onClick={() => setSelectedInvoice(entry)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title={lang === "en" ? "View Tax Invoice" : "ট্যাক্স রসিদ দেখুন"}
                            >
                              <Receipt className="w-3 h-3 text-slate-500" />
                              <span>{lang === "en" ? "Invoice" : "রসিদ"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Resolution Tab */}
        {(activeTab === "overview" || activeTab === "disputes") && (
          <div id="disputes" className="space-y-4">
            <SectionHeading
              title="Escrow dispute & arbitration center"
              titleBn="এসক্রো বিরোধ ও মধ্যস্থতা কেন্দ্র"
              subtitle="MuktoKormo escrow mediation protects your funds until deliverables are verified"
              subtitleBn="মুক্তকর্ম এসক্রো মধ্যস্থতা সেবা কাজ যাচাই না হওয়া পর্যন্ত আপনার ফান্ড সুরক্ষিত রাখে"
              lang={lang}
            />
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {lang === "en" ? "Zero Active Disputes" : "কোনো চলমান বিরোধ নেই"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === "en"
                      ? "All your contracts are proceeding normally under milestone protection."
                      : "আপনার সকল চুক্তি বর্তমানে মাইলস্টোন সুরক্ষায় স্বাভাবিকভাবে চলছে।"}
                  </p>
                </div>
              </div>

              <Link
                href="/contracts"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                {lang === "en" ? "Learn About Escrow Rules" : "এসক্রো নিয়মাবলী"}
              </Link>
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
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SAVED_TALENT.map((t) => (
                <div
                  key={t.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {lang === "bn" && t.nameBn ? t.nameBn : t.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {lang === "bn" && t.titleBn ? t.titleBn : t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="text-emerald-600 font-bold">★ {t.rating}</span>
                        <span>• ৳{t.rateBdt}/{lang === "en" ? "hr" : "ঘণ্টা"}</span>
                        <span>• {lang === "bn" && t.locationBn ? t.locationBn : t.location}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/contracts/ctr-8842"
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors shrink-0"
                  >
                    {lang === "en" ? "Direct Hire" : "সরাসরি নিয়োগ"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------------------- */}
      {/* ADD BILLING / PAYMENT METHOD MODAL (LIKE FREELANCER MODAL)                     */}
      {/* ----------------------------------------------------------------------------- */}
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
                    {lang === "en" ? "Add Billing Method" : "পেমেন্ট মাধ্যম যোগ করুন"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === "en" ? "Link verified account for 1-click escrow funding" : "১-ক্লিকে এসক্রো ফান্ড করার মাধ্যম যুক্ত করুন"}
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
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  {lang === "en" ? "Billing Method Added!" : "বিলিং মাধ্যম সফলভাবে যুক্ত হয়েছে!"}
                </h4>
                <p className="text-xs text-slate-500">
                  {lang === "en"
                    ? "Your account is verified and ready for instant milestone deposits."
                    : "আপনার অ্যাকাউন্ট যাচাইকৃত এবং তাৎক্ষণিক এসক্রো জমার জন্য প্রস্তুত।"}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSavePaymentMethod} className="space-y-4">
                {/* Method Type Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {lang === "en" ? "Payment Channel" : "পেমেন্ট চ্যানেল"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { type: "BKASH", label: "bKash" },
                      { type: "NAGAD", label: "Nagad" },
                      { type: "ROCKET", label: "Rocket" },
                      { type: "BANK", label: "Bank" },
                    ].map((t) => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setNewMethodType(t.type as any)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          newMethodType === t.type
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Type (Personal vs Merchant/Corporate) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {lang === "en" ? "Account Type" : "হিসাবের ধরন"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Merchant", "Personal"] as const).map((at) => (
                      <button
                        key={at}
                        type="button"
                        onClick={() => setNewAccountType(at)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          newAccountType === at
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
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
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {lang === "en" ? "Bank Name" : "ব্যাংকের নাম"}
                      </label>
                      <select
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-emerald-500"
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
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {lang === "en" ? "Branch Name" : "শাখার নাম"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gulshan Corporate Branch"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {lang === "en" ? "Bank Account Number" : "অ্যাকাউন্ট নম্বর"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1501 2039 4810 0001"
                        value={newAccountNumber}
                        onChange={(e) => setNewAccountNumber(e.target.value)}
                        className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {lang === "en" ? "9-Digit Routing Number" : "রাউটিং নম্বর (৯ ডিজিট)"}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 060261345"
                        value={newRoutingNumber}
                        onChange={(e) => setNewRoutingNumber(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {newMethodType} {lang === "en" ? "Mobile Wallet Number" : "মোবাইল নম্বর"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+880 1712-XXXXXX"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === "en" ? "Account / Entity Holder Name" : "হিসাবধারীর নাম / প্রতিষ্ঠানের নাম"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Lifestyle BD Ltd."
                    value={newAccountHolder}
                    onChange={(e) => setNewAccountHolder(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="setClientPrimaryMethod"
                    checked={newIsPrimary}
                    onChange={(e) => setNewIsPrimary(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <label htmlFor="setClientPrimaryMethod" className="text-xs text-slate-700 font-medium cursor-pointer">
                    {lang === "en"
                      ? "Set as default billing method for automatic escrow funding"
                      : "মাইলস্টোন এসক্রো জমার জন্য ডিফল্ট মাধ্যম হিসেবে সেট করুন"}
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddMethodModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    {lang === "en" ? "Cancel" : "বাতিল"}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {lang === "en" ? "Edit Corporate Billing Profile" : "প্রাতিষ্ঠানিক বিলিং প্রোফাইল সম্পাদনা"}
              </h3>
              <button onClick={() => setEditBillingModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === "en" ? "Registered Company Name" : "নিবন্ধিত কোম্পানির নাম"}
                </label>
                <input
                  type="text"
                  value={billingProfile.companyName}
                  onChange={(e) => setBillingProfile({ ...billingProfile, companyName: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === "en" ? "Business Identification Number (BIN / TIN)" : "বিআইএন / টিআইএন নম্বর"}
                </label>
                <input
                  type="text"
                  value={billingProfile.binNumber}
                  onChange={(e) => setBillingProfile({ ...billingProfile, binNumber: e.target.value })}
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === "en" ? "Registered Billing Address" : "বিলিং ঠিকানা"}
                </label>
                <textarea
                  rows={2}
                  value={billingProfile.billingAddress}
                  onChange={(e) => setBillingProfile({ ...billingProfile, billingAddress: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setEditBillingModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                {lang === "en" ? "Save Changes" : "সংরক্ষণ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------------- */}
      {/* OFFICIAL NBR MUSHAK-6.3 TAX INVOICE MODAL                                     */}
      {/* ----------------------------------------------------------------------------- */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Invoice Top Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  NBR Mushak-6.3 VAT Tax Invoice
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Print" : "প্রিন্ট"}</span>
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4 text-xs font-sans">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-black text-slate-900">MuktoKormo Limited</h3>
                  <p className="text-[11px] text-slate-500">Bangladesh Freelance Escrow Trust</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">BIN: 001928472-0101 · NBR Reg: MK-BDT-2026</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    PAID / ESCROW HELD
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Invoice: INV-{selectedInvoice.id.slice(0, 8)}</p>
                  <p className="text-[10px] text-slate-400">{selectedInvoice.createdLabel}</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Billed To (Client):</span>
                  <p className="font-bold text-slate-900">{billingProfile.companyName}</p>
                  <p className="text-slate-500 font-mono text-[10px]">BIN: {billingProfile.binNumber}</p>
                  <p className="text-slate-500 text-[10px]">{billingProfile.billingAddress}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Channel:</span>
                  <p className="font-bold text-slate-900">{selectedInvoice.method} Direct</p>
                  <p className="text-slate-500 font-mono text-[10px]">TrxID: {(selectedInvoice as any).trxId || "TRX-BK729182"}</p>
                  <p className="text-emerald-600 font-bold text-[10px]">Status: Verified NBR VAT Compliant</p>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="py-1.5">Description</th>
                    <th className="py-1.5 text-right">Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 text-slate-800 font-medium">
                      {lang === "en" ? selectedInvoice.label : selectedInvoice.labelBn || selectedInvoice.label}
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-slate-900">
                      ৳{Math.abs(selectedInvoice.amountBdt).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-500">Platform Escrow Fee (3%)</td>
                    <td className="py-1 text-right font-mono text-slate-600">
                      ৳{Math.round(Math.abs(selectedInvoice.amountBdt) * 0.03).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-500">Government VAT on Platform Fee (15%)</td>
                    <td className="py-1 text-right font-mono text-slate-600">
                      ৳{Math.round(Math.abs(selectedInvoice.amountBdt) * 0.03 * 0.15).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-black text-slate-900">
                    <td className="pt-2 text-xs">Total Net Paid:</td>
                    <td className="pt-2 text-right font-mono text-sm text-emerald-600">
                      ৳{(Math.abs(selectedInvoice.amountBdt) + Math.round(Math.abs(selectedInvoice.amountBdt) * 0.0345)).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <button
              onClick={() => setSelectedInvoice(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
            >
              Close Invoice
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------------- */}
      {/* ESCROW DEPOSIT MODAL                                                          */}
      {/* ----------------------------------------------------------------------------- */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === "en" ? "Fund MuktoKormo Escrow Safe" : "মুক্তকর্ম এসক্রোতে ফান্ড জমা"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === "en" ? "Safe custody via Bangladeshi MFS / Bank Gateway" : "বিকাশ, নগদ ও ব্যাংকের মাধ্যমে সুরক্ষিত তহবিল"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDepositModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {depositStep === "FORM" && (
              <div className="space-y-4">
                {/* Gateway */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {lang === "en" ? "Select Payment Channel" : "পেমেন্ট মাধ্যম নির্বাচন করুন"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "BKASH", name: "bKash" },
                      { id: "NAGAD", name: "Nagad" },
                      { id: "BANK", name: "Bank" },
                      { id: "CARD", name: "Card" },
                    ].map((gw) => (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setDepositGateway(gw.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          depositGateway === gw.id
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {gw.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {lang === "en" ? "Amount to Fund (BDT)" : "জমার পরিমাণ (টাকা)"}
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full text-base font-black px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-500 font-mono"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[10000, 20000, 42000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        ৳{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl space-y-1 text-xs text-emerald-900 border border-emerald-200/60">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>100% Escrow Protection Guaranteed</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Funds are safely held in MuktoKormo escrow. They will not be disbursed to the freelancer until you review and approve the submitted milestones.
                  </p>
                </div>

                <button
                  onClick={handleDepositEscrow}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Deposit ৳{depositAmount.toLocaleString()} to Escrow Safe</span>
                </button>
              </div>
            )}

            {depositStep === "PROCESSING" && (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">
                  Securing Funds in Escrow...
                </h4>
                <p className="text-xs text-slate-500">
                  Verifying merchant transaction with {depositGateway}.
                </p>
              </div>
            )}

            {depositStep === "SUCCESS" && (
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  ৳{depositAmount.toLocaleString()} Secured in Escrow!
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Funds have been allocated. Freelancer has been notified that the milestone is fully funded and safe to begin work.
                </p>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 font-bold">
                  TrxID: {trxResult}
                </div>
                <button
                  onClick={() => setDepositModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                >
                  Close & View Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function ClientDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Client Command Center...</div>}>
      <ClientDashboardContent />
    </Suspense>
  );
}
