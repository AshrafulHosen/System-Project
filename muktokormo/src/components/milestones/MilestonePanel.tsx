"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Layers, Plus, RefreshCw, Split } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import MilestoneCard, { type MilestoneActionKind } from "@/components/milestones/MilestoneCard";
import MilestonePlanEditor, { newEditable, type EditableMilestone } from "@/components/milestones/MilestonePlanEditor";
import type { BillingMode, MilestoneDraftInput, MilestoneRecord, MilestoneWorkspacePayload } from "@/types/milestone";

interface Props {
  contractId: string;
  lang: "en" | "bn";
  /** Tells the host page which payment model applies, so it can hide single-payment sections. */
  onModeResolved?: (mode: BillingMode) => void;
  /** Called after any change that affects contract money or status. */
  onChanged?: () => void;
}

type DialogKind =
  | { kind: "submit"; m: MilestoneRecord }
  | { kind: "request_revision"; m: MilestoneRecord }
  | { kind: "raise_dispute"; m: MilestoneRecord }
  | { kind: "release"; m: MilestoneRecord }
  | { kind: "approve"; m: MilestoneRecord }
  | { kind: "fund"; m: MilestoneRecord }
  | { kind: "request_cancel"; m: MilestoneRecord }
  | { kind: "request_plan_changes" }
  | { kind: "amendment" };

const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const inputCls =
  "w-full rounded-lg bg-white border border-line-strong text-sm text-ink placeholder:text-ink-4 px-3 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/12";

