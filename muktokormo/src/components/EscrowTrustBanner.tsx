"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Scale,
  ArrowRight,
  FolderKanban,
} from "lucide-react";

interface EscrowTrustBannerProps {
  lang: "en" | "bn";
  onOpenEscrowTest: () => void;
}

export default function EscrowTrustBanner({
  lang,
  onOpenEscrowTest,
}: EscrowTrustBannerProps) {
  const pillars = [
    {
      step: "01",
      icon: Lock,
      title: lang === "en" ? "Deposit in BDT Escrow" : "এসক্রোতে টাকা জমা দিন",
      desc:
        lang === "en"
          ? "Authorize milestone funding via SSLCOMMERZ (bKash, Nagad, Rocket, or Bank Card). Funds remain locked safely in escrow custody."
          : "বিকাশ, নগদ বা ব্যাংক কার্ড দিয়ে সহজে মাইলস্টোন ডিপোজিট করুন।",
    },
    {
      step: "02",
      icon: Smartphone,
      title: lang === "en" ? "Deliver in Workspace" : "কাজ বুঝে নিন",
      desc:
        lang === "en"
          ? "Freelancers submit live demo URLs, source repositories, and files inside the auditable Contract Workspace."
          : "ফ্রিল্যান্সার কাজ জমা দিলে তা যাচাই করুন এবং প্রয়োজনে রিভিশন চান।",
    },
    {
      step: "03",
      icon: Scale,
      title: lang === "en" ? "Approve & Instant Payout" : "পেমেন্ট রিলিজ করুন",
      desc:
        lang === "en"
          ? "Approve deliverables to trigger automated net payout settlement in BDT — backed by structured Dhaka arbitration."
          : "কাজ সন্তোষজনক হলে ১ ক্লিকে টাকা রিলিজ করুন ফ্রিল্যান্সারের বিকাশ ওয়ালেটে।",
    },
  ];

  const en = lang === "en";

  return (
    <section id="escrow-section" className="relative py-20 sm:py-24 lg:py-28 bg-navy text-white overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 mk-grid-lines-dark opacity-50" />
      <div aria-hidden="true" className="absolute -left-40 bottom-0 w-[520px] h-[520px] rounded-full bg-brand-bright/20 blur-[110px]" />

      <div className="relative mk-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14 lg:mb-16">
          <div className="lg:col-span-7">
            <span className="mk-eyebrow text-brand-light">{en ? "Financial protection" : "নিরাপদ লেনদেন"}</span>
            <h2 className="mk-h2 mt-4 text-white">
              {en ? (
                <>
                  How every Taka is safeguarded,{" "}
                  <span className="text-white/45">end to end.</span>
                </>
              ) : (
                <>
                  মুক্তকর্মে আপনার প্রতিটি টাকা যেভাবে{" "}
                  <span className="text-white/45">নিরাপদ থাকে</span>
                </>
              )}
            </h2>
          </div>
          <p className="lg:col-span-5 text-[15px] text-white/65 leading-relaxed">
            {en
              ? "Milestone funds are locked in a transparent ledger before work begins — removing unpaid-invoice risk for talent and non-delivery risk for clients."
              : "কাজ পছন্দ না হওয়া পর্যন্ত কোনো টাকা কর্তন হবে না। সম্পূর্ণ বিকাশ ও নগদ এসক্রোর মাধ্যমে লেনদেন করুন।"}
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/12 rounded-2xl overflow-hidden border border-white/12">
          {pillars.map((p, idx) => {
            const IconComp = p.icon;
            return (
              <li key={p.step} className="relative bg-navy p-7 sm:p-9 flex flex-col min-h-[260px]">
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-md bg-white/8 border border-white/12 flex items-center justify-center text-brand-light">
                    <IconComp className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[12px] text-white/40">
                    {en ? "Step" : "ধাপ"} {p.step}
                  </span>
                </div>
                <h3 className="mt-auto pt-10 text-xl font-semibold tracking-[-0.025em] text-white">{p.title}</h3>
                <p className="mt-2 text-[14px] text-white/60 leading-relaxed">{p.desc}</p>
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-0.5 bg-brand-light"
                  style={{ width: `${((idx + 1) / pillars.length) * 100}%` }}
                />
              </li>
            );
          })}
        </ol>

        <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenEscrowTest}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-white hover:bg-brand-soft text-navy font-medium text-sm transition-colors cursor-pointer"
          >
            {en ? "Try the escrow simulator" : "এসক্রো সিমুলেটর টেস্ট করুন"}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <Link
            href="/escrow"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-medium text-sm transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-brand-light" aria-hidden="true" />
            {en ? "Escrow architecture" : "এসক্রো বিস্তারিত দেখুন"}
          </Link>
          <Link
            href="/workspaces"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-medium text-sm transition-colors"
          >
            <FolderKanban className="w-4 h-4 text-brand-light" aria-hidden="true" />
            {en ? "Delivery workspaces" : "ওয়ার্কস্পেস দেখুন"}
          </Link>
        </div>
      </div>
    </section>
  );
}
