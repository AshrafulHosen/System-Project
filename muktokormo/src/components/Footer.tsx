"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowUpRight, Lock } from "lucide-react";
import Logo from "./Logo";

interface FooterProps {
  lang: "en" | "bn";
}

export default function Footer({ lang }: FooterProps) {
  return (
    <footer className="bg-[#0B3B2E] text-white/80 border-t border-white/10 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="space-y-4 lg:col-span-2 pr-4">
            <Logo size="md" inverted showSublabel />

            <p className="text-xs sm:text-[13px] text-white/70 leading-relaxed max-w-sm">
              {lang === "en"
                ? "Bangladesh's dedicated freelance & BDT escrow platform. Connecting ambitious businesses with NID-verified talent through structured milestone delivery."
                : "বাংলাদেশের নিজস্ব আধুনিক ফ্রিল্যান্স মার্কেটপ্লেস। দেশীয় প্রতিষ্ঠান ও এনআইডি-ভেরিফাইড দক্ষ মুক্তপেশাজীবীদের মধ্যে নিরাপদ বিডিটি এসক্রো সেতুবন্ধন।"}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/8 border border-white/12 text-[11px] text-white/90 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#7CE0B8] shrink-0" />
              <span>
                {lang === "en"
                  ? "Porichoy NID & Local BDT Settlement Rails"
                  : "পরিচয় এনআইডি ও স্থানীয় বিডিটি এসক্রো দ্বারা সুরক্ষিত"}
              </span>
            </div>
          </div>

          {/* For Clients */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.09em] text-white">
              {lang === "en" ? "For Clients" : "নিয়োগদাতাদের জন্য"}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/post-job"
                  className="hover:text-[#7CE0B8] transition-colors inline-flex items-center gap-1"
                >
                  <span>{lang === "en" ? "Post a Project" : "কাজ পোস্ট করুন"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#freelancers-section"
                  className="hover:text-[#7CE0B8] transition-colors"
                >
                  {lang === "en" ? "Browse Verified Talent" : "ফ্রিল্যান্সার খুঁজুন"}
                </Link>
              </li>
              <li>
                <Link
                  href="/escrow"
                  className="hover:text-[#7CE0B8] transition-colors"
                >
                  {lang === "en" ? "100% BDT Escrow Protection" : "এসক্রো সুরক্ষা নীতি"}
                </Link>
              </li>
              <li>
                <Link
                  href="/workspaces"
                  className="hover:text-[#7CE0B8] transition-colors"
                >
                  {lang === "en" ? "Contract Workspaces" : "কন্ট্রাক্ট ওয়ার্কস্পেস"}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Talent */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.09em] text-white">
              {lang === "en" ? "For Freelancers" : "ফ্রিল্যান্সারদের জন্য"}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/#jobs-section"
                  className="hover:text-[#7CE0B8] transition-colors"
                >
                  {lang === "en" ? "Explore Open Jobs" : "চলমান কাজসমূহ"}
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="hover:text-[#7CE0B8] transition-colors inline-flex items-center gap-1"
                >
                  <span>
                    {lang === "en"
                      ? "Create Freelancer Profile"
                      : "ফ্রিল্যান্সার প্রোফাইল খুলুন"}
                  </span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link
                  href="/escrow"
                  className="hover:text-[#7CE0B8] transition-colors"
                >
                  {lang === "en" ? "Escrow & Payout Breakdown" : "এসক্রো ও পেমেন্ট কাঠামো"}
                </Link>
              </li>
              <li>
                <Link
                  href="/workspaces"
                  className="hover:text-[#7CE0B8] transition-colors"
                >
                  {lang === "en" ? "Milestone Delivery Guide" : "মাইলস্টোন ডেলিভারি গাইড"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Local Payment Rails */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.09em] text-white">
              {lang === "en" ? "Settlement Rails" : "পেমেন্ট মাধ্যম"}
            </h4>
            <p className="text-xs text-white/65 leading-relaxed">
              {lang === "en"
                ? "Zero foreign exchange loss. Deposit and settle contracts natively in Bangladeshi Taka."
                : "কোনো ডলার কনভার্সন ক্ষতি ছাড়াই সরাসরি টাকায় লেনদেন।"}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {["bKash", "Nagad", "Rocket", "NPSB Bank", "SSLCOMMERZ"].map((rail) => (
                <span
                  key={rail}
                  className="px-2.5 py-1 rounded-lg bg-white/8 border border-white/12 text-[11px] font-semibold text-white/90"
                >
                  {rail}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/55 gap-3">
          <p>© 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. Dhaka, Bangladesh.</p>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#7CE0B8]" />
            <span>
              {lang === "en"
                ? "Built with financial clarity for Bangladesh's digital workforce"
                : "বাংলাদেশের ডিজিটাল কর্মীবাহিনীর জন্য স্বচ্ছ আর্থিক অবকাঠামো"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
