'use client';

import { useState, useEffect } from 'react';
import { useUser } from "@dynamic-labs-sdk/react-hooks";
import { getAuthToken } from "@dynamic-labs-sdk/client";
import Image from 'next/image';
import DynamicButton from '../components/dynamic-button';
import { dynamicClient } from '../lib/dynamic';

export default function ClientWrapper({ children }) {
  const user = useUser();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (user) {
        setIsVerifying(true);
        try {
          const token = await getAuthToken(dynamicClient);
          const response = await fetch('/api/verify-jwt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to verify token');
          }
          console.log('Token verified:', data.decoded);
        } catch (error) {
          console.error('Verification error:', error);
          setVerificationError(error.message);
        } finally {
          setIsVerifying(false);
        }
      }
    };

    verifyToken();
  }, [user]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%5BWordmark-primary%5D%20(2)-jSotf5LNO2iZLyHlkThBAGhwR2fVCb.svg"
              alt="Dynamic Logo"
              width={150}
              height={24}
              className="h-6 w-auto"
            />
            <DynamicButton />
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {verificationError && (
                <p className="text-red-500 mb-4">Error: {verificationError}</p>
              )}
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                Dynamic&apos;s Sidebar Widget
              </h1>
              <p className="mt-5 text-xl text-gray-500">
                Experience the future of Web3 interactions with Dynamic&apos;s sleek Sidebar Widget. Inspired by industry leaders like Uniswap, Phantom, and Zerion, we&apos;ve created a compact, comprehensive wallet control panel that seamlessly integrates with your website.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <DynamicButton />
                <a
                  href="https://www.dynamic.xyz/blog/sidebar-widgets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                >
                  Learn More
                </a>
                <a
                  href="https://github.com/dynamic-labs/sidebar-example"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </main>

        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Why Choose Our Sidebar Widget?</h2>
            <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Enhanced User Experience</h3>
                <p className="mt-2 text-base text-gray-500">
                  Our sidebar widget offers quick access to essential wallet functionalities without disrupting your main content. It&apos;s designed for smooth, intuitive interactions, making Web3 transactions easier than ever.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Easy Integration</h3>
                <p className="mt-2 text-base text-gray-500">
                  Set up your sidebar widget in just a minute! With a few lines of custom CSS, you can transform your wallet interface into a modern, animated sidebar that perfectly aligns with your website&apos;s design.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      {children}
    </>
  );
}
