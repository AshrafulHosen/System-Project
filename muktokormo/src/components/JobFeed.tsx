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
  SlidersHorizontal,
  Send,
  Lock,
  Sparkles,
  ArrowUpRight,
  Bookmark,
  ArrowUpDown,
  RotateCcw,
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
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
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

  const en = lang === "en";

  const budgetOptions = [
    { id: "ALL", label: en ? "Any budget" : "সব বাজেট" },
    { id: "UNDER_15K", label: "< ৳15k" },
    { id: "15K_40K", label: "৳15k – ৳40k" },
    { id: "40K_PLUS", label: "৳40k+" },
  ];
  const typeOptions = [
    { id: "ALL" as const, label: en ? "Any type" : "সকল" },
    { id: "Fixed Price" as const, label: en ? "Fixed price" : "নির্দিষ্ট বাজেট" },
    { id: "Milestone Based" as const, label: en ? "Milestone based" : "মাইলস্টোন" },
  ];
  const levelOptions = [
    { id: "ALL", label: en ? "Any level" : "যেকোনো" },
    { id: "Entry Level", label: en ? "Entry" : "এন্ট্রি" },
    { id: "Intermediate", label: en ? "Intermediate" : "মধ্যম" },
    { id: "Expert", label: en ? "Expert" : "এক্সপার্ট" },
  ];

  const optionBtn = (active: boolean) =>
    `w-full flex items-center justify-between h-9 px-3 rounded-md text-[13px] text-left transition-colors cursor-pointer ${
      active ? "bg-ink text-white font-medium" : "text-ink-2 hover:bg-subtle hover:text-ink"
    }`;

  const filterPanel = (
    <div className="space-y-6">
      <fieldset>
        <legend className="mk-eyebrow text-ink-4 mb-2">{en ? "Budget" : "বাজেট"}</legend>
        <div className="space-y-0.5">
          {budgetOptions.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={selectedBudgetRange === b.id}
              onClick={() => setSelectedBudgetRange(b.id)}
              className={optionBtn(selectedBudgetRange === b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mk-eyebrow text-ink-4 mb-2">{en ? "Contract type" : "চুক্তির ধরন"}</legend>
        <div className="space-y-0.5">
          {typeOptions.map((jt) => (
            <button
              key={jt.id}
              type="button"
              aria-pressed={selectedJobType === jt.id}
              onClick={() => setSelectedJobType(jt.id)}
              className={optionBtn(selectedJobType === jt.id)}
            >
              {jt.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mk-eyebrow text-ink-4 mb-2">{en ? "Experience" : "দক্ষতা"}</legend>
        <div className="space-y-0.5">
          {levelOptions.map((lvl) => (
            <button
              key={lvl.id}
              type="button"
              aria-pressed={selectedExperience === lvl.id}
              onClick={() => setSelectedExperience(lvl.id)}
              className={optionBtn(selectedExperience === lvl.id)}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </fieldset>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetAllFilters}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:text-brand-hover cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          {en ? "Reset filters" : "ফিল্টার রিসেট"}
        </button>
      )}
    </div>
  );

  const trimmedQuery = searchQuery.trim();
  const resultSummary = isLoading
    ? en
      ? "Loading projects…"
      : "লোড হচ্ছে…"
    : en
    ? `${filteredAndSortedJobs.length} ${filteredAndSortedJobs.length === 1 ? "project" : "projects"}${
        selectedCategory ? ` in ${selectedCategory}` : ""
      }${trimmedQuery ? ` matching "${trimmedQuery}"` : ""}`
    : `${filteredAndSortedJobs.length}টি কাজ`;

  return (
    <section id="jobs-section" className="py-20 sm:py-24 bg-canvas text-ink min-h-[520px] scroll-mt-16">
      <div className="mk-container">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 lg:mb-10">
          <div className="max-w-2xl">
            <span className="mk-eyebrow text-brand">{en ? "Find work" : "কাজ খুঁজুন"}</span>
            <h2 className="mk-h2 mt-4 text-ink">
              {en ? "Open projects, paid in Taka." : "বাংলাদেশে চলমান কাজসমূহ"}
            </h2>
            <p className="mt-4 text-[15px] text-ink-3">
              {en
                ? "Every brief is backed by milestone escrow with a clear budget and timeline."
                : "বিকাশ ও নগদ এসক্রোর মাধ্যমে প্রতিটি কাজ শতভাগ নিরাপদ।"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenMyBids && (
              <button
                type="button"
                onClick={onOpenMyBids}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-white hover:bg-subtle text-ink border border-line transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                {en ? "My bids" : "আমার বিড"}
                {myBidsCount > 0 && (
                  <span className="min-w-5 h-5 px-1 rounded text-[11px] bg-brand text-white font-semibold inline-flex items-center justify-center mk-tabular">
                    {myBidsCount}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              aria-pressed={savedOnly}
              onClick={() => setSavedOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium border transition-colors cursor-pointer ${
                savedOnly ? "bg-ink border-ink text-white" : "bg-white border-line text-ink hover:bg-subtle"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? "fill-current" : ""}`} aria-hidden="true" />
              {en ? "Saved" : "সংরক্ষিত"}
              {savedJobIds.length > 0 && (
                <span
                  className={`min-w-5 h-5 px-1 rounded text-[11px] font-semibold inline-flex items-center justify-center mk-tabular ${
                    savedOnly ? "bg-white/15" : "bg-subtle text-ink-2"
                  }`}
                >
                  {savedJobIds.length}
                </span>
              )}
            </button>
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-ink-3 absolute left-3 pointer-events-none" aria-hidden="true" />
              <select
                aria-label={en ? "Sort jobs" : "সর্ট"}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-9 pl-8 pr-7 rounded-md text-[13px] font-medium bg-white hover:bg-subtle border border-line text-ink focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="NEWEST">{en ? "Newest first" : "সর্ট: নতুন"}</option>
                <option value="BUDGET_HIGH">{en ? "Budget: high to low" : "বাজেট: বেশি থেকে কম"}</option>
                <option value="BUDGET_LOW">{en ? "Budget: low to high" : "বাজেট: কম থেকে বেশি"}</option>
                <option value="FEWEST_BIDS">{en ? "Fewest bids first" : "সবচেয়ে কম বিড"}</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="job-filters-mobile"
              className="lg:hidden inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium bg-white hover:bg-subtle text-ink border border-line cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              {en ? "Filters" : "ফিল্টার"}
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div id="job-filters-mobile" className="lg:hidden mb-6 bg-white border border-line rounded-xl p-5 mk-fade-in">
            {filterPanel}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[232px_1fr] xl:grid-cols-[256px_1fr] gap-8 xl:gap-10">
          {/* Desktop filter rail */}
          <aside aria-label={en ? "Job filters" : "কাজের ফিল্টার"} className="hidden lg:block">
            <div className="sticky top-24">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink mb-5">
                <SlidersHorizontal className="w-4 h-4 text-ink-3" aria-hidden="true" />
                {en ? "Filters" : "ফিল্টার"}
              </p>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0">
            <p className="mb-3 text-[13px] text-ink-3 mk-tabular" aria-live="polite">
              {resultSummary}
            </p>

            {isLoading ? (
              <div className="space-y-3">
                <JobCardSkeleton />
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : filteredAndSortedJobs.length === 0 ? (
              <EmptyState
                icon={<Briefcase className="w-6 h-6" />}
                title={en ? "No matching jobs found" : "কোনো কাজ পাওয়া যায়নি"}
                description={
                  en
                    ? "Try clearing your budget, contract type, or experience filters — or post a new project to hire top Bangladeshi talent."
                    : "ফিল্টার পরিবর্তন করে আবার খুঁজুন অথবা নতুন কাজ পোস্ট করুন।"
                }
                action={
                  <div className="flex items-center justify-center gap-2">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="h-10 px-4 rounded-lg border border-line-strong bg-white hover:bg-subtle text-ink font-medium text-sm cursor-pointer"
                      >
                        {en ? "Reset filters" : "ফিল্টার রিসেট"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onOpenPostJob}
                      className="h-10 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium text-sm cursor-pointer"
                    >
                      {en ? "Post a job" : "কাজ পোস্ট করুন"}
                    </button>
                  </div>
                }
              />
            ) : (
              <ul className="space-y-3">
                {filteredAndSortedJobs.map((job) => {
                  const isSaved = savedJobIds.includes(job.id);
                  return (
                    <li key={job.id}>
                      <article className="group bg-white border border-line hover:border-line-strong rounded-xl transition-[border-color,box-shadow] duration-200 hover:shadow-[var(--mk-shadow-elevated)]">
                        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 md:gap-8">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-ink-3">
                              <span className="font-medium text-brand-strong">{job.category}</span>
                              <span aria-hidden="true" className="w-1 h-1 rounded-full bg-muted-2" />
                              <span>{job.jobType}</span>
                              <span aria-hidden="true" className="w-1 h-1 rounded-full bg-muted-2" />
                              <span>{job.experienceLevel}</span>
                              <span className="inline-flex items-center gap-1 ml-auto md:ml-0 text-ink-4">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {job.postedAt}
                              </span>
                            </div>

                            <h3 className="mt-2.5">
                              <Link
                                href={`/jobs/${job.id}`}
                                className="inline-flex items-start gap-1.5 text-[17px] sm:text-lg font-semibold tracking-[-0.025em] leading-snug text-ink hover:text-brand transition-colors"
                              >
                                {en ? job.title : job.titleBn || job.title}
                                <ArrowUpRight
                                  className="w-4 h-4 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-brand"
                                  aria-hidden="true"
                                />
                              </Link>
                            </h3>

                            <p className="mt-2 text-[14px] text-ink-3 leading-relaxed line-clamp-2">
                              {en ? job.description : job.descriptionBn || job.description}
                            </p>

                            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={en ? "Skills" : "দক্ষতা"}>
                              {job.skills.map((skill) => (
                                <li key={skill} className="px-2 py-0.5 rounded-md text-[12px] font-medium bg-subtle text-ink-2">
                                  {skill}
                                </li>
                              ))}
                            </ul>

                            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-3">
                              <span className="inline-flex items-center gap-1.5 text-ink font-medium">
                                {job.clientName}
                                {job.clientVerified && (
                                  <ShieldCheck className="w-3.5 h-3.5 text-brand" aria-label={en ? "NID verified" : "যাচাইকৃত"} />
                                )}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-ink-4" aria-hidden="true" />
                                {job.clientLocation}
                              </span>
                              <span className="inline-flex items-center gap-1 mk-tabular">
                                <Star className="w-3.5 h-3.5 fill-accent-bright text-accent-bright" aria-hidden="true" />
                                {job.clientRating.toFixed(1)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onViewJobBids(job)}
                                className="inline-flex items-center gap-1 font-medium text-ink-2 hover:text-brand cursor-pointer mk-tabular"
                              >
                                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                                {job.proposalsCount}{" "}
                                {en ? (job.proposalsCount === 1 ? "proposal" : "proposals") : "বিড জমা"}
                              </button>
                            </div>
                          </div>

                          {/* Budget & actions */}
                          <div className="flex md:flex-col items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-line md:pl-8 md:min-w-[200px]">
                            <div className="md:text-right">
                              <span className="block text-[12px] text-ink-4">{en ? "Budget" : "বাজেট"}</span>
                              <span className="block text-2xl font-semibold tracking-[-0.035em] text-ink mk-tabular leading-tight">
                                ৳{job.budgetBdt.toLocaleString()}
                              </span>
                              <span className="block text-[12px] text-ink-3 mt-0.5">
                                {en ? `~${job.deadlineDays} days` : `আনুমানিক ${job.deadlineDays} দিন`}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleSaveJob(job.id)}
                                aria-label={isSaved ? (en ? "Unsave job" : "সংরক্ষণ বাতিল") : en ? "Save job" : "সংরক্ষণ করুন"}
                                aria-pressed={isSaved}
                                className={`w-9 h-9 inline-flex items-center justify-center rounded-md border transition-colors cursor-pointer ${
                                  isSaved ? "bg-ink border-ink text-white" : "bg-white border-line text-ink-3 hover:text-ink hover:bg-subtle"
                                }`}
                              >
                                <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectJobForEscrow(job)}
                                aria-label={en ? "Preview escrow breakdown" : "এসক্রো হিসাব দেখুন"}
                                title={en ? "Preview escrow breakdown" : "এসক্রো হিসাব দেখুন"}
                                className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-line bg-white text-ink-3 hover:text-ink hover:bg-subtle transition-colors cursor-pointer"
                              >
                                <Lock className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onViewJobBids(job)}
                                className="hidden sm:inline-flex h-9 px-3 items-center rounded-md border border-line bg-white hover:bg-subtle text-ink font-medium text-[13px] transition-colors cursor-pointer"
                              >
                                {en ? "View bids" : "বিড দেখুন"}
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectJobForProposal(job)}
                                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand hover:bg-brand-hover text-white font-medium text-[13px] transition-colors cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                                {en ? "Place bid" : "বিড করুন"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
