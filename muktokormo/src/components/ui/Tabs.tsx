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
        className={`flex items-center gap-1 border-b border-line overflow-x-auto ${className}`}
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
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {typeof item.count === "number" && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold mk-tabular ${
                    active
                      ? "bg-brand-soft text-brand"
                      : "bg-subtle text-ink-3"
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
      className={`inline-flex items-center gap-1 bg-subtle border border-line p-1 rounded-lg overflow-x-auto max-w-full ${className}`}
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
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer ${
              active
                ? "bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,0.08)] border border-line"
                : "text-ink-3 hover:text-ink border border-transparent"
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold mk-tabular ${
                  active
                    ? "bg-brand-soft text-brand"
                    : "bg-white/70 text-ink-3"
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

