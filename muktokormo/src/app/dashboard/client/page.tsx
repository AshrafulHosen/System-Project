"use client";

import React, { useState } from "react";
import Link from "next/link";
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
<<<<<<< HEAD
=======
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
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SectionHeading, StatCard, OnboardingChecklist } from "@/components/dashboard/Primitives";
import {
  ResourceGrid,
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
  CLIENT_RESOURCES,
} from "@/data/dashboardData";
import { formatBdt } from "@/lib/format";
<<<<<<< HEAD

const CONSULTANTS = [
  {
    name: "Abul Kalam S",
    country: "Bangladesh",
    jobs: 11,
    rate: 25,
    success: 100,
    specialty: "Full Stack & AI",
    blurb:
      "The job isn't complete until my client is fully satisfied. I'm Saju, a skilled web design expert based in Dhaka.",
    price: 30,
  },
  {
    name: "Davinder S",
    country: "India",
    jobs: 9,
    rate: 15,
    success: 90,
    specialty: "WordPress & WooCommerce",
    blurb:
      "Framer Designer | Framer Developer | Figma to Framer. Verified & Featured partner with a top 1% creator record.",
    price: 50,
  },
  {
    name: "Hardik Kumar",
    country: "India",
    jobs: 9,
    rate: 50,
    success: 100,
    specialty: "Claude Code & AI Stack",
    blurb:
      "I help startups and businesses build fast, scalable web applications and AI-powered tools end to end.",
    price: 50,
=======
import { WalletEntry } from "@/types";

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
    freelancerName: "Tanvir Rahman",
    freelancerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    freelancerTitle: "Senior Next.js & MFS Gateway Engineer",
    rating: 4.95,
    reviews: 42,
    bidBdt: 42000,
    deliveryDays: 14,
    coverNote: "I have integrated bKash and Nagad payment merchant webhooks for 8+ Bangladeshi e-commerce startups. Ready to start immediately.",
    isShortlisted: true,
  },
  {
    id: "prop-2",
    jobTitle: "Full-Stack Next.js E-Commerce Website with bKash/Nagad Payment",
    freelancerName: "Mahmudul Hasan",
    freelancerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    freelancerTitle: "Full Stack Developer",
    rating: 4.88,
    reviews: 29,
    bidBdt: 38000,
    deliveryDays: 18,
    coverNote: "Experienced in Next.js 14 App router, Tailwind CSS, PostgreSQL Prisma, and SSLCommerz.",
    isShortlisted: false,
  },
  {
    id: "prop-3",
    jobTitle: "Brand Identity, Logo & Social Media Kit for Chittagong Food Tech",
    freelancerName: "Sabbir Ahmed",
    freelancerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    freelancerTitle: "Brand Identity & Packaging Specialist",
    rating: 4.92,
    reviews: 36,
    bidBdt: 17500,
    deliveryDays: 10,
    coverNote: "Delivered packaging and social kit for several cloud kitchens in Dhaka and Chittagong. Check my portfolio.",
    isShortlisted: true,
  },
];

const SAVED_TALENT = [
  {
    id: "fav-1",
    name: "Farzana Yasmin",
    title: "Performance Marketer & Growth Strategist",
    location: "Gulshan, Dhaka",
    rating: 4.95,
    rateBdt: 1500,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80",
    skills: ["Meta Ads", "TikTok Ads", "CAPI", "Copywriting"],
  },
  {
    id: "fav-2",
    name: "Sabbir Ahmed",
    title: "Brand Identity & Packaging Specialist",
    location: "Agrabad, Chattogram",
    rating: 4.92,
    rateBdt: 1200,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    skills: ["Figma", "Branding", "Packaging", "Illustration"],
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
  },
];

export default function ClientDashboardPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
<<<<<<< HEAD
  const [consultants, setConsultants] = useState(true);