export default function MilestonePanel({ contractId, lang, onModeResolved, onChanged }: Props) {
  const en = lang === "en";
  const [data, setData] = useState<MilestoneWorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [text, setText] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [links, setLinks] = useState("");
  const [amend, setAmend] = useState({ title: "", amount: "", description: "", deadline: "" });
  const [showActivity, setShowActivity] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/milestones`, { cache: "no-store" });
      const json = (await res.json()) as MilestoneWorkspacePayload | { ok: false; error?: string };
      if (!res.ok || json.ok !== true) {
        setLoadError(("error" in json && json.error) || "Could not load milestones.");
        return;
      }
      setData(json);
      setLoadError(null);
      onModeResolved?.(json.contract.billingMode);
    } catch {
      setLoadError(en ? "Network error while loading milestones." : "মাইলস্টোন লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, [contractId, en, onModeResolved]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const after = async (msg: string | null) => {
    setDialog(null);
    setText("");
    setDemoUrl("");
    setLinks("");
    setNotice(msg);
    await load();
    onChanged?.();
  };

  const post = async (url: string, body: unknown, key: string): Promise<boolean> => {
    setBusyAction(key);
    setActionError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; gatewayPageUrl?: string };
      if (!res.ok || !json.ok) {
        setActionError(json.error || (en ? "The request was rejected." : "অনুরোধ গ্রহণ করা হয়নি।"));
        return false;
      }
      if (json.gatewayPageUrl) {
        window.location.assign(json.gatewayPageUrl);
      }
      return true;
    } catch {
      setActionError(en ? "Network error. Nothing was changed." : "নেটওয়ার্ক ত্রুটি।");
      return false;
    } finally {
      setBusyAction(null);
    }
  };

  const planAction = async (action: string, payload: Record<string, unknown> = {}, okMsg: string | null = null) => {
    const ok = await post(`/api/contracts/${contractId}/milestones`, { action, payload }, `${action}:plan`);
    if (ok) {
      setEditing(false);
      await after(okMsg);
    }
  };

  const workAction = async (m: MilestoneRecord, action: string, payload: Record<string, unknown> = {}, okMsg: string | null = null) => {
    const ok = await post(`/api/milestones/${m.id}`, { action, payload }, `${action}:${m.id}`);
    if (ok) await after(okMsg);
  };

  const handleCardAction = (kind: MilestoneActionKind, m: MilestoneRecord) => {
    setActionError(null);
    setNotice(null);
    switch (kind) {
      case "start":
        void workAction(m, "start", {}, en ? "Work started." : "কাজ শুরু হয়েছে।");
        break;
      case "accept_amendment":
      case "reject_amendment":
        void planAction(kind, { milestone_id: m.id }, en ? "Amendment decision saved." : "সিদ্ধান্ত সংরক্ষিত।");
        break;
      case "confirm_cancel":
      case "withdraw_cancel":
        void planAction(kind, { milestone_id: m.id }, en ? "Saved." : "সংরক্ষিত।");
        break;
      default:
        setText("");
        setDialog({ kind, m } as DialogKind);
    }
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    switch (dialog.kind) {
      case "submit": {
        const attachments = links
          .split(/\s+/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((url) => ({ url }));
        return workAction(dialog.m, "submit", { message: text, demo_url: demoUrl, attachments },
          en ? "Work submitted for review." : "কাজ জমা হয়েছে।");
      }
      case "request_revision":
        return workAction(dialog.m, "request_revision", { message: text }, en ? "Revision requested." : "রিভিশন চাওয়া হয়েছে।");
      case "approve":
        return workAction(dialog.m, "approve", { message: text }, en ? "Milestone approved. You can now release the payment." : "অনুমোদিত।");
      case "raise_dispute":
        return workAction(dialog.m, "raise_dispute", { message: text }, en ? "Dispute opened. An administrator will review it." : "বিরোধ খোলা হয়েছে।");
      case "release":
        return workAction(dialog.m, "release", {}, en ? "Payment released to the freelancer." : "পেমেন্ট রিলিজ হয়েছে।");
      case "request_cancel":
        return planAction("request_cancel", { milestone_id: dialog.m.id, note: text }, en ? "Cancellation requested." : "অনুরোধ পাঠানো হয়েছে।");
      case "fund": {
        // Redirects to SSLCOMMERZ on success; funding is only recorded after server-side validation.
        await post("/api/payments/initiate", { contractId, milestoneId: dialog.m.id }, `fund:${dialog.m.id}`);
        return;
      }
      case "request_plan_changes":
        return planAction("request_plan_changes", { note: text }, en ? "Change request sent to the client." : "অনুরোধ পাঠানো হয়েছে।");
      case "amendment":
        return planAction(
          "propose_amendment",
          { milestone: { title: amend.title, amount: Number(amend.amount), description: amend.description, deadline: amend.deadline || null } },
          en ? "Amendment sent to the freelancer for approval." : "সংশোধন পাঠানো হয়েছে।"
        );
    }
  };

  const editorSeed = useMemo<EditableMilestone[]>(() => {
    if (!data) return [];
    const existing = data.milestones.filter((m) => m.status !== "CANCELLED");
    if (existing.length && data.contract.planStatus !== "ACCEPTED") {
      return existing.map((m) =>
        newEditable({
          title: m.title,
          description: m.description,
          deliverables: m.deliverables,
          amount: String(m.amount),
          start_date: m.start_date ?? "",
          deadline: m.deadline ?? "",
        })
      );
    }
    if (data.proposalMilestones.length) {
      return data.proposalMilestones.map((p) => newEditable({ title: p.title, amount: String(p.amount) }));
    }
    return [newEditable({ title: en ? "Full project delivery" : "সম্পূর্ণ প্রজেক্ট", amount: String(data.contract.totalAmount || "") })];
  }, [data, en]);

  if (loading) {
    return <div className="bg-white border border-line rounded-xl p-6 h-40 animate-pulse" aria-busy="true" />;
  }
  if (loadError || !data) {
    return (
      <div role="alert" className="bg-white border border-line rounded-xl p-5 text-[13px] text-ink-3 flex items-center justify-between gap-3">
        <span>{loadError}</span>
        <Button size="sm" variant="outline" onClick={() => void load()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          {en ? "Retry" : "আবার চেষ্টা"}
        </Button>
      </div>
    );
  }

  const { contract: c, viewerRole, milestones } = data;
  const isClient = viewerRole === "client";
  const isFreelancer = viewerRole === "freelancer";

  // Single-payment contracts: only offer conversion to the client, otherwise render nothing.
  if (c.billingMode === "SINGLE") {
    if (!isClient || !c.canConvertToMilestones) return null;
    return (
      <section className="bg-white border border-line rounded-xl p-5 sm:p-6">
        {!editing ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-md bg-subtle text-navy flex items-center justify-center shrink-0">
                <Split className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-ink">{en ? "Pay in milestones instead?" : "মাইলস্টোনে পেমেন্ট করবেন?"}</h2>
                <p className="mt-0.5 text-[13px] text-ink-3 max-w-xl">
                  {en
                    ? "Split this contract into milestones and fund each one separately. The freelancer must accept the plan before any payment."
                    : "চুক্তিটি কয়েকটি মাইলস্টোনে ভাগ করে প্রতিটি আলাদাভাবে ফান্ড করুন।"}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setEditing(true)} leftIcon={<Layers className="w-4 h-4" />}>
              {en ? "Set up milestones" : "মাইলস্টোন সেট করুন"}
            </Button>
          </div>
        ) : (
          <MilestonePlanEditor
            initial={editorSeed}
            lang={lang}
            busy={busyAction !== null}
            error={actionError}
            feePct={c.platformFeePct}
            onCancel={() => setEditing(false)}
            onSaveDraft={(items: MilestoneDraftInput[]) => void planAction("save_plan", { milestones: items }, en ? "Draft saved." : "খসড়া সংরক্ষিত।")}
            onPropose={(items: MilestoneDraftInput[]) => void planAction("propose_plan", { milestones: items }, en ? "Plan sent to the freelancer." : "পরিকল্পনা পাঠানো হয়েছে।")}
          />
        )}
      </section>
    );
  }

  const active = milestones.filter((m) => m.status !== "CANCELLED" && m.agreement_status !== "REJECTED");
  const agreed = active.filter((m) => m.agreement_status === "ACCEPTED");
  const releasedCount = agreed.filter((m) => m.status === "RELEASED").length;
  const remaining = Math.max(0, c.totalAmount - c.releasedAmount);
  const inEscrow = Math.max(0, c.fundedAmount - c.releasedAmount - c.refundedAmount);
  const progressPct = c.totalAmount > 0 ? Math.min(100, (c.releasedAmount / c.totalAmount) * 100) : 0;
  const pendingPaymentFor = new Set(data.payments.filter((p) => p.status === "PENDING").map((p) => p.milestone_id));
  const submissionsFor = (id: string) => data.submissions.filter((s) => s.milestone_id === id);
  const openDisputeFor = (id: string) => data.disputes.find((d) => d.milestone_id === id && d.status === "OPEN");
  const planEditable = isClient && c.planStatus !== "ACCEPTED";

  const dialogMilestone = dialog && "m" in dialog ? dialog.m : null;
  const releaseFee = dialogMilestone ? Math.round(dialogMilestone.amount * c.platformFeePct) / 100 : 0;

  return (
    <section className="space-y-4" aria-labelledby="milestones-heading">
      {/* Summary */}
      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="mk-eyebrow text-ink-4">{en ? "Milestone contract" : "মাইলস্টোন চুক্তি"}</p>
            <h2 id="milestones-heading" className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-ink">
              {c.planStatus === "ACCEPTED"
                ? en ? `${releasedCount} of ${agreed.length} milestones paid` : `${agreed.length}টির মধ্যে ${releasedCount}টি পরিশোধিত`
                : c.planStatus === "PROPOSED"
                ? en ? "Milestone plan awaiting freelancer approval" : "পরিকল্পনা ফ্রিল্যান্সারের অনুমোদনের অপেক্ষায়"
                : en ? "Milestone plan in draft" : "পরিকল্পনা খসড়া অবস্থায়"}
            </h2>
          </div>
          <button type="button" onClick={() => void load()} className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> {en ? "Refresh" : "রিফ্রেশ"}
          </button>
        </div>
        <div className="px-5 sm:px-6 pb-5">
          <div className="h-2 rounded-full bg-subtle overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={Math.round(progressPct)} aria-label={en ? "Paid out of total budget" : "পরিশোধিত"}>
            <div className="h-full bg-success rounded-full transition-[width] duration-700" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border-t border-line">
          {[
            { k: en ? "Total budget" : "মোট বাজেট", v: c.totalAmount, cls: "text-ink" },
            { k: en ? "Held in escrow" : "এসক্রোতে", v: inEscrow, cls: "text-brand-strong" },
            { k: en ? "Released" : "রিলিজড", v: c.releasedAmount, cls: "text-success" },
            { k: en ? "Remaining" : "বাকি", v: remaining, cls: "text-ink" },
          ].map((s) => (
            <div key={s.k} className="bg-white px-5 py-4">
              <dt className="text-[12px] text-ink-4">{s.k}</dt>
              <dd className={`mt-1 text-lg font-semibold tracking-[-0.03em] mk-tabular ${s.cls}`}>{fmt(s.v)}</dd>
            </div>
          ))}
        </dl>
        {c.refundedAmount > 0 && (
          <p className="px-5 sm:px-6 py-3 border-t border-line text-[12.5px] text-ink-3">
            {en ? `${fmt(c.refundedAmount)} was refunded to the client through dispute resolution.` : `${fmt(c.refundedAmount)} ক্লায়েন্টকে রিফান্ড করা হয়েছে।`}
          </p>
        )}
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 px-4 py-3 rounded-lg bg-success-soft border border-success-border text-[13px] text-success">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> {notice}
        </p>
      )}
      {actionError && !dialog && !editing && (
        <p role="alert" className="px-4 py-3 rounded-lg bg-danger-soft border border-danger-border text-[13px] text-danger-strong">{actionError}</p>
      )}

      {/* Plan agreement */}
      {c.planStatus !== "ACCEPTED" && (
        <div className="bg-white border border-line rounded-xl p-5 sm:p-6 space-y-4">
          {c.planNote && (
            <div className="p-3 rounded-lg bg-accent-soft border border-accent-border text-[13px] text-accent-strong">
              <span className="font-medium">{en ? "Freelancer's requested changes: " : "ফ্রিল্যান্সারের অনুরোধ: "}</span>
              {c.planNote}
            </div>
          )}
          {planEditable && (editing || c.planStatus !== "PROPOSED") ? (
            <MilestonePlanEditor
              initial={editorSeed}
              lang={lang}
              busy={busyAction !== null}
              error={actionError}
              feePct={c.platformFeePct}
              onCancel={c.planStatus === "PROPOSED" ? () => setEditing(false) : undefined}
              onSaveDraft={(items) => void planAction("save_plan", { milestones: items }, en ? "Draft saved." : "খসড়া সংরক্ষিত।")}
              onPropose={(items) => void planAction("propose_plan", { milestones: items }, en ? "Plan sent to the freelancer." : "পরিকল্পনা পাঠানো হয়েছে।")}
            />
          ) : (
            <>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-accent mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-[14px] text-ink-2">
                  {isFreelancer
                    ? c.planStatus === "PROPOSED"
                      ? en ? "Review the proposed milestones. Accepting locks these terms; nothing is funded until the client pays each milestone." : "প্রস্তাবিত মাইলস্টোনগুলো পর্যালোচনা করুন।"
                      : en ? "The client is preparing the milestone plan." : "ক্লায়েন্ট পরিকল্পনা তৈরি করছেন।"
                    : en ? "Waiting for the freelancer to accept or request changes." : "ফ্রিল্যান্সারের সিদ্ধান্তের অপেক্ষায়।"}
                </p>
              </div>
              <ol className="divide-y divide-line border border-line rounded-lg">
                {active.map((m, i) => (
                  <li key={m.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-ink">{i + 1}. {m.title}</p>
                      {m.description && <p className="mt-0.5 text-[13px] text-ink-3">{m.description}</p>}
                      {m.deliverables.length > 0 && <p className="mt-1 text-[12px] text-ink-4">{m.deliverables.join(" · ")}</p>}
                      {m.deadline && <p className="mt-1 text-[12px] text-ink-4">{en ? "Due" : "ডেডলাইন"} {m.deadline}</p>}
                    </div>
                    <p className="text-[15px] font-semibold mk-tabular shrink-0">{fmt(m.amount)}</p>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2">
                {isFreelancer && c.planStatus === "PROPOSED" && (
                  <>
                    <Button onClick={() => void planAction("accept_plan", {}, en ? "Plan accepted. The client can now fund milestones." : "পরিকল্পনা গৃহীত।")}
                      loading={busyAction === "accept_plan:plan"} disabled={busyAction !== null}>
                      {en ? "Accept plan" : "পরিকল্পনা গ্রহণ"}
                    </Button>
                    <Button variant="outline" onClick={() => { setText(""); setDialog({ kind: "request_plan_changes" }); }} disabled={busyAction !== null}>
                      {en ? "Request changes" : "পরিবর্তন চান"}
                    </Button>
                  </>
                )}
                {isClient && c.planStatus === "PROPOSED" && (
                  <Button variant="outline" onClick={() => setEditing(true)}>{en ? "Edit plan" : "সম্পাদনা"}</Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Timeline */}
      {c.planStatus === "ACCEPTED" && (
        <ol className="relative space-y-3">
          {milestones.map((m, i) => (
            <li key={m.id}>
              <MilestoneCard
                milestone={m}
                index={i}
                viewerRole={viewerRole}
                viewerUserId={data.viewerUserId}
                submissions={submissionsFor(m.id)}
                openDispute={openDisputeFor(m.id)}
                hasPendingPayment={pendingPaymentFor.has(m.id)}
                lang={lang}
                busyAction={busyAction}
                onAction={handleCardAction}
              />
            </li>
          ))}
        </ol>
      )}

      {c.planStatus === "ACCEPTED" && isClient && c.status.toLowerCase() !== "completed" && (
        <button type="button" onClick={() => { setAmend({ title: "", amount: "", description: "", deadline: "" }); setDialog({ kind: "amendment" }); }}
          className="w-full h-11 rounded-xl border border-dashed border-line-strong hover:border-brand hover:bg-brand-soft/40 text-[13px] font-medium text-ink-2 hover:text-brand inline-flex items-center justify-center gap-2 cursor-pointer transition-colors">
          <Plus className="w-4 h-4" aria-hidden="true" />
          {en ? "Propose an additional milestone" : "অতিরিক্ত মাইলস্টোন প্রস্তাব"}
        </button>
      )}

      {/* Audit trail */}
      {data.events.length > 0 && (
        <div className="bg-white border border-line rounded-xl">
          <button type="button" aria-expanded={showActivity} onClick={() => setShowActivity((v) => !v)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-[13px] font-medium text-ink cursor-pointer">
            {en ? `Contract activity (${data.events.length})` : `কার্যক্রম (${data.events.length})`}
            <span className="text-ink-4">{showActivity ? "−" : "+"}</span>
          </button>
          {showActivity && (
            <ol className="border-t border-line divide-y divide-line max-h-80 overflow-y-auto">
              {data.events.map((e) => (
                <li key={e.id} className="px-5 py-2.5 flex items-center justify-between gap-4 text-[12.5px]">
                  <span className="text-ink-2">
                    <span className="font-medium">{e.event_type.replace(/_/g, " ").toLowerCase()}</span>
                    {e.actor_role && <span className="text-ink-4"> · {e.actor_role}</span>}
                  </span>
                  <time className="text-ink-4 font-mono mk-tabular shrink-0">{new Date(e.created_at).toLocaleString(en ? "en-GB" : "bn-BD")}</time>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Action dialog */}
      <Modal
        isOpen={dialog !== null}
        onClose={() => { if (!busyAction) { setDialog(null); setActionError(null); } }}
        title={
          !dialog ? "" :
          dialog.kind === "submit" ? (en ? "Submit milestone work" : "কাজ জমা দিন") :
          dialog.kind === "request_revision" ? (en ? "Request a revision" : "রিভিশন চান") :
          dialog.kind === "approve" ? (en ? "Approve this milestone?" : "অনুমোদন করবেন?") :
          dialog.kind === "raise_dispute" ? (en ? "Open a dispute" : "বিরোধ খুলুন") :
          dialog.kind === "release" ? (en ? "Release payment?" : "পেমেন্ট রিলিজ করবেন?") :
          dialog.kind === "fund" ? (en ? "Fund this milestone" : "মাইলস্টোন ফান্ড করুন") :
          dialog.kind === "request_cancel" ? (en ? "Request cancellation" : "বাতিলের অনুরোধ") :
          dialog.kind === "request_plan_changes" ? (en ? "Request plan changes" : "পরিবর্তনের অনুরোধ") :
          (en ? "Propose an additional milestone" : "অতিরিক্ত মাইলস্টোন")
        }
        subtitle={dialogMilestone ? `${dialogMilestone.title} · ${fmt(dialogMilestone.amount)}` : undefined}
        maxWidthClass="max-w-lg"
      >
        {dialog && (
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); void confirmDialog(); }}
          >
            {dialog.kind === "release" && dialogMilestone && (
              <dl className="rounded-lg border border-line divide-y divide-line text-[14px]">
                <div className="flex justify-between px-4 py-2.5"><dt className="text-ink-3">{en ? "Held in escrow" : "এসক্রোতে"}</dt><dd className="font-medium mk-tabular">{fmt(dialogMilestone.amount)}</dd></div>
                <div className="flex justify-between px-4 py-2.5"><dt className="text-ink-3">{en ? `Platform fee (${c.platformFeePct}%)` : `প্ল্যাটফর্ম ফি (${c.platformFeePct}%)`}</dt><dd className="mk-tabular text-ink-3">−{fmt(releaseFee)}</dd></div>
                <div className="flex justify-between px-4 py-2.5 bg-success-soft/60"><dt className="font-medium">{en ? "Freelancer receives" : "ফ্রিল্যান্সার পাবেন"}</dt><dd className="font-semibold text-success mk-tabular">{fmt(dialogMilestone.amount - releaseFee)}</dd></div>
                <p className="px-4 py-2.5 text-[12px] text-ink-4">{en ? "This can't be undone. Release is recorded in the escrow ledger." : "এটি ফেরানো যাবে না।"}</p>
              </dl>
            )}

            {dialog.kind === "fund" && dialogMilestone && (
              <p className="text-[14px] text-ink-2">
                {en
                  ? `You'll be taken to SSLCOMMERZ to pay ${fmt(dialogMilestone.amount)}. The milestone is marked funded only after the payment is verified by our server.`
                  : `${fmt(dialogMilestone.amount)} পরিশোধের জন্য আপনাকে SSLCOMMERZ-এ নেওয়া হবে। সার্ভারে যাচাইয়ের পরেই মাইলস্টোন ফান্ডেড হবে।`}
              </p>
            )}

            {dialog.kind === "approve" && (
              <p className="text-[14px] text-ink-2">
                {en ? "Approving accepts this delivery. You'll then be able to release the payment." : "অনুমোদনের পর পেমেন্ট রিলিজ করতে পারবেন।"}
              </p>
            )}

            {(dialog.kind === "submit" || dialog.kind === "request_revision" || dialog.kind === "raise_dispute" ||
              dialog.kind === "request_cancel" || dialog.kind === "request_plan_changes" || dialog.kind === "approve") && (
              <label className="block">
                <span className="block text-[13px] font-medium text-ink-2 mb-1.5">
                  {dialog.kind === "submit" ? (en ? "What did you deliver?" : "কী জমা দিচ্ছেন?") :
                   dialog.kind === "approve" ? (en ? "Feedback (optional)" : "মতামত (ঐচ্ছিক)") :
                   dialog.kind === "request_cancel" ? (en ? "Reason (optional)" : "কারণ (ঐচ্ছিক)") :
                   (en ? "Reason" : "কারণ")}
                </span>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={4000}
                  required={dialog.kind !== "approve" && dialog.kind !== "request_cancel"}
                  className={`${inputCls} py-2.5`} />
                {dialog.kind === "raise_dispute" && (
                  <span className="block mt-1.5 text-[12px] text-ink-4">
                    {en ? "Funds stay in escrow. An administrator reviews the submissions and decides to release, refund, or resume work." : "অ্যাডমিন পর্যালোচনা করে সিদ্ধান্ত নেবেন।"}
                  </span>
                )}
              </label>
            )}

            {dialog.kind === "submit" && (
              <>
                <label className="block">
                  <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Demo or repository link (optional)" : "ডেমো লিংক (ঐচ্ছিক)"}</span>
                  <input type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://" className={`${inputCls} h-10`} />
                </label>
                <label className="block">
                  <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Other file links (optional, one per line)" : "অন্যান্য লিংক"}</span>
                  <textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={2} placeholder="https://drive.google.com/..." className={`${inputCls} py-2.5`} />
                </label>
              </>
            )}

            {dialog.kind === "amendment" && (
              <div className="space-y-3">
                <label className="block">
                  <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Title" : "শিরোনাম"}</span>
                  <input required minLength={3} maxLength={160} value={amend.title} onChange={(e) => setAmend({ ...amend, title: e.target.value })} className={`${inputCls} h-10`} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Amount (৳)" : "পরিমাণ (৳)"}</span>
                    <input required inputMode="decimal" value={amend.amount} onChange={(e) => setAmend({ ...amend, amount: e.target.value.replace(/[^\d.]/g, "") })} className={`${inputCls} h-10 mk-tabular`} />
                  </label>
                  <label className="block">
                    <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Deadline (optional)" : "ডেডলাইন"}</span>
                    <input type="date" value={amend.deadline} onChange={(e) => setAmend({ ...amend, deadline: e.target.value })} className={`${inputCls} h-10`} />
                  </label>
                </div>
                <label className="block">
                  <span className="block text-[13px] font-medium text-ink-2 mb-1.5">{en ? "Description" : "বিবরণ"}</span>
                  <textarea value={amend.description} maxLength={4000} rows={3} onChange={(e) => setAmend({ ...amend, description: e.target.value })} className={`${inputCls} py-2.5`} />
                </label>
                <p className="text-[12px] text-ink-4">{en ? "Existing milestones don't change. The freelancer must accept this before it can be funded." : "ফ্রিল্যান্সার গ্রহণ করলে এটি যুক্ত হবে।"}</p>
              </div>
            )}

            {actionError && <p role="alert" className="text-[13px] font-medium text-danger-strong">{actionError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => { setDialog(null); setActionError(null); }} disabled={busyAction !== null}>
                {en ? "Cancel" : "বাতিল"}
              </Button>
              <Button type="submit" loading={busyAction !== null}
                variant={dialog.kind === "raise_dispute" || dialog.kind === "request_cancel" ? "danger" : "primary"}>
                {dialog.kind === "release" ? (en ? "Release payment" : "রিলিজ করুন") :
                 dialog.kind === "fund" ? (en ? "Continue to payment" : "পেমেন্টে যান") :
                 dialog.kind === "approve" ? (en ? "Approve" : "অনুমোদন") :
                 dialog.kind === "raise_dispute" ? (en ? "Open dispute" : "বিরোধ খুলুন") :
                 (en ? "Send" : "পাঠান")}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
