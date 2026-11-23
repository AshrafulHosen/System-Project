"use client";

import { cleanFileName, type ProjectFileRecord } from "@/lib/project-files/shared";

export class ProjectFileUploadError extends Error {}

function putWithProgress(url: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new ProjectFileUploadError(`Upload of "${file.name}" was refused.`));
    xhr.onerror = () => reject(new ProjectFileUploadError("Network error while uploading."));
    xhr.send(file);
  });
}

/** Mint → upload straight to private Storage → register. Owner only (enforced by the server). */
export async function uploadProjectFile(
  projectId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<ProjectFileRecord> {
  const mintRes = await fetch(`/api/projects/${projectId}/files/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  const mint = await mintRes.json().catch(() => null);
  if (!mintRes.ok || !mint?.ok) throw new ProjectFileUploadError(mint?.error || `Couldn't upload "${file.name}".`);

  await putWithProgress(mint.signedUrl, file, onProgress);

  const regRes = await fetch(`/api/projects/${projectId}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId: mint.fileId, path: mint.path, fileName: cleanFileName(file.name) }),
  });
  const reg = await regRes.json().catch(() => null);
  if (!regRes.ok || !reg?.ok || !reg.file) throw new ProjectFileUploadError(reg?.error || `Couldn't save "${file.name}".`);
  return reg.file as ProjectFileRecord;
}
