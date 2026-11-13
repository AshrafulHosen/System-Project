import React from "react";
import { getPaymentStatusMeta, getWorkStatusMeta } from "@/lib/payments/escrow";

export type StatusTone =
  | "emerald"
  | "sky"
  | "amber"
  | "rose"
  | "slate"
  | "indigo";

const TONE_CLASSES: Record<StatusTone, string> = {
  emerald: "bg-success-soft text-success border-success-border",
  sky: "bg-brand-soft text-brand-strong border-brand-border",
  amber: "bg-accent-soft text-accent-strong border-accent-border",
  rose: "bg-danger-soft text-danger-strong border-danger-border",
  slate: "bg-subtle text-ink-2 border-muted",
  indigo: "bg-plum-soft text-plum border-plum-border",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  emerald: "bg-success",
  sky: "bg-brand",
  amber: "bg-accent-bright",
  rose: "bg-danger",
  slate: "bg-ink-4",
  indigo: "bg-plum",
};

export function StatusPill({
  label,
  tone = "slate",
  showDot = true,
  className = "",
}: {
  label: string;
  tone?: StatusTone;
  showDot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`}
    >
      {showDot && (
        <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_CLASSES[tone]}`} />
      )}
      <span>{label}</span>
    </span>
  );
}

export function PaymentStatusBadge({
  status,
  lang = "en",
  className = "",
}: {
  status?: string | null;
  lang?: "en" | "bn";
  className?: string;
}) {
  const meta = getPaymentStatusMeta(status);
  return (
    <StatusPill
      label={lang === "bn" ? meta.labelBn : meta.label}
      tone={meta.tone}
      className={className}
    />
  );
}

export function WorkStatusBadge({
  status,
  lang = "en",
  className = "",
}: {
  status?: string | null;
  lang?: "en" | "bn";
  className?: string;
}) {
  const meta = getWorkStatusMeta(status);
  return (
    <StatusPill
      label={lang === "bn" ? meta.labelBn : meta.label}
      tone={meta.tone}
      className={className}
    />
  );
}

