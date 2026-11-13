"use client";

import React from "react";
import { Job, JobCategory } from "@/types";
import { CATEGORIES } from "@/data/mockData";
import {
  Code,
  Palette,
  TrendingUp,
  Video,
  FileText,
  Database,
  X,
  ArrowUpRight,
} from "lucide-react";

interface CategoryGridProps {
  selectedCategory: string | null;
  onSelectCategory: (cat: JobCategory | null) => void;
  lang: "en" | "bn";
  jobs?: Job[];
  onOpenPostJob?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code,
  Palette,
  TrendingUp,
  Video,
  FileText,
  Database,
};

const CATEGORY_BLURBS: Record<string, { en: string; bn: string }> = {
  "Web & App Development": {
    en: "Storefronts, SaaS dashboards, Flutter apps and payment integrations.",
    bn: "ই-কমার্স, SaaS ড্যাশবোর্ড, ফ্লাটার অ্যাপ ও পেমেন্ট ইন্টিগ্রেশন।",
  },
  "UI/UX & Graphic Design": {
    en: "Product design, brand identity and social kits.",
    bn: "প্রোডাক্ট ডিজাইন, ব্র্যান্ড আইডেন্টিটি ও সোশ্যাল কিট।",
  },
  "Digital Marketing & SEO": {
    en: "Meta & TikTok ads, tracking and search growth.",
    bn: "মেটা ও টিকটক অ্যাড, ট্র্যাকিং ও এসইও।",
  },
  "Video Editing & Animation": {
    en: "Reels, YouTube edits and motion graphics.",
    bn: "রিলস, ইউটিউব এডিট ও মোশন গ্রাফিক্স।",
  },
  "Bangla & English Content": {
    en: "Copywriting, SEO articles and translation.",
    bn: "কপিরাইটিং, এসইও আর্টিকেল ও অনুবাদ।",
  },
  "Virtual Assistance & Data": {
    en: "Operations support, research and data entry.",
    bn: "অপারেশন সাপোর্ট, রিসার্চ ও ডাটা এন্ট্রি।",
  },
};

