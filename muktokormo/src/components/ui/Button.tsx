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

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0F6E50] hover:bg-[#0B5940] text-white border border-[#0F6E50] shadow-[0_1px_2px_rgba(11,59,46,0.18),inset_0_1px_0_rgba(255,255,255,0.12)] hover:shadow-[0_6px_16px_-4px_rgba(15,110,80,0.3)]",
  pine:
    "bg-[#0B3B2E] hover:bg-[#072920] text-[#FAF9F6] border border-[#0B3B2E] shadow-[0_1px_2px_rgba(11,59,46,0.22),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_8px_20px_-6px_rgba(11,59,46,0.35)]",
  secondary:
    "bg-[#111315] hover:bg-[#23272B] text-white border border-[#111315] shadow-[0_1px_2px_rgba(17,19,21,0.18)]",
  outline:
    "bg-white hover:bg-[#F4F2EC] text-[#111315] border border-[rgba(17,19,21,0.14)] hover:border-[rgba(17,19,21,0.24)] shadow-[0_1px_2px_rgba(17,19,21,0.03)]",
  subtle:
    "bg-[#F4F2EC] hover:bg-[#EAE7DF] text-[#111315] border border-[rgba(17,19,21,0.08)]",
  ghost:
    "bg-transparent hover:bg-[#F4F2EC] text-[#3E434A] hover:text-[#111315] border border-transparent",
  danger:
    "bg-[#BE123C] hover:bg-[#9F1239] text-white border border-[#BE123C] shadow-[0_1px_2px_rgba(190,18,60,0.2)]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-xs sm:text-[13px] rounded-xl gap-2",
  lg: "px-5.5 py-3 text-sm rounded-xl gap-2",
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
      className={`inline-flex items-center justify-center font-semibold tracking-[-0.01em] transition-all duration-150 active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none cursor-pointer mk-focus-ring ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
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
