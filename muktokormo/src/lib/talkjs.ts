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
  contractId: string;
  client: TalkUserDef;
  freelancer: TalkUserDef;
  budgetBdt: number;
  escrowBdt: number;
  milestoneTitle: string;
  milestoneStatus: string;
  bidStatus: "ACCEPTED" | "PENDING";
  deliveryDays?: number;
}

// Preset Users for demo and quick switching
export const PRESET_CLIENT_AHAD: TalkUserDef = {
  id: "client-ahad-apex",
  name: "Ahad A (Apex Lifestyle)",
  email: "ahad@apexlifestyle.bd",
  role: "client",
  photoUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=150&q=80",
  welcomeMessage: "Hello! Welcome to MuktoKormo contract workspace.",
  headerTitle: "Managing Director · Verified Client (Dhaka)",
};

export const PRESET_CLIENT_RAFIQUL: TalkUserDef = {
  id: "client-rafiqul-fintech",
  name: "Rafiqul Islam (FinTech Ltd)",
  email: "rafiqul@fintechbd.com",
  role: "client",
  photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
  welcomeMessage: "Looking forward to working together on the MFS gateway.",
  headerTitle: "CTO, FinTech Solutions Ltd",
};

export const PRESET_FREELANCER_TANVIR: TalkUserDef = {
  id: "freelancer-tanvir-rahman",
  name: "Tanvir Rahman",
  email: "tanvir.dev@muktokormo.bd",
  role: "freelancer",
  photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  welcomeMessage: "Hi! I am ready to start working on the project deliverables.",
  headerTitle: "Senior Full-Stack Next.js & MFS Engineer",
};

export const PRESET_FREELANCER_MAHMUDUL: TalkUserDef = {
  id: "freelancer-mahmudul-hasan",
  name: "Mahmudul Hasan",
  email: "mahmudul@muktokormo.bd",
  role: "freelancer",
  photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  welcomeMessage: "Hello! Webhook architecture deliverables ready for inspection.",
  headerTitle: "Full Stack Engineer & PostgreSQL Specialist",
};

export const PRESET_FREELANCER_FARHANA: TalkUserDef = {
  id: "freelancer-farhana-yasmin",
  name: "Farhana Yasmin",
  email: "farhana.marketer@muktokormo.bd",
  role: "freelancer",
  photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
  welcomeMessage: "Hi! Server-side CAPI tracking setup will begin once approved.",
  headerTitle: "Senior Performance Marketer",
};

export const PRESET_CONVERSATIONS: TalkConversationDef[] = [
  {
    id: "conv-ctr-8842",
    contractId: "ctr-8842",
    subject: "Full-Stack Next.js E-Commerce Website with bKash/Nagad Payment",
    client: PRESET_CLIENT_AHAD,
    freelancer: PRESET_FREELANCER_TANVIR,
    budgetBdt: 42000,
    escrowBdt: 20000,
    milestoneTitle: "Milestone 1: Storefront & Product Catalogue Responsive UI",
    milestoneStatus: "IN_PROGRESS",
    bidStatus: "ACCEPTED",
    deliveryDays: 14,
  },
  {
    id: "conv-ctr-9120",
    contractId: "ctr-9120",
    subject: "Mobile Banking MFS Gateway & SMS OTP Integration",
    client: PRESET_CLIENT_RAFIQUL,
    freelancer: PRESET_FREELANCER_MAHMUDUL,
    budgetBdt: 35000,
    escrowBdt: 17500,
    milestoneTitle: "Milestone 1: Merchant Webhook Architecture",
    milestoneStatus: "SUBMITTED",
    bidStatus: "ACCEPTED",
    deliveryDays: 12,
  },
  {
    id: "conv-fav-1",
    contractId: "ctr-7731",
    subject: "Meta CAPI & Conversion Optimization Project",
    client: PRESET_CLIENT_AHAD,
    freelancer: PRESET_FREELANCER_FARHANA,
    budgetBdt: 25000,
    escrowBdt: 12500,
    milestoneTitle: "Milestone 1: Server-Side Pixel Setup",
    milestoneStatus: "PLANNING",
    bidStatus: "ACCEPTED",
    deliveryDays: 7,
  },
];

/**
 * Safely loads the TalkJS SDK client-side. Returns null during SSR.
 */
export async function getTalkJS(): Promise<typeof TalkType | null> {
  if (typeof window === "undefined") {
    return null;
  }
  const talkModule = await import("talkjs");
  return talkModule.default;
}
