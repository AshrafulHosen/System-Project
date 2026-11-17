"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { validateNidFile } from "@/lib/nid/shared";

interface Props {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  onError: (message: string | null) => void;
  error?: string | null;
  /** 0–100 while uploading, null otherwise. */
  progress?: number | null;
  disabled?: boolean;
  lang?: "en" | "bn";
}

/** One NID side: pick, preview, replace or remove an image (client-side checks only). */
export default function NIDImageUpload({ label, hint, file, onChange, onError, error, progress = null, disabled, lang = "en" }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const problem = validateNidFile(f);
    if (problem) {
      onError(
        lang === "bn"
          ? problem.includes("5 MB")
            ? "প্রতিটি ছবি সর্বোচ্চ ৫ MB হতে পারবে।"
            : "শুধুমাত্র JPG, JPEG, PNG বা WebP ছবি গ্রহণযোগ্য।"
          : problem
      );
      return;
    }
    onError(null);
    onChange(f);
  };

  const uploading = progress !== null;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-[13px] font-medium text-ink-2">
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        disabled={disabled}
        aria-describedby={`${inputId}-hint`}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {preview && file ? (
        <div
          className={`relative rounded-lg border overflow-hidden bg-canvas ${error ? "border-danger-strong/60" : "border-line-strong"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
          <img src={preview} alt={`${label} preview`} className="w-full aspect-[1.58] object-contain bg-subtle" />
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-line bg-white">
            <p className="text-[12px] text-ink-3 truncate min-w-0">
              {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
            {!disabled && !uploading && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[12px] font-medium text-ink-2 hover:bg-subtle cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  {lang === "en" ? "Replace" : "পরিবর্তন"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    onError(null);
                  }}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[12px] font-medium text-danger-strong hover:bg-danger-soft cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {lang === "en" ? "Remove" : "সরান"}
                </button>
              </div>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-subtle" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} upload`}>
              <div className="h-full bg-brand transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!disabled) pick(e.dataTransfer.files?.[0]);
          }}
          className={`w-full aspect-[1.58] rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 text-center px-4 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? "border-danger-strong/60 bg-danger-soft/40" : "border-line-strong bg-canvas/60 hover:bg-subtle hover:border-brand/50"
          }`}
        >
          <span className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
            <ImagePlus className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="text-[13px] font-medium text-ink">{lang === "en" ? "Choose image" : "ছবি নির্বাচন করুন"}</span>
          <span className="text-[11px] text-ink-3">JPG, PNG, WebP · {lang === "en" ? "max 5 MB" : "সর্বোচ্চ ৫ MB"}</span>
        </button>
      )}

      {error ? (
        <p className="text-xs font-medium text-danger-strong leading-snug" role="alert">
          {error}
        </p>
      ) : (
        <p id={`${inputId}-hint`} className="text-xs text-ink-3 leading-snug">
          {hint}
        </p>
      )}
    </div>
  );
}
