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
      className="fixed inset-0 z-50 bg-[#0B1612]/55 backdrop-blur-[3px] flex items-center justify-center p-4 mk-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-[rgba(17,19,21,0.12)] rounded-2xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col shadow-[0_24px_60px_-12px_rgba(11,22,18,0.32)] overflow-hidden mk-zoom-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[rgba(17,19,21,0.08)] flex items-start justify-between gap-4 shrink-0">
            <div className="min-w-0">
              {title && (
                <h3 className="text-base font-bold text-[#111315] tracking-[-0.02em]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[#686E78] mt-0.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-[#686E78] hover:text-[#111315] hover:bg-[#EAE7DF] transition-colors cursor-pointer shrink-0"
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
