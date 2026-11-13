"use client";

import React, { useState } from "react";

interface AvatarProps {
  src?: string | null;
  name: string;
  /** Tailwind size + radius classes, e.g. "w-12 h-12 rounded-lg text-sm" */
  className?: string;
  tone?: "navy" | "neutral";
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Profile image with a polished initials fallback when the image is
 * missing or fails to load — never shows a broken-image placeholder.
 */
export function Avatar({ src, name, className = "w-10 h-10 rounded-lg text-sm", tone = "navy" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={`object-cover border border-line shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex items-center justify-center font-semibold shrink-0 select-none ${
        tone === "navy" ? "bg-navy text-white" : "bg-subtle text-ink-2 border border-line"
      } ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