=======
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [consultants, setConsultants] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState<WalletEntry[]>(CLIENT_LEDGER);

  // Escrow Deposit Modal
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(20000);
  const [depositGateway, setDepositGateway] = useState<"BKASH" | "NAGAD" | "CARD">("BKASH");
  const [depositStep, setDepositStep] = useState<"FORM" | "PROCESSING" | "SUCCESS">("FORM");
  const [trxResult, setTrxResult] = useState<string>("");
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)

  const activeContracts = CLIENT_CONTRACTS.filter((c) => c.stage === "ACTIVE");
  const escrowHeld = CLIENT_CONTRACTS.reduce((sum, c) => sum + c.escrowHeldBdt, 0);
  const totalSpent = CLIENT_CONTRACTS.reduce((sum, c) => sum + c.releasedBdt, 0);
  const totalProposals = CLIENT_DRAFT_JOBS.reduce((sum, d) => sum + d.proposalCount, 0) + 3;

<<<<<<< HEAD
=======
  const handleDepositEscrow = () => {
    if (depositAmount <= 0) return;
    setDepositStep("PROCESSING");

    setTimeout(() => {
      const generatedTrx = `TRX-${depositGateway === "BKASH" ? "BK" : depositGateway === "NAGAD" ? "NG" : "CRD"}${Math.floor(100000 + Math.random() * 900000)}`;
      setTrxResult(generatedTrx);

      const newEntry: WalletEntry = {
        id: `tx-${Date.now()}`,
        label: `Escrow Funded via ${depositGateway} for Milestone 1`,
        labelBn: `মাইলস্টোন ১ এর জন্য ${depositGateway}-এ এসক্রো জমা`,
        method: depositGateway === "BKASH" ? "BKASH" : depositGateway === "NAGAD" ? "NAGAD" : "BANK",
        amountBdt: depositAmount,
        status: "COMPLETED",
        createdLabel: "Just now",
      };

      setLedgerEntries((prev) => [newEntry, ...prev]);
      setDepositStep("SUCCESS");
    }, 1200);
  };

