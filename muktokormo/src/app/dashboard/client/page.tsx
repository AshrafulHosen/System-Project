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
  },
];

export default function ClientDashboardPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [consultants, setConsultants] = useState(true);

  const activeContracts = CLIENT_CONTRACTS.filter((c) => c.stage === "ACTIVE");
  const escrowHeld = CLIENT_CONTRACTS.reduce((sum, c) => sum + c.escrowHeldBdt, 0);
  const totalSpent = CLIENT_CONTRACTS.reduce((sum, c) => sum + c.releasedBdt, 0);
  const totalProposals = CLIENT_DRAFT_JOBS.reduce((sum, d) => sum + d.proposalCount, 0) + 3;

  return (
    <DashboardShell
      role="client"
      nav={CLIENT_NAV}
      userName="Ahad A"
      userMeta={lang === "en" ? "Client" : "ক্লায়েন্ট"}
      avatar="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&auto=format&fit=crop&q=80"
      walletBdt={escrowHeld}
      walletLabel={lang === "en" ? "in escrow" : "এসক্রোতে"}
      action={{
        label: "Post a Job",
        labelBn: "কাজ পোস্ট করুন",
        href: "/post-job",
      }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <div id="overview" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
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
                ? "Here's what's happening with your projects and talent today."
                : "আজ আপনার প্রকল্প ও ট্যালেন্ট নিয়ে যা হচ্ছে তা এখানে।"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              {lang === "en" ? "বাংলা" : "English"}
            </button>
            <Link
              href="/post-job"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5" />
              {lang === "en" ? "Post a Job" : "কাজ পোস্ট করুন"}
            </Link>
          </div>
        </div>

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
              lang={lang}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {CONSULTANTS.map((c) => (
                <div
                  key={c.name}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600 shrink-0">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.country}</p>
                    </div>
                  </div>

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

                  <p className="text-[11px] text-slate-500 leading-relaxed mb-1.5">{c.blurb}</p>
                  <p className="text-[10px] font-bold text-emerald-700 mb-3">{c.specialty}</p>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-black text-slate-900">
                      ${c.price}
                      <span className="font-semibold text-slate-400"> / 30 min</span>
                    </span>
                    <button className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer">
                      {lang === "en" ? "Book now" : "বুক করুন"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job posts */}
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
    </DashboardShell>
  );
}
