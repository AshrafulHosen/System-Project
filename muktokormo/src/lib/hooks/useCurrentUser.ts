"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveUserRole, UserRole } from "@/lib/auth";
import { fetchProfileIds } from "@/lib/data/profile";

export interface CurrentUserState {
  userId: string | null;
  clientId: string | null;
  freelancerId: string | null;
  name: string;
  email: string;
  role: UserRole | null;
  companyName: string | null;
  title: string | null;
  hourlyRate: number | null;
  skills: string[];
  bio: string | null;
  avatarUrl: string | null;
}

const ANONYMOUS: CurrentUserState = {
  userId: null,
  clientId: null,
  freelancerId: null,
  name: "",
  email: "",
  role: null,
  companyName: null,
  title: null,
  hourlyRate: null,
  skills: [],
  bio: null,
  avatarUrl: null,
};

export default function useCurrentUser() {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<CurrentUserState>(ANONYMOUS);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState(ANONYMOUS);
        setLoading(false);
        return;
      }

      const email = user.email ?? "";
      const rawName = user.user_metadata?.full_name;
      const defaultName =
        (typeof rawName === "string" && rawName.trim()) ||
        email.split("@")[0] ||
        "User";

      const [role, ids] = await Promise.all([
        resolveUserRole(supabase, user.id),
        fetchProfileIds(supabase, user.id),
      ]);

      let companyName: string | null = null;
      let title: string | null = null;
      let hourlyRate: number | null = null;
      let skills: string[] = [];
      let bio: string | null = null;
      let avatarUrl: string | null = user.user_metadata?.avatar_url || null;
      let displayName = defaultName;

      // Fetch live details from client or freelancer tables
      if (role === "client" && ids.clientId) {
        const { data: cData } = await supabase
          .from("clients")
          .select("company_name, display_name, avatar_url, company_bio")
          .eq("id", ids.clientId)
          .maybeSingle();

        if (cData) {
          companyName = cData.company_name;
          if (cData.display_name) displayName = cData.display_name;
          if (cData.avatar_url) avatarUrl = cData.avatar_url;
          bio = cData.company_bio;
        }
      } else if (role === "freelancer" && ids.freelancerId) {
        const { data: fData } = await supabase
          .from("freelancers")
          .select("title, hourly_rate, skills, bio, display_name, avatar_url")
          .eq("id", ids.freelancerId)
          .maybeSingle();

        if (fData) {
          title = fData.title;
          hourlyRate = fData.hourly_rate ? Number(fData.hourly_rate) : null;
          skills = Array.isArray(fData.skills) ? fData.skills : [];
          bio = fData.bio;
          if (fData.display_name) displayName = fData.display_name;
          if (fData.avatar_url) avatarUrl = fData.avatar_url;
        }
      }

      setState({
        userId: user.id,
        clientId: ids.clientId,
        freelancerId: ids.freelancerId,
        name: displayName,
        email,
        role,
        companyName,
        title,
        hourlyRate,
        skills,
        bio,
        avatarUrl,
      });
    } catch (err) {
      console.error("useCurrentUser error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    refreshUser();

    // Listen to Supabase auth state change events (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled) {
        refreshUser();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, refreshUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState(ANONYMOUS);
    window.location.href = "/login";
  }, [supabase]);

  return { ...state, loading, signOut, refreshUser };
}
