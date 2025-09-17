"use client";

import { useMemo, useState } from "react";
import { cn, sortCn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCardLogo,
  type CardType,
  type CardColorVariant,
} from "@/components/credit-cards/icons";

const styles = sortCn({
  // Normal
  transparent: {
    root: "bg-black/10 bg-linear-to-br from-white/30 to-transparent backdrop-blur-[6px] before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-white",
    footerText: "text-white",
    cardTypeRoot: "bg-white/10",
  },
  "transparent-gradient": {
    root: "bg-black/10 bg-linear-to-br from-white/30 to-transparent backdrop-blur-[6px] before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-white",
    footerText: "text-white",
    cardTypeRoot: "bg-white/10",
  },
  "brand-dark": {
    root: "bg-linear-to-tr from-brand-900 to-brand-700 before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-white",
    footerText: "text-white",
    cardTypeRoot: "bg-white/10",
  },
  "brand-light": {
    root: "bg-brand-100 before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-black/10 before:ring-inset",
    company: "text-gray-700",
    footerText: "text-gray-700",
    cardTypeRoot: "bg-white",
  },
  "gray-dark": {
    root: "bg-linear-to-tr from-gray-900 to-gray-700 before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-white",
    footerText: "text-white",
    cardTypeRoot: "bg-white",
  },
  "gray-light": {
    root: "bg-gray-100 before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-black/10 before:ring-inset",
    company: "text-gray-700",
    footerText: "text-gray-700",
    cardTypeRoot: "bg-white",
  },

  // Strip
  "transparent-strip": {
    root: "bg-linear-to-br from-white/30 to-transparent backdrop-blur-[6px] before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-white",
    footerText: "text-white",
    cardTypeRoot: "bg-white/10",
  },
  "gray-strip": {
    root: "bg-gray-100 before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-gray-700",
    footerText: "text-white",
    cardTypeRoot: "bg-white/10",
  },
  "gradient-strip": {
    root: "bg-linear-to-b from-[#A5C0EE] to-[#FBC5EC] before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-white",
    footerText: "text-white",
    cardTypeRoot: "bg-white/10",
  },
  "salmon-strip": {
    root: "bg-[#F4D9D0] before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-gray-700",
    footerText: "text-white",
    cardTypeRoot: "bg-white/10",
  },

  // Vertical strip
  "gray-strip-vertical": {
    root: "bg-linear-to-br from-white/30 to-transparent before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-white",
    footerText: "text-white",
    cardTypeRoot: "bg-white/10",
  },
  "gradient-strip-vertical": {
    root: "bg-linear-to-b from-[#FBC2EB] to-[#A18CD1] before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-white",
    footerText: "text-white",
    cardTypeRoot: "bg-white/10",
  },
  "salmon-strip-vertical": {
    root: "bg-[#F4D9D0] before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:mask-linear-135 before:mask-linear-to-white/20 before:ring-1 before:ring-white/30 before:ring-inset",
    company: "text-white",
    footerText: "text-white",
    cardTypeRoot: "bg-white/10",
  },
});

const _NORMAL_TYPES = [
  "transparent",
  "transparent-gradient",
  "brand-dark",
  "brand-light",
  "gray-dark",
  "gray-light",
] as const;
const STRIP_TYPES = [
  "transparent-strip",
  "gray-strip",
  "gradient-strip",
  "salmon-strip",
] as const;
const VERTICAL_STRIP_TYPES = [
  "gray-strip-vertical",
  "gradient-strip-vertical",
  "salmon-strip-vertical",
] as const;

const CARD_WITH_COLOR_LOGO = [
  "brand-dark",
  "brand-light",
  "gray-dark",
  "gray-light",
] as const;

type CreditCardType =
  | (typeof _NORMAL_TYPES)[number]
  | (typeof STRIP_TYPES)[number]
  | (typeof VERTICAL_STRIP_TYPES)[number];

interface CreditCardProps {
  company?: string | React.ReactNode;
  cardNumber?: string | React.ReactNode;
  cardCvv?: string | React.ReactNode;
  cardExpiration?: string | React.ReactNode;
  type?: CreditCardType;
  cardType?: CardType;
  className?: string;
  width?: number;
  showCopyIcons?: boolean;
  onCopyCardNumber?: () => void;
  onCopyCvv?: () => void;
  copiedField?: string | null;
}

const calculateScale = (
  desiredWidth: number,
  originalWidth: number,
  originalHeight: number
) => {
  // Calculate the scale factor
  const scale = desiredWidth / originalWidth;

  // Calculate the new dimensions
  const scaledWidth = originalWidth * scale;
  const scaledHeight = originalHeight * scale;

  return {
    scale: scale.toFixed(4),
    scaledWidth: scaledWidth.toFixed(2),
    scaledHeight: scaledHeight.toFixed(2),
  };
};

const CopyButton = ({
  onCopy,
  copied,
}: {
  onCopy: () => void;
  copied: boolean;
}) => {
  return (
    <Button
      variant="ghost"
      className="!h-3 !w-3 min-w-0 text-white/70 hover:text-white"
      onClick={onCopy}
    >
      {copied ? (
        <Check className="!h-3 !w-3" />
      ) : (
        <Copy className="!h-3 !w-3" />
      )}
    </Button>
  );
};

