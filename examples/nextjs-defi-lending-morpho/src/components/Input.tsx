import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`px-5 py-5 rounded-2xl border-2 border-gray-600/30 text-lg mb-1 text-white bg-gradient-to-br from-gray-800/50 to-gray-900/50 outline-none shadow-lg w-full font-inherit transition-all duration-300 ease-in-out backdrop-blur-md focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/20 focus:-translate-y-1 placeholder:text-gray-100 placeholder:opacity-60 ${className}`}
      {...props}
    />
  );
}
