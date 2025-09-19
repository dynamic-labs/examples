import "./globals.css";

import { ReactNode } from "react";
import Header from "@/src/components/Header";
import StytchProvider from "@/src/components/StytchProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <title>Stytch + Dynamic Next.js Authentication Example</title>
      <meta
        name="description"
        content="An example Next.js App Router application using Stytch for authentication with Dynamic embedded wallets"
      />
      <body>
        <StytchProvider>
          <Header />
          <main>
            <div className="container">{children}</div>
          </main>
        </StytchProvider>
      </body>
    </html>
  );
}
