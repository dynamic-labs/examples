import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Providers from "@/lib/providers";

import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Aleo Private Payments with Dynamic",
  description:
    "Send private ALEO credits from a Dynamic embedded wallet with the JavaScript SDK",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
