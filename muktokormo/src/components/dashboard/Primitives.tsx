"use client";

import React from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
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
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
          {lang === "en" ? title : titleBn}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{lang === "en" ? subtitle : subtitleBn}</p>
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
    emerald: "bg-emerald-100 text-emerald-600",
    sky: "bg-sky-100 text-sky-600",
    amber: "bg-amber-100 text-amber-600",
    violet: "bg-violet-100 text-violet-600",
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accents[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {delta && (
          <span
            className={`flex items-center gap-1 text-[11px] font-bold ${
              deltaUp ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {deltaUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
      <p className="mt-3.5 text-2xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
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
  const pct = Math.round((done / tasks.length) * 100);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="text-sm font-black text-slate-900">
            {lang === "en" ? "Last steps before you can hire" : "নিয়োগের আগে শেষ ধাপ"}
          </h3>
          <span className="text-xs font-black text-emerald-600">
            {done}/{tasks.length}
          </span>
        </div>

        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
          {lang === "en"
            ? "This can increase your hiring speed by up to 3x. There's no cost until you hire."
            : "এটি আপনার নিয়োগের গতি ৩ গুণ পর্যন্ত বাড়াতে পারে। নিয়োগ না করা পর্যন্ত কোনো খরচ নেই।"}
        </p>
      </div>

      <div className="divide-y divide-slate-50">
        {tasks.map((task) => {
          const isDone = task.status === "DONE";
          return (
            <div
              key={task.id}
              className="px-5 sm:px-6 py-4 flex items-start gap-3 hover:bg-slate-50/50 transition-colors"
            >
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  isDone
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-300 bg-white"
                }`}
              >
                {isDone && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6.5L4.5 9L10 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-xs font-bold ${
                      isDone ? "text-slate-400 line-through" : "text-slate-900"
                    }`}
                  >
                    {lang === "en" ? task.label : task.labelBn}
                  </p>
                  {task.required && !isDone && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-amber-100 text-amber-700">
                      {lang === "en" ? "Required" : "আবশ্যক"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {lang === "en" ? task.description : task.descriptionBn}
                </p>
              </div>

              {!isDone && (
                <a
                  href={task.href}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors"
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
