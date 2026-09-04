import type { Metadata } from "next";
import { Bodoni_Moda, Inter } from "next/font/google";
import ClientShell from "@/components/ClientShell";
import ConditionalShell from "@/components/ConditionalShell";
import RealtimeClient from "@/components/realtime/RealtimeClient";
import InitialPreloader from "@/components/InitialPreloader";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sns-trionda.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json",
  title: {
    default: "Trionda Wears — Luxury Menswear & Made-to-Order Clothing",
    template: "%s | Trionda Wears",
  },
  description:
    "Premium luxury menswear from Pakistan — premium fabrics, shirts, trousers, sherwanis & made-to-order bespoke apparel. Shop online with nationwide delivery.",
  keywords: [
    "luxury menswear Pakistan",
    "premium fabrics Pakistan",
    "made to order shirts",
    "made to order trousers",
    "bespoke apparel Pakistan",
    "luxury shirts online",
    "premium fabric shirts",
    "sherwani Pakistan",
    "designer menswear online",
    "trionda wears",
    "online clothing store Pakistan",
    "tailored menswear",
  ],
  openGraph: {
    title: "Trionda Wears — Luxury Menswear & Made-to-Order Clothing",
    description:
      "Premium luxury menswear from Pakistan — premium fabrics, shirts, trousers, sherwanis & made-to-order bespoke apparel.",
    url: SITE_URL,
    siteName: "Trionda Wears",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/logo/trionda-icon-mark.png",
        width: 512,
        height: 512,
        alt: "Trionda Wears",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodoniModa.variable} ${inter.variable}`}>
      <head>
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground font-body antialiased pb-14 lg:pb-0">
        <InitialPreloader />
        <ConditionalShell>
          {children}
        </ConditionalShell>
        <ClientShell />
        <RealtimeClient />
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
