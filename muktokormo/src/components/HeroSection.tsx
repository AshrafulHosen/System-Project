"use client";

import React, { useState } from "react";
import {
  Search,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Users,
  ShieldCheck,
} from "lucide-react";
import HeroFlowStudio from "@/components/home/HeroFlowStudio";

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
  const [heroMode, setHeroMode] = useState<"hire" | "work">("work");
  const en = lang === "en";

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

  const hasOpenJobs = !!liveStats && liveStats.openJobsCount > 0;
  const hasFreelancers = !!liveStats && liveStats.freelancersCount > 0;

  return (
    <section className="relative bg-canvas overflow-hidden">
      {/* Quiet structural grid, faded towards the bottom */}
      <div
        aria-hidden="true"
        className="absolute inset-0 mk-grid-lines [mask-image:linear-gradient(to_bottom,black,transparent_85%)] pointer-events-none"
      />

      <div className="relative mk-container pt-10 pb-14 sm:pt-14 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-stretch">
          {/* ---------- Left: editorial copy + search ---------- */}
          <div className="lg:col-span-6 flex flex-col justify-center py-2 lg:py-8">
            <div className="mk-fade-up inline-flex self-start items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white border border-line text-[12px] font-medium text-ink-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-soft text-brand-strong text-[11px] font-semibold">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                {en ? "Escrow-protected" : "এসক্রো-সুরক্ষিত"}
              </span>
              <span>
                {en
                  ? "Bangladesh's NID-verified freelance marketplace"
                  : "বাংলাদেশের এনআইডি-যাচাইকৃত ফ্রিল্যান্স মার্কেটপ্লেস"}
              </span>
            </div>

            <h1 className="mk-display mk-fade-up mk-delay-1 mt-6 text-ink max-w-[13ch]">
              {en ? (
                <>
                  Your next great project{" "}
                  <span className="text-brand">starts here.</span>
                </>
              ) : (
                <>
                  আপনার পরবর্তী সেরা প্রজেক্ট{" "}
                  <span className="text-brand">এখান থেকেই শুরু।</span>
                </>
              )}
            </h1>

            <p className="mk-fade-up mk-delay-2 mt-5 text-base sm:text-lg text-ink-3 leading-relaxed max-w-xl">
              {en
                ? "Connect with talented professionals, discover meaningful opportunities, and get paid in Taka — with every milestone held safely in escrow."
                : "দক্ষ পেশাজীবীদের সাথে যুক্ত হোন, অর্থবহ কাজ খুঁজে নিন, আর প্রতিটি মাইলস্টোন এসক্রোতে সুরক্ষিত রেখে সরাসরি টাকায় পেমেন্ট নিন।"}
            </p>

            {/* Search studio */}
            <div className="mk-fade-up mk-delay-3 mt-8 max-w-xl">
              <div
                role="tablist"
                aria-label={en ? "Search mode" : "খোঁজার ধরন"}
                className="inline-flex items-center gap-1 mb-2.5"
              >
                {(
                  [
                    { id: "work", icon: Briefcase, label: en ? "Find work" : "কাজ খুঁজুন" },
                    { id: "hire", icon: Users, label: en ? "Hire talent" : "ট্যালেন্ট নিয়োগ" },
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  const active = heroMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setHeroMode(m.id)}
                      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                        active
                          ? "bg-ink text-white"
                          : "text-ink-3 hover:text-ink hover:bg-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSearchSubmit} role="search">
                <label htmlFor="hero-search" className="sr-only">
                  {heroMode === "hire"
                    ? en ? "Search verified talent" : "ট্যালেন্ট খুঁজুন"
                    : en ? "Search open projects" : "কাজ খুঁজুন"}
                </label>
                <div className="flex items-center bg-white rounded-xl p-1.5 border border-line-strong shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(24,60,98,0.18)] focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/12 transition-all">
                  <Search className="w-4.5 h-4.5 text-ink-4 ml-3 shrink-0" aria-hidden="true" />
                  <input
                    id="hero-search"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={
                      heroMode === "hire"
                        ? en
                          ? "Try “Next.js”, “Figma” or “SEO”"
                          : "কী ধরনের কাজের লোক প্রয়োজন লিখুন..."
                        : en
                        ? "Search open projects by skill"
                        : "আপনার স্কিল লিখে চলমান কাজ খুঁজুন..."
                    }
                    className="w-full min-w-0 px-3 h-11 text-[15px] text-ink placeholder:text-ink-4 focus:outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    className="h-11 px-4 sm:px-5 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium text-sm transition-colors shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{en ? "Search" : "খুঁজুন"}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                <span className="mk-eyebrow text-ink-4 mr-1.5">
                  {en ? "Popular" : "জনপ্রিয়"}
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
                    className="h-7 px-2.5 rounded-md bg-white hover:bg-ink hover:text-white text-ink-2 border border-line hover:border-ink text-[12px] font-medium transition-colors cursor-pointer"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary actions */}
            <div className="mk-fade-up mk-delay-4 mt-9 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={onExploreJobs}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-ink hover:bg-ink-hover text-white text-[15px] font-medium transition-colors cursor-pointer"
              >
                {en ? "Find your next project" : "পরবর্তী প্রজেক্ট খুঁজুন"}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => (onSearchTalent ? onSearchTalent("") : onOpenPostJob())}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-white hover:bg-subtle text-ink border border-line-strong text-[15px] font-medium transition-colors cursor-pointer"
              >
                {en ? "Hire top talent" : "সেরা ট্যালেন্ট নিয়োগ দিন"}
              </button>
              <button
                type="button"
                onClick={onOpenPostJob}
                className="inline-flex items-center justify-center gap-1 h-12 px-2 text-sm font-medium text-brand hover:text-brand-hover cursor-pointer group"
              >
                {en ? "or post a project free" : "অথবা ফ্রি কাজ পোস্ট করুন"}
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </button>
            </div>

            {/* Live counters — only rendered from real data */}
            {(hasOpenJobs || hasFreelancers) && (
              <dl className="mt-10 pt-6 border-t border-line flex flex-wrap gap-x-10 gap-y-4">
                {hasOpenJobs && (
                  <div>
                    <dt className="mk-eyebrow text-ink-4">{en ? "Open projects" : "সক্রিয় কাজ"}</dt>
                    <dd className="mt-1 text-2xl font-semibold text-ink mk-tabular tracking-[-0.03em]">
                      {liveStats!.openJobsCount}
                    </dd>
                  </div>
                )}
                {hasFreelancers && (
                  <div>
                    <dt className="mk-eyebrow text-ink-4">{en ? "Verified freelancers" : "যাচাইকৃত ফ্রিল্যান্সার"}</dt>
                    <dd className="mt-1 text-2xl font-semibold text-ink mk-tabular tracking-[-0.03em]">
                      {liveStats!.freelancersCount}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="mk-eyebrow text-ink-4">{en ? "Currency" : "মুদ্রা"}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-ink tracking-[-0.03em]">
                    BDT ৳
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {/* ---------- Right: navy product studio ---------- */}
          <div className="lg:col-span-6 mk-fade-up mk-delay-2">
            <HeroFlowStudio en={en} />
          </div>
        </div>
      </div>
    </section>
  );
}
