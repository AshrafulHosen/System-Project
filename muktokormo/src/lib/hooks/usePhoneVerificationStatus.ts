"use client";

import { useCallback, useEffect, useState } from "react";
import type { PhoneStatusResponse } from "@/lib/phone/shared";
import type { PhoneVerificationSummary } from "@/components/profile/PhoneVerification";

/**
 * Lightweight read of the signed-in user's phone verification state, for
 * dashboards and future features that need to gate on a verified phone.
 * `verified` is null while loading or when the user is signed out.
 */
export default function usePhoneVerificationStatus(enabled = true) {
  const [summary, setSummary] = useState<{ verified: boolean | null; phoneNumber: string | null }>({
    verified: null,
    phoneNumber: null,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/phone/status", { cache: "no-store" });
      if (!res.ok) return;
      const s = (await res.json()) as PhoneStatusResponse;
      setSummary({ verified: s.verified, phoneNumber: s.verified ? s.phoneNumber : null });
    } catch {
      /* non-critical: leave unknown */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void Promise.resolve().then(refresh);
  }, [enabled, refresh]);

  /** Pass to <PhoneVerification onStatusChange> to keep both in sync. */
  const update = useCallback((s: PhoneVerificationSummary) => {
    setSummary({ verified: s.verified, phoneNumber: s.phoneNumber });
  }, []);

  return { ...summary, refresh, update };
}
