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
          className="block text-[13px] font-medium text-ink-2"
        >
          {label}
          {requiredMark && <span className="text-danger-strong ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 text-ink-3 flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          type={resolvedType}
          className={`w-full rounded-lg bg-white border text-sm text-ink placeholder-ink-4 transition-all duration-150 focus:outline-none focus:ring-4 ${
            error
              ? "border-danger-strong/60 focus:border-danger-strong focus:ring-danger-strong/12"
              : "border-line-strong hover:border-[rgba(16,24,40,0.26)] focus:border-brand focus:ring-brand/15"
          } ${leftIcon ? "pl-10" : "pl-3.5"} ${
            isPasswordField || rightElement ? "pr-11" : "pr-3.5"
          } h-10 shadow-[0_1px_2px_rgba(16,24,40,0.03)] ${className}`}
          {...rest}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute right-2.5 p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-subtle transition-colors cursor-pointer"
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
        <p className="text-xs font-medium text-danger-strong leading-snug">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs text-ink-3 leading-snug">{hint}</p>
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
          className="block text-[13px] font-medium text-ink-2"
        >
          {label}
          {requiredMark && <span className="text-danger-strong ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full rounded-lg bg-white border text-sm text-ink placeholder-ink-4 px-3.5 py-2.5 leading-relaxed transition-all duration-150 focus:outline-none focus:ring-4 ${
          error
            ? "border-danger-strong/60 focus:border-danger-strong focus:ring-danger-strong/12"
            : "border-line-strong hover:border-[rgba(16,24,40,0.26)] focus:border-brand focus:ring-brand/15"
        } shadow-[0_1px_2px_rgba(16,24,40,0.03)] ${className}`}
        {...rest}
      />
      {error && (
        <p className="text-xs font-medium text-danger-strong leading-snug">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs text-ink-3 leading-snug">{hint}</p>
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
          className="block text-[13px] font-medium text-ink-2"
        >
          {label}
          {requiredMark && <span className="text-danger-strong ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`w-full rounded-lg bg-white border text-sm text-ink px-3.5 h-10 transition-all duration-150 focus:outline-none focus:ring-4 cursor-pointer ${
          error
            ? "border-danger-strong/60 focus:border-danger-strong focus:ring-danger-strong/12"
            : "border-line-strong hover:border-[rgba(16,24,40,0.26)] focus:border-brand focus:ring-brand/15"
        } shadow-[0_1px_2px_rgba(16,24,40,0.03)] ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs font-medium text-danger-strong leading-snug">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs text-ink-3 leading-snug">{hint}</p>
      )}
    </div>
  );
}

