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
  emerald: "bg-[#EAF5F0] text-[#0F6E50] border-[#C3E3D5]",
  sky: "bg-[#EDF4FC] text-[#1D5A96] border-[#C9DCF2]",
  amber: "bg-[#FEF8EA] text-[#9A6008] border-[#F0DDA8]",
  rose: "bg-[#FFF1F3] text-[#BE123C] border-[#FCCDD6]",
  slate: "bg-[#F4F2EC] text-[#4B5563] border-[#E3DFD5]",
  indigo: "bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  emerald: "bg-[#0F6E50]",
  sky: "bg-[#1D5A96]",
  amber: "bg-[#C68B30]",
  rose: "bg-[#BE123C]",
  slate: "bg-[#686E78]",
  indigo: "bg-[#4338CA]",
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_CLASSES[tone]}`} />
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

