"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
  showSublabel?: boolean;
}

export default function Logo({
  className = "",
  size = "md",
  inverted = false,
  showSublabel = false,
}: LogoProps) {
  const iconBox =
    size === "sm"
      ? "w-7 h-7 rounded-md"
      : size === "lg"
      ? "w-10 h-10 rounded-lg"
      : "w-8 h-8 rounded-md";

  const wordmarkSize =
    size === "sm"
      ? "text-[17px]"
      : size === "lg"
      ? "text-[26px]"
      : "text-[20px]";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`${iconBox} relative flex items-center justify-center shrink-0 transition-transform duration-200 ${
          inverted
            ? "bg-white text-navy"
            : "bg-navy text-white"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={size === "sm" ? "w-4 h-4" : size === "lg" ? "w-5.5 h-5.5" : "w-4.5 h-4.5"}
        >
          <path
            d="M4.5 17.5V7.5C4.5 6.39543 5.39543 5.5 6.5 5.5H7.2C7.87 5.5 8.49 5.83 8.86 6.39L12 11.1L15.14 6.39C15.51 5.83 16.13 5.5 16.8 5.5H17.5C18.6046 5.5 19.5 6.39543 19.5 7.5V17.5"
            stroke="currentColor"
            strokeWidth="2.15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="16.5" r="2" fill="#327DCC" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={`${wordmarkSize} font-semibold tracking-[-0.04em] ${
            inverted ? "text-white" : "text-ink"
          }`}
        >
          Mukto
          <span className={inverted ? "text-white/55" : "text-ink-4"}>
            Kormo
          </span>
        </span>
        {showSublabel && (
          <span
            className={`text-[9px] font-semibold uppercase tracking-[0.14em] mt-0.5 ${
              inverted ? "text-white/55" : "text-ink-3"
            }`}
          >
            Escrow Marketplace
          </span>
        )}
      </div>
    </div>
  );
}