>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
  return (
    <DashboardShell
      role="client"
      nav={CLIENT_NAV}
      userName="Ahad A"
<<<<<<< HEAD
      userMeta={lang === "en" ? "Client" : "ক্লায়েন্ট"}
      avatar="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&auto=format&fit=crop&q=80"
      walletBdt={escrowHeld}
      walletLabel={lang === "en" ? "in escrow" : "এসক্রোতে"}
=======
      userMeta={lang === "en" ? "Employer (Apex Lifestyle BD)" : "নিয়োগদাতা (এপেক্স লাইফস্টাইল বিডি)"}
      avatar="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&auto=format&fit=crop&q=80"
      walletBdt={escrowHeld}
      walletLabel={lang === "en" ? "in escrow safe" : "এসক্রোতে সুরক্ষিত"}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      lang={lang}
      onToggleLang={() => setLang((prev) => (prev === "en" ? "bn" : "en"))}
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
      action={{
        label: "Post a Job",
        labelBn: "কাজ পোস্ট করুন",
        href: "/post-job",
      }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
<<<<<<< HEAD
        {/* Welcome */}
        <div id="overview" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
=======
        {/* Welcome Header */}
        <div id="overview" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                {lang === "en" ? "Employer Command Center" : "নিয়োগকর্তা ড্যাশবোর্ড"}
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
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {lang === "en" ? (
                <>
                  Welcome back, <span className="text-emerald-600">Ahad</span>
                </>
              ) : (
                <>
                  স্বাগতম, <span className="text-emerald-600">আহাদ</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === "en"
<<<<<<< HEAD
                ? "Here's what's happening with your projects and talent today."
                : "আজ আপনার প্রকল্প ও ট্যালেন্ট নিয়ে যা হচ্ছে তা এখানে।"}
=======
                ? "Manage your active job postings, evaluate freelancer proposals, and fund secure milestone escrows."
                : "আপনার পোস্টকৃত কাজ পরিচালনা করুন, ফ্রিল্যান্সারদের আবেদন যাচাই করুন এবং নিরাপদ এসক্রোতে তহবিল রাখুন।"}
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
<<<<<<< HEAD
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              {lang === "en" ? "বাংলা" : "English"}
=======
              onClick={() => {
                setDepositStep("FORM");
                setDepositModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "en" ? "Fund Escrow" : "এসক্রো জমা"}</span>
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
            </button>
            <Link
              href="/post-job"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5" />
<<<<<<< HEAD
              {lang === "en" ? "Post a Job" : "কাজ পোস্ট করুন"}
=======
              <span>{lang === "en" ? "Post a Job (Free)" : "কাজ পোস্ট করুন"}</span>
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
            </Link>
          </div>
        </div>

<<<<<<< HEAD
        {/* Stats */}
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
            label="Total spent"
            labelBn="মোট ব্যয়"
            value={formatBdt(totalSpent + escrowHeld)}
            delta="-12% vs last month"
            deltaUp={false}
            lang={lang}
            accent="amber"
          />
        </div>

        {/* Onboarding + Consultation */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <OnboardingChecklist tasks={CLIENT_ONBOARDING_TASKS} lang={lang} />
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {lang === "en" ? "Guided tour" : "গাইডেড ট্যুর"}
              </span>
            </div>

            <h3 className="text-base font-black leading-snug">
              {lang === "en"
                ? "Book a consultation with an expert"
                : "একজন বিশেষজ্ঞের সাথে পরামর্শ নিন"}
            </h3>
            <p className="text-[11px] text-emerald-50/90 mt-2 leading-relaxed">
              {lang === "en"
                ? "Review your project's budget, timeline, and scope one-on-one before you commit to hiring."
                : "নিয়োগ করার আগে আপনার প্রকল্পের বাজেট, সময়সীমা ও স্কোপ একসাথে পর্যালোচনা করুন।"}
            </p>

            <button
              onClick={() => setConsultants(!consultants)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-all cursor-pointer"
            >
              {lang === "en" ? "Browse consultations" : "পরামর্শ দেখুন"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Consultants */}
        {consultants && (
          <div className="animate-in fade-in duration-200">
            <SectionHeading
              title="Book a consultation"
              titleBn="পরামর্শ বুক করুন"
              subtitle="Review your project's goals with an expert, one-on-one"
              subtitleBn="একজন বিশেষজ্ঞের সাথে একে একে আপনার প্রকল্পের লক্ষ্য পর্যালোচনা করুন"
=======
        {/* Tab Quick Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "overview", label: "Overview", labelBn: "সংক্ষিপ্ত বিবরণ" },
            { id: "jobs", label: "My Job Posts", labelBn: "আমার কাজ" },
            { id: "proposals", label: "Proposals Received", labelBn: "প্রাপ্ত আবেদন" },
            { id: "contracts", label: "Contracts & Delivery", labelBn: "চুক্তি ও ডেলিভারি" },
            { id: "payments", label: "Escrow & Payments", labelBn: "এসক্রো ও পেমেন্ট" },
            { id: "disputes", label: "Dispute Center", labelBn: "বিরোধ নিষ্পত্তি" },
            { id: "saved", label: "Saved Talent", labelBn: "সংরক্ষিত ট্যালেন্ট" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {lang === "en" ? tab.label : tab.labelBn}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        {(activeTab === "overview" || activeTab === "payments") && (
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
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
              lang={lang}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {CONSULTANTS.map((c) => (
                <div
                  key={c.name}
<<<<<<< HEAD
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
=======
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700 shrink-0">
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.country}</p>
                    </div>
                  </div>

<<<<<<< HEAD
                  <div className="grid grid-cols-3 gap-1.5 text-center mb-3">
                    <div className="bg-slate-50 rounded-lg py-1.5">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Jobs</p>
                      <p className="text-xs font-black text-slate-900">{c.jobs}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg py-1.5">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Rate</p>
                      <p className="text-xs font-black text-slate-900">${c.rate}/hr</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg py-1.5">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Success</p>
                      <p className="text-xs font-black text-emerald-600">{c.success}%</p>
                    </div>
                  </div>

=======
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-1.5">{c.blurb}</p>
                  <p className="text-[10px] font-bold text-emerald-700 mb-3">{c.specialty}</p>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-black text-slate-900">
                      ${c.price}
                      <span className="font-semibold text-slate-400"> / 30 min</span>
                    </span>
                    <button className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer">
<<<<<<< HEAD
                      {lang === "en" ? "Book now" : "বুক করুন"}
=======
                      {lang === "en" ? "Book Session" : "বুক করুন"}
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job posts */}
<<<<<<< HEAD
        <div id="jobs">
          <SectionHeading
            title="Your job posts"
            titleBn="আপনার কাজের পোস্ট"
            subtitle="Drafts and live posts"
            subtitleBn="খসড়া ও প্রকাশিত পোস্ট"
            lang={lang}
            action={
              <Link
                href="/post-job"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {lang === "en" ? "New post" : "নতুন পোস্ট"}
              </Link>
            }
          />
          <DraftJobsTable drafts={CLIENT_DRAFT_JOBS} lang={lang} />
        </div>

        {/* Contracts */}
        <div id="contracts">
          <SectionHeading
            title="Active contracts"
            titleBn="সক্রিয় চুক্তি"
            subtitle="Milestone-funded work in progress"
            subtitleBn="মাইলস্টোনে জমা চলমান কাজ"
            lang={lang}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {CLIENT_CONTRACTS.map((c) => (
              <ContractCard key={c.id} contract={c} perspective="client" lang={lang} />
            ))}
          </div>
        </div>

        {/* Payments */}
        <div id="payments">
          <SectionHeading
            title="Recent payments"
            titleBn="সাম্প্রতিক পেমেন্ট"
            subtitle="Escrow funding, releases and refunds"
            subtitleBn="এসক্রো জমা, মুক্তি ও ফেরত"
            lang={lang}
          />
          <LedgerList
            entries={CLIENT_LEDGER}
            lang={lang}
            emptyLabel="No payments yet"
            emptyLabelBn="এখনো কোনো পেমেন্ট নেই"
          />
        </div>

        {/* Resources */}
        <div id="resources">
          <SectionHeading
            title="Help and resources"
            titleBn="সহায়তা ও রিসোর্স"
            subtitle="Guides for hiring, paying and staying safe"
            subtitleBn="নিয়োগ, পেমেন্ট ও নিরাপত্তার গাইড"
            lang={lang}
          />
          <ResourceGrid resources={CLIENT_RESOURCES} lang={lang} />
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[
            {
              icon: CheckCircle2,
              title: "Posting jobs is always free",
              titleBn: "কাজ পোস্ট করা সবসময় বিনামূল্যে",
              body: "You only pay a 7% service fee when you fund a contract.",
              bodyBn: "চুক্তি এসক্রোতে জমা দিলেই ৭% সার্ভিস ফি লাগে।",
            },
            {
              icon: Users,
              title: "Get proposals and hire",
              titleBn: "আবেদন পান ও নিয়োগ করুন",
              body: "Compare verified Bangladeshi talent side by side.",
              bodyBn: "যাচাইকৃত দেশীয় ট্যালেন্ট তুলনা করে দেখুন।",
            },
            {
              icon: Star,
              title: "Pay when work is done",
              titleBn: "কাজ শেষ হলে টাকা দিন",
              body: "Escrow releases only after you approve each milestone.",
              bodyBn: "মাইলস্টোন অনুমোদনের পরেই এসক্রো মুক্ত হয়।",
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
            { icon: FileText, label: "Proposals", labelBn: "আবেদন" },
            { icon: Clock, label: "Disputes", labelBn: "বিরোধ" },
            { icon: Wallet, label: "Billing methods", labelBn: "বিলিং পদ্ধতি" },
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
            <DraftJobsTable drafts={CLIENT_DRAFT_JOBS} lang={lang} />
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
                        <h4 className="text-sm font-bold text-slate-900">{prop.freelancerName}</h4>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ★ {prop.rating} ({prop.reviews})
                        </span>
                        {prop.isShortlisted && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            Shortlisted
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{prop.freelancerTitle}</p>
                      <p className="text-xs text-slate-600 line-clamp-2 max-w-xl italic">
                        "{prop.coverNote}"
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Applying for: <span className="font-semibold text-slate-600">{prop.jobTitle}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-base font-black text-slate-900">
                        ৳{prop.bidBdt.toLocaleString()} BDT
                      </div>
                      <div className="text-[10px] text-slate-400">Delivery in {prop.deliveryDays} days</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/contracts/ctr-8842"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Hire & Open Workspace</span>
                      </Link>
                    </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {CLIENT_CONTRACTS.map((c) => (
                <ContractCard key={c.id} contract={c} perspective="client" lang={lang} />
              ))}
            </div>
          </div>
        )}

        {/* Payments Section */}
        {(activeTab === "overview" || activeTab === "payments") && (
          <div id="payments" className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeading
                title="Recent payments & escrow ledger"
                titleBn="সাম্প্রতিক পেমেন্ট ও এসক্রো খতিয়ান"
                subtitle="Escrow deposits, milestones released and MFS transaction records"
                subtitleBn="এসক্রো জমা, মাইলস্টোন মুক্তি ও বিকাশ/নগদ লেনদেনের বিবরণী"
                lang={lang}
              />
              <button
                onClick={() => {
                  setDepositStep("FORM");
                  setDepositModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                + {lang === "en" ? "Deposit Escrow" : "এসক্রো জমা দিন"}
              </button>
            </div>
            <LedgerList
              entries={ledgerEntries}
              lang={lang}
              emptyLabel="No payments yet"
              emptyLabelBn="এখনো কোনো পেমেন্ট নেই"
            />
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
                      <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                      <p className="text-[11px] text-slate-500">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="text-emerald-600 font-bold">★ {t.rating}</span>
                        <span>• ৳{t.rateBdt}/hr</span>
                        <span>• {t.location}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/contracts/ctr-8842"
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors shrink-0"
                  >
                    Direct Hire
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {activeTab === "overview" && (
          <div id="resources" className="space-y-4">
            <SectionHeading
              title="Employer help and resources"
              titleBn="নিয়োগকর্তা সহায়তা ও রিসোর্স"
              subtitle="Guides for hiring, paying and staying safe"
              subtitleBn="নিয়োগ, পেমেন্ট ও নিরাপত্তার গাইড"
              lang={lang}
            />
            <ResourceGrid resources={CLIENT_RESOURCES} lang={lang} />
          </div>
        )}
      </div>

      {/* Escrow Deposit Modal */}
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
                    {lang === "en" ? "Fund MuktoKormo Escrow" : "মুক্তকর্ম এসক্রোতে ফান্ড জমা"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === "en" ? "Safe custody via MFS Merchant Gateway" : "বিকাশ ও নগদের মাধ্যমে সুরক্ষিত তহবিল"}
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
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDepositGateway("BKASH")}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        depositGateway === "BKASH"
                          ? "bg-pink-50 border-pink-500 text-pink-700 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mx-auto mb-1 text-pink-600" />
                      <span className="text-xs">bKash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositGateway("NAGAD")}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        depositGateway === "NAGAD"
                          ? "bg-orange-50 border-orange-500 text-orange-700 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                      <span className="text-xs">Nagad</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositGateway("CARD")}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        depositGateway === "CARD"
                          ? "bg-sky-50 border-sky-500 text-sky-700 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1 text-sky-600" />
                      <span className="text-xs">Cards / Bank</span>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === "en" ? "Escrow Amount (BDT)" : "এসক্রো পরিমাণ (টাকা)"}
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base font-black text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[10000, 20000, 42000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                      >
                        ৳{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl space-y-1 text-xs text-emerald-900">
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
                  Freelancer has been notified that the milestone is fully funded. It is now safe to begin work.
                </p>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 font-bold">
                  TrxID: {trxResult}
                </div>
                <button
                  onClick={() => setDepositModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close & View Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
    </DashboardShell>
  );
}
