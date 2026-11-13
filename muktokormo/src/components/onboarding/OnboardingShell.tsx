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
                  ? "w-7 bg-navy"
                  : isDone
                    ? "w-3.5 bg-brand"
                    : "w-3 bg-[rgba(16,24,40,0.12)]"
              }`}
            />
          );
        }
        return (
          <div key={step.id} className="flex items-center gap-2.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 border transition-all font-mono mk-tabular ${
                isCurrent
                  ? "bg-navy border-navy text-white"
                  : isDone
                    ? "bg-brand-soft border-brand/30 text-brand"
                    : "bg-white border-line-strong text-ink-4"
              }`}
            >
              {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : i + 1}
            </span>
            <span
              className={`text-xs font-semibold ${
                isCurrent ? "text-ink" : isDone ? "text-brand" : "text-ink-3"
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
    <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden">
      <div
        className="h-full bg-brand rounded-full transition-all duration-500"
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
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-line sticky top-0 z-30">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-ink transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
            ) : (
              <Link href="/" className="inline-flex items-center gap-1.5 group cursor-pointer">
                <ArrowLeft className="w-4 h-4 text-ink-3 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline text-xs font-semibold text-ink-2">Home</span>
              </Link>
            )}
          </div>

          <Link href="/" className="shrink-0">
            <Logo size="sm" />
          </Link>

          <div className="text-xs text-ink-3 flex items-center gap-3">
            {headerRight}
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-soft text-navy font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
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
              <span className="inline-block px-3 py-1 rounded-lg bg-brand-soft border border-brand/20 text-navy mk-eyebrow font-mono mk-tabular">
                {eyebrow}
              </span>
            )}
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-ink">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-ink-3 max-w-lg mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Card */}
          <div
            className={`${WIDTHS[width]} mx-auto bg-white border border-line rounded-xl shadow-[var(--mk-shadow-elevated)] overflow-hidden relative`}
          >
            {steps.length > 0 && (
              <div className="relative z-10 px-6 sm:px-8 pt-5 pb-4 border-b border-line bg-canvas/60">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="mk-eyebrow text-ink-3 font-mono mk-tabular">
                    Step {currentIndex + 1} of {steps.length} ·{" "}
                    <span className="text-ink">{steps[currentIndex]?.label}</span>
                  </span>
                  <StepDots steps={steps} currentIndex={currentIndex} compact />
                </div>
                <ProgressBar current={currentIndex + 1} total={steps.length} />
              </div>
            )}

            <div className="relative z-10 p-6 sm:p-8">{children}</div>

            {footer && (
              <div className="relative z-10 px-6 sm:px-8 py-4 border-t border-line bg-subtle/60 flex items-center justify-between gap-3">
                {footer}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 text-xs text-ink-3">
        © 2026 MuktoKormo (মুক্তকর্ম) Technologies Ltd. All rights reserved.
      </footer>
    </div>
  );
}
