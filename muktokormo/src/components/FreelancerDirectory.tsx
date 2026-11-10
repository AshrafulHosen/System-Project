"use client";

import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { Badge, EmptyState, FreelancerCardSkeleton, Modal } from "@/components/ui";

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
  const [rateFilter, setRateFilter] = useState<"ALL" | "UNDER_1000" | "1000_2500" | "2500_PLUS">("ALL");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Freelancer | null>(null);

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
      if (rateFilter === "1000_2500" && (f.hourlyRateBdt < 1000 || f.hourlyRateBdt > 2500)) return false;
      if (rateFilter === "2500_PLUS" && f.hourlyRateBdt <= 2500) return false;

      return true;
    });
  }, [freelancers, searchQuery, rateFilter]);

  return (
    <section
      id="freelancers-section"
      className="py-16 bg-slate-50/80 border-t border-slate-200/70 text-slate-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                {lang === "en" ? "Vetted Bangladeshi Professionals" : "যাচাইকৃত বাংলাদেশি পেশাজীবী"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {lang === "en" ? "Top Verified Bangladeshi Talent" : "শীর্ষ ভেরিফাইড ফ্রিল্যান্সারগণ"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {lang === "en"
                ? "Hire available experts with NID Smart Card verification and transparent BDT hourly rates."
                : "জাতীয় পরিচয়পত্র যাচাইকৃত নির্ভরযোগ্য দেশীয় এক্সপার্টদের সাথে সরাসরি কাজ করুন।"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="verified" pulse>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {lang === "en" ? "Porichoy NID Verified" : "এনআইডি দ্বারা সত্যায়িত"}
            </Badge>
          </div>
        </div>

        {/* Search & Rate Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-7 border-b border-slate-200/70">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "en"
                  ? "Search by name, skill (React, UI/UX), or city..."
                  : "নাম, দক্ষতা বা শহর লিখে খুঁজুন..."
              }
              className="w-full pl-10 pr-8 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1">
              {lang === "en" ? "Hourly Rate:" : "ঘণ্টাপ্রতি রেট:"}
            </span>
            {[
              { id: "ALL" as const, label: lang === "en" ? "All Rates" : "সব রেট" },
              { id: "UNDER_1000" as const, label: "< ৳1,000/hr" },
              { id: "1000_2500" as const, label: "৳1k – ৳2.5k" },
              { id: "2500_PLUS" as const, label: "৳2,500+/hr" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setRateFilter(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  rateFilter === item.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
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
            icon={<UserCheck className="w-6 h-6 text-slate-400" />}
            title={lang === "en" ? "No matching freelancers found" : "কোনো ফ্রিল্যান্সার পাওয়া যায়নি"}
            description={
              lang === "en"
                ? "Try clearing your skill search or hourly rate filter to explore all verified professionals."
                : "অন্য কোনো দক্ষতা বা রেট দিয়ে খুঁজুন।"
            }
            action={
              <button
                onClick={() => {
                  setSearchQuery("");
                  setRateFilter("ALL");
                }}
                className="px-4 py-2 rounded-full bg-slate-900 text-white font-bold text-xs cursor-pointer"
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
                  onClick={() => setSelectedProfile(freelancer)}
                  className="bg-white border border-slate-200/85 hover:border-emerald-300 rounded-3xl p-6 transition-all duration-150 shadow-2xs hover:shadow-md flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Avatar & Header */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        <img
                          src={freelancer.avatar}
                          alt={freelancer.name}
                          className="w-13 h-13 rounded-2xl object-cover border border-slate-200"
                        />
                        {freelancer.isNidVerified && (
                          <div
                            className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 ring-2 ring-white"
                            title="NID Verified"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {freelancer.name}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{freelancer.rating.toFixed(1)}</span>
                            </span>
                            {clientId && (
                              <button
                                onClick={(e) => handleToggleSave(e, freelancer.id)}
                                disabled={savingId === freelancer.id}
                                aria-label={isSaved ? "Remove from saved talent" : "Save talent"}
                                className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                                  isSaved
                                    ? "bg-rose-50 border-rose-200 text-rose-600"
                                    : "bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500"
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-rose-500" : ""}`} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-emerald-700 truncate mt-0.5">
                          {freelancer.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {freelancer.location}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">
                            {lang === "en" ? "Available" : "উপলব্ধ"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="mt-3.5 text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {freelancer.bio}
                    </p>

                    {/* Skills */}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {freelancer.skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rate & Hire CTA */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                        {lang === "en" ? "Hourly Rate" : "প্রতি ঘণ্টা"}
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        ৳{freelancer.hourlyRateBdt.toLocaleString()}
                        <span className="text-xs font-normal text-slate-400">/hr</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfile(freelancer);
                        }}
                        className="px-3 py-2 rounded-full border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        {lang === "en" ? "Profile" : "প্রোফাইল"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onHireDirect(freelancer.name);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
                      >
                        <span>{lang === "en" ? "Invite" : "আমন্ত্রণ"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Freelancer Quick-View Profile Modal */}
      <Modal
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        title={selectedProfile?.name || "Freelancer Profile"}
        subtitle={selectedProfile?.title}
        maxWidthClass="max-w-lg"
      >
        {selectedProfile && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-100">
              <img
                src={selectedProfile.avatar}
                alt={selectedProfile.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
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
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedProfile.location}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {selectedProfile.rating.toFixed(1)} ({selectedProfile.reviewsCount} reviews)
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Rate
                </span>
                <span className="text-xl font-black text-slate-900">
                  ৳{selectedProfile.hourlyRateBdt.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400">/hr</span>
                </span>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" /> Success Rate
                </span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {selectedProfile.successRate}%
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> Total Earned
                </span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  ৳{selectedProfile.earnedBdt.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" /> Client Reviews
                </span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  {selectedProfile.reviewsCount}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                About
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedProfile.bio}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Verified Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedProfile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              {clientId && (
                <button
                  onClick={(e) => handleToggleSave(e, selectedProfile.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    savedIds.includes(selectedProfile.id)
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      savedIds.includes(selectedProfile.id) ? "fill-rose-500 text-rose-500" : ""
                    }`}
                  />
                  <span>{savedIds.includes(selectedProfile.id) ? "Saved" : "Save Talent"}</span>
                </button>
              )}
              <button
                onClick={() => {
                  const name = selectedProfile.name;
                  setSelectedProfile(null);
                  onHireDirect(name);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                <span>{lang === "en" ? "Post Job & Invite" : "কাজ পোস্ট ও আমন্ত্রণ"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
