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
      className={`bg-white border border-[rgba(17,19,21,0.09)] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(17,19,21,0.04)] ${className}`}
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
      <tr className="bg-[#FAF9F6] border-b border-[rgba(17,19,21,0.08)] text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.07em] text-[#686E78]">
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
    <th className={`py-3 px-4 font-semibold whitespace-nowrap ${alignCls} ${className}`}>
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
      className={`border-b border-[rgba(17,19,21,0.06)] last:border-b-0 transition-colors ${
        onClick ? "hover:bg-[#FAF9F6] cursor-pointer" : "hover:bg-[#FAF9F6]/70"
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
    <td className={`py-3.5 px-4 text-xs sm:text-[13px] text-[#3E434A] ${alignCls} ${className}`}>
      {children}
    </td>
  );
}

