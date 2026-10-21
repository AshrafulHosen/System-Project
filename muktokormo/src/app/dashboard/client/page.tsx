"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Send,
  Handshake,
  Wallet,
  Video,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Lock,
  Smartphone,
  CreditCard,
  X,
  RefreshCw,
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
  CLIENT_CONTRACTS,
  CLIENT_LEDGER,
  CLIENT_RESOURCES,
} from "@/data/dashboardData";
import { formatBdt } from "@/lib/format";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import { fetchClientProjects } from "@/lib/data/jobs";
import {
  fetchClientProposals,
  type ClientProposal,
} from "@/lib/data/proposals";
import { fetchSavedTalent } from "@/lib/data/freelancers";
import { WalletEntry, DraftJob, Freelancer } from "@/types";

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

function ClientDashboardContent() {  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const deniedFrom = searchParams ? searchParams.get("denied") : null;
  const { name, email, role, clientId, companyName, avatarUrl, loading: userLoading } = useCurrentUser();
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [consultants, setConsultants] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState<WalletEntry[]>(CLIENT_LEDGER);
  const [draftJobs, setDraftJobs] = useState<DraftJob[]>([]);
  const [proposals, setProposals] = useState<ClientProposal[]>([]);
  const [savedTalent, setSavedTalent] = useState<Freelancer[]>([]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    (async () => {
      const [projects, received, saved] = await Promise.all([
        fetchClientProjects(supabase, clientId),
        fetchClientProposals(supabase, clientId),
        fetchSavedTalent(supabase, clientId),
      ]);
      if (cancelled) return;
      setDraftJobs(projects);
      setProposals(received);
      setSavedTalent(saved);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, clientId]);

  useEffect(() => {
    if (!userLoading) {
      if (!email) {
        router.replace("/login?next=/dashboard/client");
      } else if (role === "freelancer") {
        router.replace("/dashboard/freelancer?denied=client");
      } else if (role === "admin") {
        router.replace("/dashboard/admin");
      }
    }
  }, [userLoading, role, email, router]);

  const displayName = name.trim() || (lang === "en" ? "Employer" : "নিয়োগদাতা");
  const firstName = displayName.split(" ")[0];
  const displayAvatar = avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  // Escrow Deposit Modal
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(20000);
  const [depositGateway, setDepositGateway] = useState<"BKASH" | "NAGAD" | "CARD">("BKASH");
  const [depositStep, setDepositStep] = useState<"FORM" | "PROCESSING" | "SUCCESS">("FORM");
  const [trxResult, setTrxResult] = useState<string>("");

  const activeContracts = CLIENT_CONTRACTS.filter((c) => c.stage === "ACTIVE");
  const escrowHeld = CLIENT_CONTRACTS.reduce((sum, c) => sum + c.escrowHeldBdt, 0);
  const totalSpent = CLIENT_CONTRACTS.reduce((sum, c) => sum + c.releasedBdt, 0);
  const totalProposals = proposals.length;
  const activeJobPosts = draftJobs.filter((d) => d.status === "LIVE").length;

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

  return (
    <DashboardShell
      role="client"
      nav={CLIENT_NAV}
      userName={displayName}
      userMeta={email}
      avatar={displayAvatar}
      walletBdt={escrowHeld}
      walletLabel={lang === "en" ? "in escrow safe" : "এসক্রোতে সুরক্ষিত"}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      lang={lang}
      onToggleLang={() => setLang((prev) => (prev === "en" ? "bn" : "en"))}
      action={{
        label: "Post a Job",
        labelBn: "কাজ পোস্ট করুন",
        href: "/post-job",
      }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {deniedFrom === "freelancer" && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-black">!</span>
              <span>
                {lang === "en"
                  ? "Access Restricted: You are signed in as an Employer / Client. Only Freelancers can access the Freelancer command center."
                  : "অ্যাক্সেস সংরক্ষিত: আপনি নিয়োগদাতা হিসেবে লগইন করেছেন। শুধুমাত্র ফ্রিল্যান্সাররাই ফ্রিল্যান্সার ড্যাশবোর্ডে প্রবেশ করতে পারেন।"}
              </span>
            </div>
            <button onClick={() => router.replace("/dashboard/client")} className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
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
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              {email || (lang === "en" ? "Employer Account" : "নিয়োগদাতা অ্যাকাউন্ট")}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === "en"
                ? "Manage your active job postings, evaluate freelancer proposals, and fund secure milestone escrows."
                : "আপনার পোস্টকৃত কাজ পরিচালনা করুন, ফ্রিল্যান্সারদের আবেদন যাচাই করুন এবং নিরাপদ এসক্রোতে তহবিল রাখুন।"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDepositStep("FORM");
                setDepositModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "en" ? "Fund Escrow" : "এসক্রো জমা"}</span>
            </button>
            <Link
              href="/post-job"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "Post a Job (Free)" : "কাজ পোস্ট করুন"}</span>
            </Link>
          </div>
        </div>

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
              value={String(activeJobPosts)}
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
            {draftJobs.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">
                  {lang === "en" ? "No job posts yet." : "এখনো কোনো কাজ পোস্ট নেই।"}
                </p>
                <Link
                  href="/post-job"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {lang === "en" ? "Post your first job" : "প্রথম কাজ পোস্ট করুন"}
                </Link>
              </div>
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
            <div className="grid grid-cols-1 gap-3.5">
              {proposals.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
                  <Send className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500">
                    {lang === "en"
                      ? "No proposals received yet. Post a job to start receiving bids!"
                      : "এখনো কোনো আবেদন নেই। কাজ পোস্ট করলে বিড পাবেন!"}
                  </p>
                </div>
              ) : proposals.map((prop) => (
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
                        &ldquo;{prop.coverNote}&rdquo;
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
                        href={`/jobs/${prop.id}`}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>View Proposals</span>
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
              {savedTalent.map((t) => (
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
                        <span>• ৳{t.hourlyRateBdt}/hr</span>
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
    </DashboardShell>
  );
}


export default function ClientDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-96 bg-white border border-slate-200/90 rounded-3xl shadow-xl animate-pulse" />
        </div>
      }
    >
      <ClientDashboardContent />
    </Suspense>
  );
}
