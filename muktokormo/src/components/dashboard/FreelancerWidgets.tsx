"use client";

import React from "react";
import Link from "next/link";
import { Send, Sparkles, TrendingUp, Clock, ArrowRight, MessageSquare, Lock } from "lucide-react";
import { TrackedProposal, TrackedProposalStatus } from "@/types";
import { formatBdt } from "@/lib/format";

const STATUS_STYLES: Record<TrackedProposalStatus, { cls: string; label: string; labelBn: string }> = {
  PENDING: {
    cls: "bg-subtle text-ink-2 border-line-strong",
    label: "Pending",
    labelBn: "অপেক্ষমাণ",
  },
  SHORTLISTED: {
    cls: "bg-accent-soft text-accent border-accent/25",
    label: "Shortlisted",
    labelBn: "শর্টলিস্ট",
  },
  INTERVIEW: {
    cls: "bg-plum-soft text-plum border-plum/20",
    label: "Interview",
    labelBn: "ইন্টারভিউ",
  },
  ACCEPTED: {
    cls: "bg-brand-soft text-navy border-brand/25",
    label: "Accepted",
    labelBn: "গৃহীত",
  },
  REJECTED: {
    cls: "bg-danger-soft text-danger border-danger/20",
    label: "Not selected",
    labelBn: "বাতিল",
  },
};

export function ProposalTracker({
  proposals,
  lang,
  onOpenChat,
}: {
  proposals: TrackedProposal[];
  lang: "en" | "bn";
  onOpenChat?: (proposalId: string) => void;
}) {
  return (
    <div className="bg-white border border-line rounded-xl shadow-[var(--mk-shadow-xs)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-line bg-canvas">
              {[
                { en: "Job", bn: "কাজ" },
                { en: "Your bid", bn: "আপনার বিড" },
                { en: "You earn", bn: "আপনি পাবেন" },
                { en: "Submitted", bn: "জমা" },
                { en: "Status", bn: "অবস্থা" },
              ].map((h) => (
                <th
                  key={h.en}
                  className="px-4 sm:px-5 py-3 text-left mk-eyebrow text-ink-3"
                >
                  {lang === "en" ? h.en : h.bn}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {proposals.map((p) => {
              const status = STATUS_STYLES[p.status];
              return (
                <tr key={p.id} className="hover:bg-canvas transition-colors">
                  <td className="px-4 sm:px-5 py-3.5">
                    <p className="text-xs font-semibold text-ink leading-snug">
                      {lang === "en" ? p.jobTitle : p.jobTitleBn}
                    </p>
                    <p className="text-[10px] text-ink-3 mt-0.5">{p.clientName}</p>
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-semibold font-mono mk-tabular text-ink whitespace-nowrap">
                    {formatBdt(p.bidBdt)}
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-semibold font-mono mk-tabular text-brand whitespace-nowrap">
                    {formatBdt(p.netBdt)}
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 text-[11px] text-ink-3 whitespace-nowrap font-mono mk-tabular">
                    {p.submittedLabel}
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border ${status.cls}`}
                      >
                        {lang === "en" ? status.label : status.labelBn}
                      </span>

                      {p.status === "ACCEPTED" ? (
                        <div className="flex items-center gap-1.5">
                          {onOpenChat ? (
                            <button
                              type="button"
                              onClick={() => onOpenChat(p.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-brand-soft text-navy border border-brand/25 hover:bg-brand-soft-2 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-2.5 h-2.5 text-brand" />
                              <span>{lang === "en" ? "Chat" : "চ্যাট"}</span>
                            </button>
                          ) : (
                            <Link
                              href={`/dashboard/freelancer?tab=messages&threadId=${p.id}#messages`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-brand-soft text-navy border border-brand/25 hover:bg-brand-soft-2 transition-colors"
                            >
                              <MessageSquare className="w-2.5 h-2.5 text-brand" />
                              <span>{lang === "en" ? "Chat" : "চ্যাট"}</span>
                            </Link>
                          )}
                          <Link
                            href="/contracts"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-navy hover:bg-navy-ink text-white transition-colors"
                          >
                            <span>Workspace</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-ink-4 bg-canvas border border-line font-medium">
                          <Lock className="w-2.5 h-2.5 text-ink-4" />
                          <span>{lang === "en" ? "Chat locked" : "চ্যাট লকড"}</span>
                        </span>
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
    <div className="bg-white border border-line rounded-xl p-5 sm:p-6 shadow-[var(--mk-shadow-xs)]">
      <div className="flex items-center gap-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#F2F4F7"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#2C6FB7"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base font-semibold font-mono mk-tabular text-ink">
            {pct}%
          </span>
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-ink">
            {lang === "en" ? "Profile strength" : "প্রোফাইলের শক্তি"}
          </h4>
          <p className="text-[11px] text-ink-3 mt-1 leading-relaxed">
            {lang === "en"
              ? "A strong, complete profile helps clients find you and increases your chances of getting hired."
              : "সম্পূর্ণ প্রোফাইলে ক্লায়েন্ট আপনাকে সহজে পাবেন এবং নিয়োগের সম্ভাবনা বাড়বে।"}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-line space-y-2">
        {missing.map((m, i) => (
          <div key={m} className="flex items-center gap-2 text-[11px]">
            <span className="w-4 h-4 rounded-full bg-accent-soft border border-accent/25 text-accent flex items-center justify-center shrink-0">
              <Clock className="w-2.5 h-2.5" />
            </span>
            <span className="text-ink-2">{lang === "en" ? m : missingBn[i]}</span>
          </div>
        ))}
      </div>

      <a
        href="/signup?step=profile"
        className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-navy hover:bg-navy-ink text-white text-xs font-semibold transition-all"
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
    <div className="bg-white border border-line rounded-xl p-5 sm:p-6 shadow-[var(--mk-shadow-xs)]">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-4 h-4 text-brand" />
        <h4 className="text-sm font-semibold text-ink">
          {lang === "en" ? "Skills in demand" : "চাহিদাসম্পন্ন দক্ষতা"}
        </h4>
      </div>
      <p className="text-[11px] text-ink-3 mb-3.5">
        {lang === "en"
          ? "Add these to your profile to appear in more searches."
          : "বেশি সার্চে দেখাতে এগুলো প্রোফাইলে যোগ করুন।"}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="px-2.5 py-1.5 rounded-lg bg-canvas hover:bg-brand-soft hover:text-navy border border-line hover:border-brand/30 text-[11px] font-semibold text-ink-2 transition-all cursor-pointer"
          >
            + {s}
          </button>
        ))}
      </div>

      <a
        href="#find-work"
        className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-subtle hover:bg-muted text-ink text-xs font-semibold transition-all"
      >
        <Send className="w-3.5 h-3.5 text-brand" />
        {lang === "en" ? "Browse matching jobs" : "মিলে যাওয়া কাজ দেখুন"}
      </a>
    </div>
  );
}
