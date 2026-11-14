"use client";

import React, { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { MilestoneDraftInput } from "@/types/milestone";

export interface EditableMilestone {
  key: string;
  title: string;
  description: string;
  deliverables: string[];
  amount: string;
  start_date: string;
  deadline: string;
}

let keySeq = 0;
export function newEditable(partial?: Partial<EditableMilestone>): EditableMilestone {
  keySeq += 1;
  return {
    key: `ms-${Date.now()}-${keySeq}`,
    title: "",
    description: "",
    deliverables: [],
    amount: "",
    start_date: "",
    deadline: "",
    ...partial,
  };
}

export function toDraftInput(items: EditableMilestone[]): MilestoneDraftInput[] {
  return items.map((m) => ({
    title: m.title.trim(),
    description: m.description.trim(),
    deliverables: m.deliverables.map((d) => d.trim()).filter(Boolean),
    amount: Number(m.amount),
    start_date: m.start_date || null,
    deadline: m.deadline || null,
  }));
}

/** Client-side checks mirror the database rules; the server re-validates everything. */
export function validateEditable(items: EditableMilestone[]): string | null {
  if (items.length === 0) return "Add at least one milestone.";
  if (items.length > 20) return "A plan can have at most 20 milestones.";
  for (const [i, m] of items.entries()) {
    const label = `Milestone ${i + 1}`;
    if (m.title.trim().length < 3) return `${label}: title needs at least 3 characters.`;
    const amt = Number(m.amount);
    if (!Number.isFinite(amt) || amt < 10) return `${label}: amount must be at least ৳10.`;
    if (m.start_date && m.deadline && m.deadline < m.start_date)
      return `${label}: deadline can't be before the start date.`;
  }
  return null;
}

const fieldCls =
  "w-full rounded-lg bg-white border border-line-strong text-sm text-ink placeholder:text-ink-4 px-3 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/12";

interface Props {
  initial: EditableMilestone[];
  lang: "en" | "bn";
  busy: boolean;
  error: string | null;
  feePct: number;
  onSaveDraft: (items: MilestoneDraftInput[]) => void;
  onPropose: (items: MilestoneDraftInput[]) => void;
  onCancel?: () => void;
}

export default function MilestonePlanEditor({
  initial,
  lang,
  busy,
  error,
  feePct,
  onSaveDraft,
  onPropose,
  onCancel,
}: Props) {
  const en = lang === "en";
  const [items, setItems] = useState<EditableMilestone[]>(initial.length ? initial : [newEditable()]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [deliverableDrafts, setDeliverableDrafts] = useState<Record<string, string>>({});

  const total = items.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const update = (key: string, patch: Partial<EditableMilestone>) =>
    setItems((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));

  const move = (idx: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const addDeliverable = (key: string) => {
    const text = (deliverableDrafts[key] ?? "").trim();
    if (!text) return;
    setItems((prev) =>
      prev.map((m) => (m.key === key && m.deliverables.length < 20 ? { ...m, deliverables: [...m.deliverables, text.slice(0, 300)] } : m))
    );
    setDeliverableDrafts((d) => ({ ...d, [key]: "" }));
  };

  const submit = (kind: "draft" | "propose") => {
    const problem = validateEditable(items);
    setLocalError(problem);
    if (problem) return;
    const payload = toDraftInput(items);
    if (kind === "draft") onSaveDraft(payload);
    else onPropose(payload);
  };

  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        {items.map((m, idx) => (
          <li key={m.key} className="bg-white border border-line rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="mk-eyebrow text-ink-4">
                {en ? "Milestone" : "মাইলস্টোন"} {idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                  aria-label={en ? "Move up" : "উপরে"}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-3 hover:bg-subtle disabled:opacity-30 cursor-pointer">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}
                  aria-label={en ? "Move down" : "নিচে"}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-3 hover:bg-subtle disabled:opacity-30 cursor-pointer">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setItems((p) => p.filter((x) => x.key !== m.key))}
                  disabled={items.length === 1}
                  aria-label={en ? "Remove milestone" : "মুছুন"}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-3 hover:bg-danger-soft hover:text-danger-strong disabled:opacity-30 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
              <label className="block">
                <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Title" : "শিরোনাম"}</span>
                <input value={m.title} maxLength={160} onChange={(e) => update(m.key, { title: e.target.value })}
                  placeholder={en ? "e.g. Homepage design" : "যেমন: হোমপেজ ডিজাইন"} className={`${fieldCls} h-10`} />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Amount (৳)" : "পরিমাণ (৳)"}</span>
                <input value={m.amount} inputMode="decimal" onChange={(e) => update(m.key, { amount: e.target.value.replace(/[^\d.]/g, "") })}
                  placeholder="10000" className={`${fieldCls} h-10 mk-tabular`} />
              </label>
            </div>

            <label className="block mt-3">
              <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Description" : "বিবরণ"}</span>
              <textarea value={m.description} maxLength={4000} rows={2} onChange={(e) => update(m.key, { description: e.target.value })}
                placeholder={en ? "What will be done in this milestone?" : "এই মাইলস্টোনে কী কাজ হবে?"} className={`${fieldCls} py-2.5`} />
            </label>

            <div className="mt-3">
              <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Deliverables" : "ডেলিভারেবল"}</span>
              {m.deliverables.length > 0 && (
                <ul className="flex flex-wrap gap-1.5 mb-2">
                  {m.deliverables.map((d, di) => (
                    <li key={`${d}-${di}`} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-subtle text-[12px] text-ink-2">
                      {d}
                      <button type="button" aria-label={`${en ? "Remove" : "মুছুন"} ${d}`}
                        onClick={() => update(m.key, { deliverables: m.deliverables.filter((_, x) => x !== di) })}
                        className="p-0.5 rounded hover:bg-muted cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input value={deliverableDrafts[m.key] ?? ""} maxLength={300}
                  onChange={(e) => setDeliverableDrafts((d) => ({ ...d, [m.key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDeliverable(m.key); } }}
                  placeholder={en ? "e.g. Figma file — press Enter to add" : "যেমন: ফিগমা ফাইল"} className={`${fieldCls} h-9 text-[13px]`}
                  aria-label={en ? "Add a deliverable" : "ডেলিভারেবল যোগ করুন"} />
                <Button size="sm" variant="outline" onClick={() => addDeliverable(m.key)}>{en ? "Add" : "যোগ"}</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <label className="block">
                <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Start date (optional)" : "শুরুর তারিখ"}</span>
                <input type="date" value={m.start_date} onChange={(e) => update(m.key, { start_date: e.target.value })} className={`${fieldCls} h-10`} />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Deadline (optional)" : "ডেডলাইন"}</span>
                <input type="date" value={m.deadline} min={m.start_date || undefined} onChange={(e) => update(m.key, { deadline: e.target.value })} className={`${fieldCls} h-10`} />
              </label>
            </div>
          </li>
        ))}
      </ol>

      <button type="button" onClick={() => setItems((p) => (p.length >= 20 ? p : [...p, newEditable()]))}
        className="w-full h-11 rounded-xl border border-dashed border-line-strong hover:border-brand hover:bg-brand-soft/40 text-[13px] font-medium text-ink-2 hover:text-brand inline-flex items-center justify-center gap-2 cursor-pointer transition-colors">
        <Plus className="w-4 h-4" aria-hidden="true" />
        {en ? "Add milestone" : "মাইলস্টোন যোগ করুন"}
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-subtle border border-line rounded-xl p-4">
        <div>
          <p className="text-[13px] text-ink-3">{en ? "Contract total" : "মোট চুক্তি"}</p>
          <p className="text-xl font-semibold tracking-[-0.03em] text-ink mk-tabular">৳{total.toLocaleString("en-US")}</p>
          <p className="text-[12px] text-ink-4 mt-0.5">
            {en
              ? `Each milestone is funded separately. A ${feePct}% platform fee is deducted from each release.`
              : `প্রতিটি মাইলস্টোন আলাদাভাবে ফান্ড হয়। প্রতিটি রিলিজ থেকে ${feePct}% ফি কাটা হয়।`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onCancel && <Button variant="ghost" onClick={onCancel} disabled={busy}>{en ? "Cancel" : "বাতিল"}</Button>}
          <Button variant="outline" onClick={() => submit("draft")} disabled={busy}>{en ? "Save draft" : "খসড়া সংরক্ষণ"}</Button>
          <Button onClick={() => submit("propose")} loading={busy}>{en ? "Send to freelancer" : "ফ্রিল্যান্সারকে পাঠান"}</Button>
        </div>
      </div>

      {(localError || error) && (
        <p role="alert" className="text-[13px] font-medium text-danger-strong">{localError || error}</p>
      )}
    </div>
  );
}
