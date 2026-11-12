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
} from "lucide-react";

interface CategoryGridProps {
  selectedCategory: string | null;
  onSelectCategory: (cat: JobCategory | null) => void;
  lang: "en" | "bn";
  jobs?: Job[];
}

const iconMap: Record<string, React.ReactNode> = {
  Code: <Code className="w-4.5 h-4.5" />,
  Palette: <Palette className="w-4.5 h-4.5" />,
  TrendingUp: <TrendingUp className="w-4.5 h-4.5" />,
  Video: <Video className="w-4.5 h-4.5" />,
  FileText: <FileText className="w-4.5 h-4.5" />,
  Database: <Database className="w-4.5 h-4.5" />,
};

export default function CategoryGrid({
  selectedCategory,
  onSelectCategory,
  lang,
  jobs,
}: CategoryGridProps) {
  return (
    <section className="py-14 bg-[#F4F2EC]/70 border-y border-[rgba(17,19,21,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0F6E50] block mb-1.5">
              {lang === "en" ? "Specialized Disciplines" : "বিশেষায়িত ক্যাটাগরি"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111315] tracking-tight">
              {lang === "en" ? "Explore Marketplace Categories" : "জনপ্রিয় ক্যাটাগরিগুলো"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#686E78]">
              {lang === "en"
                ? "Filter active opportunities and vetted specialists across Bangladesh's core digital verticals."
                : "আপনার প্রয়োজন অনুযায়ী সেরা ক্যাটাগরি বেছে নিন"}
            </p>
          </div>

          {selectedCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#EAF5F0] text-[#0B3B2E] border border-[#C3E3D5] hover:bg-[#dcefe6] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "Clear Category Filter" : "ফিল্টার সরান"}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const liveCount = jobs
              ? jobs.filter((j) => j.category === cat.name).length
              : cat.count;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : cat.name)}
                className={`group flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-[#0B3B2E] border-[#0B3B2E] text-white shadow-[0_12px_24px_-8px_rgba(11,59,46,0.3)] -translate-y-0.5"
                    : "bg-white border-[rgba(17,19,21,0.09)] hover:border-[#0F6E50]/50 shadow-[0_1px_2px_rgba(17,19,21,0.03)] hover:shadow-[0_10px_24px_-8px_rgba(17,19,21,0.08)] hover:-translate-y-0.5"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 transition-colors border ${
                    isSelected
                      ? "bg-white/12 border-white/15 text-[#7CE0B8]"
                      : "bg-[#FAF9F6] border-[rgba(17,19,21,0.08)] text-[#0F6E50] group-hover:bg-[#EAF5F0] group-hover:border-[#C3E3D5]"
                  }`}
                >
                  {iconMap[cat.icon]}
                </div>
                <div>
                  <h3
                    className={`font-semibold text-xs leading-snug ${
                      isSelected ? "text-white" : "text-[#111315] group-hover:text-[#0F6E50]"
                    }`}
                  >
                    {lang === "en" ? cat.name : cat.nameBn}
                  </h3>
                  <span
                    className={`mt-1.5 text-[11px] font-medium block mk-tabular ${
                      isSelected ? "text-[#7CE0B8]" : "text-[#686E78]"
                    }`}
                  >
                    {liveCount}{" "}
                    {lang === "en"
                      ? liveCount === 1
                        ? "open job"
                        : "open jobs"
                      : "টি কাজ"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
