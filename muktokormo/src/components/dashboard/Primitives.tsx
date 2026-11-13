"use client";

import React from "react";
import { TrendingDown, LucideIcon, Check } from "lucide-react";
import { OnboardingTask } from "@/types";

/** Page-level header for dashboard views: eyebrow, title, context line, actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-line ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="mk-eyebrow text-ink-4 mb-2">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.035em] text-ink leading-tight">{title}</h1>
        {description && <p className="mt-1.5 text-[14px] text-ink-3 leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

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
        <h2 className="text-[17px] sm:text-lg font-semibold tracking-[-0.025em] text-ink">
          {lang === "en" ? title : titleBn}
        </h2>
        {subtitle && (
          <p className="text-[13px] text-ink-3 mt-0.5 leading-relaxed">
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
    emerald: "text-brand",
    sky: "text-brand-strong",
    amber: "text-accent",
    violet: "text-plum",
  };

  return (
    <div className="bg-white border border-line rounded-xl p-4 sm:p-5 hover:border-line-strong transition-colors">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-3">{lang === "en" ? label : labelBn}</p>
        <Icon className={`w-4 h-4 ${accents[accent]}`} aria-hidden="true" />
      </div>
      <p className="mt-3 text-[26px] sm:text-[28px] font-semibold tracking-[-0.04em] text-ink mk-tabular leading-none">
        {value}
      </p>
      {/* `delta` is contextual copy (e.g. "3 funded · 1 pending"), not a trend —
          render it neutrally so no change is implied. Only an explicit
          deltaUp={false} is styled as a negative signal. */}
      {delta && (
        <span
          className={`mt-3 inline-flex items-center gap-1 text-[12px] mk-tabular ${
            deltaUp ? "text-ink-3" : "text-danger-strong font-medium"
          }`}
        >
          {!deltaUp && <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
          {delta}
        </span>
      )}
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
    <div className="bg-white border border-line rounded-xl shadow-[var(--mk-shadow-xs)] overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-line bg-canvas/60">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="text-sm font-semibold text-ink">
            {lang === "en" ? "Last steps before you can hire" : "নিয়োগের আগে শেষ ধাপ"}
          </h3>
          <span className="text-xs font-semibold font-mono mk-tabular text-brand">
            {done}/{tasks.length}
          </span>
        </div>

        <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-[11px] text-ink-3 mt-2.5 leading-relaxed">
          {lang === "en"
            ? "Complete these steps to start hiring. There's no cost until you hire."
            : "নিয়োগ শুরু করতে এই ধাপগুলো সম্পন্ন করুন। নিয়োগ না করা পর্যন্ত কোনো খরচ নেই।"}
        </p>
      </div>

      <div className="divide-y divide-line">
        {tasks.map((task) => {
          const isDone = task.status === "DONE";
          return (
            <div
              key={task.id}
              className="px-5 sm:px-6 py-4 flex items-start gap-3 hover:bg-canvas transition-colors"
            >
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  isDone
                    ? "bg-brand border-brand text-white"
                    : "border-line-strong bg-white"
                }`}
              >
                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-xs font-semibold ${
                      isDone ? "text-ink-4 line-through" : "text-ink"
                    }`}
                  >
                    {lang === "en" ? task.label : task.labelBn}
                  </p>
                  {task.required && !isDone && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide bg-accent-soft border border-accent/25 text-accent">
                      {lang === "en" ? "Required" : "আবশ্যক"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink-3 mt-0.5 leading-relaxed">
                  {lang === "en" ? task.description : task.descriptionBn}
                </p>
              </div>

              {!isDone && (
                <a
                  href={task.href}
                  className="shrink-0 h-8 px-3 inline-flex items-center rounded-md bg-ink hover:bg-ink-hover text-white text-[12px] font-medium transition-colors"
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
