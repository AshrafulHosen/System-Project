import React from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = "" }: TooltipProps) {
  return (
    <span className={`relative inline-flex group/tooltip ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none opacity-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-navy text-canvas text-[11px] font-medium leading-tight whitespace-nowrap shadow-lg z-40"
      >
        {content}
      </span>
    </span>
  );
}

