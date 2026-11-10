"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
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
  Sparkles,
  ArrowRight,
  Bookmark,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import { EmptyState, JobCardSkeleton } from "@/components/ui";

interface JobFeedProps {
  jobs: Job[];
  isLoading?: boolean;
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

type SortOption = "NEWEST" | "BUDGET_HIGH" | "BUDGET_LOW" | "FEWEST_BIDS";

const SAVED_JOBS_KEY = "mk_saved_jobs_v1";

export default function JobFeed({
  jobs,
  isLoading = false,
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
  const [selectedExperience, setSelectedExperience] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST");
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(SAVED_JOBS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const toggleSaveJob = (jobId: string) => {
    setSavedJobIds((prev) => {
      const next = prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId];
      try {
        window.localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const filteredAndSortedJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      if (selectedCategory && job.category !== selectedCategory) return false;
      if (savedOnly && !savedJobIds.includes(job.id)) return false;

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

      if (selectedExperience !== "ALL" && job.experienceLevel !== selectedExperience) return false;

      return true;
    });

    const copy = [...filtered];
    if (sortBy === "BUDGET_HIGH") {
      copy.sort((a, b) => b.budgetBdt - a.budgetBdt);
    } else if (sortBy === "BUDGET_LOW") {
      copy.sort((a, b) => a.budgetBdt - b.budgetBdt);
    } else if (sortBy === "FEWEST_BIDS") {
      copy.sort((a, b) => a.proposalsCount - b.proposalsCount);
    }
    return copy;
  }, [jobs, selectedCategory, savedOnly, savedJobIds, searchQuery, selectedBudgetRange, selectedExperience, sortBy]);

  const resetAllFilters = () => {
    setSelectedBudgetRange("ALL");
    setSelectedExperience("ALL");
    setSavedOnly(false);
    setSortBy("NEWEST");
  };

  return (
    <section id="jobs-section" className="py-16 bg-white text-slate-900 min-h-[520px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Primary Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {lang === "en" ? "Available Jobs in Bangladesh" : "বাংলাদেশে চলমান কাজসমূহ"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {filteredAndSortedJobs.length} {lang === "en" ? "Open" : "টি সক্রিয়"}
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              {lang === "en"
                ? "Every project is backed by MuktoKormo's 100% BDT escrow protection and NID-verified clients."
                : "বিকাশ ও নগদ এসক্রোর মাধ্যমে প্রতিটি কাজ শতভাগ নিরাপদ।"}
            </p>
          </div>

          {/* Right Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenMyBids && (
              <button
                onClick={onOpenMyBids}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === "en" ? "My Submitted Bids" : "আমার জমাকৃত বিড"}</span>
                {myBidsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-black ml-0.5">
                    {myBidsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setSavedOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                savedOnly
                  ? "bg-amber-50 border-amber-300 text-amber-800 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? "fill-amber-500 text-amber-500" : ""}`} />
              <span>{lang === "en" ? "Saved" : "সংরক্ষিত"}</span>
              {savedJobIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-white font-bold">
                  {savedJobIds.length}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                aria-label="Sort jobs"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="pl-8 pr-7 py-2 rounded-full text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="NEWEST">{lang === "en" ? "Sort: Newest" : "সর্ট: নতুন"}</option>
                <option value="BUDGET_HIGH">{lang === "en" ? "Budget: High to Low" : "বাজেট: বেশি থেকে কম"}</option>
                <option value="BUDGET_LOW">{lang === "en" ? "Budget: Low to High" : "বাজেট: কম থেকে বেশি"}</option>
                <option value="FEWEST_BIDS">{lang === "en" ? "Fewest Bids First" : "সবচেয়ে কম বিড"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Bar: Budget + Experience Level */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              {lang === "en" ? "Budget:" : "বাজেট:"}
            </span>
            {[
              { id: "ALL", label: lang === "en" ? "All Budgets" : "সব বাজেট" },
              { id: "UNDER_15K", label: "< ৳15k" },
              { id: "15K_40K", label: "৳15k – ৳40k" },
              { id: "40K_PLUS", label: "৳40k+" },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBudgetRange(b.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedBudgetRange === b.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">
              {lang === "en" ? "Experience:" : "অভিজ্ঞতা:"}
            </span>
            {[
              { id: "ALL", label: lang === "en" ? "Any Level" : "যেকোনো" },
              { id: "Entry Level", label: "Entry" },
              { id: "Intermediate", label: "Intermediate" },
              { id: "Expert", label: "Expert" },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setSelectedExperience(lvl.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedExperience === lvl.id
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="space-y-3.5">
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        ) : filteredAndSortedJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-6 h-6 text-slate-400" />}
            title={lang === "en" ? "No matching jobs found" : "কোনো কাজ পাওয়া যায়নি"}
            description={
              lang === "en"
                ? "Try clearing your budget, experience, or saved filters — or post a new project to hire top Bangladeshi talent."
                : "ফিল্টার পরিবর্তন করে আবার খুঁজুন অথবা নতুন কাজ পোস্ট করুন।"
            }
            action={
              <div className="flex items-center justify-center gap-2.5">
                {(selectedBudgetRange !== "ALL" || selectedExperience !== "ALL" || savedOnly) && (
                  <button
                    onClick={resetAllFilters}
                    className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    {lang === "en" ? "Reset Filters" : "ফিল্টার রিসেট"}
                  </button>
                )}
                <button
                  onClick={onOpenPostJob}
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  {lang === "en" ? "Post a Job" : "কাজ পোস্ট করুন"}
                </button>
              </div>
            }
          />
        ) : (
          /* Jobs List */
          <div className="space-y-3.5">
            {filteredAndSortedJobs.map((job) => {
              const isSaved = savedJobIds.includes(job.id);

              return (
                <div
                  key={job.id}
                  className="bg-white hover:bg-slate-50/40 border border-slate-200/85 hover:border-emerald-300/80 rounded-2xl p-5 sm:p-6 transition-all duration-150 shadow-2xs hover:shadow-md group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left Column: Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                          {job.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          {job.jobType}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/80 text-slate-600">
                          {job.experienceLevel}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto lg:ml-1">
                          <Clock className="w-3 h-3" />
                          {job.postedAt}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors"
                        >
                          <span>{lang === "en" ? job.title : job.titleBn || job.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 shrink-0" />
                        </Link>
                      </div>

                      <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                        {lang === "en" ? job.description : job.descriptionBn || job.description}
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
                            <span title="NID Verified" className="text-emerald-600">
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

                        <button
                          onClick={() => onViewJobBids(job)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs transition-colors cursor-pointer group/bid"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {job.proposalsCount} {lang === "en" ? "bids placed" : "বিড জমা"}
                          </span>
                          <ArrowRight className="w-3 h-3 text-emerald-600 group-hover/bid:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Budget & Action Buttons */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 shrink-0 lg:pl-6 lg:border-l lg:border-slate-100">
                      <div className="text-left lg:text-right">
                        <div className="flex items-center lg:justify-end gap-2">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            {lang === "en" ? "Client Budget" : "ক্লায়েন্ট বাজেট"}
                          </span>
                          <button
                            onClick={() => toggleSaveJob(job.id)}
                            aria-label={isSaved ? "Unsave job" : "Save job"}
                            title={isSaved ? "Saved" : "Save job"}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isSaved
                                ? "bg-amber-50 border-amber-200 text-amber-600"
                                : "bg-white border-slate-200 text-slate-400 hover:text-slate-700"
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-500" : ""}`} />
                          </button>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight block mt-0.5">
                          ৳{job.budgetBdt.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          {lang === "en" ? `Est. ${job.deadlineDays} days` : `আনুমানিক ${job.deadlineDays} দিন`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => onSelectJobForEscrow(job)}
                          className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                          title={lang === "en" ? "Preview Escrow Breakdown" : "এসক্রো হিসাব দেখুন"}
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onViewJobBids(job)}
                          className="px-3.5 py-2 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                        >
                          {lang === "en" ? "View Bids" : "বিড দেখুন"}
                        </button>

                        <button
                          onClick={() => onSelectJobForProposal(job)}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{lang === "en" ? "Place Bid" : "বিড করুন"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
