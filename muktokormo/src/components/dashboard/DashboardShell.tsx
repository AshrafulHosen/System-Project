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
  Star,
  Flag,
} from "lucide-react";
import Logo from "@/components/Logo";
import { Avatar } from "@/components/ui";
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
  Star,
  Flag,
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

  const en = lang === "en";
  const activeItem = nav.find((n) => n.id === active);

  const actionButton = (className: string) =>
    action ? (
      action.onAction ? (
        <button type="button" onClick={action.onAction} className={className}>
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>{en ? action.label : action.labelBn}</span>
        </button>
      ) : (
        <Link href={action.href ?? "/"} className={className}>
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>{en ? action.label : action.labelBn}</span>
        </Link>
      )
    ) : null;

  return (
    <div className="min-h-screen bg-canvas text-ink flex">
      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <button
          type="button"
          aria-label={en ? "Close navigation menu" : "মেনু বন্ধ করুন"}
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-navy-ink/40 backdrop-blur-[2px] z-40 lg:hidden mk-fade-in"
        />
      )}

      {/* ---------------- Sidebar ---------------- */}
      <aside
        aria-label={en ? "Dashboard navigation" : "ড্যাশবোর্ড নেভিগেশন"}
        className={`${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-dvh w-[264px] shrink-0 bg-white border-r border-line flex flex-col transition-transform duration-200`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-line">
          <Link href="/" className="shrink-0" aria-label="Muktokormo home">
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-subtle cursor-pointer"
            aria-label={en ? "Close navigation menu" : "মেনু বন্ধ করুন"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 mb-3 mk-eyebrow text-ink-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />
            {roleBadgeLabel}
          </p>
          <nav>
            <ul className="space-y-0.5">
              {nav.map((item) => {
                const Icon = ICONS[item.icon] || LayoutDashboard;
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => {
                        handleTabClick(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`relative w-full flex items-center gap-3 h-10 px-3 rounded-md text-[13.5px] transition-colors cursor-pointer ${
                        isActive
                          ? "bg-subtle text-ink font-semibold"
                          : "text-ink-2 font-medium hover:bg-subtle/70 hover:text-ink"
                      }`}
                    >
                      {isActive && (
                        <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-brand" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brand" : "text-ink-4"}`} />
                      <span className="flex-1 text-left truncate">{en ? item.label : item.labelBn}</span>
                      {item.badge ? (
                        <span
                          className={`min-w-5 h-5 px-1.5 rounded text-[11px] font-semibold mk-tabular inline-flex items-center justify-center ${
                            isActive ? "bg-brand text-white" : "bg-subtle text-ink-3"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="p-3 border-t border-line space-y-2">
          {role !== "admin" && walletLabel && (
            <button
              type="button"
              onClick={() => {
                handleTabClick(role === "client" ? "payments" : "wallet");
                setMobileNavOpen(false);
              }}
              className="w-full text-left rounded-lg mk-dark-card px-4 py-3.5 cursor-pointer hover:brightness-110 transition-[filter]"
            >
              <span className="flex items-center justify-between">
                <span className="text-[12px] text-white/60">{walletLabel}</span>
                <Wallet className="w-4 h-4 text-brand-light" aria-hidden="true" />
              </span>
              <span className="mt-1 block text-xl font-semibold tracking-[-0.03em] text-white mk-tabular">
                ৳{walletBdt.toLocaleString()}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleLang}
            className="sm:hidden w-full flex items-center gap-3 h-10 px-3 rounded-md text-[13.5px] font-medium text-ink-2 hover:bg-subtle transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4 text-ink-4" aria-hidden="true" />
            {en ? "Switch to বাংলা" : "Switch to English"}
          </button>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="w-full flex items-center gap-3 h-10 px-3 rounded-md text-[13.5px] font-medium text-ink-2 hover:bg-danger-soft hover:text-danger-strong transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            {en ? "Log out" : "লগ আউট"}
          </button>
        </div>
      </aside>

      {/* ---------------- Main column ---------------- */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 mk-glass border-b border-line">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-md border border-line text-ink-2 hover:text-ink hover:bg-subtle transition-colors cursor-pointer"
                aria-label={en ? "Open navigation" : "মেনু খুলুন"}
                aria-expanded={mobileNavOpen}
              >
                <Menu className="w-4.5 h-4.5" />
              </button>

              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-[13px] min-w-0 shrink-0">
                <span className="text-ink-4 truncate">{roleBadgeLabel}</span>
                <span className="text-ink-4" aria-hidden="true">/</span>
                <span className="font-medium text-ink truncate">
                  {activeItem ? (en ? activeItem.label : activeItem.labelBn) : ""}
                </span>
              </nav>

              {/* Search */}
              <div className="hidden md:flex items-center relative flex-1 max-w-sm ml-auto lg:ml-6">
                <Search className="w-4 h-4 text-ink-4 absolute left-3 pointer-events-none" aria-hidden="true" />
                <input
                  type="search"
                  aria-label={en ? "Search" : "খুঁজুন"}
                  value={currentSearch}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder={
                    role === "client"
                      ? en
                        ? "Search jobs, talent, contracts"
                        : "কাজ, ট্যালেন্ট, চুক্তি খুঁজুন"
                      : role === "admin"
                        ? en
                          ? "Search users, jobs, contracts"
                          : "ইউজার, কাজ, চুক্তি খুঁজুন"
                        : en
                          ? "Search open jobs"
                          : "চলমান কাজ খুঁজুন"
                  }
                  className="w-full h-9 pl-9 pr-3 bg-white border border-line focus:border-brand rounded-md text-[13px] text-ink placeholder-ink-4 focus:outline-none focus:ring-4 focus:ring-brand/12 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleToggleLang}
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-[13px] font-medium text-ink-2 hover:text-ink hover:bg-subtle transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-ink-4" aria-hidden="true" />
                {en ? "বাংলা" : "English"}
              </button>

              {actionButton(
                "hidden md:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand hover:bg-brand-hover text-white text-[13px] font-medium transition-colors cursor-pointer"
              )}

              {/* Notifications */}
              <div ref={notificationsRef} className="relative">
                <button
                  type="button"
                  onClick={handleNotificationToggle}
                  className="relative w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-subtle transition-colors cursor-pointer"
                  aria-label={
                    en
                      ? `Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`
                      : "বিজ্ঞপ্তি"
                  }
                  aria-expanded={notificationsOpen}
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold mk-tabular flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-white rounded-xl border border-line shadow-[var(--mk-shadow-popover)] overflow-hidden z-50 mk-zoom-in">
                    <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[14px] font-semibold text-ink">{en ? "Notifications" : "বিজ্ঞপ্তি"}</h2>
                        <span className="text-[11px] font-medium mk-tabular text-ink-3 bg-subtle px-1.5 py-0.5 rounded">
                          {unreadCount} {en ? "unread" : "নতুন"}
                        </span>
                      </div>

                      {isLiveNotifications && (
                        <div className="flex items-center gap-1">
                          {liveUnreadCount > 0 && (
                            <button
                              type="button"
                              disabled={markingAllRead}
                              onClick={handleMarkAllRead}
                              className="inline-flex items-center gap-1 h-7 px-2 rounded-md hover:bg-subtle text-ink-2 text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                              {en ? "Mark all read" : "সব পঠিত"}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={loadingNotifications}
                            onClick={() => void fetchNotificationsFromApi()}
                            aria-label={en ? "Refresh notifications" : "রিফ্রেশ"}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-subtle transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingNotifications ? "animate-spin" : ""}`} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-line">
                      {isLiveNotifications ? (
                        liveNotifications.length === 0 ? (
                          <div className="px-6 py-10 text-center">
                            <Bell className="w-5 h-5 text-ink-4 mx-auto" aria-hidden="true" />
                            <p className="mt-3 text-[13px] font-semibold text-ink">
                              {en ? "No notifications yet" : "এখনো কোনো বিজ্ঞপ্তি নেই"}
                            </p>
                            <p className="mt-1 text-[12px] text-ink-3">
                              {en
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
                                className={`w-full text-left px-4 py-3 hover:bg-subtle/60 transition-colors flex gap-3 cursor-pointer ${
                                  !n.is_read ? "bg-brand-soft/40" : ""
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? "bg-brand" : "bg-muted-2"}`}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center justify-between gap-2">
                                    <span className="text-[13px] font-semibold text-ink truncate">
                                      {!n.is_read && <span className="sr-only">{en ? "Unread: " : "নতুন: "}</span>}
                                      {titleText}
                                    </span>
                                    {n.contract_id && <ExternalLink className="w-3 h-3 text-ink-4 shrink-0" aria-hidden="true" />}
                                  </span>
                                  <span className="mt-0.5 block text-[12px] text-ink-3 leading-relaxed line-clamp-2">{bodyText}</span>
                                  <span className="mt-1 block text-[11px] text-ink-4 font-mono mk-tabular">
                                    {formatNotificationDate(n.created_at)}
                                  </span>
                                </span>
                              </button>
                            );
                          })
                        )
                      ) : (
                        previewNotifications.map((n) => (
                          <div key={n.id} className="px-4 py-3 flex gap-3">
                            <span
                              aria-hidden="true"
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? "bg-brand" : "bg-muted-2"}`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-ink">{en ? n.title : n.titleBn}</p>
                              <p className="mt-0.5 text-[12px] text-ink-3 leading-relaxed">{en ? n.text : n.textBn}</p>
                              <span className="mt-1 block text-[11px] text-ink-4">{n.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Account */}
              <div ref={profileRef} className="relative pl-2 ml-0.5 border-l border-line">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen((v) => !v);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 h-10 pl-1 pr-1.5 rounded-md hover:bg-subtle transition-colors cursor-pointer"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  aria-label={en ? "Account menu" : "অ্যাকাউন্ট মেনু"}
                >
                  <Avatar src={avatar} name={userName} className="w-8 h-8 rounded-md text-[12px]" />
                  <span className="hidden xl:block text-left leading-tight">
                    <span className="block text-[13px] font-medium text-ink truncate max-w-[140px]">{userName}</span>
                    <span className="block text-[11px] text-ink-3 truncate max-w-[140px]">{userMeta}</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-4 hidden xl:block" aria-hidden="true" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-line shadow-[var(--mk-shadow-popover)] overflow-hidden z-50 p-1.5 mk-zoom-in">
                    <div className="px-3 py-2.5 border-b border-line mb-1">
                      <p className="text-[13px] font-semibold text-ink truncate">{userName}</p>
                      <p className="text-[12px] text-ink-3 truncate">{userMeta}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleTabClick(nav[0]?.id ?? "overview");
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] font-medium text-ink hover:bg-subtle transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-ink-4" aria-hidden="true" />
                      {en ? "Dashboard overview" : "ড্যাশবোর্ড ওভারভিউ"}
                    </button>
                    <Link
                      href="/contracts"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] font-medium text-ink hover:bg-subtle transition-colors"
                    >
                      <Handshake className="w-4 h-4 text-ink-4" aria-hidden="true" />
                      {en ? "Contracts & escrow" : "কন্ট্রাক্ট ও এসক্রো"}
                    </Link>
                    <Link
                      href="/messages"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] font-medium text-ink hover:bg-subtle transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-ink-4" aria-hidden="true" />
                      {en ? "Messages" : "মেসেজ"}
                    </Link>
                    <Link
                      href="/"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] font-medium text-ink hover:bg-subtle transition-colors"
                    >
                      <Home className="w-4 h-4 text-ink-4" aria-hidden="true" />
                      {en ? "Public marketplace" : "মূল মার্কেটপ্লেস"}
                    </Link>
                    <div className="my-1 border-t border-line" />
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="w-full flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] font-medium text-danger-strong hover:bg-danger-soft transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      {en ? "Log out" : "লগ আউট"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 w-full max-w-[1440px] mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {actionButton(
            "md:hidden flex items-center justify-center gap-2 w-full h-11 mb-5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium cursor-pointer"
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
