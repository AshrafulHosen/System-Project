import type TalkType from "talkjs";

export const TALKJS_APP_ID = process.env.NEXT_PUBLIC_TALKJS_APP_ID || "t6ZAnQRV";

export interface TalkUserDef {
  id: string;
  name: string;
  email: string;
  role: "client" | "freelancer" | "admin" | "default";
  photoUrl: string;
  welcomeMessage?: string;
  headerTitle?: string;
}

export interface TalkConversationDef {
  id: string;
  subject: string;
  contractId?: string;
  client: TalkUserDef;
  freelancer: TalkUserDef;
  budgetBdt?: number;
  escrowBdt?: number;
  milestoneTitle?: string;
  milestoneStatus?: string;
  bidStatus?: "ACCEPTED" | "PENDING";
  deliveryDays?: number;
}

export const DEFAULT_TALK_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

/**
 * Generates a stable, collision-free TalkJS user ID.
 * Prefers Supabase user/profile UUID if provided, falls back to role + sanitized name.
 */
export function buildStableTalkUserId(params: {
  userId?: string | null;
  role: "client" | "freelancer" | "admin" | "default";
  name?: string | null;
}): string {
  if (params.userId && params.userId.trim().length > 10) {
    return `${params.role}_${params.userId.trim().replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  }
  const cleanName = (params.name || "user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return `${params.role}_${cleanName}`;
}

/**
 * Normalizes any app user or profile into a valid TalkJS user object.
 */
export function formatTalkUser(params: {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  photoUrl?: string | null;
  welcomeMessage?: string;
  headerTitle?: string;
}): TalkUserDef {
  const cleanId = params.id ? String(params.id).trim() : `user-${Date.now()}`;
  const cleanName = params.name ? String(params.name).trim() : "MuktoKormo User";
  const cleanRole =
    params.role === "client" || params.role === "freelancer" || params.role === "admin"
      ? params.role
      : "default";
  const emailFallback = `${cleanName.replace(/\s+/g, "").toLowerCase() || "user"}@muktokormo.bd`;

  return {
    id: cleanId,
    name: cleanName,
    email: params.email || emailFallback,
    role: cleanRole,
    photoUrl: params.photoUrl || DEFAULT_TALK_AVATAR,
    welcomeMessage: params.welcomeMessage,
    headerTitle: params.headerTitle,
  };
}

/**
 * Builds a deterministic, collision-free 1-to-1 conversation ID between two users,
 * optionally scoped to a project contract.
 */
export function getOneOnOneConversationId(userAId: string, userBId: string, contextId?: string): string {
  const sorted = [userAId, userBId].sort();
  const pairKey = `${sorted[0]}__${sorted[1]}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  if (contextId) {
    const cleanContext = contextId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `one_on_one_c_${cleanContext}__${pairKey}`;
  }
  return `one_on_one_direct__${pairKey}`;
}

/**
 * Singleton promise so the CDN script is injected exactly once, even across
 * HMR re-evaluations and Turbopack module re-execution.
 *
 * The talkjs npm package works by:
 *   1. Injecting a <script src="cdn.talkjs.com/talk.js"> tag
 *   2. Setting window.Talk to a stub with a fake `ready` thenable
 *   3. When the CDN script loads, it replaces window.Talk with the real SDK
 *      and drains the queued callbacks
 *
 * Problem with Turbopack / Next.js HMR: every re-evaluation of the npm
 * package module re-runs the IIFE, which OVERWRITES window.Talk with a NEW
 * stub whose callback queue is empty. The CDN script has already loaded and
 * resolved the OLD stub, so the new stub's `await Talk.ready` hangs forever,
 * causing the ".mount has taken over 60 seconds" error.
 *
 * Fix: bypass the npm package's side-effecting loader entirely. Inject the
 * CDN script tag ourselves (once), then wait for window.Talk to become the
 * real SDK (it has a `Session` constructor when fully loaded).
 */
let _talkjsPromise: Promise<typeof TalkType | null> | null = null;

function isRealTalkSDK(obj: any): obj is typeof TalkType {
  return obj && typeof obj === "object" && typeof obj.Session === "function";
}

export async function getTalkJS(): Promise<typeof TalkType | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // If the real SDK is already on window.Talk (e.g. from a previous load),
  // return it immediately — no need to inject anything.
  if (isRealTalkSDK((window as any).Talk)) {
    return (window as any).Talk as typeof TalkType;
  }

  // Deduplicate: only create one loading promise per page lifetime.
  if (_talkjsPromise) {
    return _talkjsPromise;
  }

  _talkjsPromise = new Promise<typeof TalkType | null>((resolve, reject) => {
    // Check if we already have a script tag for TalkJS CDN
    const existingScript = document.querySelector(
      'script[src="https://cdn.talkjs.com/talk.js"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://cdn.talkjs.com/talk.js";
      script.async = true;
      script.onerror = () => {
        _talkjsPromise = null;
        reject(new Error("Failed to load TalkJS CDN script."));
      };
      document.head.appendChild(script);
    }

    // Poll for the real SDK on window.Talk. The CDN script replaces the
    // stub with the full SDK object that has `Session`, `User`, etc.
    let elapsed = 0;
    const interval = 100; // ms
    const maxWait = 30_000; // 30s timeout

    const timer = setInterval(() => {
      elapsed += interval;

      if (isRealTalkSDK((window as any).Talk)) {
        clearInterval(timer);
        resolve((window as any).Talk as typeof TalkType);
        return;
      }

      if (elapsed >= maxWait) {
        clearInterval(timer);
        _talkjsPromise = null;
        reject(
          new Error(
            "TalkJS SDK did not load within 30 seconds. Check your network connection."
          )
        );
      }
    }, interval);
  });

  return _talkjsPromise;
}
