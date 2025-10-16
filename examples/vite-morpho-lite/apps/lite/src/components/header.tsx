import { useKeyedState } from "@morpho-org/uikit/hooks/use-keyed-state";
import { cn } from "@morpho-org/uikit/lib/utils";
import { XIcon } from "lucide-react";
import React from "react";

import { BANNERS, DEMO_BANNER } from "@/lib/constants";

function Banner(chainId: number | undefined) {
  const [shouldShowChainBanner, setShouldShowChainBanner] = useKeyedState(true, chainId, { persist: true });
  const [shouldShowDemoBanner, setShouldShowDemoBanner] = useKeyedState(true, "demo", { persist: true });

  const banners = [];

  // Always show demo banner first (if not dismissed)
  if (shouldShowDemoBanner) {
    banners.push(
      <aside
        key="demo-banner"
        className={cn(
          "pointer-events-auto flex h-10 min-h-min items-center px-1 text-sm font-light italic",
          DEMO_BANNER.color,
        )}
      >
        {DEMO_BANNER.text}
        <XIcon className="hover:bg-accent mx-2 h-6 w-6 rounded-sm p-1" onClick={() => setShouldShowDemoBanner(false)} />
      </aside>,
    );
  }

  // Show chain-specific banner (if not dismissed and exists)
  if (chainId !== undefined && BANNERS[chainId] && shouldShowChainBanner) {
    const banner = BANNERS[chainId];
    banners.push(
      <aside
        key="chain-banner"
        className={cn(
          "pointer-events-auto flex h-10 min-h-min items-center px-1 text-sm font-light italic",
          banner.color,
        )}
      >
        {banner.text}
        <XIcon
          className="hover:bg-accent mx-2 h-6 w-6 rounded-sm p-1"
          onClick={() => setShouldShowChainBanner(false)}
        />
      </aside>,
    );
  }

  if (banners.length === 0) {
    return { placeholder: undefined, banner: undefined };
  }

  return {
    placeholder: <div className={cn("h-10 min-h-min", banners.length > 1 && "h-20")}></div>,
    banner: banners,
  };
}

export function Header({ className, children, chainId, ...props }: React.ComponentProps<"div"> & { chainId?: number }) {
  const { placeholder, banner } = Banner(chainId);

  return (
    <>
      {placeholder}
      <div className="pointer-events-none fixed top-0 z-50 flex h-screen w-screen flex-col">
        {banner}
        <header className={cn("bg-primary pointer-events-auto h-16", className)} {...props}>
          {children}
        </header>

        <aside className="flex shrink grow basis-auto flex-col">
          <div className="apply-rounding-blur -z-10 m-[-2px] mb-[55px] mt-[-12px] flex grow sm:mb-[29px]">
            <svg className="hidden h-0 w-0">
              <defs>
                <filter id="rounding_blur">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -14"
                    result="rounding_blur"
                  />
                  <feComposite in="SourceGraphic" in2="rounding_blur" operator="atop" />
                </filter>
              </defs>
            </svg>
            <div className="is-frame bg-primary w-full"></div>
          </div>
          {/* <div className="mt-[-10px] h-[12px] bg-slate-100 dark:bg-slate-700"></div> */}
        </aside>
      </div>
    </>
  );
}
