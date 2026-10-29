import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://closetai.lat"),
  // Neither title repeats an A/B headline: the tab and every shared link would
  // show variant A to the people in group B (found Oct 29, 2026).
  title: {
    default: "ClosetAI — AI personal stylist",
    template: "%s · ClosetAI",
  },
  description:
    "Photograph your clothes, build your digital closet and let AI tell you what to wear — and show it on you.",
  openGraph: {
    title: "ClosetAI — Wear what you already own",
    description:
      "Photograph your clothes, build your digital closet and let AI tell you what to wear — and show it on you.",
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0a0c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
