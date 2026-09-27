"use client";

import React from "react";
import { ShieldCheck, Lock, Smartphone, Scale, ArrowRight } from "lucide-react";

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
            <span>{lang === "en" ? "Financial Protection" : "নিরাপদ লেনদেন"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {lang === "en" ? (
              <>
                How MuktoKormo Protects{" "}
                <span className="text-sky-500">Every Single Taka</span>
              </>
            ) : (
              <>
                মুক্তকর্মে আপনার প্রতিটি টাকা যেভাবে{" "}
                <span className="text-sky-500">নিরাপদ থাকে</span>
              </>
            )}
          </h2>

          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            {lang === "en"
              ? "No risk of getting scammed. Funds are held safely in BDT Escrow via bKash, Nagad, or Bank until you approve the work."
              : "কাজ পছন্দ না হওয়া পর্যন্ত কোনো টাকা কর্তন হবে না। সম্পূর্ণ বিকাশ ও নগদ এসক্রোর মাধ্যমে লেনদেন করুন।"}
          </p>
        </div>

        {/* 3 Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-xs">
                <Lock className="w-5 h-5 text-sky-500" />
              </div>
              <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block mb-1">
                Step 01
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === "en" ? "Deposit in BDT Escrow" : "এসক্রোতে টাকা জমা দিন"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === "en"
                  ? "Authorize milestone payment directly with bKash, Nagad, or Bank Card. Funds are securely locked."
                  : "বিকাশ, নগদ বা ব্যাংক কার্ড দিয়ে সহজে মাইলস্টোন ডিপোজিট করুন।"}
              </p>
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-xs">
                <Smartphone className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Step 02
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === "en" ? "Work Delivered & Inspected" : "কাজ বুঝে নিন"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === "en"
                  ? "Freelancer delivers files. You inspect the deliverables and request revisions if needed."
                  : "ফ্রিল্যান্সার কাজ জমা দিলে তা যাচাই করুন এবং প্রয়োজনে রিভিশন চান।"}
              </p>
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-xs">
                <Scale className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                Step 03
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === "en" ? "Approve & Release" : "পেমেন্ট রিলিজ করুন"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === "en"
                  ? "Approve work to instantly release funds to freelancer's bKash. 24/7 Dhaka arbitration if any dispute arises."
                  : "কাজ সন্তোষজনক হলে ১ ক্লিকে টাকা রিলিজ করুন ফ্রিল্যান্সারের বিকাশ ওয়ালেটে।"}
              </p>
            </div>
          </div>

        </div>

        {/* Action button */}
        <div className="mt-10 text-center">
          <button
            onClick={onOpenEscrowTest}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <span>{lang === "en" ? "Test Escrow Simulator" : "এসক্রো সিমুলেটর টেস্ট করুন"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
}
