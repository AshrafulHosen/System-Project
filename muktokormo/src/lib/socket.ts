"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001";

let globalSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(SOCKET_SERVER_URL, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });
  }
  return globalSocket;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderId?: string;
  time: string;
  text: string;
  isClient: boolean;
  attachments?: Array<{ name: string; url: string; size?: string; type?: string }>;
  createdAt?: string;
}

export interface WorkspaceUser {
  id: string;
  name: string;
  role: "client" | "freelancer" | "admin";
  avatar?: string;
}

export interface UseWorkspaceSocketOptions {
  roomId: string;
  currentUser: WorkspaceUser;
  initialMessages?: ChatMessage[];
  onMilestoneUpdated?: (data: { eventType: string; milestone: any; updatedBy: WorkspaceUser }) => void;
  onBidAccepted?: (data: { threadId: string; acceptedBy: WorkspaceUser; bidAmountBdt: number; freelancerName: string; systemMessage?: ChatMessage }) => void;
}

export function useWorkspaceSocket({
  roomId,
  currentUser,
  initialMessages = [],
  onMilestoneUpdated,
  onBidAccepted,
}: UseWorkspaceSocketOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<WorkspaceUser[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<WorkspaceUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join_room", { roomId, user: currentUser });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleReceiveMessage = (newMsg: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicate messages if already present optimistically
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });
    };

    const handleMessageHistory = (history: ChatMessage[]) => {
      if (Array.isArray(history) && history.length > 0) {
        setMessages((prev) => {
          const combined = [...prev];
          for (const item of history) {
            if (!combined.some((m) => m.id === item.id)) {
              combined.push(item);
            }
          }
          return combined;
        });
      }
    };

    const handleRoomPresence = (members: WorkspaceUser[]) => {
      if (Array.isArray(members)) {
        setOnlineMembers(members);
      }
    };

    const handleUserTyping = (typingUser: WorkspaceUser) => {
      if (!typingUser || typingUser.id === currentUser.id) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => u.id === typingUser.id)) return prev;
        return [...prev, typingUser];
      });
    };

    const handleUserStopTyping = (stoppedUser: WorkspaceUser) => {
      if (!stoppedUser) return;
      setTypingUsers((prev) => prev.filter((u) => u.id !== stoppedUser.id));
    };

    const handleMilestoneEvent = (data: any) => {
      if (onMilestoneUpdated) {
        onMilestoneUpdated(data);
      }
    };

    const handleBidAccepted = (data: any) => {
      if (onBidAccepted) {
        onBidAccepted(data);
      }
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_history", handleMessageHistory);
    socket.on("room_presence", handleRoomPresence);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("milestone_updated", handleMilestoneEvent);
    socket.on("bid_accepted", handleBidAccepted);

    return () => {
      socket.emit("leave_room", { roomId, user: currentUser });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_history", handleMessageHistory);
      socket.off("room_presence", handleRoomPresence);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("milestone_updated", handleMilestoneEvent);
      socket.off("bid_accepted", handleBidAccepted);
    };
  }, [roomId, currentUser.id, onMilestoneUpdated, onBidAccepted]);

  // Send new message
  const sendMessage = useCallback(
    (text: string, attachments?: Array<{ name: string; url: string; size?: string; type?: string }>) => {
      if (!text.trim() && (!attachments || attachments.length === 0)) return;

      const socket = getSocket();
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sender: currentUser.name,
        senderId: currentUser.id,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: text.trim(),
        isClient: currentUser.role === "client",
        attachments: attachments || [],
        createdAt: new Date().toISOString(),
      };

      // Optimistic update
      setMessages((prev) => [...prev, newMsg]);

      // Emit to server
      socket.emit("send_message", { roomId, message: newMsg });

      // Clear typing indicator
      socket.emit("stop_typing", { roomId, user: currentUser });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    },
    [roomId, currentUser]
  );

  // Send typing signal
  const sendTyping = useCallback(() => {
    const socket = getSocket();
    socket.emit("typing", { roomId, user: currentUser });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { roomId, user: currentUser });
    }, 2500);
  }, [roomId, currentUser]);

  // Emit milestone event (deliverable submitted, approved, etc.)
  const broadcastMilestoneEvent = useCallback(
    (eventType: "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED", milestone: any) => {
      const socket = getSocket();
      socket.emit("milestone_event", {
        roomId,
        eventType,
        milestone,
        updatedBy: currentUser,
      });
    },
    [roomId, currentUser]
  );

  // Accept bid & unlock messaging
  const acceptBid = useCallback(
    (threadId: string, bidAmountBdt: number, freelancerName: string) => {
      const socket = getSocket();
      socket.emit("accept_bid", {
        roomId,
        threadId,
        acceptedBy: currentUser,
        bidAmountBdt,
        freelancerName,
      });
    },
    [roomId, currentUser]
  );

  return {
    messages,
    sendMessage,
    sendTyping,
    broadcastMilestoneEvent,
    acceptBid,
    isConnected,
    typingUsers,
    onlineMembers,
  };
}
