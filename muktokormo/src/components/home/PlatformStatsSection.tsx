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
    <section
      aria-label={lang === "en" ? "Platform at a glance" : "এক নজরে প্ল্যাটফর্ম"}
      className="relative bg-navy-ink text-white overflow-hidden"
    >
      <div aria-hidden="true" className="absolute inset-0 mk-grid-lines-dark opacity-60" />
      <div className="relative mk-container py-16 sm:py-20">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] max-w-xl">
            {lang === "en"
              ? "Built on local rails, measured in Taka."
              : "স্থানীয় পেমেন্ট ব্যবস্থায় তৈরি, টাকায় হিসাব।"}
          </h2>
          <p className="text-[14px] text-white/55 max-w-sm">
            {lang === "en"
              ? "Marketplace counts update live from the platform."
              : "মার্কেটপ্লেসের সংখ্যাগুলো সরাসরি প্ল্যাটফর্ম থেকে হালনাগাদ হয়।"}
          </p>
        </div>
        <dl className="grid grid-cols-2 lg:grid-cols-4 border-t border-white/12">
          {stats.map((st, idx) => (
            <div
              key={st.label}
              className={`pt-6 pb-2 pr-4 ${idx % 2 === 1 ? "pl-4 sm:pl-6 border-l border-white/12" : ""} ${
                idx === 2 ? "lg:pl-6 lg:border-l" : ""
              } ${idx >= 2 ? "mt-6 lg:mt-0 border-t lg:border-t-0 border-white/12" : ""}`}
            >
              <dt className="text-[13px] font-medium text-white/85">{st.label}</dt>
              <dd className="mt-3">
                <span className="block text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.045em] text-white mk-tabular leading-none">
                  {st.value}
                </span>
                <span className="mt-3 block text-[12px] text-white/50 leading-snug">{st.note}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
