"use client";

import React from "react";

interface PlatformStatsSectionProps {
  lang: "en" | "bn";
  openJobsCount: number;
  freelancersCount: number;
}

export default function PlatformStatsSection({
  lang,
  openJobsCount,
  freelancersCount,
}: PlatformStatsSectionProps) {
  const stats = [
    {
      value: openJobsCount > 0 ? `${openJobsCount}+` : "Active",
      label: lang === "en" ? "Open Marketplace Briefs" : "সক্রিয় প্রজেক্ট",
      note:
        lang === "en"
          ? "Live BDT contracts ready for proposals"
          : "বিডিটি চুক্তির জন্য প্রস্তুত",
    },
    {
      value: freelancersCount > 0 ? `${freelancersCount}+` : "NID",
      label: lang === "en" ? "Vetted Bangladeshi Talent" : "ভেরিফাইড ফ্রিল্যান্সার",
      note:
        lang === "en"
          ? "Verified engineering, design & growth pros"
          : "এনআইডি সত্যায়িত দক্ষ বিশেষজ্ঞ",
    },
    {
      value: "0%",
      label: lang === "en" ? "Forex Conversion Loss" : "ডলার কনভার্সন ক্ষতি",
      note:
        lang === "en"
          ? "100% native Bangladeshi Taka accounting"
          : "শতভাগ দেশীয় টাকায় লেনদেন",
    },
    {
      value: "4 Rails",
      label: lang === "en" ? "Local Settlement Channels" : "স্থানীয় পেমেন্ট চ্যানেল",
      note:
        lang === "en"
          ? "bKash, Nagad, Rocket & NPSB Bank via SSLCOMMERZ"
          : "বিকাশ, নগদ, রকেট ও ব্যাংক কার্ড",
    },
  ];

  return (
    <section className="py-12 bg-[#0B3B2E] text-[#FAF9F6] border-y border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((st, idx) => (
            <div
              key={st.label}
              className={`${
                idx !== 0 ? "lg:border-l lg:border-white/12 lg:pl-8" : ""
              } space-y-1`}
            >
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#7CE0B8] tracking-tight block mk-tabular">
                {st.value}
              </span>
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                {st.label}
              </h3>
              <p className="text-[11px] text-white/65 leading-snug">{st.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

