import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/lib/providers";
import Navigation from "@/components/Navigation";
import Footer from "@/components/footer";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Defi Lending & Borrowing Yield with Dynamic wallets",
  description: "Decentralized lending and borrowing platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Navigation />
          <main className="min-h-screen bg-background">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
