"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fetchFreelancers,
  fetchSavedTalent,
  saveTalent,
  unsaveTalent,
} from "@/lib/data/freelancers";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { Freelancer } from "@/types";
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Search,
  Heart,
  MapPin,
  Award,
  Briefcase,
  X,
  MessageSquare,
  Layers,
  Clock,
} from "lucide-react";
import {
  Avatar,
  Badge,
  EmptyState,
  FreelancerCardSkeleton,
  Modal,
  Tabs,
} from "@/components/ui";

interface FreelancerDirectoryProps {
  lang: "en" | "bn";
  onHireDirect: (freelancerName: string) => void;
  externalSearchQuery?: string;
  onLoadedCount?: (count: number) => void;
}

export default function FreelancerDirectory({
  lang,
  onHireDirect,
  externalSearchQuery = "",
  onLoadedCount,
}: FreelancerDirectoryProps) {
  const supabase = useMemo(() => createClient(), []);
  const { clientId } = useCurrentUser();

  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [rateFilter, setRateFilter] = useState<
    "ALL" | "UNDER_1000" | "1000_2500" | "2500_PLUS"
  >("ALL");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Freelancer | null>(null);
  const [profileModalTab, setProfileModalTab] = useState<
    "overview" | "portfolio" | "track"
  >("overview");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const live = await fetchFreelancers(supabase);
      if (cancelled) return;
      setFreelancers(live);
      setIsLoading(false);
      onLoadedCount?.(live.length);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, onLoadedCount]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    (async () => {
      const saved = await fetchSavedTalent(supabase, clientId);
      if (!cancelled) setSavedIds(saved.map((f) => f.id));
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, clientId]);

  const handleToggleSave = async (e: React.MouseEvent, freelancerId: string) => {
    e.stopPropagation();
    if (!clientId || savingId) return;
    setSavingId(freelancerId);
    const isCurrentlySaved = savedIds.includes(freelancerId);
    if (isCurrentlySaved) {
      const ok = await unsaveTalent(supabase, clientId, freelancerId);
      if (ok) setSavedIds((prev) => prev.filter((id) => id !== freelancerId));
    } else {
      const ok = await saveTalent(supabase, clientId, freelancerId);
      if (ok) setSavedIds((prev) => [...prev, freelancerId]);
    }
    setSavingId(null);
  };

  const openProfileModal = (freelancer: Freelancer) => {
    setProfileModalTab("overview");
    setSelectedProfile(freelancer);
  };

  const filteredFreelancers = useMemo(() => {
    return freelancers.filter((f) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchTitle = f.title.toLowerCase().includes(q);
        const matchLocation = f.location.toLowerCase().includes(q);
        const matchSkill = f.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchTitle && !matchLocation && !matchSkill) return false;
      }

      if (rateFilter === "UNDER_1000" && f.hourlyRateBdt >= 1000) return false;
      if (
        rateFilter === "1000_2500" &&
        (f.hourlyRateBdt < 1000 || f.hourlyRateBdt > 2500)
      )
        return false;
      if (rateFilter === "2500_PLUS" && f.hourlyRateBdt <= 2500) return false;

      return true;
    });
  }, [freelancers, searchQuery, rateFilter]);

  const en = lang === "en";
  const rateOptions = [
    { id: "ALL" as const, label: en ? "Any rate" : "সব রেট" },
    { id: "UNDER_1000" as const, label: "< ৳1,000/hr" },
    { id: "1000_2500" as const, label: "৳1k – ৳2.5k" },
    { id: "2500_PLUS" as const, label: "৳2,500+/hr" },
  ];

  return (
    <section id="freelancers-section" className="py-20 sm:py-24 bg-white border-t border-line text-ink scroll-mt-16">
      <div className="mk-container">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 lg:mb-10">
          <div className="max-w-2xl">
            <span className="mk-eyebrow text-brand">{en ? "Find talent" : "ট্যালেন্ট খুঁজুন"}</span>
            <h2 className="mk-h2 mt-4 text-ink">
              {en ? "Verified professionals, ready to start." : "শীর্ষ ভেরিফাইড ফ্রিল্যান্সারগণ"}
            </h2>
            <p className="mt-4 text-[15px] text-ink-3">
              {en
                ? "Hire experts with Porichoy NID verification and transparent hourly rates in Taka."
                : "জাতীয় পরিচয়পত্র যাচাইকৃত নির্ভরযোগ্য দেশীয় এক্সপার্টদের সাথে সরাসরি কাজ করুন।"}
            </p>
          </div>
          <Badge variant="verified">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            {en ? "Porichoy NID verified" : "এনআইডি দ্বারা সত্যায়িত"}
          </Badge>
        </div>

        {/* Search & rate filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-lg">
            <label htmlFor="talent-search" className="sr-only">
              {en ? "Search talent" : "ট্যালেন্ট খুঁজুন"}
            </label>
            <Search className="w-4 h-4 text-ink-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="talent-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={en ? "Search by name, skill or city" : "নাম, দক্ষতা বা শহর লিখে খুঁজুন..."}
              className="w-full h-11 pl-10 pr-9 rounded-lg bg-white border border-line-strong text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/12"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={en ? "Clear search" : "খোঁজ মুছুন"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-ink-4 hover:text-ink hover:bg-subtle cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div role="group" aria-label={en ? "Hourly rate" : "রেট"} className="inline-flex items-center gap-1 p-1 rounded-lg bg-subtle border border-line overflow-x-auto max-w-full">
            {rateOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={rateFilter === item.id}
                onClick={() => setRateFilter(item.id)}
                className={`h-8 px-3 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  rateFilter === item.id
                    ? "bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,0.08)] border border-line"
                    : "text-ink-3 hover:text-ink border border-transparent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {!isLoading && (
          <p className="mb-3 text-[13px] text-ink-3 mk-tabular" aria-live="polite">
            {en
              ? `${filteredFreelancers.length} ${filteredFreelancers.length === 1 ? "professional" : "professionals"}`
              : `${filteredFreelancers.length} জন পেশাজীবী`}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
          </div>
        ) : filteredFreelancers.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="w-6 h-6" />}
            title={en ? "No matching freelancers found" : "কোনো ফ্রিল্যান্সার পাওয়া যায়নি"}
            description={
              en
                ? "Try clearing your skill search or hourly rate filter to explore all verified professionals."
                : "অন্য কোনো দক্ষতা বা রেট দিয়ে খুঁজুন।"
            }
            action={
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setRateFilter("ALL");
                }}
                className="h-10 px-4 rounded-lg bg-ink hover:bg-ink-hover text-white font-medium text-sm cursor-pointer"
              >
                {en ? "Reset talent filters" : "ফিল্টার রিসেট করুন"}
              </button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFreelancers.map((freelancer) => {
              const isSaved = savedIds.includes(freelancer.id);
              return (
                <li key={freelancer.id}>
                  <article className="group relative h-full bg-white border border-line hover:border-line-strong rounded-xl p-5 sm:p-6 flex flex-col transition-[border-color,box-shadow] duration-200 hover:shadow-[var(--mk-shadow-elevated)]">
                    <div className="flex items-start gap-3.5">
                      <div className="relative">
                        <Avatar src={freelancer.avatar} name={freelancer.name} className="w-14 h-14 rounded-lg text-base" />
                        {freelancer.isNidVerified && (
                          <span
                            className="absolute -bottom-1 -right-1 bg-brand text-white rounded-full p-0.5 ring-2 ring-white"
                            title={en ? "NID verified" : "এনআইডি যাচাইকৃত"}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" aria-label={en ? "NID verified" : "এনআইডি যাচাইকৃত"} />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink truncate">
                          <button
                            type="button"
                            onClick={() => openProfileModal(freelancer)}
                            className="text-left hover:text-brand transition-colors cursor-pointer after:absolute after:inset-0 after:rounded-xl"
                          >
                            {freelancer.name}
                          </button>
                        </h3>
                        <p className="text-[13px] text-ink-2 truncate mt-0.5">{freelancer.title}</p>
                        <p className="flex items-center gap-1 mt-1 text-[12px] text-ink-3 truncate">
                          <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                          {freelancer.location}
                        </p>
                      </div>
                      {clientId && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleSave(e, freelancer.id)}
                          disabled={savingId === freelancer.id}
                          aria-pressed={isSaved}
                          aria-label={isSaved ? (en ? "Remove from saved talent" : "সংরক্ষণ বাতিল") : en ? "Save talent" : "সংরক্ষণ করুন"}
                          className={`relative z-10 w-8 h-8 inline-flex items-center justify-center rounded-md border transition-colors cursor-pointer shrink-0 ${
                            isSaved
                              ? "bg-danger-soft border-danger-border text-danger-strong"
                              : "bg-white border-line text-ink-4 hover:text-danger-strong"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-danger-strong" : ""}`} aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-px bg-line rounded-lg overflow-hidden border border-line">
                      <div className="bg-canvas px-3 py-2">
                        <dt className="text-[11px] text-ink-4">{en ? "Rating" : "রেটিং"}</dt>
                        <dd className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-ink mk-tabular">
                          <Star className="w-3.5 h-3.5 fill-accent-bright text-accent-bright" aria-hidden="true" />
                          {freelancer.rating.toFixed(1)}
                        </dd>
                      </div>
                      <div className="bg-canvas px-3 py-2">
                        <dt className="text-[11px] text-ink-4">{en ? "Job success" : "সাফল্য"}</dt>
                        <dd className="mt-0.5 text-[13px] font-semibold text-ink mk-tabular">{freelancer.successRate}%</dd>
                      </div>
                    </dl>

                    <p className="mt-4 text-[13.5px] text-ink-3 leading-relaxed line-clamp-3">{freelancer.bio}</p>

                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={en ? "Skills" : "দক্ষতা"}>
                      {freelancer.skills.slice(0, 5).map((skill) => (
                        <li key={skill} className="px-2 py-0.5 rounded-md text-[12px] font-medium bg-subtle text-ink-2">
                          {skill}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-5">
                      <div className="pt-4 border-t border-line flex items-end justify-between gap-3">
                        <div>
                          <span className="block text-[12px] text-ink-4">{en ? "Hourly rate" : "প্রতি ঘণ্টা"}</span>
                          <span className="text-lg font-semibold tracking-[-0.03em] text-ink mk-tabular">
                            ৳{freelancer.hourlyRateBdt.toLocaleString()}
                            <span className="text-[13px] font-normal text-ink-3">/hr</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onHireDirect(freelancer.name);
                          }}
                          className="relative z-10 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-ink hover:bg-ink-hover text-white font-medium text-[13px] transition-colors cursor-pointer"
                        >
                          {en ? "Invite" : "আমন্ত্রণ"}
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Freelancer Full Profile Modal */}
      <Modal
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        title={selectedProfile?.name || "Freelancer Profile"}
        subtitle={selectedProfile?.title}
        maxWidthClass="max-w-2xl"
      >
        {selectedProfile && (
          <div className="space-y-5">
            {/* Profile Header Block */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-[rgba(16,24,40,0.08)]">
              <Avatar src={selectedProfile.avatar} name={selectedProfile.name} className="w-16 h-16 rounded-lg text-lg" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedProfile.isNidVerified && (
                    <Badge variant="verified">
                      <ShieldCheck className="w-3 h-3" /> NID Verified
                    </Badge>
                  )}
                  <Badge variant="brand" pulse>
                    Available for Work
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-3">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-ink-4" />
                    {selectedProfile.location}
                  </span>
                  <span className="inline-flex items-center gap-1 text-accent font-semibold mk-tabular">
                    <Star className="w-3.5 h-3.5 fill-accent-bright text-accent-bright" />
                    {selectedProfile.rating.toFixed(1)} ({selectedProfile.reviewsCount}{" "}
                    {lang === "en" ? "reviews" : "রিভিউ"})
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] uppercase tracking-[0.07em] text-ink-3 font-semibold block">
                  {lang === "en" ? "Hourly Rate" : "রেট"}
                </span>
                <span className="font-mono text-xl font-bold text-ink mk-tabular">
                  ৳{selectedProfile.hourlyRateBdt.toLocaleString()}
                  <span className="font-sans text-xs font-normal text-ink-3">/hr</span>
                </span>
              </div>
            </div>

            {/* Key Stats Strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-canvas border border-line">
                <span className="text-[11px] text-ink-3 font-medium flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-brand" />
                  {lang === "en" ? "Job Success" : "সাফল্যের হার"}
                </span>
                <span className="font-mono text-base font-bold text-ink mt-1 block mk-tabular">
                  {selectedProfile.successRate}%
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-canvas border border-line">
                <span className="text-[11px] text-ink-3 font-medium flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-brand" />
                  {lang === "en" ? "Total Earned" : "মোট আয়"}
                </span>
                <span className="font-mono text-base font-bold text-ink mt-1 block mk-tabular">
                  ৳{selectedProfile.earnedBdt.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-canvas border border-line">
                <span className="text-[11px] text-ink-3 font-medium flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-accent-bright" />
                  {lang === "en" ? "Verified Reviews" : "ক্লায়েন্ট রিভিউ"}
                </span>
                <span className="font-mono text-base font-bold text-ink mt-1 block mk-tabular">
                  {selectedProfile.reviewsCount}
                </span>
              </div>
            </div>

            {/* Profile Section Tabs */}
            <Tabs
              activeId={profileModalTab}
              onChange={setProfileModalTab}
              items={[
                { id: "overview", label: lang === "en" ? "Overview & Skills" : "পরিচিতি ও দক্ষতা" },
                { id: "portfolio", label: lang === "en" ? "Service Readiness" : "সেবাসমূহ" },
                { id: "track", label: lang === "en" ? "Ratings & History" : "রিভিউ ও রেকর্ড" },
              ]}
            />

            {profileModalTab === "overview" && (
              <div className="space-y-4">
                <div>
                  <h4 className="mk-eyebrow text-ink-4 mb-1.5">
                    {lang === "en" ? "Professional Biography" : "পেশাগত পরিচিতি"}
                  </h4>
                  <p className="text-xs sm:text-[13px] text-ink-2 leading-relaxed">
                    {selectedProfile.bio}
                  </p>
                </div>

                <div>
                  <h4 className="mk-eyebrow text-ink-4 mb-2">
                    {lang === "en" ? "Verified Core Skills" : "দক্ষতাসমূহ"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-brand-soft text-navy border border-brand-border"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {profileModalTab === "portfolio" && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-canvas border border-line space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-brand" />
                      {lang === "en" ? "Core Engagement Tracks" : "প্রধান কাজের ধরন"}
                    </span>
                    <span className="text-[11px] text-brand font-semibold">
                      BDT Escrow Ready
                    </span>
                  </div>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    {lang === "en"
                      ? `${selectedProfile.name} accepts structured milestone and fixed-price contracts covering ${selectedProfile.skills.slice(0, 4).join(", ")}. Live deliverable links and repository walkthroughs are shared directly upon project invitation.`
                      : `${selectedProfile.name} মাইলস্টোন ও নির্দিষ্ট বাজেটের প্রজেক্টে ${selectedProfile.skills.slice(0, 3).join(", ")} বিষয়ে কাজ করেন।`}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedProfile.skills.slice(0, 4).map((skill) => (
                    <div
                      key={skill}
                      className="p-3 rounded-xl bg-white border border-[rgba(16,24,40,0.09)] flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-ink">{skill}</span>
                      <span className="text-[10px] font-semibold text-brand bg-brand-soft px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profileModalTab === "track" && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-canvas border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold text-ink mk-tabular">
                        {selectedProfile.rating.toFixed(1)}
                      </span>
                      <div className="flex items-center gap-0.5 text-accent-bright">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i <= Math.round(selectedProfile.rating)
                                ? "fill-accent-bright"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-ink-3 mt-1">
                      {lang === "en"
                        ? `Across ${selectedProfile.reviewsCount} completed client evaluations`
                        : `${selectedProfile.reviewsCount}টি ক্লায়েন্ট মূল্যায়নের ভিত্তিতে`}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedProfile.successRate}% On-Scope Completion
                    </span>
                    <p className="text-[11px] text-ink-3 mt-0.5">
                      {selectedProfile.isNidVerified
                        ? "Porichoy Smart NID Verified"
                        : "Standard Account"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer CTAs */}
            <div className="pt-3.5 border-t border-[rgba(16,24,40,0.08)] flex flex-wrap items-center justify-between gap-2.5">
              <Link
                href="/messages"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-line-strong hover:bg-subtle text-sm font-medium text-ink"
              >
                <MessageSquare className="w-3.5 h-3.5 text-brand" />
                <span>{lang === "en" ? "Open Messages" : "মেসেজ করুন"}</span>
              </Link>

              <div className="flex items-center gap-2">
                {clientId && (
                  <button
                    type="button"
                    onClick={(e) => handleToggleSave(e, selectedProfile.id)}
                    className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                      savedIds.includes(selectedProfile.id)
                        ? "bg-danger-soft border-danger-border text-danger-strong"
                        : "bg-white border-[rgba(16,24,40,0.13)] text-ink-2 hover:bg-canvas"
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        savedIds.includes(selectedProfile.id) ? "fill-danger-strong" : ""
                      }`}
                    />
                    <span>
                      {savedIds.includes(selectedProfile.id) ? "Saved" : "Save Talent"}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const name = selectedProfile.name;
                    setSelectedProfile(null);
                    onHireDirect(name);
                  }}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium text-sm cursor-pointer"
                >
                  <span>
                    {lang === "en" ? "Post Job & Invite" : "কাজ পোস্ট ও আমন্ত্রণ"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
