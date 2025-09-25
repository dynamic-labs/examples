import './globals.css'
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import ClientWrapper from './ClientWrapper';
import { customCSS } from './customCSS';

export const metadata = {
  title: "Dynamic Sidebar Widget Demo",
  description: "Experience the future of Web3 interactions with Dynamic's sleek Sidebar Widget. Seamlessly integrate wallet functionality into your website.",
  openGraph: {
    title: "Dynamic Sidebar Widget Demo",
    description: "Experience the future of Web3 interactions with Dynamic's sleek Sidebar Widget. Seamlessly integrate wallet functionality into your website.",
    images: [
      {
        url: "https://cdn.prod.website-files.com/626692727bba3f384e008e8a/653900afcd3d30a612147826_Dynamic.jpg",
        width: 1200,
        height: 630,
        alt: "Dynamic Sidebar Widget Demo",
      },
    ],
    siteName: "Dynamic Sidebar Widget Demo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dynamic Sidebar Widget Demo",
    description: "Experience the future of Web3 interactions with Dynamic's sleek Sidebar Widget. Seamlessly integrate wallet functionality into your website.",
    images: ["https://cdn.prod.website-files.com/626692727bba3f384e008e8a/653900afcd3d30a612147826_Dynamic.jpg"],
    creator: "@dynamic_xyz",
  },
};

export default function RootLayout({ children }) {


  return (
    <html lang="en">
      <body>
        <DynamicContextProvider
          settings={{
            environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID,
            walletConnectors: [EthereumWalletConnectors],
            cssOverrides: customCSS,
          }}
        >
          <ClientWrapper>{children}</ClientWrapper>
        </DynamicContextProvider>
      </body>
    </html>
  );
}
