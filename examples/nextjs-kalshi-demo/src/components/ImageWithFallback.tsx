"use client";

import Image from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className,
  sizes,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`bg-linear-to-br from-[#8b5cf6]/30 to-[#06b6d4]/30 flex items-center justify-center ${className}`}
      >
        <span className="text-lg">📊</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill
      sizes={sizes}
      onError={() => setError(true)}
    />
  );
}

