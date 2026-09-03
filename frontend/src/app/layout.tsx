import type { Metadata } from "next";
import { Bodoni_Moda, Inter } from "next/font/google";
import ClientShell from "@/components/ClientShell";
import ConditionalShell from "@/components/ConditionalShell";
import RealtimeClient from "@/components/realtime/RealtimeClient";
import InitialPreloader from "@/components/InitialPreloader";
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

export const metadata: Metadata = {
  title: "Trionda Wears",
  description: "Premium luxury clothing — fabrics, shirts, trousers & made-to-order apparel.",
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
      </head>
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground font-body antialiased pb-14 md:pb-0">
        <InitialPreloader />
        <ConditionalShell>
          {children}
        </ConditionalShell>
        <ClientShell />
        <RealtimeClient />
      </body>
    </html>
  );
}
