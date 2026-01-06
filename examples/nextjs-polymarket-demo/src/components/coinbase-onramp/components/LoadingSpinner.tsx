import { Loader2 } from "lucide-react";
import { BodyText } from "@/components/ui/Typography";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeClasses = {
  sm: "h-[16px] w-[16px]",
  md: "h-[24px] w-[24px]",
  lg: "h-[32px] w-[32px]",
};

export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-[8px]">
      <Loader2
        className={`animate-spin ${sizeClasses[size]} text-[#72D0ED]`}
        aria-label="Loading"
      />
      {text && <BodyText>{text}</BodyText>}
    </div>
  );
}
