"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface BaseFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  requiredMark?: boolean;
  containerClassName?: string;
}

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export function Input({
  label,
  hint,
  error,
  requiredMark,
  leftIcon,
  rightElement,
  showPasswordToggle = false,
  type = "text",
  containerClassName = "",
  className = "",
  id,
  ...rest
}: InputProps) {
  const [revealed, setRevealed] = useState(false);
  const isPasswordField = type === "password" && showPasswordToggle;
  const resolvedType = isPasswordField ? (revealed ? "text" : "password") : type;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#3E434A]"
        >
          {label}
          {requiredMark && <span className="text-[#BE123C] ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 text-[#686E78] flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          type={resolvedType}
          className={`w-full rounded-xl bg-white border text-sm text-[#111315] placeholder-[#949BA6] transition-all duration-150 focus:outline-none focus:ring-3 ${
            error
              ? "border-[#BE123C]/60 focus:border-[#BE123C] focus:ring-[#BE123C]/12"
              : "border-[rgba(17,19,21,0.13)] hover:border-[rgba(17,19,21,0.24)] focus:border-[#0F6E50] focus:ring-[#0F6E50]/12"
          } ${leftIcon ? "pl-10" : "pl-3.5"} ${
            isPasswordField || rightElement ? "pr-11" : "pr-3.5"
          } py-2.5 shadow-[0_1px_2px_rgba(17,19,21,0.02)] ${className}`}
          {...rest}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute right-2.5 p-1.5 rounded-lg text-[#686E78] hover:text-[#111315] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
          >
            {revealed ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
        {!isPasswordField && rightElement && (
          <div className="absolute right-3 flex items-center">{rightElement}</div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-[#BE123C] leading-snug">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-[11px] text-[#686E78] leading-snug">{hint}</p>
      )}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

export function Textarea({
  label,
  hint,
  error,
  requiredMark,
  containerClassName = "",
  className = "",
  id,
  ...rest
}: TextareaProps) {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#3E434A]"
        >
          {label}
          {requiredMark && <span className="text-[#BE123C] ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full rounded-xl bg-white border text-sm text-[#111315] placeholder-[#949BA6] px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-3 ${
          error
            ? "border-[#BE123C]/60 focus:border-[#BE123C] focus:ring-[#BE123C]/12"
            : "border-[rgba(17,19,21,0.13)] hover:border-[rgba(17,19,21,0.24)] focus:border-[#0F6E50] focus:ring-[#0F6E50]/12"
        } shadow-[0_1px_2px_rgba(17,19,21,0.02)] ${className}`}
        {...rest}
      />
      {error && (
        <p className="text-xs font-medium text-[#BE123C] leading-snug">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-[11px] text-[#686E78] leading-snug">{hint}</p>
      )}
    </div>
  );
}

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {}

export function Select({
  label,
  hint,
  error,
  requiredMark,
  containerClassName = "",
  className = "",
  id,
  children,
  ...rest
}: SelectProps) {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#3E434A]"
        >
          {label}
          {requiredMark && <span className="text-[#BE123C] ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`w-full rounded-xl bg-white border text-sm text-[#111315] px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-3 cursor-pointer ${
          error
            ? "border-[#BE123C]/60 focus:border-[#BE123C] focus:ring-[#BE123C]/12"
            : "border-[rgba(17,19,21,0.13)] hover:border-[rgba(17,19,21,0.24)] focus:border-[#0F6E50] focus:ring-[#0F6E50]/12"
        } shadow-[0_1px_2px_rgba(17,19,21,0.02)] ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs font-medium text-[#BE123C] leading-snug">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-[11px] text-[#686E78] leading-snug">{hint}</p>
      )}
    </div>
  );
}

