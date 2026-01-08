import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FontWeight = "medium" | "semibold" | "bold";

type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";

interface TypographyProps {
  children: ReactNode;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div" | "label";
  size?: TextSize;
  weight?: FontWeight;
  color?: "primary" | "secondary" | "muted" | "accent" | "custom";
  customColor?: string;
  htmlFor?: string;
}

const sizeClasses: Record<TextSize, string> = {
  xs: "text-[12px]",
  sm: "text-[14px]",
  base: "text-[16px]",
  lg: "text-[18px]",
  xl: "text-[20px]",
  "2xl": "text-[22px]",
};

const colorClasses: Record<
  Exclude<TypographyProps["color"], "custom" | undefined>,
  string
> = {
  primary: "text-[#dde2f6]",
  secondary: "text-[rgba(221,226,246,0.6)]",
  muted: "text-[rgba(221,226,246,0.4)]",
  accent: "text-[#72D0ED]",
};

export function Typography({
  children,
  className,
  as: Component = "span",
  size = "base",
  weight = "semibold",
  color = "primary",
  customColor,
  htmlFor,
  ...props
}: TypographyProps) {
  const fontFamilyClass =
    weight === "semibold"
      ? "font-['SF_Pro_Rounded:Semibold',sans-serif]"
      : weight === "bold"
      ? "font-['SF_Pro_Rounded:Bold',sans-serif]"
      : "font-['SF_Pro_Rounded:Medium',sans-serif]";

  return (
    <Component
      className={cn(
        fontFamilyClass,
        sizeClasses[size],
        color === "custom" ? customColor : colorClasses[color],
        className
      )}
      htmlFor={htmlFor}
      {...props}
    >
      {children}
    </Component>
  );
}

// Convenience components for common patterns
export function Label({
  children,
  className,
  as: Component = "span",
  htmlFor,
}: {
  children: ReactNode;
  className?: string;
  as?: "span" | "label";
  htmlFor?: string;
}) {
  if (Component === "label") {
    return (
      <Typography
        as="label"
        size="sm"
        color="secondary"
        className={className}
        htmlFor={htmlFor}
      >
        {children}
      </Typography>
    );
  }

  return (
    <Typography size="sm" color="secondary" className={className}>
      {children}
    </Typography>
  );
}

export function Value({
  children,
  className,
  size = "lg",
}: {
  children: ReactNode;
  className?: string;
  size?: TextSize;
}) {
  return (
    <Typography size={size} color="primary" className={className}>
      {children}
    </Typography>
  );
}

export function AccentText({
  children,
  className,
  size = "lg",
}: {
  children: ReactNode;
  className?: string;
  size?: TextSize;
}) {
  return (
    <Typography size={size} color="accent" className={className}>
      {children}
    </Typography>
  );
}

export function Heading({
  children,
  className,
  level = 2,
}: {
  children: ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4;
}) {
  const sizeMap: Record<typeof level, TextSize> = {
    1: "2xl",
    2: "xl",
    3: "lg",
    4: "base",
  };

  return (
    <Typography
      as={`h${level}` as const}
      size={sizeMap[level]}
      weight="semibold"
      color="primary"
      className={className}
    >
      {children}
    </Typography>
  );
}

export function BodyText({
  children,
  className,
  muted = false,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <Typography
      as="p"
      size="base"
      color={muted ? "secondary" : "primary"}
      className={className}
    >
      {children}
    </Typography>
  );
}
