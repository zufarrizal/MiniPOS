import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/assets/css/globals.css";
import LayoutShell from "./layout-shell";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MiniPOS - Sistem Kasir Minimarket",
  description: "Sistem POS Minimarket Modern & Cepat dengan SQLite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable}`}>
      <body className={`${inter.className} bg-background text-foreground min-h-screen overflow-hidden`}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
