import DynamicLogo from "./dynamic/logo";

interface FooterProps {
  bottomLinks?: {
    text: string;
    url: string;
  }[];
}

export default function Footer({
  bottomLinks = [
    {
      text: "GitHub",
      url: "https://github.com/dynamic-labs/stablecoin-cards-demo",
    },
    { text: "Docs", url: "https://docs.dynamic.xyz" },
    { text: "Dashboard", url: "https://app.dynamic.xyz" },
    { text: "Support", url: "https://www.dynamic.xyz/join-slack" },
  ],
}: FooterProps) {
  return (
    <footer className="z-51 bg-primary border-border fixed bottom-0 left-0 right-0 w-full border-t">
      <div className="w-full px-4 py-3">
        <div className="text-muted-foreground spa mx-auto flex flex-col items-center justify-between gap-2 text-xs sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-medium">integrated with</span>
            <DynamicLogo width={75} height={15} />
          </div>
          <ul className="flex gap-4">
            {bottomLinks.map((link, linkIdx) => (
              <li key={linkIdx}>
                <a
                  href={link.url}
                  className="hover:text-foreground transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
