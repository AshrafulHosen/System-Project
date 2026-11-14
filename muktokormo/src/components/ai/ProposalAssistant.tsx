"use client";

import React, { useEffect, useState } from "react";
import { Check, Copy, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui";
import { isUuid } from "@/lib/payments/constants";

type Action = "generate" | "regenerate" | "improve" | "shorten" | "professional" | "persuasive" | "simplify" | "tone" | "expand";

interface Props {
  jobId: string;
  currentDraft: string;
  onApply: (text: string) => void;
  lang: "en" | "bn";
}

const TONES = ["friendly", "confident", "formal", "concise", "warm"] as const;

/**
 * AI proposal helper. Produces an editable draft that the freelancer reviews and
 * applies to the cover letter themselves — it never submits a proposal.
 */
export default function ProposalAssistant({ jobId, currentDraft, onApply, lang }: Props) {
  const en = lang === "en";
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [usedFacts, setUsedFacts] = useState<string[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState<(typeof TONES)[number]>("friendly");
  const [details, setDetails] = useState("");
  const [copied, setCopied] = useState(false);
  const isRealJob = isUuid(jobId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/status", { cache: "no-store" });
        const json = (await res.json()) as { configured?: boolean };
        if (!cancelled) setConfigured(Boolean(json.configured));
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (action: Action) => {
    setBusy(action);
    setError(null);
    const base = action === "generate" || action === "regenerate" ? draft || currentDraft : draft || currentDraft;
    try {
      const res = await fetch("/api/ai/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          action,
          currentDraft: base,
          tone: action === "tone" ? tone : undefined,
          additionalDetails: action === "expand" ? details : undefined,
          lang,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; proposal?: string; usedFacts?: string[]; missingInfo?: string[] };
      if (!res.ok || !json.ok || !json.proposal) {
        setError(json.error || (en ? "The assistant couldn't produce a draft." : "খসড়া তৈরি করা যায়নি।"));
        return;
      }
      setDraft(json.proposal);
      setUsedFacts(json.usedFacts ?? []);
      setMissing(json.missingInfo ?? []);
      if (action === "expand") setDetails("");
    } catch {
      setError(en ? "Network error — nothing was generated." : "নেটওয়ার্ক ত্রুটি।");
    } finally {
      setBusy(null);
    }
  };

  if (configured === null) return null;

  if (!configured || !isRealJob) {
    return (
      <p className="mb-2 text-[12px] text-ink-4 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
        {!configured
          ? en ? "AI proposal assistant is not configured on this server." : "এআই সহকারী চালু নেই।"
          : en ? "AI drafting is available on live job posts." : "লাইভ কাজে এআই ব্যবহার করা যাবে।"}
      </p>
    );
  }

  const hasDraftToTransform = (draft || currentDraft).trim().length >= 40;
  const transforms: { a: Action; label: string }[] = [
    { a: "improve", label: en ? "Improve writing" : "লেখা উন্নত করুন" },
    { a: "shorten", label: en ? "Shorten" : "সংক্ষিপ্ত" },
    { a: "professional", label: en ? "More professional" : "আরও পেশাদার" },
    { a: "persuasive", label: en ? "More persuasive" : "আরও প্রভাবশালী" },
    { a: "simplify", label: en ? "Simplify" : "সহজ করুন" },
  ];

  return (
    <div className="mb-3 rounded-lg border border-brand-border bg-brand-soft/40">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left cursor-pointer">
          <span className="flex items-center gap-2 text-[13px] font-medium text-brand-strong">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {en ? "Generate proposal with AI" : "এআই দিয়ে প্রস্তাব লিখুন"}
          </span>
          <span className="text-[11.5px] text-ink-3">{en ? "Uses only your real profile" : "শুধু আপনার প্রোফাইল ব্যবহার করে"}</span>
        </button>
      ) : (
        <div className="p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => void run(draft ? "regenerate" : "generate")} loading={busy === "generate" || busy === "regenerate"}
              disabled={busy !== null} leftIcon={draft ? <RefreshCw className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}>
              {draft ? (en ? "Regenerate" : "আবার তৈরি") : (en ? "Generate draft" : "খসড়া তৈরি")}
            </Button>
            {transforms.map((t) => (
              <Button key={t.a} size="sm" variant="outline" onClick={() => void run(t.a)} loading={busy === t.a}
                disabled={busy !== null || !hasDraftToTransform}>
                {t.label}
              </Button>
            ))}
            <span className="inline-flex items-center gap-1">
              <label htmlFor="ai-tone" className="sr-only">{en ? "Tone" : "টোন"}</label>
              <select id="ai-tone" value={tone} onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
                className="h-8 px-2 rounded-md border border-line bg-white text-[12px] text-ink cursor-pointer">
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <Button size="sm" variant="outline" onClick={() => void run("tone")} loading={busy === "tone"} disabled={busy !== null || !hasDraftToTransform}>
                {en ? "Change tone" : "টোন বদলান"}
              </Button>
            </span>
          </div>

          {error && <p role="alert" className="text-[12.5px] text-danger-strong">{error}</p>}

          {draft && (
            <>
              <label className="block">
                <span className="block text-[12px] font-medium text-ink-2 mb-1">
                  {en ? "AI draft — edit freely before using it" : "এআই খসড়া — ব্যবহারের আগে সম্পাদনা করুন"}
                </span>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={9} maxLength={6000}
                  className="w-full rounded-lg bg-white border border-line-strong text-[13px] text-ink leading-relaxed px-3 py-2.5 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/12" />
              </label>

              {(usedFacts.length > 0 || missing.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                  {usedFacts.length > 0 && (
                    <div className="rounded-md bg-white border border-line p-2.5">
                      <p className="font-medium text-ink-2">{en ? "Based on your profile" : "আপনার প্রোফাইল থেকে"}</p>
                      <ul className="mt-1 list-disc pl-4 text-ink-3 space-y-0.5">{usedFacts.map((f) => <li key={f}>{f}</li>)}</ul>
                    </div>
                  )}
                  {missing.length > 0 && (
                    <div className="rounded-md bg-white border border-line p-2.5">
                      <p className="font-medium text-ink-2">{en ? "You could add" : "যোগ করতে পারেন"}</p>
                      <ul className="mt-1 list-disc pl-4 text-ink-3 space-y-0.5">{missing.map((f) => <li key={f}>{f}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="ai-details" className="sr-only">{en ? "Details to add" : "যোগ করার তথ্য"}</label>
                <input id="ai-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1500}
                  placeholder={en ? "Add a detail, e.g. a relevant project you did" : "একটি তথ্য যোগ করুন"}
                  className="flex-1 h-8 px-2.5 rounded-md border border-line bg-white text-[12.5px]" />
                <Button size="sm" variant="outline" onClick={() => void run("expand")} loading={busy === "expand"} disabled={busy !== null || details.trim().length < 10}>
                  {en ? "Add details" : "যোগ করুন"}
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-[11.5px] text-ink-4">
                  {en ? "Check every claim — you're responsible for what you submit." : "জমা দেওয়ার আগে প্রতিটি তথ্য যাচাই করুন।"}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={() => {
                      void navigator.clipboard?.writeText(draft).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      });
                    }}>
                    {copied ? (en ? "Copied" : "কপি হয়েছে") : (en ? "Copy" : "কপি")}
                  </Button>
                  <Button size="sm" onClick={() => onApply(draft)}>{en ? "Use this draft" : "এই খসড়া ব্যবহার করুন"}</Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
