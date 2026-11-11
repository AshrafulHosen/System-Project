"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Smartphone, Scale, ArrowRight, FolderKanban } from "lucide-react";

interface EscrowTrustBannerProps {
  lang: "en" | "bn";
  onOpenEscrowTest: () => void;
}

export default function EscrowTrustBanner({
  lang,
  onOpenEscrowTest,
}: EscrowTrustBannerProps) {
  return (
    <section id="escrow-section" className="py-20 bg-white text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === "en" ? "Financial Protection" : "নিরাপদ লেনদেন"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {lang === "en" ? (
              <>
                How MuktoKormo Protects{" "}
                <span className="text-emerald-600">Every Single Taka</span>
              </>
            ) : (
              <>
                মুক্তকর্মে আপনার প্রতিটি টাকা যেভাবে{" "}
                <span className="text-emerald-600">নিরাপদ থাকে</span>
              </>
            )}
          </h2>

          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            {lang === "en"
              ? "Zero payment anxiety. Milestone funds are held in BDT Escrow via bKash, Nagad, or Bank until deliverables are verified inside your Contract Workspace."
              : "কাজ পছন্দ না হওয়া পর্যন্ত কোনো টাকা কর্তন হবে না। সম্পূর্ণ বিকাশ ও নগদ এসক্রোর মাধ্যমে লেনদেন করুন।"}
          </p>
        </div>

        {/* 3 Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50/80 border border-slate-200/80 hover:border-emerald-200 rounded-3xl p-7 flex flex-col justify-between transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-2xs">
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                Step 01
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === "en" ? "Deposit in BDT Escrow" : "এসক্রোতে টাকা জমা দিন"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {lang === "en"
                  ? "Authorize milestone funding directly with bKash, Nagad, Rocket, or Bank Card. Funds stay safely locked until approval."
                  : "বিকাশ, নগদ বা ব্যাংক কার্ড দিয়ে সহজে মাইলস্টোন ডিপোজিট করুন।"}
              </p>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 hover:border-emerald-200 rounded-3xl p-7 flex flex-col justify-between transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-2xs">
                <Smartphone className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1">
                Step 02
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === "en" ? "Deliver in Workspace" : "কাজ বুঝে নিন"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {lang === "en"
                  ? "Freelancer submits deliverables, demo links, and files inside the shared Contract Workspace with full audit logs."
                  : "ফ্রিল্যান্সার কাজ জমা দিলে তা যাচাই করুন এবং প্রয়োজনে রিভিশন চান।"}
              </p>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 hover:border-emerald-200 rounded-3xl p-7 flex flex-col justify-between transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-2xs">
                <Scale className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                Step 03
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === "en" ? "Approve & Instant Payout" : "পেমেন্ট রিলিজ করুন"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {lang === "en"
                  ? "Approve the milestone to release net BDT directly to the freelancer's bKash or Nagad wallet. Backed by Dhaka dispute arbitration."
                  : "কাজ সন্তোষজনক হলে ১ ক্লিকে টাকা রিলিজ করুন ফ্রিল্যান্সারের বিকাশ ওয়ালেটে।"}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenEscrowTest}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <span>{lang === "en" ? "Launch Escrow Calculator" : "এসক্রো সিমুলেটর টেস্ট করুন"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <Link
            href="/escrow"
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/40 text-slate-700 hover:text-emerald-700 font-bold text-xs transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === "en" ? "Explore Escrow Architecture" : "এসক্রো বিস্তারিত দেখুন"}</span>
          </Link>

          <Link
            href="/workspaces"
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/40 text-slate-700 hover:text-emerald-700 font-bold text-xs transition-all"
          >
            <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === "en" ? "Tour Delivery Workspaces" : "ওয়ার্কস্পেস দেখুন"}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
