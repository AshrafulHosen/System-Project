"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Check,
} from "lucide-react";
import Logo from "@/components/Logo";
import { NavItem } from "@/types";

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
};

interface DashboardShellProps {
  role: "client" | "freelancer";
  nav: NavItem[];
  userName: string;
  userMeta: string;
  avatar: string;
  walletBdt: number;
  walletLabel: string;
  children: React.ReactNode;
  action?: { label: string; labelBn: string; href: string };
<<<<<<< HEAD
=======
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  lang?: "en" | "bn";
  onToggleLang?: () => void;
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
}

export default function DashboardShell({
  role,
  nav,
  userName,
  userMeta,
  avatar,
  walletBdt,
  walletLabel,
  children,
  action,
<<<<<<< HEAD
}: DashboardShellProps) {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [active, setActive] = useState(nav[0].id);
=======
  activeTab: controlledActiveTab,
  onTabChange,
  lang: controlledLang,
  onToggleLang,
}: DashboardShellProps) {
  const router = useRouter();
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

>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications =
    role === "client"
      ? [
          { id: "n1", text: "Mahmudul Hasan submitted Month 3 SEO report", textBn: "মাহমুদুল হাসান তৃতীয় মাসের এসইও রিপোর্ট জমা দিয়েছেন", time: "2h", unread: true },
          { id: "n2", text: "9 new proposals on SEO Retainer job", textBn: "এসইও রিটেইনার কাজে ৯টি নতুন আবেদন", time: "5h", unread: true },
          { id: "n3", text: "Escrow of ৳10,000 released successfully", textBn: "৳১০,০০০ এসক্রো সফলভাবে মুক্ত হয়েছে", time: "3d", unread: false },
        ]
      : [
          { id: "f1", text: "Your proposal was accepted - Flutter Parcel App", textBn: "আপনার আবেদন গৃহীত হয়েছে - ফ্লাটার পার্সেল অ্যাপ", time: "1h", unread: true },
          { id: "f2", text: "New message from Nafisur Rahman", textBn: "নাফিসুর রহমান থেকে নতুন বার্তা", time: "4h", unread: true },
          { id: "f3", text: "bKash withdrawal of ৳35,000 is processing", textBn: "বিকাশে ৳৩৫,০০০ উত্তোলন প্রক্রিয়াধীন", time: "1d", unread: false },
        ];

  const unreadCount = notifications.filter((n) => n.unread).length;
  const otherRoleLabel = role === "client" ? "Freelancer" : "Client";

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
                    : lang === "en" ? "Search open jobs" : "চলমান কাজ খুঁজুন"
                }
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-transparent focus:bg-white focus:border-emerald-500 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
<<<<<<< HEAD
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
=======
              onClick={handleToggleLang}
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "en" ? "বাংলা" : "English"}</span>
            </button>

<<<<<<< HEAD
=======
            {/* Quick role toggle in top bar */}
            <button
              onClick={() => router.push(role === "client" ? "/dashboard/freelancer" : "/dashboard/client")}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer border border-slate-200/80"
            >
              <UserCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{role === "client" ? (lang === "en" ? "Switch to Talent" : "ট্যালেন্ট মোড") : (lang === "en" ? "Switch to Employer" : "নিয়োগদাতা মোড")}</span>
            </button>

>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
            {/* Wallet chip */}
            <Link
              href={role === "client" ? "#payments" : "#wallet"}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>৳{walletBdt.toLocaleString()}</span>
              <span className="text-emerald-600 font-semibold hidden md:inline">{walletLabel}</span>
            </Link>

            {/* Primary action */}
            {action && (
              <Link
                href={action.href}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{lang === "en" ? action.label : action.labelBn}</span>
              </Link>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      {lang === "en" ? "Notifications" : "বিজ্ঞপ্তি"}
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {unreadCount} {lang === "en" ? "unread" : "নতুন"}
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-2.5"
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.unread ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {lang === "en" ? n.text : n.textBn}
                          </p>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + role switch */}
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
<<<<<<< HEAD
                    setActive(item.id);
=======
                    handleTabClick(item.id);
>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
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
<<<<<<< HEAD
            <div className="border-t border-slate-100 pt-4">
=======
            <div className="border-t border-slate-100 pt-4 space-y-1">
              <Link
                href="/contracts"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 hover:bg-emerald-100 transition-all"
              >
                <Handshake className="w-4 h-4 text-emerald-600" />
                <span>
                  {lang === "en" ? "Contracts Workspace" : "কন্ট্রাক্ট ওয়ার্কস্পেস"}
                </span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </Link>

>>>>>>> 9e642e7 (add bidding system and navbar is rearrange)
              <button
                onClick={() =>
                  router.push(role === "client" ? "/dashboard/freelancer" : "/dashboard/client")
                }
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <UserCircle className="w-4 h-4 text-slate-400" />
                <span>
                  {lang === "en" ? `Switch to ${otherRoleLabel}` : `${otherRoleLabel} মোডে যান`}
                </span>
              </button>

              <button
                onClick={() => router.push("/login")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === "en" ? "Log Out" : "লগ আউট"}</span>
              </button>
            </div>

            <div className="rounded-2xl bg-slate-900 p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {lang === "en" ? "BDT Escrow" : "বিডিটি এসক্রো"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {lang === "en"
                  ? "Every contract is milestone funded. Money moves only when work is approved."
                  : "প্রতিটি চুক্তি মাইলস্টোনে জমা। কাজ অনুমোদন হলেই টাকা মুক্ত হয়।"}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {action && (
            <Link
              href={action.href}
              className="md:hidden flex items-center justify-center gap-2 w-full py-3 mb-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>{lang === "en" ? action.label : action.labelBn}</span>
            </Link>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
