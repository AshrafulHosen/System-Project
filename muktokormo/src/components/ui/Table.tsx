import React from "react";

export function TableContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-line rounded-xl overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <table className={`w-full text-left border-collapse ${className}`}>
      {children}
    </table>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="bg-subtle/60 border-b border-line text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3 font-mono">
        {children}
      </tr>
    </thead>
  );
}

export function TableHeaderCell({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const alignCls =
    align === "right"
      ? "text-right"
      : align === "center"
      ? "text-center"
      : "text-left";
  return (
    <th className={`py-3 px-4 font-medium whitespace-nowrap ${alignCls} ${className}`}>
      {children}
    </th>
  );
}

export function TableRow({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-line last:border-b-0 transition-colors ${
        onClick ? "hover:bg-subtle/60 cursor-pointer" : "hover:bg-subtle/40"
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const alignCls =
    align === "right"
      ? "text-right"
      : align === "center"
      ? "text-center"
      : "text-left";
  return (
    <td className={`py-3.5 px-4 text-xs sm:text-[13px] text-ink-2 ${alignCls} ${className}`}>
      {children}
    </td>
  );
}

