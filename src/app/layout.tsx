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
  title: {
    default: "ClosetAI — Tu estilista, en tu bolsillo",
    template: "%s · ClosetAI",
  },
  description:
    "Fotografía tu ropa, arma tu clóset digital y deja que la IA te diga qué ponerte — y te lo muestre puesto.",
  openGraph: {
    title: "ClosetAI — Tu estilista, en tu bolsillo",
    description:
      "Fotografía tu ropa, arma tu clóset digital y deja que la IA te diga qué ponerte — y te lo muestre puesto.",
    locale: "es_MX",
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
      lang="es-MX"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
