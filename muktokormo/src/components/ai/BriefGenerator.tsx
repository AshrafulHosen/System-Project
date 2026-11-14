"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Button, Modal } from "@/components/ui";

const SECTION_LABELS: Record<string, string> = {
  overview: "Project overview",
  objectives: "Project objectives",
  scope: "Project scope",
  required_features: "Required features",
  functional_requirements: "Functional requirements",
  technical_requirements: "Technical requirements",
  deliverables: "Expected deliverables",
  suggested_milestones: "Suggested milestones",
  estimated_timeline: "Estimated timeline",
  acceptance_criteria: "Acceptance criteria",
  additional_notes: "Additional notes",
};
const SECTION_ORDER = Object.keys(SECTION_LABELS);

type Source = "client" | "suggested" | "needs_confirmation";
interface Section { content: string; source: Source }
interface Brief {
  title: string;
  sections: Record<string, Section>;
  required_skills: string[];
  suggested_category: string;
  follow_up_questions: string[];
}

export interface AppliedBrief {
  title: string;
  description: string;
  skills: string[];
  category: string | null;
  /** Only present when the client typed a budget themselves. */
  budgetText: string | null;
}

const SOURCE_META: Record<Source, { label: string; cls: string }> = {
  client: { label: "From you", cls: "bg-success-soft text-success border-success-border" },
  suggested: { label: "AI suggestion — review", cls: "bg-brand-soft text-brand-strong border-brand-border" },
  needs_confirmation: { label: "Needs your confirmation", cls: "bg-accent-soft text-accent-strong border-accent-border" },
};

const field = "w-full rounded-lg bg-white border border-line-strong text-sm text-ink placeholder:text-ink-4 px-3 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/12";