export const CreditCard = ({
  company = "Untitled.",
  cardNumber = "1234 1234 1234 1234",
  cardCvv = "123",
  cardExpiration = "06/28",
  type = "brand-dark",
  cardType = "mastercard",
  className,
  width,
  showCopyIcons = false,
  onCopyCardNumber,
  onCopyCvv,
  copiedField,
}: CreditCardProps) => {
  const originalWidth = 316;
  const originalHeight = 190;

  const { scale, scaledWidth, scaledHeight } = useMemo(() => {
    if (!width)
      return {
        scale: 1,
        scaledWidth: originalWidth,
        scaledHeight: originalHeight,
      };

    return calculateScale(width, originalWidth, originalHeight);
  }, [width]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const getTransformStyle = () => {
    if (!isHovered) return {};

    const maxRotation = 8;
    const rotateY = (mousePosition.x / 200) * maxRotation;
    const rotateX = -(mousePosition.y / 200) * maxRotation;

    return {
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      boxShadow: isHovered
        ? "0 8px 20px -8px rgba(0, 0, 0, 0.15), 0 0 15px rgba(255, 255, 255, 0.05)"
        : "",
    };
  };

  return (
    <div
      className={cn("w-full aspect-[316/190] relative", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl p-4 transition-all duration-200 ease-out transform-gpu will-change-transform",
          styles[type].root
        )}
        style={getTransformStyle()}
      >
        {/* Horizontal strip */}
        {STRIP_TYPES.includes(type as (typeof STRIP_TYPES)[number]) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/2 bg-gray-800"></div>
        )}
        {/* Vertical stripe */}
        {VERTICAL_STRIP_TYPES.includes(
          type as (typeof VERTICAL_STRIP_TYPES)[number]
        ) && (
          <div className="pointer-events-none absolute inset-y-0 right-22 left-0 z-0 bg-gray-800"></div>
        )}
        {/* Gradient diffusor */}
        {type === "transparent-gradient" && (
          <div className="absolute -top-4 -left-4 grid grid-cols-2 blur-3xl">
            <div className="size-20 rounded-tl-full bg-pink-500 opacity-30 mix-blend-normal" />
            <div className="size-20 rounded-tr-full bg-orange-500 opacity-50 mix-blend-normal" />
            <div className="size-20 rounded-bl-full bg-blue-500 opacity-30 mix-blend-normal" />
            <div className="size-20 rounded-br-full bg-success-500 opacity-30 mix-blend-normal" />
          </div>
        )}

        <div className="relative flex items-start justify-between px-1 pt-1">
          <div
            className={cn(
              "text-sm sm:text-base md:text-lg font-semibold leading-tight",
              styles[type].company
            )}
          >
            {company}
          </div>
        </div>

        <div className="relative flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <div
              className={cn(
                "text-sm sm:text-base md:text-md font-semibold tracking-wider tabular-nums flex items-center gap-1 leading-tight",
                styles[type].footerText
              )}
            >
              {cardNumber}
              {showCopyIcons && onCopyCardNumber && (
                <CopyButton
                  onCopy={onCopyCardNumber}
                  copied={copiedField === "cardNumber"}
                />
              )}

              {/* This is just a placeholder to always keep the space for card number even if there's no card number yet. */}
              <span className="pointer-events-none invisible inline-block w-0 max-w-0 opacity-0">
                1
              </span>
            </div>
            <div className="flex items-end gap-3">
              {cardCvv && (
                <div
                  style={{
                    wordBreak: "break-word",
                  }}
                  className={cn(
                    "text-xs sm:text-sm font-semibold tracking-wider uppercase gap-1 flex items-center leading-tight",
                    styles[type].footerText
                  )}
                >
                  <span className="text-muted-foreground">CVV</span>
                  <span>{cardCvv}</span>
                  {showCopyIcons && onCopyCvv && (
                    <CopyButton
                      onCopy={onCopyCvv}
                      copied={copiedField === "cvv"}
                    />
                  )}
                </div>
              )}
              {cardExpiration && (
                <div
                  className={cn(
                    "text-right text-xs sm:text-sm font-semibold tracking-wider tabular-nums gap-1 flex items-center leading-tight",
                    styles[type].footerText
                  )}
                >
                  <span className="text-muted-foreground">EXP</span>
                  <span>{cardExpiration}</span>
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "flex h-6 w-10 sm:h-8 sm:w-12 shrink-0 items-center justify-center rounded",
              styles[type].cardTypeRoot
            )}
          >
            {(() => {
              const colorVariant: CardColorVariant =
                CARD_WITH_COLOR_LOGO.includes(
                  type as (typeof CARD_WITH_COLOR_LOGO)[number]
                )
                  ? "color"
                  : "white";
              const CardLogoComponent = getCardLogo(cardType, colorVariant);
              return <CardLogoComponent />;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
