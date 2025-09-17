import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/lib/providers";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ShadowDomProvider } from "@/lib/shadow-dom/shadow-context";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dynamic Gasless Starter",
  description: "Dynamic Gasless Starter",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ShadowDomProvider>
            <Header />
            {children}
            <Footer />
          </ShadowDomProvider>
        </Providers>
      </body>
    </html>
  );
}
