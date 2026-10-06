"use client";

import React from "react";
import Link from "next/link";
import { Send, Sparkles, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { TrackedProposal, TrackedProposalStatus } from "@/types";
import { formatBdt } from "@/lib/format";

const STATUS_STYLES: Record<TrackedProposalStatus, { cls: string; label: string; labelBn: string }> = {
  PENDING: {
    cls: "bg-slate-50 text-slate-700 border-slate-200",
    label: "Pending",
    labelBn: "অপেক্ষমাণ",
  },
  SHORTLISTED: {
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Shortlisted",
    labelBn: "শর্টলিস্ট",
  },
  INTERVIEW: {
    cls: "bg-violet-50 text-violet-700 border-violet-200",
    label: "Interview",
    labelBn: "ইন্টারভিউ",
  },
  ACCEPTED: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Accepted",
    labelBn: "গৃহীত",
  },
  REJECTED: {
    cls: "bg-red-50 text-red-600 border-red-200",
    label: "Not selected",
    labelBn: "বাতিল",
  },
};

export function ProposalTracker({
  proposals,
  lang,
}: {
  proposals: TrackedProposal[];
  lang: "en" | "bn";
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {[
                { en: "Job", bn: "কাজ" },
                { en: "Your bid", bn: "আপনার বিড" },
                { en: "You earn", bn: "আপনি পাবেন" },
                { en: "Submitted", bn: "জমা" },
                { en: "Status", bn: "অবস্থা" },
              ].map((h) => (
                <th
                  key={h.en}
                  className="px-4 sm:px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500"
                >
                  {lang === "en" ? h.en : h.bn}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {proposals.map((p) => {
              const status = STATUS_STYLES[p.status];
              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 sm:px-5 py-3.5">
                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      {lang === "en" ? p.jobTitle : p.jobTitleBn}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.clientName}</p>
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-black text-slate-900 whitespace-nowrap">
                    {formatBdt(p.bidBdt)}
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-black text-emerald-600 whitespace-nowrap">
                    {formatBdt(p.netBdt)}
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                    {p.submittedLabel}
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${status.cls}`}
                      >
                        {lang === "en" ? status.label : status.labelBn}
                      </span>

                      {p.status === "ACCEPTED" && (
                        <Link
                          href="/contracts/ctr-8842"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                        >
                          <span>Workspace</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProfileStrength({
  pct,
  missing,
  missingBn,
  lang,
}: {
  pct: number;
  missing: string[];
  missingBn: string[];
  lang: "en" | "bn";
}) {
  const ring = 2 * Math.PI * 34;
  const offset = ring - (pct / 100) * ring;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#10b981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base font-black text-slate-900">
            {pct}%
          </span>
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-black text-slate-900">
            {lang === "en" ? "Profile strength" : "প্রোফাইলের শক্তি"}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            {lang === "en"
              ? "A strong, complete profile helps clients find you and increases your chances of getting hired."
              : "সম্পূর্ণ প্রোফাইলে ক্লায়েন্ট আপনাকে সহজে পাবেন এবং নিয়োগের সম্ভাবনা বাড়বে।"}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
        {missing.map((m, i) => (
          <div key={m} className="flex items-center gap-2 text-[11px]">
            <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-2.5 h-2.5" />
            </span>
            <span className="text-slate-600">{lang === "en" ? m : missingBn[i]}</span>
          </div>
        ))}
      </div>

      <a
        href="/signup?step=profile"
        className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {lang === "en" ? "Complete profile" : "প্রোফাইল সম্পূর্ণ করুন"}
      </a>
    </div>
  );
}

export function RecommendedSkills({
  lang,
  onPick,
}: {
  lang: "en" | "bn";
  onPick: (skill: string) => void;
}) {
  const skills = [
    "Next.js",
    "TypeScript",
    "PostgreSQL",
    "Tailwind CSS",
    "bKash API",
    "Figma",
    "React Native",
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-4 h-4 text-emerald-600" />
        <h4 className="text-sm font-black text-slate-900">
          {lang === "en" ? "Skills in demand" : "চাহিদাসম্পন্ন দক্ষতা"}
        </h4>
      </div>
      <p className="text-[11px] text-slate-500 mb-3.5">
        {lang === "en"
          ? "Add these to your profile to appear in more searches."
          : "বেশি সার্চে দেখাতে এগুলো প্রোফাইলে যোগ করুন।"}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-[11px] font-bold text-slate-700 transition-all cursor-pointer"
          >
            + {s}
          </button>
        ))}
      </div>

      <a
        href="#find-work"
        className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
      >
        <Send className="w-3.5 h-3.5" />
        {lang === "en" ? "Browse matching jobs" : "মিলে যাওয়া কাজ দেখুন"}
      </a>
    </div>
  );
}
