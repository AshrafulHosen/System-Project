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

export default function FreelancerDashboardPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [pickedSkills, setPickedSkills] = useState<string[]>([]);

  const earned = FREELANCER_CONTRACTS.reduce((s, c) => s + c.releasedBdt, 0);
  const inEscrow = FREELANCER_CONTRACTS.reduce((s, c) => s + c.escrowHeldBdt, 0);
  const available = 87500;
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

  return (
    <DashboardShell
      role="freelancer"
      nav={FREELANCER_NAV}
      userName="Arifur Rahman"
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
            </Link>
          </div>
        </div>

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
              lang={lang}
              action={
                <Link
                  href="/#jobs-section"
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
              </div>
            )}
          </div>
        </div>

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
    </DashboardShell>
  );
}
