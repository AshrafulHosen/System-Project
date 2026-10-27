"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  getTalkJS,
  TALKJS_APP_ID,
  TalkUserDef,
  PRESET_CONVERSATIONS,
} from "@/lib/talkjs";
import { Loader2, AlertCircle, Wifi, ShieldCheck } from "lucide-react";

export interface TalkJSChatProps {
  mode?: "inbox" | "chatbox";
  conversationId?: string;
  currentUser: TalkUserDef;
  otherUser?: TalkUserDef;
  subject?: string;
  customData?: Record<string, string>;
  height?: string;
  className?: string;
  syncAllPresetConversations?: boolean;
}

export default function TalkJSChat({
  mode = "chatbox",
  conversationId = "conv-ctr-8842",
  currentUser,
  otherUser,
  subject = "MuktoKormo Workspace Contract",
  customData,
  height = "640px",
  className = "",
  syncAllPresetConversations = true,
}: TalkJSChatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let sessionInstance: any = null;
    let isCancelled = false;

    async function initTalkJS() {
      setLoading(true);
      setError(null);

      try {
        const Talk = await getTalkJS();
        if (!Talk) {
          throw new Error("TalkJS can only be loaded in a browser environment.");
        }

        await Talk.ready;
        if (isCancelled || !containerRef.current) return;

        // 1. Create Current User
        const me = new Talk.User({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          photoUrl: currentUser.photoUrl,
          role: currentUser.role,
          welcomeMessage: currentUser.welcomeMessage,
        });

        // 2. Initialize TalkJS Session with provided App ID
        const session = new Talk.Session({
          appId: TALKJS_APP_ID,
          me,
        });
        sessionInstance = session;

        // 3. Pre-seed all preset conversations so user can switch seamlessly in Inbox
        if (syncAllPresetConversations) {
          for (const convDef of PRESET_CONVERSATIONS) {
            try {
              const c = session.getOrCreateConversation(convDef.id);
              const clientParticipant = new Talk.User({
                id: convDef.client.id,
                name: convDef.client.name,
                email: convDef.client.email,
                photoUrl: convDef.client.photoUrl,
                role: convDef.client.role,
              });
              const freelancerParticipant = new Talk.User({
                id: convDef.freelancer.id,
                name: convDef.freelancer.name,
                email: convDef.freelancer.email,
                photoUrl: convDef.freelancer.photoUrl,
                role: convDef.freelancer.role,
              });

              c.setParticipant(clientParticipant);
              c.setParticipant(freelancerParticipant);
              c.setAttributes({
                subject: convDef.subject,
                custom: {
                  contractId: convDef.contractId,
                  budgetBdt: String(convDef.budgetBdt),
                },
              });
            } catch (seedErr) {
              console.warn("Failed to pre-seed conversation:", convDef.id, seedErr);
            }
          }
        }

        // 4. Set up the active conversation
        const conversation = session.getOrCreateConversation(conversationId);
        conversation.setParticipant(me);

        if (otherUser) {
          const other = new Talk.User({
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            photoUrl: otherUser.photoUrl,
            role: otherUser.role,
            welcomeMessage: otherUser.welcomeMessage,
          });
          conversation.setParticipant(other);
        }

        conversation.setAttributes({
          subject: subject,
          ...(customData ? { custom: customData } : {}),
        });

        // 5. Mount Chatbox or Inbox UI
        if (mode === "inbox") {
          const inbox = session.createInbox();
          inbox.select(conversation);
          await inbox.mount(containerRef.current);
        } else {
          const chatbox = session.createChatbox();
          chatbox.select(conversation);
          await chatbox.mount(containerRef.current);
        }

        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error("TalkJS mount error:", err);
        if (!isCancelled) {
          setError(err?.message || "Failed to connect to TalkJS service.");
          setLoading(false);
        }
      }
    }

    initTalkJS();

    return () => {
      isCancelled = true;
      if (sessionInstance) {
        try {
          sessionInstance.destroy();
        } catch (e) {
          console.warn("TalkJS session destroy warning:", e);
        }
      }
    };
  }, [
    currentUser.id,
    otherUser?.id,
    conversationId,
    mode,
    subject,
    syncAllPresetConversations,
  ]);

  return (
    <div className={`relative flex flex-col w-full bg-white overflow-hidden ${className}`}>
      {/* Loading State Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
          <h4 className="text-sm font-black text-slate-900 mb-1">
            Connecting Real-Time Chat...
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-3">
            Mounting TalkJS real-time communication session with App ID <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{TALKJS_APP_ID}</code>
          </p>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Bi-Directional Messaging Live</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-8 text-center bg-rose-50/50 border border-rose-200 rounded-2xl m-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-rose-900 mb-1">TalkJS Connection Error</h4>
          <p className="text-xs text-rose-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Reload Page
          </button>
        </div>
      )}

      {/* TalkJS Mounted Container */}
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full flex-1 overflow-hidden"
      />
    </div>
  );
}
