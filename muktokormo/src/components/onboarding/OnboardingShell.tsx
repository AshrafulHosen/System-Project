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
                  ? "w-7 bg-[#0B3B2E]"
                  : isDone
                    ? "w-3.5 bg-[#0F6E50]"
                    : "w-3 bg-[rgba(17,19,21,0.12)]"
              }`}
            />
          );
        }
        return (
          <div key={step.id} className="flex items-center gap-2.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border transition-all font-mono mk-tabular ${
                isCurrent
                  ? "bg-[#0B3B2E] border-[#0B3B2E] text-white"
                  : isDone
                    ? "bg-[#EAF5F0] border-[#0F6E50]/30 text-[#0F6E50]"
                    : "bg-white border-[rgba(17,19,21,0.12)] text-[#949BA6]"
              }`}
            >
              {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : i + 1}
            </span>
            <span
              className={`text-xs font-semibold ${
                isCurrent ? "text-[#111315]" : isDone ? "text-[#0F6E50]" : "text-[#686E78]"
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
    <div className="h-1.5 w-full bg-[#F4F2EC] rounded-full overflow-hidden">
      <div
        className="h-full bg-[#0F6E50] rounded-full transition-all duration-500"
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
    <div className="min-h-screen bg-[#FAF9F6] text-[#111315] flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[rgba(17,19,21,0.08)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3E434A] hover:text-[#111315] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
            ) : (
              <Link href="/" className="inline-flex items-center gap-1.5 group cursor-pointer">
                <ArrowLeft className="w-4 h-4 text-[#686E78] group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline text-xs font-semibold text-[#3E434A]">Home</span>
              </Link>
            )}
          </div>

          <Link href="/" className="shrink-0">
            <Logo size="sm" />
          </Link>

          <div className="text-xs text-[#686E78] flex items-center gap-3">
            {headerRight}
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF5F0] text-[#0B3B2E] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F6E50]" />
              NID &amp; MFS Compliant
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex items-start justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full space-y-5 py-2">
          {/* Title block */}
          <div className="text-center space-y-2">
            {eyebrow && (
              <span className="inline-block px-3 py-1 rounded-lg bg-[#EAF5F0] border border-[#0F6E50]/20 text-[#0B3B2E] text-[10px] font-semibold uppercase tracking-wider font-mono mk-tabular">
                {eyebrow}
              </span>
            )}
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#111315]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#686E78] max-w-lg mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Card */}
          <div
            className={`${WIDTHS[width]} mx-auto bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl shadow-[0_14px_38px_-18px_rgba(11,59,46,0.12)] overflow-hidden relative`}
          >
            {steps.length > 0 && (
              <div className="relative z-10 px-6 sm:px-8 pt-5 pb-4 border-b border-[rgba(17,19,21,0.08)] bg-[#FAF9F6]/60">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686E78] font-mono mk-tabular">
                    Step {currentIndex + 1} of {steps.length} ·{" "}
                    <span className="text-[#111315]">{steps[currentIndex]?.label}</span>
                  </span>
                  <StepDots steps={steps} currentIndex={currentIndex} compact />
                </div>
                <ProgressBar current={currentIndex + 1} total={steps.length} />
              </div>
            )}

            <div className="relative z-10 p-6 sm:p-8">{children}</div>

            {footer && (
              <div className="relative z-10 px-6 sm:px-8 py-4 border-t border-[rgba(17,19,21,0.08)] bg-[#F4F2EC]/60 flex items-center justify-between gap-3">
                {footer}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 text-xs text-[#686E78]">
        © 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. All rights reserved.
      </footer>
    </div>
  );
}
