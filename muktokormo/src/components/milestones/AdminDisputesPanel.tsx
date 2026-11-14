"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Gavel, RefreshCw } from "lucide-react";
import { Button, EmptyState, StatusPill } from "@/components/ui";

interface DisputeRow {
  id: string;
  milestone_id: string;
  contract_id: string;
  raised_by_role: "client" | "freelancer";
  reason: string;
  previous_status: string;
  status: "OPEN" | "RESOLVED";
  resolution: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  contract_milestones?: { title?: string; amount?: number | string; status?: string; deliverables?: string[] } | null;
  contracts?: { contract_code?: string | null; projects?: { title?: string } | { title?: string }[] | null } | null;
}

interface SubmissionRow {
  milestone_id: string;
  revision_number: number;
  message: string;
  demo_url: string | null;
  attachments: { url: string; label?: string }[] | null;
  status: string;
  review_feedback: string | null;
  created_at: string;
}

const RESOLUTIONS = [
  { id: "RELEASE_TO_FREELANCER", en: "Release to freelancer", hint: "Pays the freelancer (minus the platform fee) from escrow." },
  { id: "REFUND_TO_CLIENT", en: "Refund the client", hint: "Records a refund of the full milestone amount and cancels the milestone." },
  { id: "RESUME_WORK", en: "Resume work", hint: "Returns the milestone to its status before the dispute. Funds stay in escrow." },
] as const;

