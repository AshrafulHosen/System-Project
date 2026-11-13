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
  brand: "bg-brand-soft text-brand-strong border-brand-border",
  verified: "bg-success-soft text-success border-success-border",
  escrow: "bg-brand-soft text-brand-strong border-brand-border",
  info: "bg-brand-soft text-brand-strong border-brand-border",
  accent: "bg-accent-soft text-accent-strong border-accent-border",
  warning: "bg-accent-soft text-accent-strong border-accent-border",
  danger: "bg-danger-soft text-danger-strong border-danger-border",
  neutral: "bg-subtle text-ink-2 border-muted",
  dark: "bg-navy text-white border-navy",
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
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium tracking-[-0.005em] border leading-snug whitespace-nowrap ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {pulse && (
        <span
          aria-hidden="true"
          className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${
            dotColor ?? "bg-brand"
          }`}
        />
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
