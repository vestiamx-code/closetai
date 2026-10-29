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

/**
 * What Google reads to name the site and show its logo in results. The tab
 * icon in results comes from the favicon; this adds the name and the full logo.
 */
const DATOS_ESTRUCTURADOS = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: "ClosetAI", url: "https://closetai.lat/" },
    {
      "@type": "Organization",
      name: "ClosetAI",
      url: "https://closetai.lat/",
      logo: "https://closetai.lat/marca/logo-closetai.jpg",
    },
  ],
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
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          // Static data written in this file, not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(DATOS_ESTRUCTURADOS) }}
        />
        {children}
      </body>
    </html>
  );
}
