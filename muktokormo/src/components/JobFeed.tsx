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
  Layers,
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
  const [selectedJobType, setSelectedJobType] = useState<
    "ALL" | "Fixed Price" | "Milestone Based"
  >("ALL");
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
      const next = prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId];
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
      if (
        selectedBudgetRange === "15K_40K" &&
        (job.budgetBdt < 15000 || job.budgetBdt > 40000)
      )
        return false;
      if (selectedBudgetRange === "40K_PLUS" && job.budgetBdt < 40000) return false;

      if (selectedExperience !== "ALL" && job.experienceLevel !== selectedExperience)
        return false;

      if (selectedJobType !== "ALL" && job.jobType !== selectedJobType)
        return false;

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
  }, [
    jobs,
    selectedCategory,
    savedOnly,
    savedJobIds,
    searchQuery,
    selectedBudgetRange,
    selectedExperience,
    selectedJobType,
    sortBy,
  ]);

  const hasActiveFilters =
    selectedBudgetRange !== "ALL" ||
    selectedExperience !== "ALL" ||
    selectedJobType !== "ALL" ||
    savedOnly;

  const resetAllFilters = () => {
    setSelectedBudgetRange("ALL");
    setSelectedExperience("ALL");
    setSelectedJobType("ALL");
    setSavedOnly(false);
    setSortBy("NEWEST");
  };

  return (
    <section
      id="jobs-section"
      className="py-16 bg-[#FAF9F6] text-[#111315] min-h-[520px]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Primary Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F6E50] block mb-1.5">
              {lang === "en" ? "Live Project Marketplace" : "লাইভ জব মার্কেটপ্লেস"}
            </span>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111315]">
                {lang === "en" ? "Open BDT Projects" : "বাংলাদেশে চলমান কাজসমূহ"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF5F0] text-[#0B3B2E] border border-[#C3E3D5] mk-tabular">
                {filteredAndSortedJobs.length} {lang === "en" ? "Open" : "টি সক্রিয়"}
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-[#686E78]">
              {lang === "en"
                ? "Verified project briefs backed by BDT milestone escrow and clear deliverable timelines."
                : "বিকাশ ও নগদ এসক্রোর মাধ্যমে প্রতিটি কাজ শতভাগ নিরাপদ।"}
            </p>
          </div>

          {/* Right Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenMyBids && (
              <button
                type="button"
                onClick={onOpenMyBids}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#EAF5F0] hover:bg-[#dcefe6] text-[#0B3B2E] border border-[#C3E3D5] transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0F6E50]" />
                <span>{lang === "en" ? "My Submitted Bids" : "আমার জমাকৃত বিড"}</span>
                {myBidsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#0B3B2E] text-white font-bold ml-0.5 mk-tabular">
                    {myBidsCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setSavedOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                savedOnly
                  ? "bg-[#FBF5EA] border-[#EADAB8] text-[#9A661A]"
                  : "bg-white border-[rgba(17,19,21,0.12)] text-[#3E434A] hover:border-[rgba(17,19,21,0.25)] hover:text-[#111315]"
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  savedOnly ? "fill-[#A87224] text-[#A87224]" : ""
                }`}
              />
              <span>{lang === "en" ? "Saved" : "সংরক্ষিত"}</span>
              {savedJobIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#111315] text-white font-bold mk-tabular">
                  {savedJobIds.length}
                </span>
              )}
            </button>

            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#686E78] absolute left-3 pointer-events-none" />
              <select
                aria-label="Sort jobs"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="pl-8 pr-7 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#F4F2EC] border border-[rgba(17,19,21,0.12)] text-[#111315] focus:outline-none focus:border-[#0F6E50] cursor-pointer"
              >
                <option value="NEWEST">{lang === "en" ? "Sort: Newest" : "সর্ট: নতুন"}</option>
                <option value="BUDGET_HIGH">
                  {lang === "en" ? "Budget: High to Low" : "বাজেট: বেশি থেকে কম"}
                </option>
                <option value="BUDGET_LOW">
                  {lang === "en" ? "Budget: Low to High" : "বাজেট: কম থেকে বেশি"}
                </option>
                <option value="FEWEST_BIDS">
                  {lang === "en" ? "Fewest Bids First" : "সবচেয়ে কম বিড"}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Multi-Row Filter Toolbar (Budget + Job Type + Experience) */}
        <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-4 mb-6 shadow-[0_1px_2px_rgba(17,19,21,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Budget */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#686E78] mr-1">
              <Filter className="w-3.5 h-3.5 text-[#0F6E50]" />
              {lang === "en" ? "Budget:" : "বাজেট:"}
            </span>
            {[
              { id: "ALL", label: lang === "en" ? "All Budgets" : "সব বাজেট" },
              { id: "UNDER_15K", label: "< ৳15k" },
              { id: "15K_40K", label: "৳15k–৳40k" },
              { id: "40K_PLUS", label: "৳40k+" },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBudgetRange(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedBudgetRange === b.id
                    ? "bg-[#0B3B2E] text-white"
                    : "bg-[#F4F2EC] text-[#3E434A] hover:text-[#111315] hover:bg-[#EAE7DF]"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Job Type */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#686E78] mr-1">
              <Layers className="w-3.5 h-3.5 text-[#0F6E50]" />
              {lang === "en" ? "Contract:" : "ধরন:"}
            </span>
            {[
              { id: "ALL" as const, label: lang === "en" ? "All Types" : "সকল" },
              {
                id: "Fixed Price" as const,
                label: lang === "en" ? "Fixed Price" : "নির্দিষ্ট বাজেট",
              },
              {
                id: "Milestone Based" as const,
                label: lang === "en" ? "Milestone Based" : "মাইলস্টোন",
              },
            ].map((jt) => (
              <button
                key={jt.id}
                type="button"
                onClick={() => setSelectedJobType(jt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedJobType === jt.id
                    ? "bg-[#0F6E50] text-white"
                    : "bg-[#F4F2EC] text-[#3E434A] hover:text-[#111315] hover:bg-[#EAE7DF]"
                }`}
              >
                {jt.label}
              </button>
            ))}
          </div>

          {/* Experience */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#686E78] mr-1">
              {lang === "en" ? "Level:" : "দক্ষতা:"}
            </span>
            {[
              { id: "ALL", label: lang === "en" ? "Any" : "যেকোনো" },
              { id: "Entry Level", label: "Entry" },
              { id: "Intermediate", label: "Mid" },
              { id: "Expert", label: "Expert" },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedExperience(lvl.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedExperience === lvl.id
                    ? "bg-[#111315] text-white"
                    : "bg-[#F4F2EC] text-[#3E434A] hover:text-[#111315] hover:bg-[#EAE7DF]"
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
            icon={<Briefcase className="w-6 h-6" />}
            title={lang === "en" ? "No matching jobs found" : "কোনো কাজ পাওয়া যায়নি"}
            description={
              lang === "en"
                ? "Try clearing your budget, contract type, or experience filters — or post a new project to hire top Bangladeshi talent."
                : "ফিল্টার পরিবর্তন করে আবার খুঁজুন অথবা নতুন কাজ পোস্ট করুন।"
            }
            action={
              <div className="flex items-center justify-center gap-2.5">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="px-4 py-2 rounded-xl border border-[rgba(17,19,21,0.14)] bg-white hover:bg-[#F4F2EC] text-[#111315] font-semibold text-xs cursor-pointer"
                  >
                    {lang === "en" ? "Reset Filters" : "ফিল্টার রিসেট"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenPostJob}
                  className="px-5 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] text-white font-semibold text-xs cursor-pointer"
                >
                  {lang === "en" ? "Post a Job" : "কাজ পোস্ট করুন"}
                </button>
              </div>
            }
          />
        ) : (
          <div className="space-y-3.5">
            {filteredAndSortedJobs.map((job) => {
              const isSaved = savedJobIds.includes(job.id);

              return (
                <div
                  key={job.id}
                  className="bg-white border border-[rgba(17,19,21,0.09)] hover:border-[#0F6E50]/45 rounded-2xl p-5 sm:p-6 transition-all duration-150 shadow-[0_1px_2px_rgba(17,19,21,0.03)] hover:shadow-[0_14px_30px_-8px_rgba(17,19,21,0.08)] group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* Left Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5F0] text-[#0B3B2E] border border-[#C3E3D5]">
                          {job.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F2EC] text-[#3E434A] border border-[rgba(17,19,21,0.07)]">
                          {job.jobType}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F2EC] text-[#3E434A] border border-[rgba(17,19,21,0.07)]">
                          {job.experienceLevel}
                        </span>
                        <span className="text-[11px] text-[#686E78] flex items-center gap-1 ml-auto lg:ml-1">
                          <Clock className="w-3 h-3" />
                          {job.postedAt}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-[#111315] group-hover:text-[#0F6E50] transition-colors"
                        >
                          <span>{lang === "en" ? job.title : job.titleBn || job.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#0F6E50] shrink-0" />
                        </Link>
                      </div>

                      <p className="mt-2 text-xs sm:text-[13px] text-[#3E434A] leading-relaxed line-clamp-2">
                        {lang === "en"
                          ? job.description
                          : job.descriptionBn || job.description}
                      </p>

                      {/* Skill Tags */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {job.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)] text-[#3E434A]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Client Metadata & Bids Counter */}
                      <div className="mt-4 pt-3.5 border-t border-[rgba(17,19,21,0.07)] flex flex-wrap items-center gap-4 text-xs text-[#686E78]">
                        <div className="flex items-center gap-1.5 text-[#111315] font-semibold">
                          <span>{job.clientName}</span>
                          {job.clientVerified && (
                            <span title="NID Verified" className="text-[#0F6E50]">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#949BA6]" />
                          <span>{job.clientLocation}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[#A87224] font-semibold mk-tabular">
                          <Star className="w-3 h-3 fill-[#D4A24C] text-[#D4A24C]" />
                          <span>{job.clientRating.toFixed(1)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onViewJobBids(job)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF5F0]/80 hover:bg-[#EAF5F0] text-[#0B3B2E] border border-[#C3E3D5] font-semibold text-xs transition-colors cursor-pointer group/bid mk-tabular"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#0F6E50]" />
                          <span>
                            {job.proposalsCount}{" "}
                            {lang === "en" ? "bids placed" : "বিড জমা"}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[#0F6E50] group-hover/bid:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Budget & CTA */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3.5 lg:pt-0 border-[rgba(17,19,21,0.07)] shrink-0 lg:pl-6 lg:border-l lg:border-[rgba(17,19,21,0.08)]">
                      <div className="text-left lg:text-right">
                        <div className="flex items-center lg:justify-end gap-2">
                          <span className="text-[10px] uppercase tracking-[0.07em] text-[#686E78] font-semibold">
                            {lang === "en" ? "Client Budget" : "ক্লায়েন্ট বাজেট"}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSaveJob(job.id)}
                            aria-label={isSaved ? "Unsave job" : "Save job"}
                            title={isSaved ? "Saved" : "Save job"}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isSaved
                                ? "bg-[#FBF5EA] border-[#EADAB8] text-[#A87224]"
                                : "bg-white border-[rgba(17,19,21,0.1)] text-[#949BA6] hover:text-[#111315]"
                            }`}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${isSaved ? "fill-[#A87224]" : ""}`}
                            />
                          </button>
                        </div>
                        <span className="font-mono text-xl sm:text-2xl font-bold text-[#111315] tracking-tight block mt-1 mk-tabular">
                          ৳{job.budgetBdt.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-[#686E78] block font-medium mt-0.5">
                          {lang === "en"
                            ? `Est. ${job.deadlineDays} days`
                            : `আনুমানিক ${job.deadlineDays} দিন`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => onSelectJobForEscrow(job)}
                          className="p-2.5 rounded-xl bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#3E434A] hover:text-[#111315] transition-all cursor-pointer"
                          title={
                            lang === "en"
                              ? "Preview Escrow Breakdown"
                              : "এসক্রো হিসাব দেখুন"
                          }
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewJobBids(job)}
                          className="px-3.5 py-2 rounded-xl border border-[rgba(17,19,21,0.13)] hover:border-[rgba(17,19,21,0.25)] bg-white hover:bg-[#FAF9F6] text-[#111315] font-semibold text-xs transition-all cursor-pointer"
                        >
                          {lang === "en" ? "View Bids" : "বিড দেখুন"}
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectJobForProposal(job)}
                          className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#0F6E50] hover:bg-[#0B5940] text-white font-semibold text-xs shadow-[0_1px_2px_rgba(11,59,46,0.2)] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
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
