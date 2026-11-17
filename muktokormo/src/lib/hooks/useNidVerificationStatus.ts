"use client";

import { useCallback, useEffect, useState } from "react";
import type { NidStatus, NidStatusResponse } from "@/lib/nid/shared";
import type { NidVerificationSummary } from "@/components/verification/NIDVerification";

/**
 * The signed-in user's NID review status as reported by the server
 * (null while loading / signed out). Never derived from client state.
 */
export default function useNidVerificationStatus(enabled = true) {
  const [status, setStatus] = useState<NidStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/nid/status", { cache: "no-store" });
      if (!res.ok) return;
      const s = (await res.json()) as NidStatusResponse;
      setStatus(s.status);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void Promise.resolve().then(refresh);
  }, [enabled, refresh]);

  const update = useCallback((s: NidVerificationSummary) => setStatus(s.status), []);

  return { status, verified: status === "approved", refresh, update };
}
