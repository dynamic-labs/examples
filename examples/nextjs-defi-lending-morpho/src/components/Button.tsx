import React from "react";

interface ButtonProps {
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "approve" | "claim";
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Button({
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  children,
  onClick,
  className = "",
}: ButtonProps) {
  const getVariantClasses = () => {
    const baseClasses =
      "border-none rounded-2xl py-4.5 font-bold text-lg cursor-pointer mb-1 shadow-lg transition-all duration-300 ease-in-out w-full relative overflow-hidden disabled:cursor-not-allowed disabled:outline-none disabled:opacity-60 disabled:transform-none";

    switch (variant) {
      case "primary":
        return `${baseClasses} bg-gradient-to-br from-blue-600 to-blue-500 text-white outline-2 outline-blue-400 hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-blue-500 hover:not-disabled:to-blue-600 hover:not-disabled:-translate-y-1 hover:not-disabled:shadow-xl hover:not-disabled:shadow-blue-600/50`;
      case "secondary":
        return `${baseClasses} bg-gradient-to-br from-gray-700 to-gray-600 text-gray-400 hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-gray-600 hover:not-disabled:to-gray-700 hover:not-disabled:-translate-y-1`;
      case "approve":
        return `${baseClasses} bg-gradient-to-br from-yellow-500 to-yellow-400 text-gray-800 font-bold text-lg py-4 outline-2 outline-yellow-700 hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-yellow-400 hover:not-disabled:to-yellow-500 hover:not-disabled:-translate-y-1 hover:not-disabled:shadow-xl hover:not-disabled:shadow-yellow-500/50`;
      case "claim":
        return `${baseClasses} bg-gradient-to-br from-green-500 to-green-400 text-white font-bold text-base py-4 mt-3 outline-2 outline-green-700 hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-green-400 hover:not-disabled:to-green-500 hover:not-disabled:-translate-y-1 hover:not-disabled:shadow-xl hover:not-disabled:shadow-green-500/50`;
      default:
        return `${baseClasses} bg-gradient-to-br from-blue-600 to-blue-500 text-white outline-2 outline-blue-400 hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-blue-500 hover:not-disabled:to-blue-600 hover:not-disabled:-translate-y-1 hover:not-disabled:shadow-xl hover:not-disabled:shadow-blue-600/50`;
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${getVariantClasses()} ${className} before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-left before:duration-500 before:ease-in-out hover:before:left-full`}
    >
      {loading ? `${children}...` : children}
    </button>
  );
}
