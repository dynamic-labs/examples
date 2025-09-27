import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import WatermarkSvg from "@morpho-org/uikit/assets/powered-by-morpho.svg?react";
import { Button } from "@morpho-org/uikit/components/shadcn/button";
import { getChainSlug } from "@morpho-org/uikit/lib/utils";
import { Menu } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { useAccount, useChains } from "wagmi";

import Footer from "@/components/footer";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { Header } from "@/components/header";
import { MorphoMenu } from "@/components/morpho-menu";
import { RewardsButton } from "@/components/rewards-button";
import { WelcomeModal } from "@/components/welcome-modal";
import { APP_DETAILS, WORDMARK } from "@/lib/constants";

enum SubPage {
  Earn = "earn",
  Borrow = "borrow",
}

export default function Page() {
  const navigate = useNavigate();
  const { chain: selectedChainSlug } = useParams();
  const { chain: chainInWallet } = useAccount();
  const location = useLocation();
  const locationSegments = location.pathname.toLowerCase().split("/").slice(1);
  const selectedSubPage = locationSegments.at(1) === SubPage.Borrow ? SubPage.Borrow : SubPage.Earn;
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  const chains = useChains();
  const chain = useMemo(() => chains.find((chain) => chain.id === chainInWallet?.id), [chains, chainInWallet]);

  const setSelectedChainSlug = useCallback(
    (value: string) => {
      void navigate(`../${value}/${selectedSubPage}`, { replace: true, relative: "path" });
      // If selected chain is a core deployment, open main app in a new tab (we don't navigate away in
      // case they're using this because the main app is down).
      // if ([...CORE_DEPLOYMENTS].map((id) => getChainSlug(extractChain({ chains, id }))).includes(value)) {
      //   window.open(`https://app.morpho.org/${value}/${selectedSubPage}`, "_blank", "noopener,noreferrer");
      // }
    },
    [navigate, selectedSubPage],
  );

  useEffect(() => {
    if (!chain) return;

    const chainSlug = getChainSlug(chain);
    if (chainSlug === selectedChainSlug) return;

    setSelectedChainSlug(getChainSlug(chain));
  }, [chain, selectedChainSlug, setSelectedChainSlug]);

  useEffect(() => {
    document.title = `${APP_DETAILS.name} | ${selectedSubPage.charAt(0).toUpperCase()}${selectedSubPage.slice(1)}`;
  }, [selectedSubPage]);

  return (
    <div className="bg-background">
      <Header className="flex items-center justify-between px-5 py-3" chainId={chain?.id}>
        <div className="text-primary-foreground flex items-center gap-4">
          {/* Always show logo/wordmark */}
          {WORDMARK.length > 0 ? (
            <>
              <img className="max-h-[24px]" src={WORDMARK} />
              <WatermarkSvg height={24} className="text-primary-foreground/50 w-[170px] min-w-[170px]" />
            </>
          ) : (
            <MorphoMenu />
          )}

          {/* Desktop: Show navigation items */}
          <div className="hidden items-center gap-0.5 rounded-full bg-transparent p-1 md:flex">
            <Link to={SubPage.Earn} relative="path">
              <Button
                variant={selectedSubPage === SubPage.Earn ? "tertiary" : "secondaryTab"}
                size="lg"
                className="rounded-full px-4 font-light"
              >
                Earn
              </Button>
            </Link>
            <Link to={SubPage.Borrow} relative="path">
              <Button
                variant={selectedSubPage === SubPage.Borrow ? "tertiary" : "secondaryTab"}
                size="lg"
                className="rounded-full px-4 font-light"
              >
                Borrow
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile: Show hamburger menu button on right */}
          <button
            onClick={() => setIsHamburgerOpen(true)}
            className="text-primary-foreground hover:bg-primary-foreground/10 rounded p-2 md:hidden"
          >
            <Menu size={24} />
          </button>

          {/* Desktop: Show rewards button and dynamic widget */}
          <div className="hidden items-center gap-2 md:flex">
            <RewardsButton chainId={chain?.id} />
            <DynamicWidget />
          </div>
        </div>
      </Header>

      {/* Mobile: Hamburger Menu */}
      <HamburgerMenu
        isOpen={isHamburgerOpen}
        onClose={() => setIsHamburgerOpen(false)}
        selectedSubPage={selectedSubPage}
      />

      <WelcomeModal />
      <Outlet context={{ chain }} />
      <Footer />
    </div>
  );
}
