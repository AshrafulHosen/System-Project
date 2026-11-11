"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Lock,
  Star,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  Users,
} from "lucide-react";

interface HeroSectionProps {
  lang: "en" | "bn";
  onOpenPostJob: () => void;
  onSelectSkill: (skill: string) => void;
  onSearchTalent?: (query: string) => void;
  onExploreJobs: () => void;
  liveStats?: {
    openJobsCount: number;
    freelancersCount: number;
  };
}

export default function HeroSection({
  lang,
  onOpenPostJob,
  onSelectSkill,
  onSearchTalent,
  onExploreJobs,
  liveStats,
}: HeroSectionProps) {
  const [searchInput, setSearchInput] = useState("");
  const [heroMode, setHeroMode] = useState<"hire" | "work">("hire");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (heroMode === "hire" && onSearchTalent) {
      onSearchTalent(trimmed);
      return;
    }
    if (trimmed) {
      onSelectSkill(trimmed);
    } else {
      onExploreJobs();
    }
  };

  const quickSkills = [
    { name: "Website Development", query: "Next.js" },
    { name: "UI/UX & Figma Design", query: "Figma" },
    { name: "Meta & TikTok Ads", query: "Meta Ads" },
    { name: "Video Editing", query: "Video Editing" },
    { name: "Bangla & English Content", query: "Content Writing" },
  ];

  const openJobsLabel =
    liveStats && liveStats.openJobsCount > 0
      ? `${liveStats.openJobsCount} Open`
      : lang === "en"
        ? "Live Feed"
        : "সক্রিয় কাজ";

  const verifiedTalentLabel =
    liveStats && liveStats.freelancersCount > 0
      ? `${liveStats.freelancersCount} Verified`
      : lang === "en"
        ? "NID Checked"
        : "এনআইডি যাচাইকৃত";

  return (
    <section className="bg-white pt-5 pb-14 lg:pt-7 lg:pb-18">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Strip */}
        <div className="mb-5">
          <div className="bg-emerald-50/75 border border-emerald-200/80 rounded-2xl px-4 sm:px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0">
                BDT ESCROW
              </span>
              <span className="text-xs sm:text-[13px] font-semibold text-slate-800">
                {lang === "en"
                  ? "Hire top Bangladeshi experts directly in Taka with 100% bKash & Nagad milestone protection"
                  : "বিকাশ ও নগদ নিরাপদ এসক্রোর মাধ্যমে সরাসরি দেশীয় মুদ্রায় সেরা ট্যালেন্ট নিয়োগ দিন"}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenPostJob}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 group shrink-0 cursor-pointer"
            >
              <span>{lang === "en" ? "Post a project in 2 minutes" : "২ মিনিটে কাজ পোস্ট করুন"}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Hero Stage Container */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/90 text-white overflow-hidden p-7 sm:p-11 lg:p-14 border border-slate-800 shadow-xl">
          {/* Subtle ambient radial glow */}
          <div className="absolute -top-24 -right-24 w-[480px] h-[480px] bg-emerald-500/12 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-24 left-1/4 w-[360px] h-[360px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left / Center Content */}
            <div className="lg:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-300 text-[11px] font-bold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {lang === "en"
                    ? "Bangladesh's Verified Freelance Marketplace"
                    : "বাংলাদেশের বিশ্বস্ত ফ্রিল্যান্সিং মার্কেটপ্লেস"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.1] text-white">
                {lang === "en" ? (
                  <>
                    You have the vision.
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                      Our freelancers take it from here.
                    </span>
                  </>
                ) : (
                  <>
                    আপনার স্বপ্ন ও লক্ষ্য।
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                      বাস্তবায়নে দেশের শীর্ষ ফ্রিল্যান্সাররা।
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed font-normal">
                {lang === "en"
                  ? "Scale your business with NID-verified developers, designers, and marketers across Bangladesh. Guaranteed milestone escrow in BDT with a transparent flat 7% platform fee."
                  : "ডলার কনভার্সন ফি ছাড়া সরাসরি দেশীয় মুদ্রায় এনআইডি ভেরিফাইড ফ্রিল্যান্সারদের দিয়ে কাজ করান। সম্পূর্ণ কাজ বুঝে পাওয়ার পর টাকা রিলিজ করুন।"}
              </p>

              {/* Dual Mode Switcher */}
              <div className="inline-flex items-center bg-slate-800/85 p-1 rounded-full border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setHeroMode("hire")}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    heroMode === "hire"
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "I want to hire" : "আমি নিয়োগ দিতে চাই"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroMode("work")}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    heroMode === "work"
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "I want to work" : "আমি কাজ করতে চাই"}</span>
                </button>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="max-w-2xl">
                <div className="relative flex items-center bg-white rounded-2xl sm:rounded-full p-1.5 shadow-xl border border-white/20 focus-within:ring-2 focus-within:ring-emerald-400 transition-all">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 ml-3.5 shrink-0" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={
                      heroMode === "hire"
                        ? lang === "en"
                          ? "Search verified talent by skill (e.g. Next.js, Figma, SEO)..."
                          : "কী ধরনের কাজের লোক প্রয়োজন লিখে খুঁজুন..."
                        : lang === "en"
                          ? "Search open jobs matching your skill (e.g. React, Logo, Video)..."
                          : "আপনার স্কিল লিখে চলমান কাজ খুঁজুন..."
                    }
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    className="px-5 sm:px-6 py-2.5 rounded-xl sm:rounded-full bg-slate-950 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm transition-colors shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{lang === "en" ? "Search" : "খুঁজুন"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Quick Skill Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-xs font-semibold text-slate-400 mr-1">
                  {lang === "en" ? "Popular:" : "জনপ্রিয়:"}
                </span>
                {quickSkills.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      if (heroMode === "hire" && onSearchTalent) {
                        onSearchTalent(item.query);
                      } else {
                        onSelectSkill(item.query);
                      }
                    }}
                    className="group inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 text-xs transition-all cursor-pointer font-medium"
                  >
                    <span>{item.name}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Trust & Live Platform Snapshot */}
            <div className="lg:col-span-4 flex flex-col gap-3.5">
              {/* Escrow Protection Card */}
              <Link
                href="/escrow"
                className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 shadow-lg flex items-center gap-3.5 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      100% Escrow Protected
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white block mt-1 group-hover:text-emerald-300 transition-colors">
                    {lang === "en" ? "bKash, Nagad & Bank Custody" : "বিকাশ, নগদ ও ব্যাংক এসক্রো"}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {lang === "en" ? "Funds released only on approval →" : "কাজ অনুমোদনেই পেমেন্ট ছাড় →"}
                  </span>
                </div>
              </Link>

              {/* Workspace Delivery Card */}
              <Link
                href="/workspaces"
                className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 shadow-lg space-y-2.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                    Contract Workspaces
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>Milestone Tracked</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === "en"
                    ? "Submit live demo URLs, review deliverables, request revisions, and chat 1-to-1 in real time."
                    : "লাইভ ডেমো লিংক জমা দিন, রিভিশন রিভিউ করুন এবং ১-টু-১ চ্যাটে যুক্ত থাকুন।"}
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{lang === "en" ? "Porichoy NID Verified" : "এনআইডি যাচাইকৃত"}</span>
                  </span>
                  <span className="font-bold text-slate-300 group-hover:text-emerald-300 transition-colors">
                    {lang === "en" ? "How it works →" : "বিস্তারিত →"}
                  </span>
                </div>
              </Link>

              {/* Genuine Platform Metrics */}
              <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-sm sm:text-base font-black text-white block">
                    {openJobsLabel}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {lang === "en" ? "Projects" : "প্রজেক্ট"}
                  </span>
                </div>
                <div className="border-x border-slate-800">
                  <span className="text-sm sm:text-base font-black text-emerald-400 block">
                    {verifiedTalentLabel}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {lang === "en" ? "Talent" : "ট্যালেন্ট"}
                  </span>
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black text-white block">
                    7% Flat
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {lang === "en" ? "Fee Only" : "প্ল্যাটফর্ম ফি"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
