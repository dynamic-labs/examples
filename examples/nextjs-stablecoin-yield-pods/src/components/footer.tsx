import DynamicLogo from "./dynamic/logo";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-[#DADADA] bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-[#606060] sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-medium">powered by</span>
            <DynamicLogo width={75} height={15} />
          </div>
          <ul className="flex gap-4">
            <li>
              <a
                href="https://github.com/dynamic-labs-oss/examples/tree/main/examples/nextjs-stablecoin-yield-pods"
                className="transition-colors duration-200 hover:text-[#030303]"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href="https://docs.dynamic.xyz"
                className="transition-colors duration-200 hover:text-[#030303]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docs
              </a>
            </li>
            <li>
              <a
                href="https://app.dynamic.xyz"
                className="transition-colors duration-200 hover:text-[#030303]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="https://www.dynamic.xyz/join-slack"
                className="transition-colors duration-200 hover:text-[#030303]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Support
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
