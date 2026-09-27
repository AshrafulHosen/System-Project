"use client";

import React, { useState } from "react";
import { 
  Search, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Star, 
  CheckCircle2 
} from "lucide-react";

interface HeroSectionProps {
  lang: "en" | "bn";
  onOpenPostJob: () => void;
  onSelectSkill: (skill: string) => void;
  onExploreJobs: () => void;
}

export default function HeroSection({
  lang,
  onOpenPostJob,
  onSelectSkill,
  onExploreJobs,
}: HeroSectionProps) {
  const [searchInput, setSearchInput] = useState("");
  const [heroMode, setHeroMode] = useState<"hire" | "work">("hire");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectSkill(searchInput.trim());
    } else {
      onExploreJobs();
    }
  };

  const fiverrSkills = [
    { name: "Website Development", query: "Next.js" },
    { name: "UI/UX & Figma Design", query: "Figma" },
    { name: "Meta & TikTok Ads", query: "Meta Ads" },
    { name: "Video Editing", query: "Video Editing" },
    { name: "Bangla & English Content", query: "Content Writing" },
  ];

  return (
    <section className="bg-white pt-6 pb-16 lg:pt-8 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* UPWORK-STYLE TOP BANNER                                                  */}
        {/* ========================================================================= */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/60 border border-emerald-200/80 rounded-2xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                NEW
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {lang === "en"
                  ? "Hire top Bangladeshi experts directly in BDT with 100% bKash & Nagad Escrow"
                  : "বিকাশ ও নগদ নিরাপদ এসক্রোর মাধ্যমে সরাসরি দেশীয় মুদ্রায় সেরা ট্যালেন্ট নিয়োগ দিন"}
              </span>
            </div>

            <button
              onClick={onOpenPostJob}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group shrink-0 cursor-pointer"
            >
              <span>{lang === "en" ? "Post a project in 2 minutes" : "২ মিনিটে কাজ পোস্ট করুন"}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO STAGE CONTAINER (Upwork + Fiverr Cinematic Fusion)                   */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/90 text-white overflow-hidden p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl">
          
          {/* Subtle ambient lighting blobs */}
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Background subtle watermark / pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.08)_0%,transparent_60%)] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            {/* LEFT / CENTER CONTENT: Iconic Headline & Search */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Main Headline (Fiverr + Upwork Caliber) */}
              <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black tracking-tight leading-[1.08] text-white">
                {lang === "en" ? (
                  <>
                    You have the vision.<br />
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                      Our freelancers take it from here.
                    </span>
                  </>
                ) : (
                  <>
                    আপনার স্বপ্ন ও লক্ষ্য।<br />
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                      বাস্তবায়নে দেশের শীর্ষ ফ্রিল্যান্সাররা।
                    </span>
                  </>
                )}
              </h1>

              {/* Supporting Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
                {lang === "en"
                  ? "Scale your business with NID-verified developers, designers, and marketers across Bangladesh. Guaranteed milestone escrow in Taka with flat 7% fee."
                  : "ডলার কনভার্সন ফি ছাড়া সরাসরি দেশীয় মুদ্রায় এনআইডি ভেরিফাইড ফ্রিল্যান্সারদের দিয়ে কাজ করান। সম্পূর্ণ কাজ বুঝে পাওয়ার পর টাকা রিলিজ করুন।"}
              </p>

              {/* Upwork-style Mode Pill Switcher */}
              <div className="inline-flex items-center bg-slate-800/80 p-1 rounded-full border border-slate-700/80 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setHeroMode("hire")}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    heroMode === "hire"
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {lang === "en" ? "I want to hire" : "আমি নিয়োগ দিতে চাই"}
                </button>
                <button
                  type="button"
                  onClick={() => setHeroMode("work")}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    heroMode === "work"
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {lang === "en" ? "I want to work" : "আমি কাজ করতে চাই"}
                </button>
              </div>

              {/* Massive Hero Search Bar (Upwork + Fiverr Fusion) */}
              <form onSubmit={handleSearchSubmit} className="max-w-2xl">
                <div className="relative flex items-center bg-white rounded-full p-2 shadow-2xl border-2 border-white/20 focus-within:border-emerald-400 transition-all">
                  <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={
                      heroMode === "hire"
                        ? (lang === "en" ? "Describe what you need to hire for (e.g. Next.js, Figma, SEO)..." : "কী ধরনের কাজের লোক প্রয়োজন লিখে খুঁজুন...")
                        : (lang === "en" ? "Search open jobs matching your skill (e.g. React, Logo, Video)..." : "আপনার স্কিল লিখে চলমান কাজ খুঁজুন...")
                    }
                    className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    className="px-7 py-3 rounded-full bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-2"
                  >
                    <span>{lang === "en" ? "Search" : "খুঁজুন"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Fiverr-Style Quick Skill Pills with Right Arrows */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-400 mr-1">
                  {lang === "en" ? "Popular:" : "জনপ্রিয়:"}
                </span>
                {fiverrSkills.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => onSelectSkill(item.query)}
                    className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/50 text-xs transition-all cursor-pointer font-medium"
                  >
                    <span>{item.name}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

            </div>

            {/* RIGHT COLUMN: Cinematic Floating Trust Showcase */}
            <div className="lg:col-span-4 flex flex-col gap-4 relative">
              
              {/* Floating Escrow Security Card */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl p-4 shadow-xl flex items-center gap-3 transform hover:scale-[1.02] transition-transform">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Escrow Protected
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">• bKash / Bank</span>
                  </div>
                  <span className="text-sm font-black text-white block mt-0.5">
                    ৳45,000 Milestone Locked
                  </span>
                </div>
              </div>

              {/* Floating Featured Talent Card */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl p-5 shadow-xl space-y-3 transform hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        alt="Featured Talent"
                        className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/40"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-white">Arifur Rahman</h4>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                          PRO
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Senior Full-Stack Engineer</p>
                      <div className="flex items-center gap-1 text-amber-400 font-bold text-xs mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>4.98 (47 jobs)</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-white block">৳1,800</span>
                    <span className="text-[10px] text-slate-400">per hour</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Available for hire</span>
                  </div>
                  <button
                    onClick={onOpenPostJob}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    Hire directly →
                  </button>
                </div>
              </div>

              {/* Bottom Trust Stat Summary */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <span className="text-lg font-black text-white block">12,400+</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">NID Verified</span>
                </div>
                <div>
                  <span className="text-lg font-black text-emerald-400 block">7% Flat</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Platform Fee</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
