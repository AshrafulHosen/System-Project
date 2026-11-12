import React from "react";

export type CardVariant = "default" | "subtle" | "outlined" | "dark";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default:
    "bg-white border border-[rgba(17,19,21,0.09)] shadow-[0_1px_2px_rgba(17,19,21,0.04),0_4px_12px_-2px_rgba(17,19,21,0.03)] text-[#111315]",
  subtle:
    "bg-[#F4F2EC] border border-[rgba(17,19,21,0.08)] text-[#111315]",
  outlined:
    "bg-white/70 border border-[rgba(17,19,21,0.11)] text-[#111315]",
  dark:
    "mk-dark-card text-[#FAF9F6]",
};

const PADDING_CLASSES = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card({
  variant = "default",
  interactive = false,
  padding = "md",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-2xl transition-all duration-200 ${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${
        interactive
          ? "hover:border-[rgba(17,19,21,0.18)] hover:shadow-[0_14px_30px_-8px_rgba(17,19,21,0.09)] hover:-translate-y-0.5"
          : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-[#111315] leading-snug">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-[#686E78] mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

