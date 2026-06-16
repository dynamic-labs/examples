import './globals.css'
import Providers from './providers';
import ClientWrapper from './ClientWrapper';

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
        <Providers>
          <ClientWrapper>{children}</ClientWrapper>
        </Providers>
      </body>
    </html>
  );
}
