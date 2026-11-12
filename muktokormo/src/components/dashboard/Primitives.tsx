"use client";

import React from "react";
import { TrendingUp, TrendingDown, LucideIcon, Check } from "lucide-react";
import { OnboardingTask } from "@/types";

export function SectionHeading({
  title,
  titleBn,
  subtitle,
  subtitleBn,
  lang,
  action,
}: {
  title: string;
  titleBn: string;
  subtitle?: string;
  subtitleBn?: string;
  lang: "en" | "bn";
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315]">
          {lang === "en" ? title : titleBn}
        </h2>
        {subtitle && (
          <p className="text-xs text-[#686E78] mt-0.5 leading-relaxed">
            {lang === "en" ? subtitle : subtitleBn}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  labelBn,
  value,
  delta,
  deltaUp = true,
  lang,
  accent = "emerald",
}: {
  icon: LucideIcon;
  label: string;
  labelBn: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  lang: "en" | "bn";
  accent?: "emerald" | "sky" | "amber" | "violet";
}) {
  const accents: Record<string, string> = {
    emerald: "bg-[#EAF5F0] text-[#0F6E50] border-[#0F6E50]/15",
    sky: "bg-[#EEF5FA] text-[#1E5B88] border-[#1E5B88]/15",
    amber: "bg-[#FEF6E6] text-[#A87224] border-[#A87224]/20",
    violet: "bg-[#F3EFFA] text-[#5B3E96] border-[#5B3E96]/15",
  };

  return (
    <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(17,19,21,0.04)] hover:border-[rgba(17,19,21,0.16)] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center ${accents[accent]}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        {delta && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold font-mono mk-tabular px-2 py-0.5 rounded-md ${
              deltaUp
                ? "text-[#0F6E50] bg-[#EAF5F0]"
                : "text-[#DC2626] bg-[#FEF2F2]"
            }`}
          >
            {deltaUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
      <p className="mt-3.5 text-2xl font-bold tracking-tight text-[#111315] font-mono mk-tabular">
        {value}
      </p>
      <p className="text-[11px] font-medium text-[#686E78] mt-1">
        {lang === "en" ? label : labelBn}
      </p>
    </div>
  );
}

export function OnboardingChecklist({
  tasks,
  lang,
}: {
  tasks: OnboardingTask[];
  lang: "en" | "bn";
}) {
  const done = tasks.filter((t) => t.status === "DONE").length;
  const pct = Math.round((done / Math.max(tasks.length, 1)) * 100);

  return (
    <div className="bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-[0_1px_2px_rgba(17,19,21,0.04)] overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-[rgba(17,19,21,0.08)] bg-[#FAF9F6]/60">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="text-sm font-bold text-[#111315]">
            {lang === "en" ? "Last steps before you can hire" : "নিয়োগের আগে শেষ ধাপ"}
          </h3>
          <span className="text-xs font-bold font-mono mk-tabular text-[#0F6E50]">
            {done}/{tasks.length}
          </span>
        </div>

        <div className="h-1.5 w-full bg-[#F4F2EC] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0F6E50] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-[11px] text-[#686E78] mt-2.5 leading-relaxed">
          {lang === "en"
            ? "This can increase your hiring speed by up to 3x. There's no cost until you hire."
            : "এটি আপনার নিয়োগের গতি ৩ গুণ পর্যন্ত বাড়াতে পারে। নিয়োগ না করা পর্যন্ত কোনো খরচ নেই।"}
        </p>
      </div>

      <div className="divide-y divide-[rgba(17,19,21,0.06)]">
        {tasks.map((task) => {
          const isDone = task.status === "DONE";
          return (
            <div
              key={task.id}
              className="px-5 sm:px-6 py-4 flex items-start gap-3 hover:bg-[#FAF9F6] transition-colors"
            >
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  isDone
                    ? "bg-[#0F6E50] border-[#0F6E50] text-white"
                    : "border-[rgba(17,19,21,0.22)] bg-white"
                }`}
              >
                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-xs font-semibold ${
                      isDone ? "text-[#949BA6] line-through" : "text-[#111315]"
                    }`}
                  >
                    {lang === "en" ? task.label : task.labelBn}
                  </p>
                  {task.required && !isDone && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide bg-[#FEF6E6] border border-[#A87224]/25 text-[#A87224]">
                      {lang === "en" ? "Required" : "আবশ্যক"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#686E78] mt-0.5 leading-relaxed">
                  {lang === "en" ? task.description : task.descriptionBn}
                </p>
              </div>

              {!isDone && (
                <a
                  href={task.href}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[#0B3B2E] hover:bg-[#07281F] text-white text-[10px] font-semibold transition-colors"
                >
                  {task.actionLabel}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
