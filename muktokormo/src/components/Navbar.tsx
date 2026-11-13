"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Globe,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Handshake,
  User,
  Briefcase,
  CreditCard,
} from "lucide-react";
import Logo from "./Logo";
import useCurrentUser from "@/lib/hooks/useCurrentUser";
import { dashboardPathForRole } from "@/lib/auth";

const TALENT_CATEGORIES = [
  {
    id: "ai",
    name: "AI & Automation",
    nameBn: "এআই ও অটোমেশন",
    roles: [
      { title: "AI Video Creators & Editors", desc: "Generate and edit AI-powered video" },
      { title: "AI Integration Developers", desc: "Connect AI to your existing tools" },
      { title: "Chatbot developers", desc: "Build AI for support and sales" },
      { title: "Machine learning engineers", desc: "Models that learn from your data" },
      { title: "AI Developers", desc: "Custom AI-powered apps and features" },
      { title: "Automation Experts", desc: "Streamline your business processes" },
      { title: "N8N Experts", desc: "No-code workflow automation" },
      { title: "Vibe Coders", desc: "Prototype and build rapidly with AI" },
      { title: "Claude Experts", desc: "Build with Anthropic's Claude" },
      { title: "AI Consultants", desc: "Strategic AI guidance for business" },
    ],
  },
  {
    id: "dev",
    name: "Development & IT",
    nameBn: "ডেভেলপমেন্ট ও আইটি",
    roles: [
      { title: "Full-Stack Developers", desc: "End-to-end web apps with Next.js & React" },
      { title: "Mobile App Developers", desc: "Cross-platform iOS & Android in Flutter" },
      { title: "Frontend Specialists", desc: "Pixel-perfect responsive web interfaces" },
      { title: "Backend Engineers", desc: "Scalable REST APIs in Node & Python" },
      { title: "E-Commerce Developers", desc: "Custom stores with bKash & SSLCommerz" },
      { title: "Payment API Engineers", desc: "Direct bKash, Nagad & card integrations" },
      { title: "DevOps & Cloud Engineers", desc: "AWS, Docker & CI/CD deployment" },
      { title: "WordPress Developers", desc: "Custom themes, plugins & speed optimization" },
      { title: "Database Architects", desc: "PostgreSQL, Supabase & schema tuning" },
      { title: "Cybersecurity Specialists", desc: "Vulnerability audits & secure auth" },
    ],
  },
  {
    id: "design",
    name: "Design & Creative",
    nameBn: "ডিজাইন ও ক্রিয়েটিভ",
    roles: [
      { title: "UI/UX Designers", desc: "High-converting Figma prototypes & wireframes" },
      { title: "Brand & Logo Designers", desc: "Visual identities, guidelines & vector logos" },
      { title: "Motion Graphics Artists", desc: "Dynamic animations, intros & 2D effects" },
      { title: "Video Editors", desc: "Fast-paced YouTube, TikTok & podcast editing" },
      { title: "Graphic Designers", desc: "Social media banners, flyers & print kits" },
      { title: "Design System Specialists", desc: "Scalable Figma component libraries" },
      { title: "3D Modelers & Animators", desc: "Blender, realistic product renders & 3D art" },
      { title: "Packaging Designers", desc: "Print-ready retail box & label artwork" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    nameBn: "মার্কেটিং",
    roles: [
      { title: "Meta Ads Specialists", desc: "High-ROAS Facebook & Instagram conversion ads" },
      { title: "TikTok Media Buyers", desc: "Viral short-form creative ad campaigns" },
      { title: "SEO Consultants", desc: "Technical audits, on-page SEO & link building" },
      { title: "Google Ads Experts", desc: "PPC, Search, Shopping & Display campaigns" },
      { title: "Conversion Rate Optimizers", desc: "Landing page A/B testing & funnel growth" },
      { title: "Email Marketers", desc: "Automated retention flows & newsletters" },
      { title: "Social Media Managers", desc: "Organic growth, community & scheduling" },
      { title: "Influencer Marketers", desc: "Bangladeshi creator outreach & partnerships" },
    ],
  },
  {
    id: "data",
    name: "Data & Analytics",
    nameBn: "ডাটা ও অ্যানালিটিক্স",
    roles: [
      { title: "Data Analysts", desc: "PowerBI, Tableau dashboards & SQL insights" },
      { title: "Google Analytics 4 Experts", desc: "Server-side tracking, GTM & conversion APIs" },
      { title: "Excel & Sheet Automators", desc: "Advanced formulas, VBA macros & pipelines" },
      { title: "Data Engineers", desc: "ETL pipelines, data cleaning & web scraping" },
      { title: "Financial Modelers", desc: "Cash flow projections & startup unit economics" },
      { title: "BI Consultants", desc: "Executive KPI scorecards & revenue reporting" },
    ],
  },
  {
    id: "admin",
    name: "Admin & support",
    nameBn: "অ্যাডমিন ও সাপোর্ট",
    roles: [
      { title: "Virtual Assistants", desc: "Executive calendar, inbox & operations support" },
      { title: "Customer Support Specialists", desc: "Live chat, Zendesk & email ticket resolution" },
      { title: "Data Entry Specialists", desc: "Accurate spreadsheet entry & catalog updates" },
      { title: "Project Coordinators", desc: "Sprint management with Jira, Trello & Notion" },
      { title: "E-Commerce Store Managers", desc: "Order fulfillment, customer calls & dispatch" },
      { title: "Online Researchers", desc: "Competitor analysis & business lead finding" },
    ],
  },
  {
    id: "writing",
    name: "Writing & content",
    nameBn: "রাইটিং ও কন্টেন্ট",
    roles: [
      { title: "SEO Content Writers", desc: "High-ranking informative articles & blog posts" },
      { title: "Bilingual Copywriters", desc: "Engaging English & Bangla marketing copy" },
      { title: "Technical Writers", desc: "API docs, developer guides & whitepapers" },
      { title: "Scriptwriters", desc: "Engaging YouTube scripts, ads & short videos" },
      { title: "English-Bangla Translators", desc: "Fluent contextual localization & translation" },
      { title: "Proofreaders & Editors", desc: "Grammar, syntax, tone & brand consistency" },
    ],
  },
];

const WORK_CATEGORIES = [
  {
    id: "ai",
    name: "AI & Automation",
    nameBn: "এআই ও অটোমেশন",
    roles: [
      { title: "Artificial Intelligence", desc: "Work on cutting-edge AI projects" },
      { title: "AI Generated Video", desc: "Create AI-powered video content" },
      { title: "AI Model Training", desc: "Label, train and fine-tune AI models" },
      { title: "Prompt Engineering", desc: "Craft prompts for better AI outputs" },
      { title: "AI Content Creation", desc: "Write and edit AI-assisted content" },
      { title: "Generative AI", desc: "Build with generative AI tools" },
      { title: "AI Writing", desc: "Write with and about AI" },
      { title: "Automation", desc: "Workflows that cut manual work" },
      { title: "Chatbot", desc: "Deploy conversational bots" },
      { title: "ChatGPT", desc: "Projects using ChatGPT and OpenAI" },
    ],
  },
  {
    id: "dev",
    name: "Development & IT",
    nameBn: "ডেভেলপমেন্ট ও আইটি",
    roles: [
      { title: "Full-Stack Development", desc: "Build complete web apps with Next.js & React" },
      { title: "Mobile App Development", desc: "Native & Flutter apps for iOS & Android" },
      { title: "Frontend Development", desc: "Responsive UI with Tailwind, CSS & React" },
      { title: "Backend Development", desc: "REST & GraphQL APIs, Node.js & Python" },
      { title: "E-Commerce & bKash", desc: "Custom checkout, SSLCommerz & payment gateways" },
      { title: "WordPress Development", desc: "Themes, plugins & speed optimization" },
      { title: "DevOps & Cloud", desc: "AWS, Docker, CI/CD pipeline automation" },
      { title: "Database Architecture", desc: "PostgreSQL, Supabase & schema optimization" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    nameBn: "মার্কেটিং",
    roles: [
      { title: "Meta & Facebook Ads", desc: "High-ROAS conversion campaigns & CAPI tracking" },
      { title: "TikTok Ad Campaigns", desc: "Viral short-form creative video promotions" },
      { title: "Search Engine Optimization", desc: "On-page, technical audits & rank climbing" },
      { title: "Google Ads & PPC", desc: "High-intent search & shopping ad campaigns" },
      { title: "Email Marketing & Flows", desc: "Klaviyo retention, automations & newsletters" },
      { title: "Social Media Growth", desc: "Organic strategy, community & scheduling" },
      { title: "Conversion Optimization", desc: "Landing page A/B tests & funnel analysis" },
      { title: "Influencer Marketing", desc: "Creator sponsorships & brand partnerships" },
    ],
  },
  {
    id: "design",
    name: "Design & Creative",
    nameBn: "ডিজাইন ও ক্রিয়েটিভ",
    roles: [
      { title: "UI/UX & Mobile Design", desc: "Interactive Figma wireframes & prototypes" },
      { title: "Brand & Logo Identity", desc: "Logos, brand guidelines & typography systems" },
      { title: "Graphic Design", desc: "Social media assets, banners & print design" },
      { title: "Design Systems", desc: "Figma tokens, reusable components & auto-layout" },
      { title: "3D Product Modeling", desc: "Realistic Blender renders & 3D animations" },
      { title: "Packaging & Label Design", desc: "Retail product boxes, mockups & labels" },
      { title: "Illustrations & Vector Art", desc: "Custom icon sets & digital drawings" },
      { title: "Presentation Design", desc: "Pitch decks, investor slides & keynotes" },
    ],
  },
  {
    id: "video",
    name: "Video & Audio",
    nameBn: "ভিডিও ও অডিও",
    roles: [
      { title: "YouTube Video Editing", desc: "High-retention pacing, sound design & B-roll" },
      { title: "Motion Graphics & VFX", desc: "After Effects animations, intros & lower thirds" },
      { title: "TikTok & Shorts Editing", desc: "Captivating captions, hooks & trending formats" },
      { title: "Color Grading", desc: "DaVinci Resolve cinematic look & LUTs" },
      { title: "Podcast Audio Production", desc: "Vocal cleanup, mastering & sound mixing" },
      { title: "Commercial Ad Videos", desc: "High-converting promo video production" },
    ],
  },
  {
    id: "writing",
    name: "Writing & content",
    nameBn: "রাইটিং ও কন্টেন্ট",
    roles: [
      { title: "SEO Blog & Article Writing", desc: "In-depth research & high-ranking content" },
      { title: "Bilingual Copywriting", desc: "Persuasive sales copy in English & Bangla" },
      { title: "Technical Writing", desc: "Developer docs, API guides & whitepapers" },
      { title: "Scriptwriting", desc: "YouTube video scripts & podcast outlines" },
      { title: "English-Bangla Translation", desc: "Accurate contextual translation" },
      { title: "Proofreading & Editing", desc: "Grammar, syntax & flow enhancements" },
    ],
  },
  {
    id: "admin",
    name: "Admin & support",
    nameBn: "অ্যাডমিন ও সাপোর্ট",
    roles: [
      { title: "Virtual Assistance", desc: "Executive scheduling, email & calendar triage" },
      { title: "Customer Support (Chat/Email)", desc: "Zendesk, live chat & ticket management" },
      { title: "Data Entry & Cleanup", desc: "Accurate spreadsheet entry & catalog updates" },
      { title: "Project Management", desc: "Sprint tracking via Jira, Trello & Notion" },
      { title: "E-Commerce Store Support", desc: "Order fulfillment, customer calls & dispatch" },
      { title: "Web Research & Lead Sourcing", desc: "Targeted B2B leads & competitor intel" },
    ],
  },
];

interface NavbarProps {
  onOpenPostJob: () => void;
  lang: "en" | "bn";
  onToggleLang: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  myBidsCount?: number;
  onOpenMyBids?: () => void;
}

export default function Navbar({
  onOpenPostJob,
  lang,
  onToggleLang,
  searchQuery,
  onSearchChange,
  myBidsCount = 0,
  onOpenMyBids,
}: NavbarProps) {
  const { name, email, role, loading: userLoading, signOut } = useCurrentUser();
  const pathname = usePathname();
  const onHowItWorks = pathname === "/how-it-works";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<
    "talent" | "work" | "why" | "profile" | null
  >(null);
  const [selectedTalentCatIdx, setSelectedTalentCatIdx] = useState(0);
  const [selectedWorkCatIdx, setSelectedWorkCatIdx] = useState(0);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMouseEnter = (menu: "talent" | "work" | "why" | "profile") => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 160);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  const userInitial = (name ? name.trim()[0] : email?.[0] || "M").toUpperCase();
  const firstName = name ? name.split(" ")[0] : email?.split("@")[0] || "Account";

  return (
    <header
      className={`sticky top-0 z-40 text-ink font-sans transition-[background-color,border-color,box-shadow] duration-200 border-b ${
        scrolled || mobileMenuOpen
          ? "mk-glass border-line shadow-[0_1px_0_rgba(16,24,40,0.02)]"
          : "bg-canvas border-transparent"
      }`}
    >
      <div className="mk-container">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          {/* Left: Brand + Qonto-inspired Navigation */}
          <div className="flex items-center gap-6 xl:gap-10">
            <Link href="/" className="cursor-pointer shrink-0">
              <Logo size="md" />
            </Link>

            <nav aria-label="Primary" className="hidden lg:flex items-center gap-0.5 text-[14px] font-medium text-ink-2">
              {/* 2. Find Work Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("work")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "work" ? null : "work")
                  }
                  aria-expanded={activeDropdown === "work"}
                  aria-haspopup="true"
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-md transition-colors cursor-pointer ${
                    activeDropdown === "work"
                      ? "bg-subtle text-ink"
                      : "hover:text-ink hover:bg-subtle"
                  }`}
                >
                  <span>{lang === "en" ? "Find Work" : "কাজ খুঁজুন"}</span>
                  {myBidsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-brand" />
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-200 ${
                      activeDropdown === "work" ? "rotate-180 text-brand" : ""
                    }`}
                  />
                </button>

                {activeDropdown === "work" && (
                  <div
                    className="absolute top-full left-0 w-[860px] max-w-[calc(100vw-3rem)] pt-2.5 mk-zoom-in z-50"
                    onMouseEnter={() => handleMouseEnter("work")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-white rounded-xl border border-line shadow-[var(--mk-shadow-popover)] overflow-hidden flex flex-col">
                      <div className="flex min-h-[380px]">
                        {/* Left Pane */}
                        <div className="w-56 border-r border-[rgba(16,24,40,0.08)] py-3.5 px-2.5 bg-canvas flex flex-col justify-start shrink-0">
                          <span className="block mk-eyebrow text-ink-4 px-3 pt-1 pb-2.5">
                            {lang === "en" ? "Job Categories" : "কাজের বিভাগ"}
                          </span>
                          <div className="space-y-0.5">
                            {WORK_CATEGORIES.map((cat, idx) => (
                              <button
                                key={cat.id}
                                type="button"
                                onMouseEnter={() => setSelectedWorkCatIdx(idx)}
                                onClick={() => setSelectedWorkCatIdx(idx)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors text-left cursor-pointer ${
                                  selectedWorkCatIdx === idx
                                    ? "bg-white text-ink font-medium shadow-[0_1px_2px_rgba(16,24,40,0.06)] border border-line"
                                    : "text-ink-2 hover:text-ink hover:bg-white/60 font-medium border border-transparent"
                                }`}
                              >
                                <span>{lang === "en" ? cat.name : cat.nameBn}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-ink-4 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Right Pane */}
                        <div className="flex-1 py-5 px-7 bg-white flex flex-col justify-between">
                          <div>
                            <span className="block mk-eyebrow text-brand mb-4">
                              {lang === "en"
                                ? WORK_CATEGORIES[selectedWorkCatIdx].name
                                : WORK_CATEGORIES[selectedWorkCatIdx].nameBn}
                            </span>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                              {WORK_CATEGORIES[selectedWorkCatIdx].roles.map((r) => (
                                <Link
                                  key={r.title}
                                  href="/#jobs-section"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    onSearchChange(r.title);
                                  }}
                                  className="group block text-left"
                                >
                                  <h4 className="text-[13px] font-semibold text-ink group-hover:text-brand transition-colors">
                                    {r.title}
                                  </h4>
                                  <p className="text-[12px] text-ink-3 mt-0.5 leading-snug">
                                    {r.desc}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Action Bar */}
                      <div className="border-t border-[rgba(16,24,40,0.08)] bg-canvas/70 px-7 py-3.5 flex items-center gap-6 text-[13px]">
                        <Link
                          href="/#jobs-section"
                          onClick={() => setActiveDropdown(null)}
                          className="font-semibold text-brand hover:text-navy inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "Explore open jobs" : "সকল কাজ দেখুন"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href="/dashboard/freelancer"
                          onClick={() => setActiveDropdown(null)}
                          className="font-semibold text-brand hover:text-navy inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "Freelancer portal" : "ফ্রিল্যান্সার ড্যাশবোর্ড"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href="/escrow"
                          onClick={() => setActiveDropdown(null)}
                          className="font-semibold text-ink-2 hover:text-ink inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "How BDT payout works" : "পেমেন্ট প্রক্রিয়া"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 1. Find Talent Mega Menu */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("talent")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "talent" ? null : "talent")
                  }
                  aria-expanded={activeDropdown === "talent"}
                  aria-haspopup="true"
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-md transition-colors cursor-pointer ${
                    activeDropdown === "talent"
                      ? "bg-subtle text-ink"
                      : "hover:text-ink hover:bg-subtle"
                  }`}
                >
                  <span>{lang === "en" ? "Find Talent" : "ট্যালেন্ট খুঁজুন"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-200 ${
                      activeDropdown === "talent" ? "rotate-180 text-brand" : ""
                    }`}
                  />
                </button>

                {activeDropdown === "talent" && (
                  <div
                    className="absolute top-full left-0 w-[860px] max-w-[calc(100vw-3rem)] pt-2.5 mk-zoom-in z-50"
                    onMouseEnter={() => handleMouseEnter("talent")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-white rounded-xl border border-line shadow-[var(--mk-shadow-popover)] overflow-hidden flex flex-col">
                      <div className="flex min-h-[380px]">
                        {/* Left Pane */}
                        <div className="w-56 border-r border-[rgba(16,24,40,0.08)] py-3.5 px-2.5 bg-canvas flex flex-col justify-start shrink-0">
                          <span className="block mk-eyebrow text-ink-4 px-3 pt-1 pb-2.5">
                            {lang === "en" ? "Specialties" : "বিভাগসমূহ"}
                          </span>
                          <div className="space-y-0.5">
                            {TALENT_CATEGORIES.map((cat, idx) => (
                              <button
                                key={cat.id}
                                type="button"
                                onMouseEnter={() => setSelectedTalentCatIdx(idx)}
                                onClick={() => setSelectedTalentCatIdx(idx)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors text-left cursor-pointer ${
                                  selectedTalentCatIdx === idx
                                    ? "bg-white text-ink font-medium shadow-[0_1px_2px_rgba(16,24,40,0.06)] border border-line"
                                    : "text-ink-2 hover:text-ink hover:bg-white/60 font-medium border border-transparent"
                                }`}
                              >
                                <span>{lang === "en" ? cat.name : cat.nameBn}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-ink-4 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Right Pane */}
                        <div className="flex-1 py-5 px-7 bg-white flex flex-col justify-between">
                          <div>
                            <span className="block mk-eyebrow text-brand mb-4">
                              {lang === "en"
                                ? TALENT_CATEGORIES[selectedTalentCatIdx].name
                                : TALENT_CATEGORIES[selectedTalentCatIdx].nameBn}
                            </span>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                              {TALENT_CATEGORIES[selectedTalentCatIdx].roles.map((r) => (
                                <Link
                                  key={r.title}
                                  href="/#freelancers-section"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    onSearchChange(r.title);
                                  }}
                                  className="group block text-left"
                                >
                                  <h4 className="text-[13px] font-semibold text-ink group-hover:text-brand transition-colors">
                                    {r.title}
                                  </h4>
                                  <p className="text-[12px] text-ink-3 mt-0.5 leading-snug">
                                    {r.desc}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Action Bar */}
                      <div className="border-t border-[rgba(16,24,40,0.08)] bg-canvas/70 px-7 py-3.5 flex items-center gap-6 text-[13px]">
                        <Link
                          href="/#freelancers-section"
                          onClick={() => setActiveDropdown(null)}
                          className="font-semibold text-brand hover:text-navy inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "Browse verified talent" : "সকল ট্যালেন্ট দেখুন"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            onOpenPostJob();
                          }}
                          className="font-semibold text-brand hover:text-navy inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "Post a job for free" : "ফ্রি কাজ পোস্ট করুন"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href="/dashboard/client"
                          onClick={() => setActiveDropdown(null)}
                          className="font-semibold text-ink-2 hover:text-ink inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "Client workspace" : "ক্লায়েন্ট ড্যাশবোর্ড"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* How it works */}
              <Link
                href="/how-it-works"
                aria-current={onHowItWorks ? "page" : undefined}
                className={`flex items-center px-3 h-9 rounded-md transition-colors ${
                  onHowItWorks ? "bg-subtle text-ink" : "hover:text-ink hover:bg-subtle"
                }`}
              >
                {lang === "en" ? "How it works" : "কার্যপদ্ধতি"}
              </Link>

              {/* 3. Platform / Why MuktoKormo Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("why")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === "why" ? null : "why")
                  }
                  aria-expanded={activeDropdown === "why"}
                  aria-haspopup="true"
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-md transition-colors cursor-pointer ${
                    activeDropdown === "why"
                      ? "bg-subtle text-ink"
                      : "hover:text-ink hover:bg-subtle"
                  }`}
                >
                  <span>{lang === "en" ? "Why MuktoKormo" : "কেন মুক্তকর্ম"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-200 ${
                      activeDropdown === "why" ? "rotate-180 text-brand" : ""
                    }`}
                  />
                </button>

                {activeDropdown === "why" && (
                  <div className="absolute top-full left-0 w-80 pt-2.5 mk-zoom-in z-50">
                    <div className="bg-white rounded-xl border border-line shadow-[var(--mk-shadow-popover)] p-2.5 space-y-1">
                      <Link
                        href="/escrow"
                        onClick={() => setActiveDropdown(null)}
                        className="block p-3 rounded-lg hover:bg-subtle transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <p className="text-[13px] font-semibold text-ink group-hover:text-brand">
                            {lang === "en"
                              ? "100% BDT Escrow Protection"
                              : "১০০% নিরাপদ বিডিটি এসক্রো"}
                          </p>
                        </div>
                        <p className="text-[11px] text-ink-3 mt-1 pl-9.5 leading-relaxed">
                          {lang === "en"
                            ? "Milestone custody via bKash, Nagad & bank cards. Pay only when approved."
                            : "বিকাশ ও নগদে সুরক্ষিত তহবিল। কাজ অনুমোদনের পরেই পেমেন্ট ছাড়।"}
                        </p>
                      </Link>

                      <Link
                        href="/workspaces"
                        onClick={() => setActiveDropdown(null)}
                        className="block p-3 rounded-lg hover:bg-subtle transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                            <Handshake className="w-4 h-4" />
                          </div>
                          <p className="text-[13px] font-semibold text-ink group-hover:text-brand">
                            {lang === "en"
                              ? "Contract Delivery Workspaces"
                              : "কন্ট্রাক্ট ডেলিভারি ওয়ার্কস্পেস"}
                          </p>
                        </div>
                        <p className="text-[11px] text-ink-3 mt-1 pl-9.5 leading-relaxed">
                          {lang === "en"
                            ? "Track deliverables, live URLs, audit trails, and integrated 1-to-1 chat."
                            : "মাইলস্টোন ডেলিভারি জমা দিন, রিভিশন রিভিউ ও ট্র্যাকিং করুন।"}
                        </p>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Search Pill */}
            <div className="hidden xl:flex items-center relative w-52 2xl:w-60">
              <Search className="w-3.5 h-3.5 text-ink-4 absolute left-3 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={
                  lang === "en" ? "Search talent or jobs..." : "ট্যালেন্ট বা কাজ খুঁজুন..."
                }
                aria-label={lang === "en" ? "Search talent or jobs" : "ট্যালেন্ট বা কাজ খুঁজুন"}
                className="w-full h-9 pl-8.5 pr-3 bg-white hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/12 border border-line rounded-md text-[13px] focus:outline-none transition-all placeholder:text-ink-4 text-ink"
              />
            </div>

            {/* Bilingual Language Toggle */}
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-2.5 h-9 rounded-md text-[13px] font-medium text-ink-2 hover:text-ink hover:bg-subtle transition-colors cursor-pointer"
              title={lang === "en" ? "Switch to বাংলা" : "Switch to English"}
            >
              <Globe className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
              <span>{lang === "en" ? "বাংলা" : "English"}</span>
            </button>

            <div className="h-5 w-px bg-line-strong mx-0.5" aria-hidden="true" />

            {/* Authenticated vs Guest */}
            {!userLoading && email ? (
              <div className="flex items-center gap-2">
                {/* Profile Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnter("profile")}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(activeDropdown === "profile" ? null : "profile")
                    }
                    aria-expanded={activeDropdown === "profile"}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 pl-1 pr-2.5 h-9 rounded-md bg-white hover:bg-subtle border border-line transition-colors cursor-pointer"
                  >
                    <span className="w-7 h-7 rounded bg-navy text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
                      {userInitial}
                    </span>
                    <span className="text-[13px] font-medium text-ink max-w-[96px] truncate">
                      {firstName}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        role === "client"
                          ? "bg-brand-soft text-navy"
                          : role === "admin"
                          ? "bg-accent-soft text-accent-strong"
                          : "bg-brand-soft text-brand-strong"
                      }`}
                    >
                      {role || "member"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-ink-3" />
                  </button>

                  {activeDropdown === "profile" && (
                    <div className="absolute right-0 top-full w-64 pt-2 mk-zoom-in z-50">
                      <div className="bg-white rounded-xl border border-line shadow-[var(--mk-shadow-popover)] p-2 space-y-0.5">
                        <div className="px-3 py-2.5 border-b border-line mb-1">
                          <p className="text-[13px] font-semibold text-ink truncate">
                            {name || firstName}
                          </p>
                          <p className="text-[11px] text-ink-3 truncate">
                            {email}
                          </p>
                        </div>
                        <Link
                          href={dashboardPathForRole(role || "freelancer")}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-ink hover:bg-subtle"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-brand" />
                          <span>{lang === "en" ? "Dashboard Overview" : "ড্যাশবোর্ড"}</span>
                        </Link>
                        <Link
                          href="/contracts"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-ink hover:bg-subtle"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-brand" />
                          <span>{lang === "en" ? "Contracts & Escrow" : "চুক্তি ও এসক্রো"}</span>
                        </Link>
                        <Link
                          href="/messages"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-ink hover:bg-subtle"
                        >
                          <User className="w-3.5 h-3.5 text-brand" />
                          <span>{lang === "en" ? "Messages" : "মেসেজ"}</span>
                        </Link>
                        <Link
                          href="/escrow"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-ink hover:bg-subtle"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-brand" />
                          <span>{lang === "en" ? "Payment Guide" : "পেমেন্ট গাইড"}</span>
                        </Link>
                        <div className="pt-1 border-t border-[rgba(16,24,40,0.08)]">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdown(null);
                              signOut();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-danger-strong hover:bg-danger-soft cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>{lang === "en" ? "Sign Out" : "লগআউট"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard Primary CTA */}
                <Link
                  href={dashboardPathForRole(role || "freelancer")}
                  className="flex items-center gap-1.5 bg-ink hover:bg-ink-hover text-white font-medium text-[13px] px-3.5 h-9 rounded-md transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{lang === "en" ? "Dashboard" : "ড্যাশবোর্ড"}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-[13px] font-medium text-ink-2 hover:text-ink px-3 h-9 inline-flex items-center rounded-md hover:bg-subtle transition-colors cursor-pointer"
                >
                  <span>{lang === "en" ? "Log In" : "লগইন"}</span>
                </Link>
                <Link
                  href="/signup"
                  className="bg-brand hover:bg-brand-hover text-white font-medium text-[13px] px-4 h-9 inline-flex items-center rounded-md transition-colors cursor-pointer"
                >
                  <span>{lang === "en" ? "Sign Up" : "সাইন আপ"}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={onOpenPostJob}
              className="bg-brand text-white font-medium px-3 h-9 rounded-md text-[13px] cursor-pointer"
            >
              {lang === "en" ? "Post Job" : "পোস্ট"}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 inline-flex items-center justify-center rounded-md text-ink hover:bg-subtle border border-line cursor-pointer"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-line px-4 py-5 space-y-5 shadow-[var(--mk-shadow-popover)] mk-fade-in max-h-[calc(100dvh-4rem)] overflow-y-auto">
          {/* Mobile Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ink-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                lang === "en" ? "Search talent or jobs..." : "ট্যালেন্ট বা কাজ খুঁজুন..."
              }
              aria-label={lang === "en" ? "Search talent or jobs" : "ট্যালেন্ট বা কাজ খুঁজুন"}
              className="w-full h-11 pl-8.5 pr-3 bg-canvas border border-line rounded-lg text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-[rgba(16,24,40,0.07)]">
            <button
              type="button"
              onClick={onToggleLang}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink"
            >
              <Globe className="w-3.5 h-3.5 text-brand" />
              <span>{lang === "en" ? "বাংলা সংস্করণ দেখুন" : "Switch to English"}</span>
            </button>
          </div>

          <div className="divide-y divide-line text-[15px] font-medium text-ink">
            <Link
              href="/#jobs-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 hover:text-brand"
            >
              {lang === "en" ? "Find Work" : "কাজ খুঁজুন"}
            </Link>
            <Link
              href="/#freelancers-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 hover:text-brand"
            >
              {lang === "en" ? "Hire Talent" : "ট্যালেন্ট খুঁজুন"}
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              aria-current={onHowItWorks ? "page" : undefined}
              className={`block py-3 hover:text-brand ${onHowItWorks ? "text-brand" : ""}`}
            >
              {lang === "en" ? "How it works" : "কার্যপদ্ধতি"}
            </Link>
            <Link
              href="/escrow"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-3 hover:text-brand"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
              <span>
                {lang === "en" ? "100% BDT Escrow Protection" : "১০০% নিরাপদ বিডিটি এসক্রো"}
              </span>
            </Link>
            <Link
              href="/workspaces"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-3 hover:text-brand"
            >
              <Handshake className="w-3.5 h-3.5 text-brand" />
              <span>
                {lang === "en" ? "Contract Delivery Workspaces" : "কন্ট্রাক্ট ডেলিভারি ওয়ার্কস্পেস"}
              </span>
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 text-brand"
            >
              {lang === "en" ? "Dashboard Portal" : "ড্যাশবোর্ড পোর্টাল"}
            </Link>
            {onOpenMyBids && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMyBids();
                }}
                className="w-full text-left py-3 text-ink hover:text-brand flex items-center justify-between cursor-pointer"
              >
                <span>{lang === "en" ? "My Submitted Bids" : "আমার জমাকৃত বিড"}</span>
                {myBidsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-soft text-navy">
                    {myBidsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-[rgba(16,24,40,0.08)] flex items-center gap-3">
            {!userLoading && email ? (
              <div className="w-full space-y-2.5">
                <div className="flex items-center justify-between text-xs px-1 font-bold text-ink">
                  <span className="truncate">{name || email}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-brand-soft text-navy">
                    {role === "client" ? "Client" : role === "admin" ? "Admin" : "Freelancer"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={dashboardPathForRole(role || "freelancer")}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center h-11 inline-flex items-center justify-center text-sm font-medium text-white bg-ink rounded-lg"
                  >
                    {lang === "en" ? "Dashboard" : "ড্যাশবোর্ড"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="flex-1 text-center h-11 text-sm font-medium text-danger-strong border border-danger-border bg-danger-soft rounded-lg cursor-pointer"
                  >
                    {lang === "en" ? "Sign Out" : "লগআউট"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center h-11 inline-flex items-center justify-center text-sm font-medium text-ink border border-line-strong rounded-lg"
                >
                  {lang === "en" ? "Log In" : "লগইন"}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center h-11 inline-flex items-center justify-center text-sm font-medium text-white bg-ink rounded-lg"
                >
                  {lang === "en" ? "Sign Up" : "সাইন আপ"}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
