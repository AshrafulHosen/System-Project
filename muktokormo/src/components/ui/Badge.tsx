import React from "react";

export type BadgeVariant =
  | "brand"
  | "verified"
  | "escrow"
  | "warning"
  | "danger"
  | "info"
  | "accent"
  | "neutral"
  | "dark";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  pulse?: boolean;
  dotColor?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  brand: "bg-[#EAF5F0] text-[#0B3B2E] border-[#C3E3D5]",
  verified: "bg-[#EAF5F0] text-[#0F6E50] border-[#BBE0D1]",
  escrow: "bg-[#EDF4FC] text-[#1D5A96] border-[#C9DCF2]",
  info: "bg-[#EDF4FC] text-[#1D5A96] border-[#C9DCF2]",
  accent: "bg-[#FBF5EA] text-[#9A661A] border-[#EADAB8]",
  warning: "bg-[#FEF8EA] text-[#9A6008] border-[#F0DDA8]",
  danger: "bg-[#FFF1F3] text-[#BE123C] border-[#FCCDD6]",
  neutral: "bg-[#F4F2EC] text-[#3E434A] border-[#E3DFD5]",
  dark: "bg-[#0B3B2E] text-[#FAF9F6] border-[#165745]",
};

export function Badge({
  children,
  variant = "neutral",
  icon,
  pulse = false,
  dotColor,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-[-0.01em] border leading-snug ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${
            dotColor ?? "bg-[#0F6E50]"
          }`}
        />
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
