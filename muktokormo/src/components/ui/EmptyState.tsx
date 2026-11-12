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
      className={`bg-white border border-dashed border-[rgba(17,19,21,0.16)] rounded-2xl p-8 sm:p-11 text-center flex flex-col items-center justify-center space-y-3.5 shadow-[0_1px_2px_rgba(17,19,21,0.03)] ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-[#EAF5F0] border border-[#C3E3D5] text-[#0F6E50] flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-sm sm:text-base font-bold text-[#111315]">
          {title}
        </h3>
        <p className="text-xs text-[#686E78] leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
