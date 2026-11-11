"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
}: DashboardShellProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [internalLang, setInternalLang] = useState<"en" | "bn">("en");
  const lang = controlledLang ?? internalLang;
  const handleToggleLang = onToggleLang ?? (() => setInternalLang((prev) => (prev === "en" ? "bn" : "en")));

  const [internalActive, setInternalActive] = useState(nav[0].id);
  const active = controlledActiveTab ?? internalActive;
  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActive(tabId);
    }
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="shrink-0">
              <Logo size="sm" />
            </Link>

            {/* Search */}
            <div className="hidden md:flex items-center relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="search"
                placeholder={
                  role === "client"
                    ? lang === "en" ? "Search jobs, talent, contracts" : "কাজ, ট্যালেন্ট, চুক্তি খুঁজুন"
                    : role === "admin"
                      ? lang === "en" ? "Search users, jobs, contracts" : "ইউজার, কাজ, চুক্তি খুঁজুন"
                      : lang === "en" ? "Search open jobs" : "চলমান কাজ খুঁজুন"
                }
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-transparent focus:bg-white focus:border-emerald-500 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleToggleLang}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "en" ? "বাংলা" : "English"}</span>
            </button>

            {/* Wallet chip */}
            {role !== "admin" && walletLabel && (
              <button
                type="button"
                onClick={() => handleTabClick(role === "client" ? "payments" : "wallet")}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>৳{walletBdt.toLocaleString()}</span>
                <span className="text-emerald-600 font-semibold hidden md:inline">{walletLabel}</span>
              </button>
            )}

            {/* Primary action */}
            {action && (
              action.onAction ? (
                <button
                  onClick={action.onAction}
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{lang === "en" ? action.label : action.labelBn}</span>
                </button>
              ) : (
                <Link
                  href={action.href ?? "/"}
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{lang === "en" ? action.label : action.labelBn}</span>
                </Link>
              )
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={handleNotificationToggle}
                className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        {lang === "en" ? "Notifications" : "বিজ্ঞপ্তি"}
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            <span>{lang === "en" ? "Mark all read" : "সব পঠিত"}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={loadingNotifications}
                          onClick={() => void fetchNotificationsFromApi()}
                          aria-label="Refresh notifications"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingNotifications ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {isLiveNotifications ? (
                      liveNotifications.length === 0 ? (
                        <div className="px-4 py-8 text-center space-y-1.5">
                          <Bell className="w-5 h-5 text-slate-300 mx-auto" />
                          <p className="text-xs font-bold text-slate-700">
                            {lang === "en" ? "No notifications yet" : "এখনো কোনো বিজ্ঞপ্তি নেই"}
                          </p>
                          <p className="text-[11px] text-slate-400">
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
                              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-2.5 cursor-pointer ${
                                !n.is_read ? "bg-emerald-50/35" : ""
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  !n.is_read ? "bg-emerald-500" : "bg-slate-200"
                                }`}
                              />
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {titleText}
                                  </p>
                                  {n.contract_id && (
                                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                                  {bodyText}
                                </p>
                                <span className="text-[10px] text-slate-400 block">
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
                          className="px-4 py-3 hover:bg-slate-50 transition-colors flex gap-2.5"
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              n.unread ? "bg-emerald-500" : "bg-slate-200"
                            }`}
                          />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-xs font-bold text-slate-800">
                              {lang === "en" ? n.title : n.titleBn}
                            </p>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {lang === "en" ? n.text : n.textBn}
                            </p>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
              <img
                src={avatar}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
              />
              <div className="hidden lg:block leading-tight">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400">{userMeta}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-w-0">
        {/* Sidebar */}
        <aside
          className={`${
            mobileNavOpen ? "block" : "hidden"
          } lg:block fixed lg:static inset-y-0 left-0 z-30 lg:z-auto w-64 shrink-0 bg-white border-r border-slate-200 lg:border-r-0 overflow-y-auto`}
        >
          <nav className="p-4 space-y-1">
            {nav.map((item) => {
              const Icon = ICONS[item.icon] || LayoutDashboard;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabClick(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "text-slate-600 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                  <span className="flex-1 text-left truncate">
                    {lang === "en" ? item.label : item.labelBn}
                  </span>
                  {item.badge ? (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="px-4 pb-4 space-y-2">
            <div className="border-t border-slate-100 pt-4 space-y-1">


              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/login");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === "en" ? "Log Out" : "লগ আউট"}</span>
              </button>
            </div>


          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {action && (
            action.onAction ? (
              <button
                onClick={action.onAction}
                className="md:hidden flex items-center justify-center gap-2 w-full py-3 mb-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>{lang === "en" ? action.label : action.labelBn}</span>
              </button>
            ) : (
              <Link
                href={action.href ?? "/"}
                className="md:hidden flex items-center justify-center gap-2 w-full py-3 mb-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>{lang === "en" ? action.label : action.labelBn}</span>
              </Link>
            )
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
