import type { Metadata } from "next";
import "../styles/globals.css";
import Providers from "@/lib/providers";

export const metadata: Metadata = {
  title: "Dynamic: Predictions Market Demo",
  description: "Predictions Market Demo by Dynamic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#0a0b0f]">
      <body>
        <Providers>
          <div className="bg-[#0a0b0f] flex justify-center min-h-screen">
            <div
              className="box-border w-full px-[20px] sm:px-[32px] md:px-[48px] lg:px-[64px] xl:px-[80px]"
              style={{ maxWidth: "1440px" }}
            >
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

