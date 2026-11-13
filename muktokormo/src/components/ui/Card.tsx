import React from "react";

export type CardVariant = "default" | "subtle" | "outlined" | "dark";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default:
    "bg-white border border-line shadow-[0_1px_2px_rgba(16,24,40,0.04)] text-ink",
  subtle:
    "bg-subtle border border-line text-ink",
  outlined:
    "bg-transparent border border-line-strong text-ink",
  dark:
    "mk-dark-card text-white",
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
      className={`rounded-xl transition-[border-color,box-shadow,transform] duration-200 ${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${
        interactive
          ? "hover:border-line-strong hover:shadow-[var(--mk-shadow-elevated)] hover:-translate-y-0.5"
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
        <h3 className="text-[15px] sm:text-base font-semibold text-ink leading-snug tracking-[-0.02em]">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[13px] text-ink-3 mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