export default function CategoryGrid({
  selectedCategory,
  onSelectCategory,
  lang,
  jobs,
  onOpenPostJob,
}: CategoryGridProps) {
  const en = lang === "en";

  const countFor = (name: string, fallback: number) =>
    jobs ? jobs.filter((j) => j.category === name).length : fallback;

  const countLabel = (n: number) =>
    en ? `${n} open ${n === 1 ? "job" : "jobs"}` : `${n}টি কাজ`;

  return (
    <section id="categories" className="py-20 sm:py-24 bg-canvas">
      <div className="mk-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 lg:mb-12">
          <div className="max-w-2xl">
            <span className="mk-eyebrow text-brand">{en ? "Discover" : "ক্যাটাগরি"}</span>
            <h2 className="mk-h2 mt-4 text-ink">
              {en ? "Every discipline a digital business needs." : "ডিজিটাল ব্যবসার প্রতিটি প্রয়োজনে।"}
            </h2>
          </div>
          {selectedCategory ? (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="inline-flex items-center gap-1.5 self-start md:self-auto h-9 px-3 rounded-md text-[13px] font-medium bg-ink text-white hover:bg-ink-hover transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              {en ? "Clear category filter" : "ফিল্টার সরান"}
            </button>
          ) : (
            <p className="text-[15px] text-ink-3 max-w-sm md:text-right">
              {en
                ? "Pick a category to filter the live job feed below."
                : "নিচের কাজের তালিকা ফিল্টার করতে একটি ক্যাটাগরি বেছে নিন।"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 lg:grid-rows-2 gap-3 lg:gap-4">
          {CATEGORIES.map((cat, idx) => {
            const isSelected = selectedCategory === cat.name;
            const Icon = iconMap[cat.icon] ?? Code;
            const live = countFor(cat.name, cat.count);
            const featured = idx === 0;
            const blurb = CATEGORY_BLURBS[cat.name];

            if (featured) {
              return (
                <button
                  key={cat.name}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectCategory(isSelected ? null : cat.name)}
                  className={`group relative sm:col-span-2 lg:row-span-2 min-h-[260px] lg:min-h-0 text-left rounded-2xl p-6 sm:p-8 overflow-hidden flex flex-col justify-between transition-[box-shadow,transform] duration-200 cursor-pointer mk-dark-card hover:-translate-y-0.5 ${
                    isSelected ? "ring-4 ring-brand-light/60" : ""
                  }`}
                >
                  <span aria-hidden="true" className="absolute inset-0 mk-hatch-dark opacity-50 [mask-image:radial-gradient(circle_at_100%_100%,black,transparent_70%)]" />
                  <span className="relative flex items-start justify-between">
                    <span className="w-12 h-12 rounded-lg bg-white/10 border border-white/15 text-brand-light flex items-center justify-center">
                      <Icon className="w-5.5 h-5.5" />
                    </span>
                    <ArrowUpRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" aria-hidden="true" />
                  </span>
                  <span className="relative">
                    <span className="mk-eyebrow text-brand-light">{en ? "Most requested" : "সবচেয়ে চাহিদাসম্পন্ন"}</span>
                    <span className="mt-3 block text-2xl sm:text-[32px] font-semibold tracking-[-0.035em] leading-[1.1] text-white">
                      {en ? cat.name : cat.nameBn}
                    </span>
                    {blurb && (
                      <span className="mt-2 block text-[14px] text-white/65 max-w-sm">
                        {en ? blurb.en : blurb.bn}
                      </span>
                    )}
                    <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-white mk-tabular">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-light" aria-hidden="true" />
                      {countLabel(live)}
                    </span>
                  </span>
                </button>
              );
            }

            return (
              <button
                key={cat.name}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectCategory(isSelected ? null : cat.name)}
                className={`group text-left rounded-xl p-5 border flex flex-col justify-between gap-6 min-h-[168px] transition-[border-color,background-color,transform] duration-200 cursor-pointer hover:-translate-y-0.5 ${
                  isSelected
                    ? "bg-ink border-ink text-white"
                    : "bg-white border-line hover:border-line-strong"
                }`}
              >
                <span className="flex items-start justify-between">
                  <span
                    className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
                      isSelected ? "bg-white/10 text-white" : "bg-subtle text-navy group-hover:bg-brand-soft group-hover:text-brand"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <span className={`text-[12px] font-medium mk-tabular ${isSelected ? "text-white/70" : "text-ink-4"}`}>
                    {countLabel(live)}
                  </span>
                </span>
                <span>
                  <span className={`block text-[15px] font-semibold tracking-[-0.02em] leading-snug ${isSelected ? "text-white" : "text-ink"}`}>
                    {en ? cat.name : cat.nameBn}
                  </span>
                  {blurb && (
                    <span className={`mt-1 block text-[12.5px] leading-snug ${isSelected ? "text-white/65" : "text-ink-3"}`}>
                      {en ? blurb.en : blurb.bn}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          {/* Closing tile — custom brief */}
          {onOpenPostJob && (
            <button
              type="button"
              onClick={onOpenPostJob}
              className="group text-left rounded-xl p-5 border border-dashed border-line-strong hover:border-brand bg-transparent hover:bg-brand-soft/50 flex flex-col justify-between gap-6 min-h-[168px] transition-colors cursor-pointer"
            >
              <span className="w-10 h-10 rounded-md border border-line-strong group-hover:border-brand text-ink-2 group-hover:text-brand flex items-center justify-center text-xl leading-none transition-colors" aria-hidden="true">
                +
              </span>
              <span>
                <span className="block text-[15px] font-semibold tracking-[-0.02em] text-ink">
                  {en ? "Something else?" : "অন্য কিছু?"}
                </span>
                <span className="mt-1 block text-[12.5px] text-ink-3">
                  {en ? "Post a custom brief in minutes." : "কয়েক মিনিটে কাস্টম কাজ পোস্ট করুন।"}
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
