"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}

export default function Logo({ className = "", size = "md", inverted = false }: LogoProps) {
  const textSize = size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <span className={`${textSize} font-black tracking-tight ${inverted ? "text-white" : "text-slate-950"}`}>
        Mukto<span className="text-emerald-600">Kormo</span>
      </span>
      <span className={`${dotSize} rounded-full bg-emerald-500 shrink-0`} />
    </div>
  );
}
