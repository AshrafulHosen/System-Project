"use client";

import React, { useState } from "react";
import { Job } from "@/types";
import { 
  Briefcase, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Filter, 
  Send,
  Lock,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface JobFeedProps {
  jobs: Job[];
  lang: "en" | "bn";
  selectedCategory: string | null;
  searchQuery: string;
  onSelectJobForProposal: (job: Job) => void;
  onViewJobBids: (job: Job) => void;
  onSelectJobForEscrow: (job: Job) => void;
  onOpenPostJob: () => void;
  myBidsCount?: number;
  onOpenMyBids?: () => void;
}

export default function JobFeed({
  jobs,
  lang,
  selectedCategory,
  searchQuery,
  onSelectJobForProposal,
  onViewJobBids,
  onSelectJobForEscrow,
  onOpenPostJob,
  myBidsCount = 0,
  onOpenMyBids,
}: JobFeedProps) {
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<string>("ALL");

  const filteredJobs = jobs.filter((job) => {
    if (selectedCategory && job.category !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchDesc = job.description.toLowerCase().includes(q);
      const matchSkill = job.skills.some((s) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSkill) return false;
    }

    if (selectedBudgetRange === "UNDER_15K" && job.budgetBdt >= 15000) return false;
    if (selectedBudgetRange === "15K_40K" && (job.budgetBdt < 15000 || job.budgetBdt > 40000)) return false;
    if (selectedBudgetRange === "40K_PLUS" && job.budgetBdt < 40000) return false;

    return true;
  });

  return (
    <section id="jobs-section" className="py-16 bg-white text-slate-900 min-h-[500px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {lang === "en" ? "Available Jobs in Bangladesh" : "বাংলাদেশে চলমান কাজসমূহ"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {filteredJobs.length} {lang === "en" ? "Open" : "টি সক্রিয়"}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {lang === "en"
                ? "Every job is protected by MuktoKormo's guaranteed BDT escrow & verified client badges."
                : "বিকাশ ও নগদ এসক্রোর মাধ্যমে প্রতিটি কাজ শতভাগ নিরাপদ।"}
            </p>
          </div>

          {/* Quick Hub Trigger & Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* My Bids Drawer Button */}
            {onOpenMyBids && (
              <button
                onClick={onOpenMyBids}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === "en" ? "My Submitted Bids" : "আমার জমাকৃত বিড"}</span>
                {myBidsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-black ml-0.5">
                    {myBidsCount}
                  </span>
                )}
              </button>
            )}

            {/* Budget Filters */}
            <div className="flex items-center gap-1 text-xs text-slate-400 mr-0.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "en" ? "Budget:" : "বাজেট:"}</span>
            </div>

            <button
              onClick={() => setSelectedBudgetRange("ALL")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedBudgetRange === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              {lang === "en" ? "All Budgets" : "সব বাজেট"}
            </button>
            <button
              onClick={() => setSelectedBudgetRange("UNDER_15K")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedBudgetRange === "UNDER_15K"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              &lt; ৳15k
            </button>
            <button
              onClick={() => setSelectedBudgetRange("15K_40K")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedBudgetRange === "15K_40K"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              ৳15k - ৳40k
            </button>
            <button
              onClick={() => setSelectedBudgetRange("40K_PLUS")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedBudgetRange === "40K_PLUS"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              ৳40k+
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-white mx-auto flex items-center justify-center mb-3 shadow-xs border border-slate-200">
              <Briefcase className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {lang === "en" ? "No jobs found" : "কোনো কাজ পাওয়া যায়নি"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {lang === "en" ? "Try clearing filters or search terms." : "অন্য কোনো কি-ওয়ার্ড দিয়ে খুঁজুন।"}
            </p>
            <button
              onClick={onOpenPostJob}
              className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Post a Job
            </button>
          </div>
        ) : (
          /* Jobs List */
          <div className="space-y-3.5">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 sm:p-6 transition-all duration-150 shadow-xs hover:shadow-sm group"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  
                  {/* Left Column: Job Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {job.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/70 text-slate-600">
                        {job.jobType}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto lg:ml-2">
                        <Clock className="w-3 h-3" />
                        {job.postedAt}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {lang === "en" ? job.title : (job.titleBn || job.title)}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {lang === "en" ? job.description : (job.descriptionBn || job.description)}
                    </p>

                    {/* Skill Tags */}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Client Info & Interactive Bids Counter */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1 text-slate-800 font-semibold">
                        <span>{job.clientName}</span>
                        {job.clientVerified && (
                          <span title="NID Verified" className="text-emerald-500">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{job.clientLocation}</span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{job.clientRating.toFixed(1)}</span>
                      </div>

                      {/* Clickable Bids Counter */}
                      <button
                        onClick={() => onViewJobBids(job)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs transition-colors cursor-pointer group/bid"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{job.proposalsCount} {lang === "en" ? "bids placed" : "বিড জমা"}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-600 group-hover/bid:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                  </div>

                  {/* Right Column: Budget & Action Buttons */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 shrink-0 lg:pl-6">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                        {lang === "en" ? "Client Budget" : "ক্লায়েন্ট বাজেট"}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        ৳{job.budgetBdt.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">Est. {job.deadlineDays} days</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => onSelectJobForEscrow(job)}
                        className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                        title="Simulate Escrow"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>

                      {/* View Bids Button */}
                      <button
                        onClick={() => onViewJobBids(job)}
                        className="px-3.5 py-2 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                      >
                        {lang === "en" ? "View Bids" : "বিড দেখুন"}
                      </button>

                      {/* Place Bid Button */}
                      <button
                        onClick={() => onSelectJobForProposal(job)}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{lang === "en" ? "Place Bid" : "বিড করুন"}</span>
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
