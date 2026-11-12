"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Briefcase,
  Send,
  Handshake,
  MessageSquare,
  Wallet,
  Gavel,
  Bookmark,
  Search,
  UserCircle,
  LogOut,
  Bell,
  PlusCircle,
  Menu,
  X,
  Globe,
  RefreshCw,
  CheckCheck,
  Layers,
  ExternalLink,
  ChevronDown,
  Home,
} from "lucide-react";
import Logo from "@/components/Logo";
import { NavItem } from "@/types";
import type { NotificationRecord } from "@/types/payment";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Briefcase,
  Send,
  Handshake,
  MessageSquare,
  Wallet,
  Gavel,
  Bookmark,
  Search,
  UserCircle,
  Layers,
};

interface DashboardShellProps {
  role: "client" | "freelancer" | "admin";
  nav: NavItem[];
  userName: string;
  userMeta: string;
  avatar: string;
  walletBdt?: number;
  walletLabel?: string;
  children: React.ReactNode;
  action?: { label: string; labelBn: string; href?: string; onAction?: () => void };
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  lang?: "en" | "bn";
  onToggleLang?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

function formatNotificationDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-BD", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

const DEMO_FALLBACK_NOTIFICATIONS = {
  client: [
    {
      id: "demo-c1",
      title: "Preview Mode Alert",
      titleBn: "প্রিভিউ মোড সতর্কতা",
      text: "Sign in as a client to view live SSLCOMMERZ payment, delivery, and refund notifications.",
      textBn: "লাইভ পেমেন্ট ও রিফান্ড বিজ্ঞপ্তি দেখতে ক্লায়েন্ট হিসেবে সাইন ইন করুন।",
      time: "Preview",
      unread: true,
    },
  ],
  admin: [
    {
      id: "demo-a1",
      title: "Preview Mode Alert",
      titleBn: "প্রিভিউ মোড সতর্কতা",
      text: "Sign in as an administrator to view live refund request and escrow notifications.",
      textBn: "লাইভ রিফান্ড ও এসক্রো বিজ্ঞপ্তি দেখতে অ্যাডমিন হিসেবে সাইন ইন করুন।",
      time: "Preview",
      unread: true,
    },
  ],
  freelancer: [
    {
      id: "demo-f1",
      title: "Preview Mode Alert",
      titleBn: "প্রিভিউ মোড সতর্কতা",
      text: "Sign in as a freelancer to receive real-time contract funding, release, and refund alerts.",
      textBn: "কন্ট্রাক্ট ফান্ডিং, রিলিজ ও রিফান্ড বিজ্ঞপ্তি পেতে ফ্রিল্যান্সার হিসেবে সাইন ইন করুন।",
      time: "Preview",
      unread: true,
    },
  ],
};

export default function DashboardShell({
  role,
  nav,
  userName,
  userMeta,
  avatar,
  walletBdt = 0,
  walletLabel = "",
  children,
  action,
  activeTab: controlledActiveTab,
  onTabChange,
  lang: controlledLang,
  onToggleLang,
  searchValue,
  onSearchChange,
}: DashboardShellProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [internalLang, setInternalLang] = useState<"en" | "bn">("en");
  const lang = controlledLang ?? internalLang;
  const handleToggleLang =
    onToggleLang ?? (() => setInternalLang((prev) => (prev === "en" ? "bn" : "en")));

  const [internalActive, setInternalActive] = useState(nav[0]?.id ?? "overview");
  const active = controlledActiveTab ?? internalActive;
  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActive(tabId);
    }
  };

  const [internalSearch, setInternalSearch] = useState("");
  const currentSearch = searchValue !== undefined ? searchValue : internalSearch;
  const handleSearchInput = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    else setInternalSearch(val);
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const [isLiveNotifications, setIsLiveNotifications] = useState<boolean>(false);
  const [liveNotifications, setLiveNotifications] = useState<NotificationRecord[]>([]);
  const [liveUnreadCount, setLiveUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
  const [markingAllRead, setMarkingAllRead] = useState<boolean>(false);

  const fetchNotificationsFromApi = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const response = await fetch("/api/notifications?limit=25", {
        cache: "no-store",
      });
      if (response.status === 401) {
        setIsLiveNotifications(false);
        return;
      }
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as {
        ok?: boolean;
        notifications?: NotificationRecord[];
        unreadCount?: number;
      };
      if (data.ok) {
        setIsLiveNotifications(true);
        setLiveNotifications(data.notifications ?? []);
        setLiveUnreadCount(Number(data.unreadCount ?? 0));
      }
    } catch {
      // Silently preserve existing state on transient network error
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    let activeFlag = true;
    (async () => {
      try {
        const response = await fetch("/api/notifications?limit=25", {
          cache: "no-store",
        });
        if (!activeFlag) return;
        if (response.status === 401) {
          setIsLiveNotifications(false);
          return;
        }
        if (!response.ok) return;
        const data = (await response.json()) as {
          ok?: boolean;
          notifications?: NotificationRecord[];
          unreadCount?: number;
        };
        if (!activeFlag) return;
        if (data.ok) {
          setIsLiveNotifications(true);
          setLiveNotifications(data.notifications ?? []);
          setLiveUnreadCount(Number(data.unreadCount ?? 0));
        }
      } catch {
        // Ignore transient network errors on initial background poll
      }
    })();

    return () => {
      activeFlag = false;
    };
  }, []);

  const handleNotificationToggle = () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    setProfileMenuOpen(false);
    if (nextOpen) {
      void fetchNotificationsFromApi();
    }
  };

  const handleMarkNotificationRead = async (notification: NotificationRecord) => {
    if (!notification.is_read) {
      setLiveNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true, read_at: new Date().toISOString() }
            : item
        )
      );
      setLiveUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notification.id] }),
        });
        if (res.ok) {
          const data = (await res.json()) as { unreadCount?: number };
          if (typeof data.unreadCount === "number") {
            setLiveUnreadCount(data.unreadCount);
          }
        }
      } catch {
        // Keep optimistic state
      }
    }

    if (notification.contract_id) {
      setNotificationsOpen(false);
      router.push(`/contracts/${notification.contract_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (!isLiveNotifications || liveUnreadCount === 0) return;
    setMarkingAllRead(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (response.ok) {
        const nowIso = new Date().toISOString();
        setLiveNotifications((prev) =>
          prev.map((item) => ({ ...item, is_read: true, read_at: item.read_at ?? nowIso }))
        );
        setLiveUnreadCount(0);
      }
    } finally {
      setMarkingAllRead(false);
    }
  };

  const previewNotifications = DEMO_FALLBACK_NOTIFICATIONS[role];
  const unreadCount = isLiveNotifications
    ? liveUnreadCount
    : previewNotifications.filter((n) => n.unread).length;

  const roleBadgeLabel =
    role === "client"
      ? lang === "en"
        ? "Client Workspace"
        : "ক্লায়েন্ট ওয়ার্কস্পেস"
      : role === "admin"
        ? lang === "en"
          ? "Admin Console"
          : "অ্যাডমিন কনসোল"
        : lang === "en"
          ? "Freelancer Portal"
          : "ফ্রিল্যান্সার পোর্টাল";

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111315] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[rgba(17,19,21,0.08)]">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-2 -ml-2 text-[#3E434A] hover:text-[#111315] rounded-lg hover:bg-[#F4F2EC] transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="shrink-0">
              <Logo size="sm" />
            </Link>

            {/* Search */}
            <div className="hidden md:flex items-center relative flex-1 max-w-sm lg:max-w-md ml-2">
              <Search className="w-4 h-4 text-[#686E78] absolute left-3.5 pointer-events-none" />
              <input
                type="search"
                value={currentSearch}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder={
                  role === "client"
                    ? lang === "en"
                      ? "Search jobs, talent, contracts"
                      : "কাজ, ট্যালেন্ট, চুক্তি খুঁজুন"
                    : role === "admin"
                      ? lang === "en"
                        ? "Search users, jobs, contracts"
                        : "ইউজার, কাজ, চুক্তি খুঁজুন"
                      : lang === "en"
                        ? "Search open jobs"
                        : "চলমান কাজ খুঁজুন"
                }
                className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[rgba(17,19,21,0.1)] focus:bg-white focus:border-[#0F6E50] rounded-xl text-xs font-medium text-[#111315] placeholder-[#949BA6] focus:outline-none focus:ring-2 focus:ring-[#0F6E50]/15 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={handleToggleLang}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#111315] bg-[#FAF9F6] border border-[rgba(17,19,21,0.09)] hover:border-[rgba(17,19,21,0.2)] transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#0F6E50]" />
              <span>{lang === "en" ? "বাংলা" : "English"}</span>
            </button>

            {/* Wallet chip */}
            {role !== "admin" && walletLabel && (
              <button
                type="button"
                onClick={() => handleTabClick(role === "client" ? "payments" : "wallet")}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EAF5F0] border border-[#0F6E50]/20 text-xs font-semibold text-[#0B3B2E] hover:bg-[#DDF0E6] transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-[#0F6E50]" />
                <span className="font-mono mk-tabular font-bold">
                  ৳{walletBdt.toLocaleString()}
                </span>
                <span className="text-[#0F6E50] font-medium hidden md:inline">{walletLabel}</span>
              </button>
            )}

            {/* Primary action */}
            {action &&
              (action.onAction ? (
                <button
                  type="button"
                  onClick={action.onAction}
                  className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 stroke-[2.25]" />
                  <span>{lang === "en" ? action.label : action.labelBn}</span>
                </button>
              ) : (
                <Link
                  href={action.href ?? "/"}
                  className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5 stroke-[2.25]" />
                  <span>{lang === "en" ? action.label : action.labelBn}</span>
                </Link>
              ))}

            {/* Notifications */}
            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                onClick={handleNotificationToggle}
                className="relative p-2 rounded-xl text-[#3E434A] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#0F6E50] text-white text-[9px] font-bold font-mono mk-tabular flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[rgba(17,19,21,0.1)] shadow-[0_18px_40px_-16px_rgba(11,59,46,0.18)] overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[rgba(17,19,21,0.08)] bg-[#FAF9F6] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#111315]">
                        {lang === "en" ? "Notifications" : "বিজ্ঞপ্তি"}
                      </h4>
                      <span className="text-[10px] font-semibold font-mono mk-tabular text-[#0B3B2E] bg-[#EAF5F0] px-2 py-0.5 rounded-md border border-[#0F6E50]/20">
                        {unreadCount} {lang === "en" ? "unread" : "নতুন"}
                      </span>
                    </div>

                    {isLiveNotifications && (
                      <div className="flex items-center gap-1.5">
                        {liveUnreadCount > 0 && (
                          <button
                            type="button"
                            disabled={markingAllRead}
                            onClick={handleMarkAllRead}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[rgba(17,19,21,0.1)] hover:bg-[#F4F2EC] text-[#111315] text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <CheckCheck className="w-3 h-3 text-[#0F6E50]" />
                            <span>{lang === "en" ? "Mark all read" : "সব পঠিত"}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={loadingNotifications}
                          onClick={() => void fetchNotificationsFromApi()}
                          aria-label="Refresh notifications"
                          className="p-1.5 rounded-lg text-[#686E78] hover:text-[#111315] hover:bg-[#F4F2EC] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingNotifications ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[rgba(17,19,21,0.06)]">
                    {isLiveNotifications ? (
                      liveNotifications.length === 0 ? (
                        <div className="px-4 py-8 text-center space-y-1.5">
                          <Bell className="w-5 h-5 text-[#949BA6] mx-auto" />
                          <p className="text-xs font-semibold text-[#111315]">
                            {lang === "en" ? "No notifications yet" : "এখনো কোনো বিজ্ঞপ্তি নেই"}
                          </p>
                          <p className="text-[11px] text-[#686E78]">
                            {lang === "en"
                              ? "Payment, submission, approval release, and refund alerts appear here."
                              : "পেমেন্ট, কাজ জমা, রিলিজ ও রিফান্ড বিজ্ঞপ্তি এখানে দেখাবে।"}
                          </p>
                        </div>
                      ) : (
                        liveNotifications.map((n) => {
                          const titleText = lang === "bn" && n.title_bn ? n.title_bn : n.title;
                          const bodyText = lang === "bn" && n.message_bn ? n.message_bn : n.message;
                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => void handleMarkNotificationRead(n)}
                              className={`w-full text-left px-4 py-3 hover:bg-[#FAF9F6] transition-colors flex gap-2.5 cursor-pointer ${
                                !n.is_read ? "bg-[#EAF5F0]/45" : ""
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  !n.is_read ? "bg-[#0F6E50]" : "bg-[rgba(17,19,21,0.16)]"
                                }`}
                              />
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold text-[#111315] truncate">
                                    {titleText}
                                  </p>
                                  {n.contract_id && (
                                    <ExternalLink className="w-3 h-3 text-[#686E78] shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-[#3E434A] leading-relaxed line-clamp-2">
                                  {bodyText}
                                </p>
                                <span className="text-[10px] text-[#949BA6] block font-mono mk-tabular">
                                  {formatNotificationDate(n.created_at)}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )
                    ) : (
                      previewNotifications.map((n) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 hover:bg-[#FAF9F6] transition-colors flex gap-2.5"
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              n.unread ? "bg-[#0F6E50]" : "bg-[rgba(17,19,21,0.16)]"
                            }`}
                          />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-xs font-semibold text-[#111315]">
                              {lang === "en" ? n.title : n.titleBn}
                            </p>
                            <p className="text-[11px] text-[#3E434A] leading-relaxed">
                              {lang === "en" ? n.text : n.textBn}
                            </p>
                            <span className="text-[10px] text-[#949BA6]">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + Profile Dropdown */}
            <div ref={profileRef} className="relative pl-2 sm:pl-3 border-l border-[rgba(17,19,21,0.09)]">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-[#F4F2EC] transition-colors cursor-pointer"
                aria-expanded={profileMenuOpen}
                aria-label="Account menu"
              >
                <img
                  src={avatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-[#0F6E50]/20"
                />
                <div className="hidden lg:block text-left leading-tight">
                  <p className="text-xs font-semibold text-[#111315] truncate max-w-[125px]">
                    {userName}
                  </p>
                  <p className="text-[10px] text-[#686E78] truncate max-w-[125px]">{userMeta}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#686E78] hidden lg:block" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[rgba(17,19,21,0.1)] shadow-[0_18px_40px_-16px_rgba(11,59,46,0.18)] overflow-hidden z-50 p-1.5">
                  <div className="px-3 py-2 border-b border-[rgba(17,19,21,0.08)] mb-1">
                    <p className="text-xs font-bold text-[#111315] truncate">{userName}</p>
                    <p className="text-[10px] text-[#686E78] truncate">{userMeta}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleTabClick(nav[0]?.id ?? "overview");
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111315] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#0F6E50]" />
                    <span>{lang === "en" ? "Dashboard Overview" : "ড্যাশবোর্ড ওভারভিউ"}</span>
                  </button>
                  <Link
                    href="/contracts"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111315] hover:bg-[#F4F2EC] transition-colors"
                  >
                    <Handshake className="w-3.5 h-3.5 text-[#0F6E50]" />
                    <span>{lang === "en" ? "Contracts & Escrow" : "কন্ট্রাক্ট ও এসক্রো"}</span>
                  </Link>
                  <Link
                    href="/messages"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111315] hover:bg-[#F4F2EC] transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#0F6E50]" />
                    <span>{lang === "en" ? "Messages" : "মেসেজ"}</span>
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#111315] hover:bg-[#F4F2EC] transition-colors"
                  >
                    <Home className="w-3.5 h-3.5 text-[#686E78]" />
                    <span>{lang === "en" ? "Public Marketplace" : "মূল মার্কেটপ্লেস"}</span>
                  </Link>
                  <div className="my-1 border-t border-[rgba(17,19,21,0.08)]" />
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{lang === "en" ? "Log Out" : "লগ আউট"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-w-0 relative">
        {/* Mobile Backdrop */}
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-[#111315]/35 backdrop-blur-[2px] z-30 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } fixed lg:static inset-y-0 left-0 top-16 lg:top-0 z-40 lg:z-auto w-64 shrink-0 bg-white border-r border-[rgba(17,19,21,0.08)] flex flex-col justify-between transition-transform duration-200 overflow-y-auto`}
        >
          <div className="p-4 space-y-4">
            <div className="px-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#686E78]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E50]" />
                {roleBadgeLabel}
              </span>
            </div>

            <nav className="space-y-1">
              {nav.map((item) => {
                const Icon = ICONS[item.icon] || LayoutDashboard;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleTabClick(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#0B3B2E] text-white shadow-xs"
                        : "text-[#3E434A] hover:bg-[#F4F2EC] hover:text-[#111315]"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-[#A7E6CE]" : "text-[#686E78]"
                      }`}
                    />
                    <span className="flex-1 text-left truncate">
                      {lang === "en" ? item.label : item.labelBn}
                    </span>
                    {item.badge ? (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono mk-tabular ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-[#F4F2EC] text-[#3E434A]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-[rgba(17,19,21,0.08)] space-y-1.5">
            <button
              type="button"
              onClick={handleToggleLang}
              className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#3E434A] hover:bg-[#F4F2EC] transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-[#0F6E50]" />
              <span>{lang === "en" ? "Switch to বাংলা" : "Switch to English"}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#3E434A] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === "en" ? "Log Out" : "লগ আউট"}</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px]">
          {action &&
            (action.onAction ? (
              <button
                type="button"
                onClick={action.onAction}
                className="md:hidden flex items-center justify-center gap-2 w-full py-3 mb-4 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.25]" />
                <span>{lang === "en" ? action.label : action.labelBn}</span>
              </button>
            ) : (
              <Link
                href={action.href ?? "/"}
                className="md:hidden flex items-center justify-center gap-2 w-full py-3 mb-4 rounded-xl bg-[#0B3B2E] hover:bg-[#07281F] text-white text-xs font-semibold shadow-xs"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.25]" />
                <span>{lang === "en" ? action.label : action.labelBn}</span>
              </Link>
            ))}
          {children}
        </main>
      </div>
    </div>
  );
}
