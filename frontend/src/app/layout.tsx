import type { Metadata } from "next";
import { Bodoni_Moda, Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClientShell from "@/components/ClientShell";
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
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground font-body antialiased pb-14 md:pb-0">
        <Header />
        {children}
        <Footer />
        <ClientShell />
      </body>
    </html>
  );
}
