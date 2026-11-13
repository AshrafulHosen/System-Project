"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileEdit,
  UserCheck,
  Lock,
  CheckCircle2,
  Send,
  FolderGit2,
  Wallet,
  ShieldCheck,
} from "lucide-react";

interface HowItWorksSectionProps {
  lang: "en" | "bn";
  /** Show a link to the full /how-it-works page (used on the homepage). */
  showPageLink?: boolean;
}

export default function HowItWorksSection({ lang, showPageLink = false }: HowItWorksSectionProps) {
  const [track, setTrack] = useState<"client" | "freelancer">("client");

  const clientSteps = [
    {
      num: "01",
      icon: FileEdit,
      title: lang === "en" ? "Post a Scoped Brief" : "সুস্পষ্ট প্রজেক্ট পোস্ট করুন",
      desc:
        lang === "en"
          ? "Outline milestones, BDT budget, and required technical stack in under 2 minutes."
          : "বাজেট, সময়সীমা ও কাজের ধাপ উল্লেখ করে ২ মিনিটেই কাজ পোস্ট করুন।",
    },
    {
      num: "02",
      icon: UserCheck,
      title: lang === "en" ? "Evaluate Verified Bids" : "ভেরিফাইড বিড যাচাই করুন",
      desc:
        lang === "en"
          ? "Review proposals side-by-side from NID-checked Bangladeshi professionals, shortlist top fits, and discuss scope."
          : "এনআইডি যাচাইকৃত ফ্রিল্যান্সারদের প্রস্তাব, রেট ও পূর্ববর্তী অভিজ্ঞতা তুলনা করুন।",
    },
    {
      num: "03",
      icon: Lock,
      title: lang === "en" ? "Lock Milestone in BDT Escrow" : "বিডিটি এসক্রোতে ফান্ড লক",
      desc:
        lang === "en"
          ? "Fund contract milestones using bKash, Nagad, or local card rails before execution starts."
          : "বিকাশ, নগদ বা ব্যাংক কার্ডে মাইলস্টোন ফান্ড নিরাপদ এসক্রোতে জমা রাখুন।",
    },
    {
      num: "04",
      icon: CheckCircle2,
      title: lang === "en" ? "Inspect & Release Payout" : "যাচাই করে পেমেন্ট রিলিজ",
      desc:
        lang === "en"
          ? "Test live URLs and asset files inside the Contract Workspace, then release funds with 1 click."
          : "লাইভ ডেমো ও ফাইল পরীক্ষা করে সন্তুষ্ট হলেই পেমেন্ট রিলিজ করুন।",
    },
  ];

  const freelancerSteps = [
    {
      num: "01",
      icon: ShieldCheck,
      title: lang === "en" ? "Verify Identity & Profile" : "প্রোফাইল ও এনআইডি যাচাই",
      desc:
        lang === "en"
          ? "Complete your Porichoy NID verification, technical specialty tags, and BDT hourly rate."
          : "আপনার দক্ষতা, পোর্টফোলিও এবং পরিচয় এনআইডি যাচাই সম্পন্ন করুন।",
    },
    {
      num: "02",
      icon: Send,
      title: lang === "en" ? "Submit Structured Proposals" : "মাইলস্টোন প্রস্তাব পাঠান",
      desc:
        lang === "en"
          ? "Bid transparently in Taka with milestone breakdowns, delivery timelines, and net payout previews."
          : "আপনার পারিশ্রমিক ও ডেলিভারি পরিকল্পনা উল্লেখ করে প্রজেক্টে বিড করুন।",
    },
    {
      num: "03",
      icon: FolderGit2,
      title: lang === "en" ? "Deliver Inside Workspace" : "ওয়ার্কস্পেসে কাজ জমা দিন",
      desc:
        lang === "en"
          ? "Begin only once escrow funding is confirmed. Submit staging URLs, repos, and communicate in real time."
          : "এসক্রো ফান্ড নিশ্চিত হওয়ার পর কাজ শুরু করে ডেমো লিংক ও ফাইল জমা দিন।",
    },
    {
      num: "04",
      icon: Wallet,
      title: lang === "en" ? "Settle Direct to MFS / Bank" : "সরাসরি বিকাশ/ব্যাংকে পেমেন্ট",
      desc:
        lang === "en"
          ? "Once approved, receive net BDT earnings straight to bKash, Nagad, Rocket, or local bank accounts."
          : "অনুমোদনের পর সরাসরি আপনার বিকাশ, নগদ বা ব্যাংক অ্যাকাউন্টে টাকা পান।",
    },
  ];

  const steps = track === "client" ? clientSteps : freelancerSteps;
  const en = lang === "en";

  return (
    <section id="how-it-works" className="py-20 sm:py-24 lg:py-28 bg-white border-y border-line">
      <div className="mk-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12 lg:mb-16">
          <div className="lg:col-span-7">
            <span className="mk-eyebrow text-brand">{en ? "How it works" : "কার্যপদ্ধতি"}</span>
            <h2 className="mk-h2 mt-4 text-ink">
              {en ? "Four steps. No guesswork." : "চারটি ধাপ। কোনো অনিশ্চয়তা নেই।"}
            </h2>
            {showPageLink && (
              <Link
                href="/how-it-works"
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
              >
                {en ? "Read the full guide — escrow, fees and FAQ" : "সম্পূর্ণ গাইড পড়ুন — এসক্রো, ফি ও প্রশ্নোত্তর"}
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <div
              role="tablist"
              aria-label={en ? "Choose your role" : "আপনার ভূমিকা"}
              className="inline-flex items-center bg-subtle border border-line p-1 rounded-lg"
            >
              {(
                [
                  { id: "client", label: en ? "For clients" : "ক্লায়েন্টদের জন্য" },
                  { id: "freelancer", label: en ? "For freelancers" : "ফ্রিল্যান্সারদের জন্য" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={track === t.id}
                  onClick={() => setTrack(t.id)}
                  className={`h-9 px-4 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                    track === t.id
                      ? "bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,0.08)] border border-line"
                      : "text-ink-3 hover:text-ink border border-transparent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ol key={track} className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {/* connecting rule on desktop */}
          <span aria-hidden="true" className="hidden lg:block absolute top-5 left-0 right-0 h-px bg-line-strong" />
          {steps.map((s, idx) => {
            const IconComp = s.icon;
            const isLast = idx === steps.length - 1;
            return (
              <li key={s.num} className="relative mk-fade-up" style={{ animationDelay: `${idx * 70}ms` }}>
                <div className="flex items-center gap-3">
                  <span
                    className={`relative z-10 w-10 h-10 rounded-md flex items-center justify-center ${
                      isLast ? "bg-brand text-white" : "bg-ink text-white"
                    }`}
                  >
                    <IconComp className="w-4.5 h-4.5" aria-hidden="true" />
                  </span>
                  <span className="relative z-10 bg-white pr-3 font-mono text-[12px] text-ink-4">
                    {en ? "Step" : "ধাপ"} {s.num}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.025em] text-ink leading-snug">
                  {s.title}
                </h3>
                <p className="mt-2 text-[14px] text-ink-3 leading-relaxed">{s.desc}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
