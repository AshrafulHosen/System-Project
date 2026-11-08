"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  getTalkJS,
  TALKJS_APP_ID,
  TalkUserDef,
  DEFAULT_TALK_AVATAR,
} from "@/lib/talkjs";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";

export interface TalkJSChatProps {
  mode?: "inbox" | "chatbox";
  conversationId?: string;
  currentUser: TalkUserDef;
  otherUser?: TalkUserDef;
  subject?: string;
  customData?: Record<string, string>;
  height?: string;
  className?: string;
}

export default function TalkJSChat({
  mode = "chatbox",
  conversationId,
  currentUser,
  otherUser,
  subject = "Direct 1-on-1 Workspace Conversation",
  customData,
  height = "640px",
  className = "",
}: TalkJSChatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track the mounted UI and session so cleanup can properly destroy them
  const uiRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);

  const cleanup = useCallback(() => {
    // Destroy the UI (inbox/chatbox) first, then the session
    if (uiRef.current) {
      try {
        uiRef.current.destroy();
      } catch (e) {
        // Ignore — may already be detached from DOM
      }
      uiRef.current = null;
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.destroy();
      } catch (e) {
        // Ignore — session may already be destroyed
      }
      sessionRef.current = null;
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function initTalkJS() {
      if (!currentUser || !currentUser.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // getTalkJS() handles CDN script injection + singleton caching.
        // It returns the real TalkJS SDK object (not the npm stub).
        // No `await Talk.ready` needed — our loader guarantees it.
        const Talk = await getTalkJS();
        if (!Talk) {
          throw new Error("TalkJS can only be loaded in a browser environment.");
        }

        if (isCancelled || !containerRef.current) return;

        // 1. Create Current User
        const me = new Talk.User({
          id: currentUser.id,
          name: currentUser.name || "MuktoKormo User",
          email: currentUser.email || `${currentUser.id}@muktokormo.bd`,
          photoUrl: currentUser.photoUrl || DEFAULT_TALK_AVATAR,
          role: currentUser.role || "default",
          welcomeMessage: currentUser.welcomeMessage,
        });

        // 2. Initialize TalkJS Session
        const session = new Talk.Session({
          appId: TALKJS_APP_ID,
          me,
        });
        if (isCancelled) {
          try { session.destroy(); } catch {}
          return;
        }
        sessionRef.current = session;

        // 3. Create or select 1-on-1 conversation
        let targetConversation: any = null;

        if (otherUser && otherUser.id) {
          const other = new Talk.User({
            id: otherUser.id,
            name: otherUser.name || "Partner",
            email: otherUser.email || `${otherUser.id}@muktokormo.bd`,
            photoUrl: otherUser.photoUrl || DEFAULT_TALK_AVATAR,
            role: otherUser.role || "default",
            welcomeMessage: otherUser.welcomeMessage,
          });

          // Guaranteed isolated 1-on-1 conversation ID between me and otherUser
          const oneOnOneId = Talk.oneOnOneId(me, other);
          const convId = conversationId
            ? `one_on_one_${conversationId.replace(/[^a-zA-Z0-9_-]/g, "_")}__${oneOnOneId}`
            : `one_on_one_direct__${oneOnOneId}`;

          targetConversation = session.getOrCreateConversation(convId);
          targetConversation.setParticipant(me);
          targetConversation.setParticipant(other);

          targetConversation.setAttributes({
            subject: subject,
            ...(customData ? { custom: customData } : {}),
          });
        } else if (conversationId) {
          targetConversation = session.getOrCreateConversation(conversationId);
          targetConversation.setParticipant(me);
          if (subject) {
            targetConversation.setAttributes({
              subject,
              ...(customData ? { custom: customData } : {}),
            });
          }
        }

        if (isCancelled || !containerRef.current) {
          cleanup();
          return;
        }

        // 4. Mount UI (Inbox or Chatbox)
        let ui: any;
        if (mode === "inbox") {
          ui = session.createInbox({
            showFeedHeader: true,
          });
          if (targetConversation) {
            ui.select(targetConversation);
          }
        } else {
          // Hide duplicate internal TalkJS header in Chatbox mode since custom header is already present
          ui = session.createChatbox({
            showChatHeader: false,
          });
          if (targetConversation) {
            ui.select(targetConversation);
          }
        }

        uiRef.current = ui;

        if (isCancelled || !containerRef.current) {
          cleanup();
          return;
        }

        await ui.mount(containerRef.current);

        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error("TalkJS mount error:", err);
        if (!isCancelled) {
          setError(err?.message || "Failed to connect to TalkJS real-time messaging service.");
          setLoading(false);
        }
      }
    }

    initTalkJS();

    return () => {
      isCancelled = true;
      cleanup();
    };
  }, [
    currentUser.id,
    currentUser.name,
    currentUser.photoUrl,
    otherUser?.id,
    otherUser?.name,
    otherUser?.photoUrl,
    conversationId,
    mode,
    subject,
    cleanup,
  ]);

  return (
    <div className={`relative flex flex-col flex-1 w-full h-full min-h-[520px] bg-white overflow-hidden talkjs-chat-wrapper ${className}`}>
      {/* Dynamic CSS override to guarantee TalkJS iframe always stretches 100% */}
      <style>{`
        .talkjs-chat-wrapper,
        .talkjs-chat-wrapper > div,
        .talkjs-chat-wrapper iframe,
        iframe[name="____talkjs__chat__ui_internal"] {
          width: 100% !important;
          height: 100% !important;
          min-height: 520px !important;
          display: block !important;
          border: none !important;
          box-sizing: border-box !important;
        }
      `}</style>

      {/* Minimalist Upwork-Style Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white p-6 text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium text-slate-500">Loading conversation...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-8 text-center bg-rose-50/50 border border-rose-200 rounded-2xl m-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-rose-900 mb-1">TalkJS Connection Notice</h4>
          <p className="text-xs text-rose-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* TalkJS Mounted Container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: height || "100%",
          minHeight: "520px",
          display: "flex",
          flexDirection: "column",
          flex: "1 1 0%",
        }}
        className="w-full flex-1 h-full min-h-[520px] overflow-hidden talkjs-chat-wrapper"
      />
    </div>
  );
}
