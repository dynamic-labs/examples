import type { Metadata } from "next";
import "../../styles/globals.css";

export const metadata: Metadata = {
  title: "Access Restricted | Dynamic Kalshi Demo",
  description: "This service is not available in your region.",
};

export default function GeoBlockedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
