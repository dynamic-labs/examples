import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

interface ImageWithFallbackProps extends Omit<ImageProps, "src" | "alt"> {
  src?: string | null;
  alt?: string;
}

export function ImageWithFallback({
  src,
  alt = "",
  className,
  style,
  width,
  height,
  fill,
  sizes,
  ...rest
}: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src || ERROR_IMG_SRC);

  const handleError = () => {
    if (!didError) {
      setDidError(true);
      setImgSrc(ERROR_IMG_SRC);
    }
  };

  // Convert string width/height to numbers if needed
  const numWidth = typeof width === "string" ? parseInt(width, 10) : width;
  const numHeight = typeof height === "string" ? parseInt(height, 10) : height;

  // Determine if we should use fill mode (if className suggests absolute positioning or no explicit dimensions)
  const shouldUseFill =
    fill || (!numWidth && !numHeight && className?.includes("absolute"));

  // If no src provided or error occurred, show error image
  if (!src || didError) {
    const errorImageProps = {
      src: ERROR_IMG_SRC,
      alt: "Error loading image",
      className,
      style,
      unoptimized: true, // Data URLs need unoptimized
      ...rest,
    };

    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${
          className ?? ""
        }`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          {shouldUseFill ? (
            <Image {...errorImageProps} alt={errorImageProps.alt} fill sizes={sizes || "100vw"} />
          ) : (
            <Image
              {...errorImageProps}
              alt={errorImageProps.alt}
              width={numWidth || 88}
              height={numHeight || 88}
            />
          )}
        </div>
      </div>
    );
  }

  const imageProps = {
    src: imgSrc,
    alt,
    className,
    style,
    unoptimized: imgSrc.startsWith("data:") || imgSrc.startsWith("blob:"),
    ...rest,
  } as ImageProps;

  if (shouldUseFill) {
    return (
      <Image
        {...imageProps}
        alt={imageProps.alt}
        fill
        sizes={sizes || "100vw"}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      {...imageProps}
      alt={imageProps.alt}
      width={numWidth}
      height={numHeight}
      onError={handleError}
    />
  );
}
