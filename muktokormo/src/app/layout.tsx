import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MuktoKormo (মুক্তকর্ম) | Bangladesh's Trusted Freelance Platform",
  description: "Work with Bangladesh's top independent talent. MuktoKormo connects students, freelancers, startups, and SMEs with guaranteed BDT milestone escrow.",
  keywords: [
    "MuktoKormo",
    "Bangladesh Freelance",
    "Freelancing in Bangladesh",
    "bKash Escrow",
    "Upwork Bangladesh",
    "মুক্তকর্ম"
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
