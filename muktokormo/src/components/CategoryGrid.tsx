"use client";

import React from "react";
import { JobCategory } from "@/types";
import { CATEGORIES } from "@/data/mockData";
import { Code, Palette, TrendingUp, Video, FileText, Database } from "lucide-react";

interface CategoryGridProps {
  selectedCategory: string | null;
  onSelectCategory: (cat: JobCategory | null) => void;
  lang: "en" | "bn";
}

const iconMap: Record<string, React.ReactNode> = {
  Code: <Code className="w-5 h-5 text-sky-500" />,
  Palette: <Palette className="w-5 h-5 text-pink-500" />,
  TrendingUp: <TrendingUp className="w-5 h-5 text-blue-500" />,
  Video: <Video className="w-5 h-5 text-amber-500" />,
  FileText: <FileText className="w-5 h-5 text-emerald-500" />,
  Database: <Database className="w-5 h-5 text-purple-500" />,
};

export default function CategoryGrid({
  selectedCategory,
  onSelectCategory,
  lang,
}: CategoryGridProps) {
  return (
    <section className="py-12 bg-slate-50/60 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {lang === "en" ? "Explore Top Categories" : "জনপ্রিয় ক্যাটাগরিগুলো"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {lang === "en"
                ? "Browse verified talent across high-demand digital skills in Bangladesh"
                : "আপনার প্রয়োজন অনুযায়ী সেরা ক্যাটাগরি বেছে নিন"}
            </p>
          </div>

          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="mt-2 sm:mt-0 text-xs font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
            >
              {lang === "en" ? "Clear Filter (Show All)" : "ফিল্টার সরান (সব দেখুন)"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(isSelected ? null : cat.name)}
                className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-white border-sky-500 shadow-md shadow-sky-500/10 ring-2 ring-sky-500/20"
                    : "bg-white hover:bg-slate-50 border-slate-200/80 shadow-xs hover:border-slate-300"
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3">
                  {iconMap[cat.icon]}
                </div>
                <h3 className="font-bold text-xs text-slate-900 leading-snug">
                  {lang === "en" ? cat.name : cat.nameBn}
                </h3>
                <span className="mt-1.5 text-[11px] font-semibold text-slate-400">
                  {cat.count} {lang === "en" ? "jobs" : "টি কাজ"}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
