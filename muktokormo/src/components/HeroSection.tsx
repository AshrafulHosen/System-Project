"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  Users,
  Layers,
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
    { name: "Next.js & React", query: "Next.js" },
    { name: "UI/UX & Figma", query: "Figma" },
    { name: "Meta Ads & SEO", query: "Meta Ads" },
    { name: "Video Editing", query: "Video Editing" },
    { name: "Bangla Copywriting", query: "Content Writing" },
  ];

  const openJobsDisplay =
    liveStats && liveStats.openJobsCount > 0
      ? `${liveStats.openJobsCount}`
      : lang === "en"
      ? "Live"
      : "সক্রিয়";

  const verifiedTalentDisplay =
    liveStats && liveStats.freelancersCount > 0
      ? `${liveStats.freelancersCount}`
      : lang === "en"
      ? "NID"
      : "যাচাইকৃত";

  return (
    <section className="relative bg-[#0B3B2E] text-[#FAF9F6] pt-6 pb-16 lg:pt-10 lg:pb-24 overflow-hidden">
      {/* Velvety emerald radial spotlight backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,224,184,0.18),transparent)] pointer-events-none" />
      <div className="absolute -bottom-24 right-0 w-[640px] h-[520px] bg-[radial-gradient(circle_at_70%_45%,rgba(15,110,80,0.28),transparent_65%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Bar */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/8 border border-white/12 rounded-2xl px-4 sm:px-5 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="bg-[#7CE0B8]/15 border border-[#7CE0B8]/30 text-[#7CE0B8] text-[10px] font-bold uppercase tracking-[0.09em] px-2.5 py-1 rounded-md shrink-0">
              BDT ESCROW
            </span>
            <span className="text-xs sm:text-[13px] font-medium text-white/80 truncate">
              {lang === "en"
                ? "Direct Bangladeshi Taka contracts with bKash, Nagad & SSLCOMMERZ milestone protection."
                : "বিকাশ, নগদ ও এসএসএলকমার্জ এসক্রোর মাধ্যমে সরাসরি দেশীয় মুদ্রায় সেরা ট্যালেন্ট নিয়োগ দিন।"}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenPostJob}
            className="text-xs font-semibold text-[#7CE0B8] hover:text-white inline-flex items-center gap-1 group shrink-0 cursor-pointer transition-colors"
          >
            <span>
              {lang === "en" ? "Post a brief in 2 minutes" : "২ মিনিটে কাজ পোস্ট করুন"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Main Editorial Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Typography, Search & Action */}
          <div className="lg:col-span-7 space-y-6 mk-fade-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#7CE0B8] text-[11px] font-semibold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7CE0B8]" />
              <span>
                {lang === "en"
                  ? "Porichoy NID Verified Marketplace • Built for Bangladesh"
                  : "পরিচয় এনআইডি যাচাইকৃত মার্কেটপ্লেস • বাংলাদেশ"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-[-0.03em] leading-[1.08] text-white">
              {lang === "en" ? (
                <>
                  <span className="block">You have the vision.</span>
                  <span className="block font-serif italic font-normal text-[#7CE0B8]">
                    Our freelancers take it from here.
                  </span>
                </>
              ) : (
                <>
                  <span className="block">আপনার আছে স্বপ্ন ও লক্ষ্য।</span>
                  <span className="block text-[#7CE0B8]">
                    বাকিটা সামলে নেবে আমাদের ফ্রিল্যান্সাররা।
                  </span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-white/75 max-w-xl leading-relaxed">
              {lang === "en"
                ? "Hire NID-verified software engineers, product designers, and growth specialists across Bangladesh — with structured contract workspaces and zero foreign exchange loss."
                : "ডলার কনভার্সন ফি ছাড়াই সরাসরি টাকায় এনআইডি-যাচাইকৃত ডেভেলপার, ডিজাইনার ও ডিজিটাল মার্কেটার নিয়োগ দিন।"}
            </p>

            {/* Dual Mode Switcher */}
            <div className="inline-flex items-center bg-white/8 p-1 rounded-xl border border-white/12">
              <button
                type="button"
                onClick={() => setHeroMode("hire")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  heroMode === "hire"
                    ? "bg-[#0F6E50] text-white border border-[#7CE0B8]/30 shadow-sm"
                    : "text-white/75 hover:text-white border border-transparent"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#7CE0B8]" />
                <span>{lang === "en" ? "I want to hire" : "আমি নিয়োগ দিতে চাই"}</span>
              </button>
              <button
                type="button"
                onClick={() => setHeroMode("work")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  heroMode === "work"
                    ? "bg-[#0F6E50] text-white border border-[#7CE0B8]/30 shadow-sm"
                    : "text-white/75 hover:text-white border border-transparent"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-[#7CE0B8]" />
                <span>{lang === "en" ? "I want to work" : "আমি কাজ করতে চাই"}</span>
              </button>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-xl">
              <div className="flex items-center bg-white/10 rounded-2xl p-1.5 border border-white/18 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.28)] focus-within:border-[#7CE0B8]/70 focus-within:ring-3 focus-within:ring-[#7CE0B8]/15 transition-all">
                <Search className="w-4 h-4 text-[#7CE0B8] ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={
                    heroMode === "hire"
                      ? lang === "en"
                        ? "Search verified talent (e.g. Next.js, Figma, SEO)..."
                        : "কী ধরনের কাজের লোক প্রয়োজন লিখুন..."
                      : lang === "en"
                      ? "Search open BDT projects (e.g. React, Logo, Ads)..."
                      : "আপনার স্কিল লিখে চলমান কাজ খুঁজুন..."
                  }
                  className="w-full px-3 py-2.5 text-xs sm:text-sm text-white placeholder-white/55 focus:outline-none bg-transparent"
                />
                <button
                  type="submit"
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#0F6E50] hover:bg-[#0B5940] text-white font-semibold text-xs sm:text-sm border border-white/10 transition-colors shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>{lang === "en" ? "Search" : "খুঁজুন"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Quick Skill Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/60 mr-1">
                {lang === "en" ? "In demand:" : "জনপ্রিয়:"}
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
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/8 hover:bg-white/15 text-white/85 hover:text-[#7CE0B8] border border-white/12 hover:border-[#7CE0B8]/35 text-xs font-medium transition-colors cursor-pointer"
                >
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* Dual CTA Links */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenPostJob}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0F6E50] hover:bg-[#0B5940] text-white text-xs sm:text-sm font-semibold shadow-lg border border-white/10 transition-all cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>{lang === "en" ? "Post a Project Free" : "ফ্রি কাজ পোস্ট করুন"}</span>
              </button>
              <button
                type="button"
                onClick={onExploreJobs}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                <span>{lang === "en" ? "Browse Live Jobs" : "সক্রিয় কাজ দেখুন"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#7CE0B8]" />
              </button>
            </div>
          </div>

          {/* Right Column: Fintech Financial Workspace Preview Card */}
          <div className="lg:col-span-5 mk-fade-up">
            <div className="rounded-2xl bg-white text-[#111315] border border-[rgba(17,19,21,0.08)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35)] p-6 sm:p-7 space-y-5 relative overflow-hidden">
              <div className="absolute -right-14 -top-14 w-48 h-48 rounded-full bg-[#EAF5F0] opacity-75 blur-2xl pointer-events-none" />

              {/* Ledger Header */}
              <div className="flex items-center justify-between border-b border-[rgba(17,19,21,0.08)] pb-4 relative z-10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0F6E50] block">
                    {lang === "en" ? "Escrow Custody Ledger" : "এসক্রো কাস্টডি লেজার"}
                  </span>
                  <p className="font-mono text-xs text-[#686E78] mt-0.5">
                    MK-CTR-2026 • SSLCOMMERZ MFS
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF5F0] border border-[#C3E3D5] text-[#0B3B2E] text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E50] animate-pulse" />
                  PROTECTED
                </span>
              </div>

              {/* Milestone Pipeline Preview */}
              <div className="space-y-3 relative z-10">
                <Link
                  href="/escrow"
                  className="block p-3.5 rounded-xl bg-[#FAF9F6] hover:bg-[#EAF5F0]/65 border border-[rgba(17,19,21,0.08)] hover:border-[#C3E3D5] transition-colors group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#EAF5F0] border border-[#C3E3D5] flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-[#0F6E50]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#111315] group-hover:text-[#0F6E50] transition-colors truncate">
                          {lang === "en"
                            ? "bKash, Nagad & Card Vault"
                            : "বিকাশ, নগদ ও ব্যাংক কার্ড ভল্ট"}
                        </p>
                        <p className="text-[11px] text-[#686E78] truncate">
                          {lang === "en"
                            ? "Funds held safely until deliverable approval"
                            : "কাজ অনুমোদনের আগ পর্যন্ত সুরক্ষিত"}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#686E78] group-hover:text-[#0F6E50] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </Link>

                <Link
                  href="/workspaces"
                  className="block p-3.5 rounded-xl bg-[#FAF9F6] hover:bg-[#EAF5F0]/65 border border-[rgba(17,19,21,0.08)] hover:border-[#C3E3D5] transition-colors group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#FBF5EA] border border-[#EADAB8] flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4 text-[#A87224]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#111315] group-hover:text-[#0F6E50] transition-colors truncate">
                          {lang === "en"
                            ? "Milestone Delivery Workspaces"
                            : "মাইলস্টোন ডেলিভারি ওয়ার্কস্পেস"}
                        </p>
                        <p className="text-[11px] text-[#686E78] truncate">
                          {lang === "en"
                            ? "Live demo inspection, revisions & 1-to-1 chat"
                            : "লাইভ ডেমো যাচাই, রিভিশন ও ১-টু-১ চ্যাট"}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#686E78] group-hover:text-[#0F6E50] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </Link>
              </div>

              {/* Live Marketplace Snapshot Counters */}
              <div className="pt-3 border-t border-[rgba(17,19,21,0.08)] grid grid-cols-3 gap-3 relative z-10">
                <div className="p-2.5 rounded-xl bg-[#F4F2EC] border border-[rgba(17,19,21,0.07)]">
                  <span className="font-mono text-base sm:text-lg font-bold text-[#111315] block mk-tabular">
                    {openJobsDisplay}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#686E78] font-semibold">
                    {lang === "en" ? "Open Jobs" : "সক্রিয় কাজ"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F4F2EC] border border-[rgba(17,19,21,0.07)]">
                  <span className="font-mono text-base sm:text-lg font-bold text-[#0F6E50] block mk-tabular">
                    {verifiedTalentDisplay}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#686E78] font-semibold">
                    {lang === "en" ? "Verified Pro" : "ভেরিফাইড"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F4F2EC] border border-[rgba(17,19,21,0.07)]">
                  <span className="font-mono text-base sm:text-lg font-bold text-[#A87224] block mk-tabular">
                    0% FX
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#686E78] font-semibold">
                    {lang === "en" ? "BDT Direct" : "সরাসরি টাকা"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#3E434A] pt-1 relative z-10">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6E50]" />
                  <span>
                    {lang === "en" ? "Porichoy NID Verification" : "পরিচয় এনআইডি যাচাইকৃত"}
                  </span>
                </span>
                <Link
                  href="/escrow"
                  className="font-semibold text-[#0F6E50] hover:text-[#0B3B2E] hover:underline"
                >
                  {lang === "en" ? "Fee Calculator →" : "ফি ক্যালকুলেটর →"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
