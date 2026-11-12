"use client";

import React from "react";
import Link from "next/link";
import {
  Rocket,
  Wallet,
  ShieldCheck,
  Lock,
  UserCircle,
  Send,
  Briefcase,
  FileText,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { DashboardContract, ResourceCardData, DraftJob, WalletEntry } from "@/types";
import { formatBdt, formatSignedBdt } from "@/lib/format";

const RESOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Wallet,
  ShieldCheck,
  Lock,
  UserCircle,
  Send,
};

const METHOD_STYLES: Record<string, string> = {
  BKASH: "bg-[#FCEEF4] text-[#B81D5D] border-[#B81D5D]/20",
  NAGAD: "bg-[#FEF2EC] text-[#C2410C] border-[#C2410C]/20",
  ROCKET: "bg-[#F3EFFA] text-[#6D28D9] border-[#6D28D9]/20",
  BANK: "bg-[#EEF5FA] text-[#1E5B88] border-[#1E5B88]/20",
  ESCROW: "bg-[#EAF5F0] text-[#0F6E50] border-[#0F6E50]/20",
  PLATFORM_FEE: "bg-[#F4F2EC] text-[#3E434A] border-[rgba(17,19,21,0.12)]",
};

const STAGE_STYLES: Record<string, string> = {
  ACTIVE: "bg-[#EEF5FA] text-[#1E5B88] border-[#1E5B88]/20",
  COMPLETED: "bg-[#EAF5F0] text-[#0F6E50] border-[#0F6E50]/25",
  DISPUTED: "bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/20",
  TERMINATED: "bg-[#F4F2EC] text-[#686E78] border-[rgba(17,19,21,0.12)]",
};

export function ResourceGrid({
  resources,
  lang,
}: {
  resources: ResourceCardData[];
  lang: "en" | "bn";
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
      {resources.map((res) => {
        const Icon = RESOURCE_ICONS[res.icon] || Rocket;
        return (
          <div
            key={res.id}
            className="rounded-2xl border border-[rgba(17,19,21,0.09)] bg-white p-5 transition-all hover:border-[#0B3B2E]/30 hover:shadow-sm cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] border border-[#0F6E50]/15 text-[#0F6E50] flex items-center justify-center mb-3.5 group-hover:bg-[#0B3B2E] group-hover:text-white transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#111315]">
              {lang === "en" ? res.title : res.titleBn}
            </h4>
            <p className="text-[11px] text-[#686E78] mt-1 leading-relaxed">
              {lang === "en" ? res.body : res.bodyBn}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F6E50] mt-3 group-hover:gap-2 transition-all">
              {lang === "en" ? "Learn more" : "আরও জানুন"}
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        );
      })}

      <Link
        href="/escrow"
        className="mk-dark-card rounded-2xl p-5 flex flex-col justify-center items-start hover:opacity-95 transition-opacity"
      >
        <p className="text-sm font-bold text-white">
          {lang === "en" ? "View all resources" : "সব রিসোর্স দেখুন"}
        </p>
        <p className="text-[11px] text-white/70 mt-1.5 leading-relaxed">
          {lang === "en"
            ? "Guides, escrow calculators and policy updates for Bangladesh."
            : "বাংলাদেশি ফ্রিল্যান্স অর্থনীতির গাইড ও পলিসি।"}
        </p>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A7E6CE] mt-3">
          {lang === "en" ? "Explore escrow guide" : "এসক্রো গাইড দেখুন"}
          <ArrowRight className="w-3 h-3" />
        </span>
      </Link>
    </div>
  );
}

