import React from "react";

export type BadgeVariant =
  | "brand"
  | "verified"
  | "escrow"
  | "warning"
  | "danger"
  | "neutral"
  | "dark";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  brand: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  verified: "bg-emerald-50/90 text-emerald-700 border-emerald-200",
  escrow: "bg-teal-50 text-teal-800 border-teal-200/80",
  warning: "bg-amber-50 text-amber-800 border-amber-200/80",
  danger: "bg-rose-50 text-rose-700 border-rose-200/80",
  neutral: "bg-slate-100 text-slate-700 border-slate-200/80",
  dark: "bg-slate-900 text-white border-slate-800",
};

export function Badge({
  children,
  variant = "neutral",
  icon,
  pulse = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight border ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

