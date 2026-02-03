"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getCountryName } from "@/lib/geo-blocking";

function GeoBlockedContent() {
  const searchParams = useSearchParams();
  const countryCode = searchParams.get("country") || "your region";
  const countryName =
    countryCode.length === 2 ? getCountryName(countryCode) : countryCode;

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative bg-linear-to-b from-[#12131a] to-[#0d0e14] border border-[#1f2937] rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Warning Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 w-24 h-24 rounded-full border-2 border-red-400/30 animate-ping" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="font-['Clash_Display',sans-serif] text-3xl md:text-4xl font-bold text-center text-white mb-4">
            Access Restricted
          </h1>

          {/* Country Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1b23] border border-[#2a2b33] rounded-full">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-sm text-gray-300">{countryName}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-center text-[rgba(221,226,246,0.6)] text-base md:text-lg leading-relaxed mb-8 max-w-lg mx-auto">
            We&apos;re sorry, but this service is not available in{" "}
            <span className="text-white font-medium">{countryName}</span> due to
            regulatory requirements and legal restrictions in your jurisdiction.
          </p>

          {/* Divider */}
          <div className="w-full h-px bg-linear-to-r from-transparent via-[#2a2b33] to-transparent mb-8" />

          {/* Additional Information */}
          <div className="space-y-4 text-sm text-[rgba(221,226,246,0.4)]">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-gray-500 mt-0.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>
                This restriction is in place to comply with applicable laws and
                regulations in certain jurisdictions, including but not limited
                to sanctions programs and local financial regulations.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-gray-500 mt-0.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>
                If you believe you are seeing this message in error, please
                ensure you are not using a VPN or proxy service that may be
                masking your true location.
              </p>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-10 pt-6 border-t border-[#1f2937] text-center">
            <p className="text-xs text-[rgba(221,226,246,0.3)]">
              Powered by{" "}
              <a
                href="https://dynamic.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors"
              >
                Dynamic
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeoBlockedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <GeoBlockedContent />
    </Suspense>
  );
}
