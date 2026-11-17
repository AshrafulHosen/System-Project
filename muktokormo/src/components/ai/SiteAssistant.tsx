"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, MessageCircleQuestion, RotateCcw, Sparkles, X } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  links?: { href: string; label: string }[];
  error?: boolean;
}

const STORAGE_KEY = "mk_site_assistant_v1";
const STARTERS = [
  "How does escrow protect my payment?",
  "What is the platform fee?",
  "How do milestone contracts work?",
  "আমি কীভাবে কাজ পোস্ট করব?",
];
/** Pages where a floating button would cover the main UI. */
const HIDDEN_ON = ["/messages"];

function loadHistory(): Msg[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(parsed) ? parsed.slice(-20) : [];
  } catch {
    return [];
  }
}

export default function SiteAssistant() {
  const pathname = usePathname();
  const [configured, setConfigured] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Don't write history to storage until it has been read, or the first render would erase it.
  const historyLoaded = useRef(false);

  // Only show the assistant when the server has AI configured.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/status", { cache: "no-store" });
        const json = (await res.json()) as { configured?: boolean };
        if (!cancelled) {
          setConfigured(Boolean(json.configured));
          setMessages(loadHistory());
          historyLoaded.current = true;
        }
      } catch {
        /* stay hidden */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!historyLoaded.current) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      /* storage unavailable — history just won't persist */
    }
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const ask = async (question: string) => {
    const q = question.trim().slice(0, 1000);
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => !m.error).slice(-12).map(({ role, content }) => ({ role, content })),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; answer?: string; links?: Msg["links"] };
      if (!res.ok || !json.ok || !json.answer) {
        setMessages((m) => [...m, { role: "assistant", content: json.error || "Sorry, I couldn't answer that. Please try again.", error: true }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: json.answer!, links: json.links ?? [] }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error. Please check your connection and try again.", error: true }]);
    } finally {
      setBusy(false);
    }
  };

  if (!configured || HIDDEN_ON.some((p) => pathname?.startsWith(p))) return null;

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="mk-assistant-title"
          className="fixed z-[60] bottom-[5.5rem] right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[min(560px,calc(100dvh-7.5rem))] flex flex-col bg-white border border-line rounded-2xl shadow-[var(--mk-shadow-popover)] overflow-hidden mk-zoom-in"
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 bg-navy text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0" aria-hidden="true">
                <Sparkles className="w-4 h-4 text-brand-light" />
              </span>
              <div className="min-w-0">
                <h2 id="mk-assistant-title" className="text-[14px] font-semibold leading-tight">Ask Muktokormo</h2>
                <p className="text-[11.5px] text-white/60 leading-tight">AI help with using the platform</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button type="button" onClick={() => setMessages([])} aria-label="Start a new conversation"
                  className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10 cursor-pointer">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button type="button" onClick={close} aria-label="Close assistant"
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-canvas" aria-live="polite" aria-busy={busy}>
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-[13.5px] text-ink-2 leading-relaxed">
                  Hi! I can answer questions about how Muktokormo works — posting jobs, bidding, escrow, milestones, fees and reviews.
                </p>
                <div className="flex flex-col gap-1.5">
                  {STARTERS.map((s) => (
                    <button key={s} type="button" onClick={() => void ask(s)}
                      className="text-left px-3 py-2 rounded-lg bg-white border border-line hover:border-brand hover:bg-brand-soft/50 text-[13px] text-ink-2 hover:text-brand-strong transition-colors cursor-pointer">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-brand text-white rounded-br-md"
                      : m.error
                      ? "bg-danger-soft text-danger-strong border border-danger-border rounded-bl-md"
                      : "bg-white text-ink border border-line rounded-bl-md"
                  }`}
                >
                  {m.role === "assistant" && !m.error && <span className="sr-only">Assistant: </span>}
                  {m.content}
                  {m.links && m.links.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-brand-soft text-brand-strong text-[12px] font-medium hover:bg-brand-soft-2">
                          {l.label} →
                        </Link>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start" aria-label="Assistant is typing">
                <div className="bg-white border border-line rounded-2xl rounded-bl-md px-3.5 py-3 flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-ink-4 animate-pulse" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <form className="border-t border-line p-3 bg-white" onSubmit={(e) => { e.preventDefault(); void ask(input); }}>
            <div className="flex items-end gap-2">
              <label htmlFor="mk-assistant-input" className="sr-only">Your question</label>
              <textarea
                id="mk-assistant-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={1000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask(input);
                  }
                }}
                placeholder="Ask about Muktokormo…"
                className="flex-1 resize-none max-h-28 rounded-lg bg-canvas border border-line-strong px-3 py-2.5 text-[13.5px] text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/12"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send question"
                className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-lg bg-brand hover:bg-brand-hover text-white disabled:opacity-40 cursor-pointer transition-colors">
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink-4">AI answers can be wrong and it can&apos;t see your account. Check important details.</p>
          </form>
        </section>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? "Close Muktokormo assistant" : "Ask Muktokormo assistant"}
        className="fixed z-[60] bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 rounded-full bg-navy hover:bg-brand text-white shadow-[0_12px_32px_-8px_rgba(24,60,98,0.55)] inline-flex items-center justify-center transition-colors cursor-pointer"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircleQuestion className="w-6 h-6" />}
      </button>
    </>
  );
}
