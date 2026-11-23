"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Lock, Paperclip, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import {
  PROJECT_FILE_ACCEPT,
  PROJECT_FILES_MAX_COUNT,
  formatFileSize,
  validateProjectFile,
  type ProjectFilesResponse,
} from "@/lib/project-files/shared";
import { uploadProjectFile } from "@/lib/project-files/upload";

interface Props {
  /** Provide one of these. */
  projectId?: string;
  contractId?: string;
  lang?: "en" | "bn";
  className?: string;
}

/**
 * Files the client attached to a job. The client can add/remove them; the
 * hired freelancer (and admins) can download them; other viewers only see
 * that files exist and will be shared after hiring.
 */
export default function ProjectFiles({ projectId, contractId, lang = "en", className = "" }: Props) {
  const en = lang === "en";
  const [data, setData] = useState<ProjectFilesResponse | null>(null);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const endpoint = contractId ? `/api/contracts/${contractId}/files` : projectId ? `/api/projects/${projectId}/files` : null;

  const load = useCallback(async () => {
    if (!endpoint) return;
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 400) {
        setHidden(true);
        return;
      }
      const json = (await res.json()) as ProjectFilesResponse;
      setData(json);
      setHidden(false);
    } catch {
      setError(en ? "Couldn't load project files." : "প্রজেক্ট ফাইল লোড করা যায়নি।");
    }
  }, [endpoint, en]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function addFiles(list: FileList | null) {
    if (!list || !data || uploading) return;
    setError(null);
    const files = Array.from(list);
    const room = PROJECT_FILES_MAX_COUNT - data.files.length;
    if (files.length > room) {
      setError(en ? `You can attach up to ${PROJECT_FILES_MAX_COUNT} files per project.` : `প্রতি প্রজেক্টে সর্বোচ্চ ${PROJECT_FILES_MAX_COUNT}টি ফাইল।`);
      return;
    }
    for (const f of files) {
      const problem = validateProjectFile(f);
      if (problem) {
        setError(problem);
        return;
      }
    }
    try {
      for (const f of files) {
        setUploading({ name: f.name, pct: 0 });
        await uploadProjectFile(data.projectId, f, (pct) => setUploading({ name: f.name, pct }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : en ? "Upload failed." : "আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setUploading(null);
      await load();
    }
  }

  async function remove(fileId: string, name: string) {
    if (!data || deleting) return;
    if (!window.confirm(en ? `Remove "${name}" from this project?` : `"${name}" ফাইলটি সরাবেন?`)) return;
    setDeleting(fileId);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${data.projectId}/files/${fileId}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) setError(json?.error || (en ? "Couldn't remove the file." : "ফাইল সরানো যায়নি।"));
      await load();
    } finally {
      setDeleting(null);
    }
  }

  if (!endpoint || hidden) return null;
  if (!data) {
    return error ? (
      <p className={`text-[13px] text-danger-strong ${className}`}>{error}</p>
    ) : (
      <div className={`h-24 rounded-xl bg-subtle animate-pulse ${className}`} aria-busy="true" />
    );
  }

  const isOwner = data.access === "owner";
  // Non-parties with nothing attached: nothing to say.
  if (data.access === "none" && data.count === 0) return null;
  // Freelancer / admin view with no files: stay quiet as well.
  if (!isOwner && data.access !== "none" && data.files.length === 0) return null;

  return (
    <section className={`bg-white border border-line rounded-xl p-6 shadow-xs space-y-4 ${className}`} aria-labelledby="project-files-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="project-files-heading" className="text-sm font-semibold text-ink flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-ink-3" aria-hidden="true" />
          {en ? "Project files" : "প্রজেক্ট ফাইল"}
          <span className="text-[11px] font-mono mk-tabular text-ink-4">{data.count}</span>
        </h2>
        {isOwner && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={PROJECT_FILE_ACCEPT}
              className="sr-only"
              id="project-files-input"
              onChange={(e) => {
                void addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              loading={Boolean(uploading)}
              disabled={data.files.length >= PROJECT_FILES_MAX_COUNT}
              onClick={() => inputRef.current?.click()}
            >
              {en ? "Add files" : "ফাইল যোগ করুন"}
            </Button>
          </>
        )}
      </div>

      {data.access === "none" ? (
        <p className="flex items-start gap-2 text-[13px] text-ink-3">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          {en
            ? `The client attached ${data.count} file${data.count === 1 ? "" : "s"}. They are shared with the freelancer once a proposal is accepted.`
            : `ক্লায়েন্ট ${data.count}টি ফাইল সংযুক্ত করেছেন। প্রস্তাব গৃহীত হলে ফ্রিল্যান্সারের সঙ্গে শেয়ার করা হয়।`}
        </p>
      ) : (
        <>
          {data.files.length === 0 ? (
            <p className="text-[13px] text-ink-3">
              {en
                ? "No files yet. Add briefs, designs or reference documents — your hired freelancer will be able to download them."
                : "এখনও কোনো ফাইল নেই। ব্রিফ, ডিজাইন বা রেফারেন্স ফাইল যোগ করুন — নিয়োগকৃত ফ্রিল্যান্সার ডাউনলোড করতে পারবেন।"}
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {data.files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="w-8 h-8 rounded-md bg-subtle text-ink-3 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink truncate">{f.fileName}</p>
                    <p className="text-[11px] text-ink-4 font-mono mk-tabular">{formatFileSize(f.sizeBytes)}</p>
                  </div>
                  <a
                    href={`/api/projects/${data.projectId}/files/${f.id}`}
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12px] font-medium text-brand hover:bg-brand-soft"
                    aria-label={`${en ? "Download" : "ডাউনলোড"} ${f.fileName}`}
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">{en ? "Download" : "ডাউনলোড"}</span>
                  </a>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => void remove(f.id, f.fileName)}
                      disabled={deleting === f.id}
                      className="inline-flex items-center h-8 px-2 rounded-md text-danger-strong hover:bg-danger-soft disabled:opacity-50 cursor-pointer"
                      aria-label={`${en ? "Remove" : "সরান"} ${f.fileName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isOwner && (
            <p className="text-[11px] text-ink-4">
              {en
                ? "Private: only you, the freelancer you hire for this job, and Muktokormo admins can open these files. PDF, Office, TXT, CSV, images or ZIP · up to 20 MB each · max 10."
                : "ব্যক্তিগত: শুধু আপনি, এই কাজে নিয়োগকৃত ফ্রিল্যান্সার ও অ্যাডমিন ফাইলগুলো খুলতে পারবেন।"}
            </p>
          )}
        </>
      )}

      {uploading && (
        <div className="space-y-1" role="status">
          <p className="text-[12px] text-ink-3 truncate">
            {en ? "Uploading" : "আপলোড হচ্ছে"} {uploading.name} · {uploading.pct}%
          </p>
          <div className="h-1 rounded-full bg-subtle overflow-hidden">
            <div className="h-full bg-brand transition-all" style={{ width: `${uploading.pct}%` }} />
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-[13px] rounded-md px-3 py-2 border bg-danger-soft border-danger-border text-danger-strong">
          {error}
        </p>
      )}
    </section>
  );
}
