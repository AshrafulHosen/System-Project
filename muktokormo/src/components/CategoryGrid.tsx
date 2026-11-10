"use client";

import React from "react";
import { Job, JobCategory } from "@/types";
import { CATEGORIES } from "@/data/mockData";
import { Code, Palette, TrendingUp, Video, FileText, Database, X } from "lucide-react";

interface CategoryGridProps {
  selectedCategory: string | null;
  onSelectCategory: (cat: JobCategory | null) => void;
  lang: "en" | "bn";
  jobs?: Job[];
}

const iconMap: Record<string, React.ReactNode> = {
  Code: <Code className="w-5 h-5 text-emerald-600" />,
  Palette: <Palette className="w-5 h-5 text-rose-500" />,
  TrendingUp: <TrendingUp className="w-5 h-5 text-blue-600" />,
  Video: <Video className="w-5 h-5 text-amber-500" />,
  FileText: <FileText className="w-5 h-5 text-teal-600" />,
  Database: <Database className="w-5 h-5 text-indigo-600" />,
};

export default function CategoryGrid({
  selectedCategory,
  onSelectCategory,
  lang,
  jobs,
}: CategoryGridProps) {
  return (
    <section className="py-12 bg-slate-50/70 border-y border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-7 gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              {lang === "en" ? "Specialized Disciplines" : "বিশেষায়িত ক্যাটাগরি"}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {lang === "en" ? "Explore Top Categories" : "জনপ্রিয় ক্যাটাগরিগুলো"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {lang === "en"
                ? "Browse NID-verified talent across high-demand digital skills in Bangladesh"
                : "আপনার প্রয়োজন অনুযায়ী সেরা ক্যাটাগরি বেছে নিন"}
            </p>
          </div>

          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
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
                onClick={() => onSelectCategory(isSelected ? null : cat.name)}
                className={`group flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-white border-emerald-600 shadow-md shadow-emerald-600/10 ring-2 ring-emerald-500/20 -translate-y-0.5"
                    : "bg-white hover:bg-white border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-sm hover:-translate-y-0.5"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl border mb-3 transition-colors ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-100 group-hover:bg-emerald-50/50 group-hover:border-emerald-100"
                  }`}
                >
                  {iconMap[cat.icon]}
                </div>
                <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                  {lang === "en" ? cat.name : cat.nameBn}
                </h3>
                <span className="mt-1.5 text-[11px] font-semibold text-slate-400">
                  {liveCount} {lang === "en" ? (liveCount === 1 ? "open job" : "open jobs") : "টি কাজ"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