export default function AdminDisputesPanel({ lang }: { lang: "en" | "bn" }) {
  const en = lang === "en";
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"OPEN" | "RESOLVED">("OPEN");
  const [resolving, setResolving] = useState<string | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/disputes?status=${filter}`, { cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; error?: string; disputes?: DisputeRow[]; submissions?: SubmissionRow[] };
      if (!res.ok || !json.ok) {
        setError(json.error || "Failed to load disputes.");
        return;
      }
      setDisputes(json.disputes ?? []);
      setSubmissions(json.submissions ?? []);
      setError(null);
    } catch {
      setError("Network error while loading disputes.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const resolve = async (d: DisputeRow) => {
    const resolution = choice[d.id];
    const note = (notes[d.id] ?? "").trim();
    if (!resolution) return setRowError((e) => ({ ...e, [d.id]: "Choose a resolution." }));
    if (note.length < 10) return setRowError((e) => ({ ...e, [d.id]: "Write at least 10 characters explaining the decision." }));
    setResolving(d.id);
    setRowError((e) => ({ ...e, [d.id]: "" }));
    try {
      const res = await fetch(`/api/admin/disputes/${d.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution, notes: note }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setRowError((e) => ({ ...e, [d.id]: json.error || "Resolution failed." }));
        return;
      }
      await load();
    } catch {
      setRowError((e) => ({ ...e, [d.id]: "Network error. Nothing was changed." }));
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 text-ink-3" aria-hidden="true" />
          <h3 className="text-[15px] font-semibold text-ink">{en ? "Milestone disputes" : "মাইলস্টোন বিরোধ"}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Filter" className="inline-flex p-1 rounded-lg bg-subtle border border-line">
            {(["OPEN", "RESOLVED"] as const).map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
                className={`h-7 px-3 rounded-md text-[12px] font-medium cursor-pointer ${filter === f ? "bg-white text-ink border border-line" : "text-ink-3"}`}>
                {f === "OPEN" ? "Open" : "Resolved"}
              </button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => void load()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Refresh</Button>
        </div>
      </div>

      {error && <p role="alert" className="px-5 py-3 text-[13px] text-danger-strong">{error}</p>}

      {loading ? (
        <div className="p-6 h-32 animate-pulse" aria-busy="true" />
      ) : disputes.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={<Gavel className="w-6 h-6" />} title={filter === "OPEN" ? "No open disputes" : "No resolved disputes yet"}
            description="Disputes raised on funded milestones appear here with their submission history." />
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {disputes.map((d) => {
            const ms = d.contract_milestones;
            const proj = Array.isArray(d.contracts?.projects) ? d.contracts?.projects[0] : d.contracts?.projects;
            const subs = submissions.filter((s) => s.milestone_id === d.milestone_id);
            return (
              <li key={d.id} className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] text-ink-4">
                      {proj?.title ?? "Contract"} {d.contracts?.contract_code ? `· ${d.contracts.contract_code}` : ""} · opened {new Date(d.created_at).toLocaleString("en-GB")}
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-ink">{ms?.title ?? "Milestone"}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusPill label={d.status === "OPEN" ? "Open" : `Resolved · ${String(d.resolution).replace(/_/g, " ").toLowerCase()}`}
                        tone={d.status === "OPEN" ? "rose" : "slate"} />
                      <span className="text-[12px] text-ink-3">Raised by {d.raised_by_role} · was {d.previous_status.replace(/_/g, " ").toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-ink-4">In escrow</p>
                    <p className="text-lg font-semibold mk-tabular">৳{Number(ms?.amount ?? 0).toLocaleString("en-US")}</p>
                    <Link href={`/contracts/${d.contract_id}`} className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:text-brand-hover">
                      Open contract <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-danger-soft/60 border border-danger-border text-[13px] text-ink-2">
                  <span className="font-medium text-danger-ink">Reason: </span>{d.reason}
                </div>

                {subs.length > 0 && (
                  <details className="rounded-lg border border-line">
                    <summary className="px-3 py-2 text-[12.5px] font-medium text-ink-2 cursor-pointer">Evidence · {subs.length} submission(s)</summary>
                    <ol className="divide-y divide-line border-t border-line">
                      {subs.map((s) => (
                        <li key={`${s.milestone_id}-${s.revision_number}`} className="p-3 text-[12.5px] space-y-1">
                          <p className="text-ink-4">Revision {s.revision_number} · {s.status.toLowerCase()} · {new Date(s.created_at).toLocaleString("en-GB")}</p>
                          <p className="text-ink-2 whitespace-pre-line">{s.message}</p>
                          {s.demo_url && <a href={s.demo_url} target="_blank" rel="noopener noreferrer" className="text-brand">{s.demo_url}</a>}
                          {s.review_feedback && <p className="text-ink-3">Client feedback: {s.review_feedback}</p>}
                        </li>
                      ))}
                    </ol>
                  </details>
                )}

                {d.status === "RESOLVED" ? (
                  <p className="text-[13px] text-ink-3"><span className="font-medium text-ink-2">Decision notes: </span>{d.resolution_notes}</p>
                ) : (
                  <fieldset className="space-y-3" disabled={resolving !== null}>
                    <legend className="text-[13px] font-medium text-ink-2 mb-2">Resolution</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {RESOLUTIONS.map((r) => (
                        <label key={r.id} className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer ${choice[d.id] === r.id ? "border-brand bg-brand-soft/50" : "border-line hover:border-line-strong"}`}>
                          <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                            <input type="radio" name={`res-${d.id}`} value={r.id} checked={choice[d.id] === r.id}
                              onChange={() => setChoice((c) => ({ ...c, [d.id]: r.id }))} />
                            {r.en}
                          </span>
                          <span className="text-[12px] text-ink-3">{r.hint}</span>
                        </label>
                      ))}
                    </div>
                    <label className="block">
                      <span className="block text-[13px] font-medium text-ink-2 mb-1.5">Decision notes (recorded in the audit trail and sent to both parties)</span>
                      <textarea rows={3} maxLength={4000} value={notes[d.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                        className="w-full rounded-lg bg-white border border-line-strong text-sm px-3 py-2.5 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/12" />
                    </label>
                    {rowError[d.id] && <p role="alert" className="text-[13px] text-danger-strong">{rowError[d.id]}</p>}
                    <Button onClick={() => void resolve(d)} loading={resolving === d.id}>Record decision</Button>
                  </fieldset>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
