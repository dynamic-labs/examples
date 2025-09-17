import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/lib/providers";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ToastContainer } from "@/components/ui/toast";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export function generateMetadata(): Metadata {
  const TITLE = "Dynamic Stablecoin Debit Card Demo";
  const DESCRIPTION =
    "Seamless stablecoin backed debit card experience with Dynamic wallets. Social login, gasless transactions, virtual Visa card - no crypto expertise required.";
  return {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      images: [{ url: "/preview.png", width: 1200, height: 630, alt: TITLE }],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: ["/preview.png"],
    },
  };
}

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
          <Footer />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
