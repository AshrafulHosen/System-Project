"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveUserRole, UserRole } from "@/lib/auth";
import { fetchProfileIds } from "@/lib/data/profile";

interface CurrentUserState {
  userId: string | null;
  clientId: string | null;
  freelancerId: string | null;
  name: string;
  email: string;
  role: UserRole | null;
}

const ANONYMOUS: CurrentUserState = {
  userId: null,
  clientId: null,
  freelancerId: null,
  name: "",
  email: "",
  role: null,
};

export default function useCurrentUser() {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<CurrentUserState>(ANONYMOUS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const email = user.email ?? "";
      const rawName = user.user_metadata?.full_name;
      const name =
        (typeof rawName === "string" && rawName.trim()) ||
        email.split("@")[0] ||
        "User";

      const [role, ids] = await Promise.all([
        resolveUserRole(supabase, user.id),
        fetchProfileIds(supabase, user.id),
      ]);
      if (cancelled) return;

      setState({
        userId: user.id,
        clientId: ids.clientId,
        freelancerId: ids.freelancerId,
        name,
        email,
        role,
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return { ...state, loading };
}
