"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Check } from "lucide-react";
import Logo from "@/components/Logo";

export interface WizardStep {
  id: string;
  label: string;
  labelBn: string;
}

interface OnboardingShellProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  steps: WizardStep[];
  currentIndex: number;
  onBack?: () => void;
  backLabel?: string;
  headerRight?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const WIDTHS = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function StepDots({
  steps,
  currentIndex,
  compact = false,
}: {
  steps: WizardStep[];
  currentIndex: number;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "flex items-center gap-1.5" : "space-y-2.5"}>
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        if (compact) {
          return (
            <span
              key={step.id}
              title={step.label}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isCurrent
                  ? "w-6 bg-emerald-600"
                  : isDone
                    ? "w-3 bg-emerald-300"
                    : "w-3 bg-slate-200"
              }`}
            />
          );
        }
        return (
          <div key={step.id} className="flex items-center gap-2.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border-2 transition-all ${
                isCurrent
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : isDone
                    ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : i + 1}
            </span>
            <span
              className={`text-xs font-bold ${
                isCurrent ? "text-slate-900" : isDone ? "text-emerald-700" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  );
}

export default function OnboardingShell({
  title,
  subtitle,
  eyebrow,
  steps,
  currentIndex,
  onBack,
  backLabel = "Back",
  headerRight,
  width = "md",
  children,
  footer,
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
            ) : (
              <Link href="/" className="flex items-center gap-1.5 group cursor-pointer">
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline text-xs font-bold text-slate-600">Home</span>
              </Link>
            )}
          </div>

          <Link href="/">
            <Logo size="sm" />
          </Link>

          <div className="text-xs text-slate-500 flex items-center gap-3">
            {headerRight}
            <span className="hidden md:flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              NID & MFS Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-start justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full space-y-5">
          {/* Title block */}
          <div className="text-center space-y-1.5">
            {eyebrow && (
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                {eyebrow}
              </span>
            )}
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">{subtitle}</p>}
          </div>

          {/* Card */}
          <div
            className={`${WIDTHS[width]} mx-auto bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden relative`}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

            {steps.length > 0 && (
              <div className="relative z-10 px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {currentIndex + 1} of {steps.length}
                  </span>
                  <StepDots steps={steps} currentIndex={currentIndex} compact />
                </div>
                <ProgressBar current={currentIndex + 1} total={steps.length} />
              </div>
            )}

            <div className="relative z-10 p-6 sm:p-8">{children}</div>

            {footer && (
              <div className="relative z-10 px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-5 text-xs text-slate-400">
        © 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. All rights reserved.
      </div>
    </div>
  );
}
