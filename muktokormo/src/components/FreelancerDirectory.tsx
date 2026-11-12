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

  return (
    <section
      id="freelancers-section"
      className="py-16 bg-[#F4F2EC]/65 border-t border-[rgba(17,19,21,0.08)] text-[#111315]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <UserCheck className="w-4 h-4 text-[#0F6E50]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F6E50]">
                {lang === "en"
                  ? "Vetted Bangladeshi Professionals"
                  : "যাচাইকৃত বাংলাদেশি পেশাজীবী"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111315]">
              {lang === "en"
                ? "Top Verified Bangladeshi Talent"
                : "শীর্ষ ভেরিফাইড ফ্রিল্যান্সারগণ"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#686E78]">
              {lang === "en"
                ? "Hire available experts with NID Smart Card verification and transparent BDT hourly rates."
                : "জাতীয় পরিচয়পত্র যাচাইকৃত নির্ভরযোগ্য দেশীয় এক্সপার্টদের সাথে সরাসরি কাজ করুন।"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="verified" pulse>
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F6E50]" />
              {lang === "en" ? "Porichoy NID Verified" : "এনআইডি দ্বারা সত্যায়িত"}
            </Badge>
          </div>
        </div>

        {/* Search & Rate Filter Bar */}
        <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-4 mb-7 shadow-[0_1px_2px_rgba(17,19,21,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#949BA6] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "en"
                  ? "Search by name, skill (React, UI/UX), or city..."
                  : "নাম, দক্ষতা বা শহর লিখে খুঁজুন..."
              }
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.11)] text-xs font-medium text-[#111315] placeholder:text-[#949BA6] focus:outline-none focus:bg-white focus:border-[#0F6E50]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#949BA6] hover:text-[#111315] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#686E78] mr-1">
              {lang === "en" ? "Rate:" : "রেট:"}
            </span>
            {[
              { id: "ALL" as const, label: lang === "en" ? "All Rates" : "সব রেট" },
              { id: "UNDER_1000" as const, label: "< ৳1,000/hr" },
              { id: "1000_2500" as const, label: "৳1k – ৳2.5k" },
              { id: "2500_PLUS" as const, label: "৳2,500+/hr" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRateFilter(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  rateFilter === item.id
                    ? "bg-[#0B3B2E] text-white"
                    : "bg-[#F4F2EC] text-[#3E434A] hover:text-[#111315] hover:bg-[#EAE7DF]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
          </div>
        ) : filteredFreelancers.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="w-6 h-6" />}
            title={
              lang === "en"
                ? "No matching freelancers found"
                : "কোনো ফ্রিল্যান্সার পাওয়া যায়নি"
            }
            description={
              lang === "en"
                ? "Try clearing your skill search or hourly rate filter to explore all verified professionals."
                : "অন্য কোনো দক্ষতা বা রেট দিয়ে খুঁজুন।"
            }
            action={
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setRateFilter("ALL");
                }}
                className="px-4 py-2 rounded-xl bg-[#0B3B2E] text-white font-semibold text-xs cursor-pointer"
              >
                {lang === "en" ? "Reset Talent Filters" : "ফিল্টার রিসেট করুন"}
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFreelancers.map((freelancer) => {
              const isSaved = savedIds.includes(freelancer.id);

              return (
                <div
                  key={freelancer.id}
                  onClick={() => openProfileModal(freelancer)}
                  className="bg-white border border-[rgba(17,19,21,0.09)] hover:border-[#0F6E50]/45 rounded-2xl p-6 transition-all duration-150 shadow-[0_1px_2px_rgba(17,19,21,0.03)] hover:shadow-[0_14px_30px_-8px_rgba(17,19,21,0.08)] flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        <img
                          src={freelancer.avatar}
                          alt={freelancer.name}
                          className="w-13 h-13 rounded-xl object-cover border border-[rgba(17,19,21,0.1)]"
                        />
                        {freelancer.isNidVerified && (
                          <div
                            className="absolute -bottom-1 -right-1 bg-[#0F6E50] text-white rounded-full p-0.5 ring-2 ring-white"
                            title="NID Verified"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm text-[#111315] group-hover:text-[#0F6E50] transition-colors truncate">
                            {freelancer.name}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="flex items-center gap-0.5 text-[#A87224] font-bold text-xs mk-tabular">
                              <Star className="w-3 h-3 fill-[#D4A24C] text-[#D4A24C]" />
                              <span>{freelancer.rating.toFixed(1)}</span>
                            </span>
                            {clientId && (
                              <button
                                type="button"
                                onClick={(e) => handleToggleSave(e, freelancer.id)}
                                disabled={savingId === freelancer.id}
                                aria-label={
                                  isSaved ? "Remove from saved talent" : "Save talent"
                                }
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  isSaved
                                    ? "bg-[#FFF1F3] border-[#FCCDD6] text-[#BE123C]"
                                    : "bg-[#FAF9F6] border-[rgba(17,19,21,0.1)] text-[#949BA6] hover:text-[#BE123C]"
                                }`}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${
                                    isSaved ? "fill-[#BE123C]" : ""
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-[#0F6E50] truncate mt-0.5">
                          {freelancer.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#686E78]">
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {freelancer.location}
                          </span>
                          <span>•</span>
                          <span className="text-[#0F6E50] font-semibold">
                            {freelancer.successRate}% {lang === "en" ? "Success" : "সাফল্য"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3.5 text-xs text-[#3E434A] leading-relaxed line-clamp-3">
                      {freelancer.bio}
                    </p>

                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {freelancer.skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)] text-[#3E434A]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[rgba(17,19,21,0.07)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#686E78] block uppercase tracking-[0.07em] font-semibold">
                        {lang === "en" ? "Hourly Rate" : "প্রতি ঘণ্টা"}
                      </span>
                      <span className="font-mono text-sm font-bold text-[#111315] mk-tabular">
                        ৳{freelancer.hourlyRateBdt.toLocaleString()}
                        <span className="font-sans text-xs font-normal text-[#686E78]">
                          /hr
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProfileModal(freelancer);
                        }}
                        className="px-3 py-2 rounded-xl border border-[rgba(17,19,21,0.13)] hover:border-[rgba(17,19,21,0.25)] text-[#111315] font-semibold text-xs transition-colors cursor-pointer"
                      >
                        {lang === "en" ? "Profile" : "প্রোফাইল"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onHireDirect(freelancer.name);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] text-white font-semibold text-xs transition-all cursor-pointer"
                      >
                        <span>{lang === "en" ? "Invite" : "আমন্ত্রণ"}</span>
                        <ArrowRight className="w-3 h-3 text-[#7CE0B8]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-[rgba(17,19,21,0.08)]">
              <img
                src={selectedProfile.avatar}
                alt={selectedProfile.name}
                className="w-16 h-16 rounded-2xl object-cover border border-[rgba(17,19,21,0.1)]"
              />
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
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#686E78]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#949BA6]" />
                    {selectedProfile.location}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#A87224] font-semibold mk-tabular">
                    <Star className="w-3.5 h-3.5 fill-[#D4A24C] text-[#D4A24C]" />
                    {selectedProfile.rating.toFixed(1)} ({selectedProfile.reviewsCount}{" "}
                    {lang === "en" ? "reviews" : "রিভিউ"})
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] uppercase tracking-[0.07em] text-[#686E78] font-semibold block">
                  {lang === "en" ? "Hourly Rate" : "রেট"}
                </span>
                <span className="font-mono text-xl font-bold text-[#111315] mk-tabular">
                  ৳{selectedProfile.hourlyRateBdt.toLocaleString()}
                  <span className="font-sans text-xs font-normal text-[#686E78]">/hr</span>
                </span>
              </div>
            </div>

            {/* Key Stats Strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)]">
                <span className="text-[11px] text-[#686E78] font-medium flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#0F6E50]" />
                  {lang === "en" ? "Job Success" : "সাফল্যের হার"}
                </span>
                <span className="font-mono text-base font-bold text-[#111315] mt-1 block mk-tabular">
                  {selectedProfile.successRate}%
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)]">
                <span className="text-[11px] text-[#686E78] font-medium flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-[#0F6E50]" />
                  {lang === "en" ? "Total Earned" : "মোট আয়"}
                </span>
                <span className="font-mono text-base font-bold text-[#111315] mt-1 block mk-tabular">
                  ৳{selectedProfile.earnedBdt.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)]">
                <span className="text-[11px] text-[#686E78] font-medium flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[#D4A24C]" />
                  {lang === "en" ? "Verified Reviews" : "ক্লায়েন্ট রিভিউ"}
                </span>
                <span className="font-mono text-base font-bold text-[#111315] mt-1 block mk-tabular">
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
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#686E78] mb-1.5">
                    {lang === "en" ? "Professional Biography" : "পেশাগত পরিচিতি"}
                  </h4>
                  <p className="text-xs sm:text-[13px] text-[#3E434A] leading-relaxed">
                    {selectedProfile.bio}
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#686E78] mb-2">
                    {lang === "en" ? "Verified Core Skills" : "দক্ষতাসমূহ"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#EAF5F0] text-[#0B3B2E] border border-[#C3E3D5]"
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
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111315] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#0F6E50]" />
                      {lang === "en" ? "Core Engagement Tracks" : "প্রধান কাজের ধরন"}
                    </span>
                    <span className="text-[11px] text-[#0F6E50] font-semibold">
                      BDT Escrow Ready
                    </span>
                  </div>
                  <p className="text-xs text-[#3E434A] leading-relaxed">
                    {lang === "en"
                      ? `${selectedProfile.name} accepts structured milestone and fixed-price contracts covering ${selectedProfile.skills.slice(0, 4).join(", ")}. Live deliverable links and repository walkthroughs are shared directly upon project invitation.`
                      : `${selectedProfile.name} মাইলস্টোন ও নির্দিষ্ট বাজেটের প্রজেক্টে ${selectedProfile.skills.slice(0, 3).join(", ")} বিষয়ে কাজ করেন।`}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedProfile.skills.slice(0, 4).map((skill) => (
                    <div
                      key={skill}
                      className="p-3 rounded-xl bg-white border border-[rgba(17,19,21,0.09)] flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-[#111315]">{skill}</span>
                      <span className="text-[10px] font-semibold text-[#0F6E50] bg-[#EAF5F0] px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profileModalTab === "track" && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[rgba(17,19,21,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold text-[#111315] mk-tabular">
                        {selectedProfile.rating.toFixed(1)}
                      </span>
                      <div className="flex items-center gap-0.5 text-[#D4A24C]">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i <= Math.round(selectedProfile.rating)
                                ? "fill-[#D4A24C]"
                                : "text-[#E3DFD5]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#686E78] mt-1">
                      {lang === "en"
                        ? `Across ${selectedProfile.reviewsCount} completed client evaluations`
                        : `${selectedProfile.reviewsCount}টি ক্লায়েন্ট মূল্যায়নের ভিত্তিতে`}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F6E50]">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedProfile.successRate}% On-Scope Completion
                    </span>
                    <p className="text-[11px] text-[#686E78] mt-0.5">
                      {selectedProfile.isNidVerified
                        ? "Porichoy Smart NID Verified"
                        : "Standard Account"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer CTAs */}
            <div className="pt-3.5 border-t border-[rgba(17,19,21,0.08)] flex flex-wrap items-center justify-between gap-2.5">
              <Link
                href="/messages"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[rgba(17,19,21,0.13)] hover:bg-[#FAF9F6] text-xs font-semibold text-[#111315]"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#0F6E50]" />
                <span>{lang === "en" ? "Open Messages" : "মেসেজ করুন"}</span>
              </Link>

              <div className="flex items-center gap-2">
                {clientId && (
                  <button
                    type="button"
                    onClick={(e) => handleToggleSave(e, selectedProfile.id)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      savedIds.includes(selectedProfile.id)
                        ? "bg-[#FFF1F3] border-[#FCCDD6] text-[#BE123C]"
                        : "bg-white border-[rgba(17,19,21,0.13)] text-[#3E434A] hover:bg-[#FAF9F6]"
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        savedIds.includes(selectedProfile.id) ? "fill-[#BE123C]" : ""
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] text-white font-semibold text-xs cursor-pointer"
                >
                  <span>
                    {lang === "en" ? "Post Job & Invite" : "কাজ পোস্ট ও আমন্ত্রণ"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#7CE0B8]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