export function ContractCard({
  contract,
  perspective,
  lang,
}: {
  contract: DashboardContract;
  perspective: "client" | "freelancer";
  lang: "en" | "bn";
}) {
  return (
    <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-5 shadow-[0_1px_2px_rgba(17,19,21,0.04)] hover:border-[rgba(17,19,21,0.18)] transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          {contract.counterpartyAvatar ? (
            <img
              src={contract.counterpartyAvatar}
              alt={contract.counterparty}
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-[rgba(17,19,21,0.1)]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#F4F2EC] flex items-center justify-center shrink-0 text-[#3E434A]">
              <Briefcase className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#111315] leading-snug">
              {lang === "en" ? contract.jobTitle : contract.jobTitleBn}
            </h4>
            <p className="text-[11px] text-[#686E78] mt-0.5 truncate">
              {perspective === "client" ? "Talent" : "Client"}: {contract.counterparty}
            </p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
            STAGE_STYLES[contract.stage] ?? STAGE_STYLES.ACTIVE
          }`}
        >
          {contract.stage}
        </span>
      </div>

      <div className="h-1.5 w-full bg-[#F4F2EC] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-[#0F6E50] rounded-full transition-all duration-500"
          style={{ width: `${contract.progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-[#FAF9F6] border border-[rgba(17,19,21,0.06)] rounded-xl py-2 px-1">
          <p className="text-[9px] font-semibold text-[#686E78] uppercase">
            {lang === "en" ? "Total" : "মোট"}
          </p>
          <p className="text-xs font-bold font-mono mk-tabular text-[#111315] mt-0.5">
            {formatBdt(contract.totalBdt)}
          </p>
        </div>
        <div className="bg-[#FEF6E6] border border-[#A87224]/20 rounded-xl py-2 px-1">
          <p className="text-[9px] font-semibold text-[#A87224] uppercase">
            {lang === "en" ? "In escrow" : "এসক্রোতে"}
          </p>
          <p className="text-xs font-bold font-mono mk-tabular text-[#8A5A17] mt-0.5">
            {formatBdt(contract.escrowHeldBdt)}
          </p>
        </div>
        <div className="bg-[#EAF5F0] border border-[#0F6E50]/20 rounded-xl py-2 px-1">
          <p className="text-[9px] font-semibold text-[#0F6E50] uppercase">
            {lang === "en" ? "Released" : "মুক্ত"}
          </p>
          <p className="text-xs font-bold font-mono mk-tabular text-[#0B3B2E] mt-0.5">
            {formatBdt(contract.releasedBdt)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-[rgba(17,19,21,0.07)]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-[#111315] truncate">
            {contract.nextMilestone}
          </p>
          <p className="text-[10px] text-[#686E78] mt-0.5">{contract.nextMilestoneDue}</p>
        </div>
        <Link
          href={`/contracts/${contract.id}`}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EAF5F0] hover:bg-[#DDF0E6] text-[#0B3B2E] text-xs font-semibold transition-all cursor-pointer border border-[#0F6E50]/20"
        >
          <span>{lang === "en" ? "Workspace" : "ওয়ার্কস্পেস"}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#0F6E50]" />
        </Link>
      </div>

      <p className="text-[10px] text-[#949BA6] mt-2 font-mono mk-tabular">{contract.startedLabel}</p>
    </div>
  );
}

export function DraftJobsTable({
  drafts,
  lang,
}: {
  drafts: DraftJob[];
  lang: "en" | "bn";
}) {
  if (drafts.length === 0) {
    return (
      <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#EAF5F0] text-[#0F6E50] flex items-center justify-center mx-auto">
          <Briefcase className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#111315]">
          {lang === "en" ? "No jobs posted yet" : "এখনও কোনো কাজের পোস্ট করা হয়নি"}
        </h3>
        <p className="text-xs text-[#686E78] max-w-md mx-auto">
          {lang === "en"
            ? "Create your first job post to connect with vetted Bangladeshi developers and specialists."
            : "দক্ষ বাংলাদেশি ফ্রিল্যান্সারদের সাথে যুক্ত হতে আপনার প্রথম কাজের পোস্ট তৈরি করুন।"}
        </p>
        <Link
          href="/post-job"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] text-white text-xs font-semibold transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === "en" ? "Post a Job Now" : "এখনই কাজ পোস্ট করুন"}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-[0_1px_2px_rgba(17,19,21,0.04)] overflow-hidden">
      <div className="divide-y divide-[rgba(17,19,21,0.06)]">
        {drafts.map((draft) => {
          const isLive = draft.status === "LIVE";
          return (
            <div
              key={draft.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-[#FAF9F6] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                      isLive
                        ? "bg-[#EAF5F0] text-[#0B3B2E] border-[#0F6E50]/25"
                        : "bg-[#FEF6E6] text-[#A87224] border-[#A87224]/25"
                    }`}
                  >
                    {isLive
                      ? lang === "en"
                        ? "Live"
                        : "প্রকাশিত"
                      : lang === "en"
                        ? "Draft"
                        : "খসড়া"}
                  </span>
                  <span className="text-[10px] text-[#949BA6]">{draft.updatedLabel}</span>
                </div>

                <h4 className="text-xs font-bold text-[#111315] leading-snug truncate">
                  {lang === "en" ? draft.title : draft.titleBn}
                </h4>
                <p className="text-[11px] text-[#686E78] mt-0.5">{draft.category}</p>

                {!isLive && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1 flex-1 bg-[#F4F2EC] rounded-full overflow-hidden max-w-[160px]">
                      <div
                        className="h-full bg-[#A87224] rounded-full"
                        style={{ width: `${draft.completionPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold font-mono mk-tabular text-[#686E78]">
                      {draft.completionPct}%
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-semibold text-[#686E78] uppercase">
                    {lang === "en" ? "Budget" : "বাজেট"}
                  </p>
                  <p className="text-sm font-bold font-mono mk-tabular text-[#111315]">
                    {formatBdt(draft.budgetBdt)}
                  </p>
                </div>

                {isLive && (
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-semibold text-[#686E78] uppercase">
                      {lang === "en" ? "Proposals" : "আবেদন"}
                    </p>
                    <p className="text-sm font-bold font-mono mk-tabular text-[#0F6E50]">
                      {draft.proposalCount}
                    </p>
                  </div>
                )}

                <Link
                  href={isLive ? `/jobs/${draft.id}` : `/post-job`}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
                    isLive
                      ? "bg-[#F4F2EC] hover:bg-[#EAE7DE] text-[#111315]"
                      : "bg-[#0B3B2E] hover:bg-[#07281F] text-white"
                  }`}
                >
                  {isLive
                    ? lang === "en"
                      ? "View & Manage"
                      : "দেখুন ও পরিচালনা"
                    : lang === "en"
                      ? "Fill in draft"
                      : "খসড়া পূরণ"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LedgerList({
  entries,
  lang,
  emptyLabel,
  emptyLabelBn,
}: {
  entries: WalletEntry[];
  lang: "en" | "bn";
  emptyLabel: string;
  emptyLabelBn: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-10 text-center">
        <p className="text-xs text-[#686E78]">{lang === "en" ? emptyLabel : emptyLabelBn}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-[0_1px_2px_rgba(17,19,21,0.04)] overflow-hidden">
      <div className="divide-y divide-[rgba(17,19,21,0.06)]">
        {entries.map((entry) => {
          const isCredit = entry.amountBdt > 0;
          return (
            <div
              key={entry.id}
              className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-[#FAF9F6] transition-colors"
            >
              <span
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                  METHOD_STYLES[entry.method] ?? METHOD_STYLES.PLATFORM_FEE
                }`}
              >
                {entry.method === "ESCROW" ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : entry.method === "PLATFORM_FEE" ? (
                  <FileText className="w-3.5 h-3.5" />
                ) : (
                  <Wallet className="w-3.5 h-3.5" />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#111315] truncate">
                  {lang === "en" ? entry.label : entry.labelBn}
                </p>
                <p className="text-[10px] text-[#686E78] mt-0.5 font-mono mk-tabular">
                  {entry.createdLabel} · {entry.method}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-xs font-bold font-mono mk-tabular ${
                    isCredit ? "text-[#0F6E50]" : "text-[#111315]"
                  }`}
                >
                  {isCredit ? `+${formatBdt(entry.amountBdt)}` : formatSignedBdt(entry.amountBdt)}
                </p>
                {entry.status === "PENDING" && (
                  <span className="text-[9px] font-semibold text-[#A87224]">
                    {lang === "en" ? "Pending" : "অপেক্ষমাণ"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
