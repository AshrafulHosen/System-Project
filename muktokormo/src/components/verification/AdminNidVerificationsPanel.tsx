"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, IdCard, RefreshCw, Search, Trash2 } from "lucide-react";
import {
  Button,
  EmptyState,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import NIDReviewModal from "@/components/verification/NIDReviewModal";
import VerificationBadge from "@/components/verification/VerificationBadge";
import type { NidAdminRow } from "@/lib/nid/shared";

type StatusFilter = "all" | "pending" | "approved" | "rejected";
type RoleFilter = "all" | "client" | "freelancer";

interface ListResponse {
  ok: boolean;
  error?: string;
  rows: NidAdminRow[];
  total: number;
  page: number;
  pageSize: number;
  counts: { all: number; pending: number; approved: number; rejected: number };
}

const PAGE_SIZE = 15;

function fmt(iso: string | null) {
  return iso ? new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "—";
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 px-3 rounded-md text-[12px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
        active ? "bg-ink text-white border-ink" : "bg-white text-ink-2 border-line-strong hover:bg-subtle"
      }`}
    >
      {children}
    </button>
  );
}

/** Admin: NID Verification Management (list, filter, search, review, retention). */
export default function AdminNidVerificationsPanel() {
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [role, setRole] = useState<RoleFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [purgeMsg, setPurgeMsg] = useState<string | null>(null);

  // Debounce search input.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (status !== "all") params.set("status", status);
    if (role !== "all") params.set("role", role);
    if (q) params.set("q", q);
    try {
      const res = await fetch(`/api/nid/admin/requests?${params}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as ListResponse | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error || "Failed to load submissions.");
        return;
      }
      setData(json);
      setError(null);
    } catch {
      setError("Network error while loading submissions.");
    } finally {
      setLoading(false);
    }
  }, [page, status, role, q]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function runRetention() {
    if (purging) return;
    if (!window.confirm("Delete NID images that are past the retention period (approved > 90 days, rejected > 30 days, unattached uploads > 24 hours)? Review records are kept.")) {
      return;
    }
    setPurging(true);
    setPurgeMsg(null);
    try {
      const res = await fetch("/api/nid/admin/retention", { method: "POST" });
      const json = await res.json().catch(() => null);
      setPurgeMsg(
        res.ok && json?.ok
          ? `Retention cleanup complete: ${json.deletedFiles} file(s) deleted from ${json.submissionsPurged} submission(s), including ${json.orphanFiles} unattached upload(s).`
          : json?.error || "Retention cleanup failed."
      );
      if (res.ok) void load();
    } catch {
      setPurgeMsg("Network error. Nothing was deleted.");
    } finally {
      setPurging(false);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const counts = data?.counts;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["pending", "approved", "rejected", "all"] as const).map((s) => (
            <Chip
              key={s}
              active={status === s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
            >
              {s === "all" ? "All submissions" : s[0].toUpperCase() + s.slice(1)}
              {counts && <span className="ml-1.5 opacity-70 mk-tabular">{counts[s]}</span>}
            </Chip>
          ))}
          <span className="w-px h-5 bg-line mx-1 hidden sm:block" aria-hidden="true" />
          {(["all", "client", "freelancer"] as const).map((r) => (
            <Chip
              key={r}
              active={role === r}
              onClick={() => {
                setRole(r);
                setPage(1);
              }}
            >
              {r === "all" ? "All roles" : r === "client" ? "Clients" : "Freelancers"}
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex-1 lg:w-64">
            <span className="sr-only">Search by name or email</span>
            <Search className="w-4 h-4 text-ink-4 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-line-strong bg-white text-[13px] text-ink placeholder-ink-4 focus:outline-none focus:ring-4 focus:ring-brand/15 focus:border-brand"
            />
          </label>
          <Button size="sm" variant="outline" onClick={() => void load()} aria-label="Refresh" leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}>
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-[13px] rounded-md px-3 py-2 border bg-danger-soft border-danger-border text-danger-strong">
          {error}
        </p>
      )}

      {data && data.rows.length === 0 && !loading ? (
        <EmptyState
          icon={<IdCard className="w-5 h-5" />}
          title={status === "pending" ? "No submissions waiting for review" : "No submissions found"}
          description={q ? "Try a different name or email." : "New NID submissions from clients and freelancers will appear here."}
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Submitted</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell align="right">Action</TableHeaderCell>
            </TableHead>
            <tbody>
              {!data &&
                loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-4" ><div className="h-4 w-40 rounded bg-subtle animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-16 rounded bg-subtle animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-20 rounded bg-subtle animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-24 rounded bg-subtle animate-pulse" /></TableCell>
                    <TableCell align="right"><div className="h-7 w-16 rounded bg-subtle animate-pulse ml-auto" /></TableCell>
                  </TableRow>
                ))}
              {data?.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-semibold text-ink truncate max-w-[220px]">{r.name}</p>
                    <p className="text-[12px] text-ink-3 truncate max-w-[220px]">{r.email}</p>
                  </TableCell>
                  <TableCell className="capitalize">{r.role}</TableCell>
                  <TableCell className="whitespace-nowrap mk-tabular">{fmt(r.submittedAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <VerificationBadge status={r.status} />
                      {r.documentsDeleted && <span className="text-[11px] text-ink-4">Images deleted</span>}
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="sm" variant={r.status === "pending" ? "primary" : "outline"} onClick={() => setReviewId(r.id)}>
                      {r.status === "pending" ? "Review" : "View"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between gap-3 text-[12px] text-ink-3">
          <span className="mk-tabular">
            Page {data.page} of {totalPages} · {data.total} submissions
          </span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}>
              Prev
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)} rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
              Next
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-canvas/60 px-4 py-3">
        <p className="text-[12px] text-ink-3 leading-relaxed">
          Retention: images are deleted 90 days after approval, 30 days after rejection (or on resubmission), and unattached uploads after
          24 hours. Review records are kept.
        </p>
        <Button size="sm" variant="outline" loading={purging} onClick={() => void runRetention()} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
          Run retention cleanup
        </Button>
      </div>
      {purgeMsg && <p className="text-[12px] text-ink-2" role="status">{purgeMsg}</p>}

      <NIDReviewModal verificationId={reviewId} onClose={() => setReviewId(null)} onReviewed={() => void load()} />
    </div>
  );
}
