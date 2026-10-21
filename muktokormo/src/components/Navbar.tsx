"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Menu,
  X,
  Globe,
  LogOut,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Users,
  FileText,
  LayoutDashboard,
  Sparkles,
  Handshake,
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
  const isLoggedIn = !userLoading && Boolean(email);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"talent" | "work" | "why" | null>(null);
  const [selectedTalentCatIdx, setSelectedTalentCatIdx] = useState(0);
  const [selectedWorkCatIdx, setSelectedWorkCatIdx] = useState(0);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menu: "talent" | "work" | "why") => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-200/90 text-slate-900 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[68px]">
          
          {/* Left: Brand + Upwork-style Nav Menus */}
          <div className="flex items-center gap-7">
            <Link href="/" className="cursor-pointer shrink-0">
              <Logo size="md" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1 text-[13px] font-semibold text-slate-700">
              {/* 1. Find Talent Mega Menu (Upwork Style) */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("talent")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "talent" ? null : "talent")}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg hover:text-emerald-700 transition-colors cursor-pointer ${
                    activeDropdown === "talent" ? "text-emerald-700" : ""
                  }`}
                >
                  <span>{lang === "en" ? "Find Talent" : "ট্যালেন্ট খুঁজুন"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      activeDropdown === "talent" ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>

                {activeDropdown === "talent" && (
                  <div
                    className="absolute top-full left-0 w-[860px] max-w-[calc(100vw-3rem)] pt-2 animate-in fade-in zoom-in-95 duration-150 z-50"
                    onMouseEnter={() => handleMouseEnter("talent")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                      
                      {/* 2-Pane Upwork Mega Menu Body */}
                      <div className="flex min-h-[380px]">
                        
                        {/* Left Pane: Categories List */}
                        <div className="w-56 border-r border-slate-100/90 py-3 px-2 bg-white flex flex-col justify-start shrink-0">
                          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-1 pb-2">
                            CATEGORIES
                          </span>
                          <div className="space-y-0.5">
                            {TALENT_CATEGORIES.map((cat, idx) => (
                              <button
                                key={cat.id}
                                type="button"
                                onMouseEnter={() => setSelectedTalentCatIdx(idx)}
                                onClick={() => setSelectedTalentCatIdx(idx)}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] transition-colors text-left cursor-pointer ${
                                  selectedTalentCatIdx === idx
                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal"
                                }`}
                              >
                                <span>{lang === "en" ? cat.name : cat.nameBn}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Right Pane: 2-Column Skills Grid */}
                        <div className="flex-1 py-4 px-7 bg-white flex flex-col justify-between">
                          <div>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                              {lang === "en"
                                ? TALENT_CATEGORIES[selectedTalentCatIdx].name
                                : TALENT_CATEGORIES[selectedTalentCatIdx].nameBn}
                            </span>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                              {TALENT_CATEGORIES[selectedTalentCatIdx].roles.map((role) => (
                                <Link
                                  key={role.title}
                                  href="/#freelancers-section"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    onSearchChange(role.title);
                                  }}
                                  className="group block text-left"
                                >
                                  <h4 className="text-[13px] font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                    {role.title}
                                  </h4>
                                  <p className="text-[12px] text-slate-500 mt-0.5 leading-snug group-hover:text-slate-600">
                                    {role.desc}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Footer Action Bar (Upwork Style) */}
                      <div className="border-t border-slate-100 px-7 py-3.5 flex items-center gap-6 text-[13px]">
                        <Link
                          href="/#freelancers-section"
                          onClick={() => setActiveDropdown(null)}
                          className="font-medium text-[#108a00] hover:text-[#14a800] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "See all talent" : "সকল ট্যালেন্ট দেখুন"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            onOpenPostJob();
                          }}
                          className="font-medium text-[#108a00] hover:text-[#14a800] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "Post a job for free" : "ফ্রি কাজ পোস্ট করুন"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href="/dashboard/client"
                          onClick={() => setActiveDropdown(null)}
                          className="font-medium text-[#108a00] hover:text-[#14a800] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "Talent marketplace" : "ট্যালেন্ট মার্কেটপ্লেস"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* 2. Find Work Dropdown (Upwork 2-Column Style) */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("work")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "work" ? null : "work")}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg hover:text-emerald-700 transition-colors cursor-pointer ${
                    activeDropdown === "work" ? "text-emerald-700" : ""
                  }`}
                >
                  <span>{lang === "en" ? "Find Work" : "কাজ খুঁজুন"}</span>
                  {myBidsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      activeDropdown === "work" ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>

                {activeDropdown === "work" && (
                  <div
                    className="absolute top-full left-0 w-[860px] max-w-[calc(100vw-3rem)] pt-2 animate-in fade-in zoom-in-95 duration-150 z-50"
                    onMouseEnter={() => handleMouseEnter("work")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                      
                      {/* 2-Pane Upwork Mega Menu Body */}
                      <div className="flex min-h-[380px]">
                        
                        {/* Left Pane: Categories List */}
                        <div className="w-56 border-r border-slate-100/90 py-3 px-2 bg-white flex flex-col justify-start shrink-0">
                          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-1 pb-2">
                            CATEGORIES
                          </span>
                          <div className="space-y-0.5">
                            {WORK_CATEGORIES.map((cat, idx) => (
                              <button
                                key={cat.id}
                                type="button"
                                onMouseEnter={() => setSelectedWorkCatIdx(idx)}
                                onClick={() => setSelectedWorkCatIdx(idx)}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] transition-colors text-left cursor-pointer ${
                                  selectedWorkCatIdx === idx
                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-normal"
                                }`}
                              >
                                <span>{lang === "en" ? cat.name : cat.nameBn}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Right Pane: 2-Column Job Specialties Grid */}
                        <div className="flex-1 py-4 px-7 bg-white flex flex-col justify-between">
                          <div>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                              {lang === "en"
                                ? WORK_CATEGORIES[selectedWorkCatIdx].name
                                : WORK_CATEGORIES[selectedWorkCatIdx].nameBn}
                            </span>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                              {WORK_CATEGORIES[selectedWorkCatIdx].roles.map((role) => (
                                <Link
                                  key={role.title}
                                  href="/#jobs-section"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    onSearchChange(role.title);
                                  }}
                                  className="group block text-left"
                                >
                                  <h4 className="text-[13px] font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                    {role.title}
                                  </h4>
                                  <p className="text-[12px] text-slate-500 mt-0.5 leading-snug group-hover:text-slate-600">
                                    {role.desc}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Footer Action Bar (Directly from Upwork Image 1) */}
                      <div className="border-t border-slate-100 px-7 py-3.5 flex items-center gap-6 text-[13px]">
                        <Link
                          href="/#jobs-section"
                          onClick={() => setActiveDropdown(null)}
                          className="font-medium text-[#108a00] hover:text-[#14a800] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "See all jobs" : "সকল কাজ দেখুন"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href="/dashboard/freelancer"
                          onClick={() => setActiveDropdown(null)}
                          className="font-medium text-[#108a00] hover:text-[#14a800] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "Win work with ads" : "বিজ্ঞাপনে কাজ জিতুন"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href="/dashboard/freelancer"
                          onClick={() => setActiveDropdown(null)}
                          className="font-medium text-[#108a00] hover:text-[#14a800] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{lang === "en" ? "Ways to earn" : "উপার্জনের উপায়"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* 3. Why MuktoKormo Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("why")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "why" ? null : "why")}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg hover:text-emerald-700 transition-colors cursor-pointer ${
                    activeDropdown === "why" ? "text-emerald-700" : ""
                  }`}
                >
                  <span>{lang === "en" ? "Why MuktoKormo" : "কেন মুক্তকর্ম"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      activeDropdown === "why" ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>

                {activeDropdown === "why" && (
                  <div className="absolute top-full left-0 w-80 pt-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-1">
                      <Link
                        href="/#escrow-section"
                        onClick={() => setActiveDropdown(null)}
                        className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {lang === "en" ? "100% BDT Escrow Protection" : "১০০% নিরাপদ বিডিটি এসক্রো"}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6">
                          {lang === "en"
                            ? "Safe deposits via bKash & Nagad. Release funds only when work is approved"
                            : "বিকাশ ও নগদে সুরক্ষিত তহবিল। কাজ অনুমোদনের পরেই পেমেন্ট ছাড়"}
                        </p>
                      </Link>

                      <Link
                        href="/contracts"
                        onClick={() => setActiveDropdown(null)}
                        className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Handshake className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            {lang === "en" ? "Contract Delivery Workspaces" : "কন্ট্রাক্ট ডেলিভারি ওয়ার্কস্পেস"}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6">
                          {lang === "en"
                            ? "Submit deliverables, demo URLs, and audit activity logs"
                            : "মাইলস্টোন ডেলিভারি জমা দিন, রিভিশন রিভিউ ও ট্র্যাকিং করুন"}
                        </p>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              
            </nav>
          </div>

          {/* Right: Clean, Upwork-style Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Search Bar */}
            <div className="hidden xl:flex items-center relative w-52 2xl:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={lang === "en" ? "Search talent or jobs..." : "ট্যালেন্ট বা কাজ খুঁজুন..."}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-full text-xs font-medium focus:outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>

            {/* Language Toggle with subtle pill & Globe icon */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-200"
              title={lang === "en" ? "Switch to বাংলা" : "Switch to English"}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "en" ? "বাংলা" : "English"}</span>
            </button>

            {/* Subtle Divider */}
            <div className="h-5 w-px bg-slate-200 mx-0.5" />

            {/* Authenticated vs Guest Actions */}
            {!userLoading && email ? (
              <div className="flex items-center gap-2.5">
                {/* User Profile Pill */}
                <Link
                  href={dashboardPathForRole(role || "freelancer")}
                  title={lang === "en" ? "View profile & dashboard" : "প্রোফাইল ও ড্যাশবোর্ড"}
                  className="group flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 uppercase shadow-xs">
                    {(name ? name.trim()[0] : email[0]).toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-slate-800 max-w-[100px] truncate group-hover:text-emerald-700 transition-colors">
                    {name ? name.split(" ")[0] : email.split("@")[0]}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      role === "client"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {role === "client" ? "Client" : "Freelancer"}
                  </span>
                </Link>

                {/* Dashboard Primary CTA */}
                <Link
                  href={dashboardPathForRole(role || "freelancer")}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-full transition-all cursor-pointer shadow-xs hover:shadow-emerald-600/20"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Dashboard" : "ড্যাশবোর্ড"}</span>
                </Link>

                {/* Sign Out Button with Icon */}
                <button
                  type="button"
                  onClick={() => signOut()}
                  title={lang === "en" ? "Sign Out" : "লগআউট"}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{lang === "en" ? "Sign Out" : "লগআউট"}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <span>{lang === "en" ? "Log In" : "লগইন"}</span>
                </Link>
                <Link
                  href="/signup"
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs hover:shadow-emerald-600/20"
                >
                  <span>{lang === "en" ? "Sign Up" : "সাইন আপ"}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenPostJob}
              className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-full text-xs"
            >
              Post Job
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-950 cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-800" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-slate-200 px-5 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <button
              onClick={onToggleLang}
              className="text-xs font-semibold text-slate-700"
            >
              {lang === "en" ? "বাংলা ভার্সন" : "English Version"}
            </button>
          </div>

          <div className="space-y-2.5 text-xs font-semibold text-slate-700">
            <Link
              href="/#jobs-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 hover:text-emerald-600"
            >
              {lang === "en" ? "Find Work" : "কাজ খুঁজুন"}
            </Link>
            <Link
              href="/#freelancers-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 hover:text-emerald-600"
            >
              {lang === "en" ? "Hire Talent" : "ট্যালেন্ট খুঁজুন"}
            </Link>
            
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-emerald-700 font-bold"
            >
              {lang === "en" ? "Dedicated Dashboards" : "ড্যাশবোর্ড পোর্টাল"}
            </Link>
            {onOpenMyBids && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMyBids();
                }}
                className="w-full text-left py-1 text-slate-700 hover:text-emerald-600 flex items-center justify-between"
              >
                <span>{lang === "en" ? "My Bids" : "আমার বিড"}</span>
                {myBidsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                    {myBidsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            {!userLoading && email ? (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs px-1 font-bold text-slate-700">
                  <span className="truncate">{name || email}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                    {role === "client" ? "Client" : "Freelancer"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={dashboardPathForRole(role || "freelancer")}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 text-xs font-bold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 shadow-xs"
                  >
                    {lang === "en" ? "Dashboard" : "ড্যাশবোর্ড"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="flex-1 text-center py-2 text-xs font-bold text-rose-600 border border-rose-200 rounded-full hover:bg-rose-50"
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
                  className="flex-1 text-center py-2 text-xs font-bold text-slate-800 border border-slate-200 rounded-full hover:bg-slate-50"
                >
                  {lang === "en" ? "Log In" : "লগইন"}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 shadow-xs"
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
