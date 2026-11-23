import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-sans",
  display: "swap",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  display: "swap",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Forge — project management where your code lives",
    template: "%s · Forge",
  },
  description:
    "Forge brings GitHub issues, pull requests, commits and team workflow into one calm, keyboard-first workspace. Your project management should live where your code already lives.",
  applicationName: "Forge",
  openGraph: {
    title: "Forge",
    description:
      "GitHub, redesigned as a team workspace. Issues, pull requests, tasks and activity in one place.",
    url: siteUrl,
    siteName: "Forge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forge",
    description: "GitHub, redesigned as a team workspace.",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
