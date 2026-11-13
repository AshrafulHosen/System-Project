import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`bg-white border border-line rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div aria-hidden="true" className="w-12 h-12 rounded-lg bg-subtle border border-line text-ink-2 flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-[15px] sm:text-base font-semibold text-ink tracking-[-0.02em]">
          {title}
        </h3>
        <p className="text-[13px] text-ink-3 leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
