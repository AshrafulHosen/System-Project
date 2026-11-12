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

  return (
    <section
      id="escrow-section"
      className="py-20 bg-white text-[#111315] border-t border-[rgba(17,19,21,0.08)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5F0] border border-[#C3E3D5] text-[#0B3B2E] text-[11px] font-semibold uppercase tracking-[0.08em] mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F6E50]" />
            <span>{lang === "en" ? "Financial Protection" : "নিরাপদ লেনদেন"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111315]">
            {lang === "en" ? (
              <>
                How MuktoKormo safeguards{" "}
                <span className="font-serif italic font-normal text-[#0F6E50]">
                  every single Taka
                </span>
              </>
            ) : (
              <>
                মুক্তকর্মে আপনার প্রতিটি টাকা যেভাবে{" "}
                <span className="font-serif italic font-normal text-[#0F6E50]">
                  নিরাপদ থাকে
                </span>
              </>
            )}
          </h2>

          <p className="mt-3 text-sm text-[#686E78] leading-relaxed">
            {lang === "en"
              ? "Milestone funds are locked inside a transparent ledger before work begins, eliminating unpaid invoices for talent and non-delivery risk for clients."
              : "কাজ পছন্দ না হওয়া পর্যন্ত কোনো টাকা কর্তন হবে না। সম্পূর্ণ বিকাশ ও নগদ এসক্রোর মাধ্যমে লেনদেন করুন।"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p) => {
            const IconComp = p.icon;
            return (
              <div
                key={p.step}
                className="bg-[#FAF9F6] border border-[rgba(17,19,21,0.09)] hover:border-[#0F6E50]/40 rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-8px_rgba(17,19,21,0.08)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-white border border-[rgba(17,19,21,0.09)] flex items-center justify-center shadow-[0_1px_2px_rgba(17,19,21,0.04)] text-[#0F6E50]">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-[#686E78]">
                      STEP {p.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#111315] mb-2">
                    {p.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#3E434A] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenEscrowTest}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] text-[#FAF9F6] font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            <span>
              {lang === "en" ? "Launch Escrow Simulator" : "এসক্রো সিমুলেটর টেস্ট করুন"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#7CE0B8]" />
          </button>

          <Link
            href="/escrow"
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-[rgba(17,19,21,0.14)] hover:border-[#0F6E50] bg-white hover:bg-[#FAF9F6] text-[#111315] font-semibold text-xs transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F6E50]" />
            <span>
              {lang === "en" ? "Explore Escrow Architecture" : "এসক্রো বিস্তারিত দেখুন"}
            </span>
          </Link>

          <Link
            href="/workspaces"
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-[rgba(17,19,21,0.14)] hover:border-[#0F6E50] bg-white hover:bg-[#FAF9F6] text-[#111315] font-semibold text-xs transition-all"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#0F6E50]" />
            <span>
              {lang === "en" ? "Tour Delivery Workspaces" : "ওয়ার্কস্পেস দেখুন"}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
