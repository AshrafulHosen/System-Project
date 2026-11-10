"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, ArrowUpRight } from "lucide-react";
import Logo from "./Logo";

interface FooterProps {
  lang: "en" | "bn";
}

export default function Footer({ lang }: FooterProps) {
  return (
    <footer className="bg-slate-50 text-slate-600 border-t border-slate-200/85 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-slate-200/80">
          {/* Brand Col */}
          <div className="space-y-3.5 lg:col-span-2 pr-4">
            <Logo size="sm" />

            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              {lang === "en"
                ? "Bangladesh's dedicated freelance marketplace. Connecting enterprises, startups, and SMEs with NID-verified talent through guaranteed BDT milestone escrow."
                : "বাংলাদেশের নিজস্ব আধুনিক ফ্রিল্যান্স মার্কেটপ্লেস। দেশীয় প্রতিষ্ঠান ও দক্ষ মুক্তপেশাজীবীদের মধ্যে নিরাপদ বিডিটি এসক্রো সেতুবন্ধন।"}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs text-slate-700 font-semibold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {lang === "en"
                  ? "Porichoy NID & Bangladesh Bank MFS Compliant"
                  : "পরিচয় এনআইডি ও এমএফএস দ্বারা সুরক্ষিত"}
              </span>
            </div>
          </div>

          {/* Col 2: For Clients */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {lang === "en" ? "For Clients" : "নিয়োগদাতাদের জন্য"}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/post-job"
                  className="hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                >
                  <span>{lang === "en" ? "Post a Job" : "কাজ পোস্ট করুন"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#freelancers-section"
                  className="hover:text-emerald-700 transition-colors"
                >
                  {lang === "en" ? "Browse Verified Talent" : "ফ্রিল্যান্সার খুঁজুন"}
                </Link>
              </li>
              <li>
                <Link
                  href="/escrow"
                  className="hover:text-emerald-700 transition-colors"
                >
                  {lang === "en" ? "100% BDT Escrow Protection" : "এসক্রো সুরক্ষা নীতি"}
                </Link>
              </li>
              <li>
                <Link
                  href="/workspaces"
                  className="hover:text-emerald-700 transition-colors"
                >
                  {lang === "en" ? "Contract Workspaces" : "কন্ট্রাক্ট ওয়ার্কস্পেস"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Talent */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {lang === "en" ? "For Freelancers" : "ফ্রিল্যান্সারদের জন্য"}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/#jobs-section"
                  className="hover:text-emerald-700 transition-colors"
                >
                  {lang === "en" ? "Explore Open Jobs" : "চলমান কাজসমূহ"}
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                >
                  <span>{lang === "en" ? "Create Freelancer Profile" : "ফ্রিল্যান্সার প্রোফাইল খুলুন"}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="/escrow"
                  className="hover:text-emerald-700 transition-colors"
                >
                  {lang === "en" ? "Flat 7% Fee Breakdown" : "মাত্র ৭% ফি কাঠামো"}
                </Link>
              </li>
              <li>
                <Link
                  href="/workspaces"
                  className="hover:text-emerald-700 transition-colors"
                >
                  {lang === "en" ? "Milestone Delivery Guide" : "মাইলস্টোন ডেলিভারি গাইড"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Payment Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {lang === "en" ? "Local Payment Rails" : "সমর্থিত পেমেন্ট মাধ্যম"}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {lang === "en"
                ? "Zero foreign exchange loss. Deposit and withdraw directly in BDT."
                : "কোনো ডলার কনভার্সন ক্ষতি ছাড়াই সরাসরি টাকায় লেনদেন।"}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-pink-600 shadow-2xs">
                bKash
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-orange-600 shadow-2xs">
                Nagad
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-purple-600 shadow-2xs">
                Rocket
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-emerald-700 shadow-2xs">
                NPSB Bank
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. Dhaka, Bangladesh.</p>
          <div className="flex items-center gap-1.5">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Bangladesh&apos;s independent workforce</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
