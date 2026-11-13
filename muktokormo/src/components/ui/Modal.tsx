"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  maxWidthClass?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidthClass = "max-w-lg",
  bodyClassName = "p-6",
  children,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "mk-modal-title" : undefined}
      className="fixed inset-0 z-50 bg-navy-ink/50 backdrop-blur-[2px] flex items-center justify-center p-4 mk-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-line rounded-2xl w-full ${maxWidthClass} max-h-[90dvh] flex flex-col shadow-[var(--mk-shadow-popover)] overflow-hidden mk-zoom-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="px-5 sm:px-6 py-4 bg-white border-b border-line flex items-start justify-between gap-4 shrink-0">
            <div className="min-w-0">
              {title && (
                <h3 id="mk-modal-title" className="text-base sm:text-[17px] font-semibold text-ink tracking-[-0.02em]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[13px] text-ink-3 mt-0.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 -mr-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-subtle transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className={`overflow-y-auto ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}
