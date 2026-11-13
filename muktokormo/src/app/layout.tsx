import type { Metadata } from "next";
import { Hind_Siliguri, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MuktoKormo (মুক্তকর্ম) | Bangladesh's Trusted Freelance Platform",
  description:
    "Work with Bangladesh's top independent talent. MuktoKormo connects founders, agencies, and verified freelancers with structured BDT milestone escrow.",
  keywords: [
    "MuktoKormo",
    "Bangladesh Freelance",
    "Freelancing in Bangladesh",
    "bKash Escrow",
    "SSLCOMMERZ Freelance",
    "মুক্তকর্ম",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${hindSiliguri.variable} h-full antialiased scroll-smooth`}
    >
      <body
        className="min-h-full flex flex-col bg-canvas text-ink font-sans overflow-x-clip"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
