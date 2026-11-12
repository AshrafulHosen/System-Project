"use client";

import React from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs<T extends string = string>({
  items,
  activeId,
  onChange,
  variant = "pill",
  className = "",
}: TabsProps<T>) {
  if (variant === "underline") {
    return (
      <div
        role="tablist"
        className={`flex items-center gap-1 border-b border-[rgba(17,19,21,0.09)] overflow-x-auto ${className}`}
      >
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? "border-[#0F6E50] text-[#111315]"
                  : "border-transparent text-[#686E78] hover:text-[#111315]"
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {typeof item.count === "number" && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold mk-tabular ${
                    active
                      ? "bg-[#EAF5F0] text-[#0F6E50]"
                      : "bg-[#F4F2EC] text-[#686E78]"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 bg-[#F4F2EC] border border-[rgba(17,19,21,0.08)] p-1 rounded-xl overflow-x-auto max-w-full ${className}`}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              active
                ? "bg-white text-[#111315] shadow-[0_1px_3px_rgba(17,19,21,0.08)] border border-[rgba(17,19,21,0.07)]"
                : "text-[#686E78] hover:text-[#111315] border border-transparent"
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold mk-tabular ${
                  active
                    ? "bg-[#EAF5F0] text-[#0F6E50]"
                    : "bg-white/70 text-[#686E78]"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