export default function BriefGenerator({
  isOpen,
  onClose,
  onApply,
  lang,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (b: AppliedBrief) => void;
  lang: "en" | "bn";
}) {
  const en = lang === "en";
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [input, setInput] = useState({ idea: "", features: "", technologies: "", audience: "", deliverables: "", budget: "", deadline: "", design: "", special: "" });
  const [brief, setBrief] = useState<Brief | null>(null);
  const [include, setInclude] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || configured !== null) return;
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
  }, [isOpen, configured]);

  const call = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action + (extra.targetSection ? `:${extra.targetSection}` : ""));
    setError(null);
    try {
      const res = await fetch("/api/ai/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          input,
          lang,
          currentBrief: brief,
          answers: Object.entries(answers).filter(([, a]) => a.trim()).map(([question, answer]) => ({ question, answer })),
          ...extra,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; brief?: Brief; warnings?: string[] };
      if (!res.ok || !json.ok || !json.brief) {
        setError(json.error || "The AI couldn't produce a brief.");
        return;
      }
      setBrief(json.brief);
      setWarnings(json.warnings ?? []);
      setInclude(Object.fromEntries(SECTION_ORDER.map((k) => [k, json.brief!.sections[k]?.source !== "needs_confirmation" && !!json.brief!.sections[k]?.content])));
    } catch {
      setError("Network error — nothing was generated.");
    } finally {
      setBusy(null);
    }
  };

  const composed = useMemo(() => {
    if (!brief) return "";
    return SECTION_ORDER.filter((k) => include[k] && brief.sections[k]?.content.trim())
      .map((k) => `${SECTION_LABELS[k]}\n${brief.sections[k].content.trim()}`)
      .join("\n\n");
  }, [brief, include]);

  const apply = () => {
    if (!brief) return;
    onApply({
      title: brief.title.trim(),
      description: composed,
      skills: brief.required_skills,
      category: brief.suggested_category || null,
      budgetText: input.budget.trim() || null,
    });
    onClose();
  };

  const set = (k: keyof typeof input) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setInput((s) => ({ ...s, [k]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={() => !busy && onClose()} maxWidthClass="max-w-3xl"
      title={en ? "Create project brief with AI" : "এআই দিয়ে প্রজেক্ট ব্রিফ"}
      subtitle={en ? "Nothing is posted automatically — you review every section and publish yourself." : "কিছুই স্বয়ংক্রিয়ভাবে প্রকাশ হয় না।"}>
      {configured === false ? (
        <p className="text-[14px] text-ink-3">
          {en ? "The AI brief generator isn't configured on this server yet. You can still write your post manually." : "এআই এখনো চালু নেই।"}
        </p>
      ) : !brief ? (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void call("generate"); }}>
          <label className="block">
            <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Describe your project idea" : "আপনার প্রজেক্টের ধারণা লিখুন"}</span>
            <textarea rows={4} required minLength={20} maxLength={3000} value={input.idea} onChange={set("idea")} className={`${field} py-2.5`}
              placeholder={en ? "e.g. I need a website for my restaurant where customers can see the menu, make reservations and contact us." : "যেমন: আমার রেস্টুরেন্টের জন্য একটি ওয়েবসাইট দরকার…"} />
          </label>
          <details className="rounded-lg border border-line">
            <summary className="px-3 py-2.5 text-[13px] font-medium text-ink-2 cursor-pointer">{en ? "Add more details (optional, recommended)" : "আরও বিস্তারিত (ঐচ্ছিক)"}</summary>
            <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                ["features", "Required features"],
                ["technologies", "Preferred technologies"],
                ["audience", "Target audience"],
                ["deliverables", "Expected deliverables"],
                ["budget", "Budget (only if decided)"],
                ["deadline", "Deadline (only if decided)"],
                ["design", "Design preferences"],
                ["special", "Special requirements"],
              ] as const).map(([k, label]) => (
                <label key={k} className="block">
                  <span className="block text-[12.5px] text-ink-3 mb-1">{label}</span>
                  <input value={input[k]} onChange={set(k)} maxLength={800} className={`${field} h-9 text-[13px]`} />
                </label>
              ))}
            </div>
          </details>
          {error && <p role="alert" className="text-[13px] text-danger-strong">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>{en ? "Cancel" : "বাতিল"}</Button>
            <Button type="submit" loading={busy === "generate"} disabled={configured === null || input.idea.trim().length < 20}
              leftIcon={<Sparkles className="w-4 h-4" />}>
              {en ? "Generate brief" : "ব্রিফ তৈরি"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <label className="block">
            <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Job title" : "শিরোনাম"}</span>
            <input value={brief.title} maxLength={120} onChange={(e) => setBrief({ ...brief, title: e.target.value })} className={`${field} h-10 font-medium`} />
          </label>

          {warnings.length > 0 && (
            <ul role="alert" className="rounded-lg bg-accent-soft border border-accent-border p-3 space-y-1 text-[12.5px] text-accent-strong">
              {warnings.map((w) => <li key={w} className="flex gap-2"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />{w}</li>)}
            </ul>
          )}

          {brief.follow_up_questions.length > 0 && (
            <div className="rounded-lg border border-brand-border bg-brand-soft/40 p-3 space-y-2">
              <p className="text-[13px] font-medium text-brand-strong">{en ? "A few questions to sharpen the brief" : "কিছু প্রশ্ন"}</p>
              {brief.follow_up_questions.map((q) => (
                <label key={q} className="block">
                  <span className="block text-[12.5px] text-ink-2 mb-1">{q}</span>
                  <input value={answers[q] ?? ""} maxLength={800} onChange={(e) => setAnswers((a) => ({ ...a, [q]: e.target.value }))} className={`${field} h-9 text-[13px]`} />
                </label>
              ))}
              <Button size="sm" onClick={() => void call("regenerate")} loading={busy === "regenerate"} disabled={busy !== null || !Object.values(answers).some((a) => a.trim())}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                {en ? "Update brief with my answers" : "উত্তর দিয়ে আপডেট"}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {([["more_detail", "More detail"], ["simplify", "Simplify"], ["more_technical", "More technical"], ["clarity", "Improve clarity"], ["trim", "Remove extra content"], ["regenerate", "Regenerate all"]] as const).map(([a, l]) => (
              <Button key={a} size="sm" variant="outline" onClick={() => void call(a)} loading={busy === a} disabled={busy !== null}>{l}</Button>
            ))}
          </div>

          <ol className="space-y-3">
            {SECTION_ORDER.map((k) => {
              const s = brief.sections[k];
              if (!s) return null;
              const meta = SOURCE_META[s.source];
              return (
                <li key={k} className={`rounded-lg border p-3 ${include[k] ? "border-line bg-white" : "border-line bg-subtle/60"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink">
                      <input type="checkbox" checked={!!include[k]} onChange={(e) => setInclude((i) => ({ ...i, [k]: e.target.checked }))} />
                      {SECTION_LABELS[k]}
                    </label>
                    <span className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded border text-[11px] font-medium ${meta.cls}`}>{meta.label}</span>
                      <button type="button" disabled={busy !== null} onClick={() => void call("regenerate_section", { targetSection: k })}
                        aria-label={`Regenerate ${SECTION_LABELS[k]}`}
                        className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-brand disabled:opacity-40 cursor-pointer">
                        <Wand2 className={`w-3.5 h-3.5 ${busy === `regenerate_section:${k}` ? "animate-spin" : ""}`} aria-hidden="true" /> {en ? "Regenerate" : "আবার"}
                      </button>
                    </span>
                  </div>
                  <textarea rows={Math.min(10, Math.max(2, s.content.split("\n").length + 1))} value={s.content} maxLength={4000}
                    aria-label={SECTION_LABELS[k]}
                    onChange={(e) => setBrief({ ...brief, sections: { ...brief.sections, [k]: { ...s, content: e.target.value } } })}
                    className={`${field} py-2 text-[13px] leading-relaxed`} />
                </li>
              );
            })}
          </ol>

          <div className="rounded-lg bg-subtle border border-line p-3 text-[12.5px] text-ink-3 space-y-1">
            <p><span className="font-medium text-ink-2">{en ? "Skills: " : "দক্ষতা: "}</span>{brief.required_skills.join(", ") || "—"}</p>
            <p><span className="font-medium text-ink-2">{en ? "Category: " : "ক্যাটাগরি: "}</span>{brief.suggested_category || (en ? "choose in the form" : "ফর্মে বেছে নিন")}</p>
            <p><span className="font-medium text-ink-2">{en ? "Budget: " : "বাজেট: "}</span>
              {input.budget.trim() ? input.budget : en ? "not set — you'll enter it in the Budget step" : "বাজেট ধাপে দিন"}</p>
          </div>

          {error && <p role="alert" className="text-[13px] text-danger-strong">{error}</p>}
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="ghost" onClick={() => setBrief(null)} disabled={busy !== null}>{en ? "Start over" : "আবার শুরু"}</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={busy !== null}>{en ? "Cancel" : "বাতিল"}</Button>
              <Button onClick={apply} disabled={busy !== null || brief.title.trim().length < 8 || composed.length < 20}>
                {en ? "Use this brief" : "এই ব্রিফ ব্যবহার করুন"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
