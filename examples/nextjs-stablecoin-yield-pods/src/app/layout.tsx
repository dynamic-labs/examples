import "./globals.css";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Providers from "@/lib/providers";
import { Header } from "@/components/header";
import Footer from "@/components/footer";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "DeFi Yield with Dynamic",
  description:
    "Batch Pods bytecode into one ZeroDev smart-wallet transaction with Dynamic's MPC wallets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} font-sans bg-[#F9F9F9] text-[#030303]`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pb-16">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
