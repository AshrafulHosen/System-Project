import React from "react";

export type ButtonVariant =
  | "primary"
  | "pine"
  | "secondary"
  | "outline"
  | "subtle"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Button variants
 * - primary:   brand blue, the single main action on a surface
 * - pine:      deep navy, for actions on light editorial surfaces (kept name for API compatibility)
 * - secondary: ink, high-contrast neutral action
 * - outline:   bordered neutral
 * - subtle:    filled neutral
 * - ghost:     text-only
 * - danger:    destructive
 */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-brand hover:bg-brand-hover text-white border border-brand hover:border-brand-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
  pine:
    "bg-navy hover:bg-navy-ink text-white border border-navy hover:border-navy-ink",
  secondary:
    "bg-ink hover:bg-ink-hover text-white border border-ink hover:border-ink-hover",
  outline:
    "bg-white hover:bg-subtle text-ink border border-line-strong hover:border-[rgba(16,24,40,0.26)]",
  subtle:
    "bg-subtle hover:bg-muted text-ink border border-transparent",
  ghost:
    "bg-transparent hover:bg-subtle text-ink-2 hover:text-ink border border-transparent",
  danger:
    "bg-danger-strong hover:bg-danger-ink text-white border border-danger-strong hover:border-danger-ink",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1.5",
  md: "h-10 px-4 text-[13px] sm:text-sm rounded-lg gap-2",
  lg: "h-12 px-6 text-sm sm:text-[15px] rounded-lg gap-2",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center font-medium tracking-[-0.01em] whitespace-nowrap transition-colors duration-150 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none cursor-pointer mk-focus-ring ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
        />
      ) : (
        leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="shrink-0 flex items-center">{rightIcon}</span>
      )}
    </button>
  );
}
