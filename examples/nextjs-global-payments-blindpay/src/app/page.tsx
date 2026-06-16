"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useKYCStatus } from "@/lib/hooks/useKYCStatus";
import { usePaymentMethods } from "@/lib/hooks/usePaymentMethods";
import { useAccount } from "wagmi";
import { ArrowRight, CreditCard, History, TrendingUp } from "lucide-react";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { receiverId, isKYCComplete, isLoading: kycLoading } = useKYCStatus();

  const { hasPaymentMethods, hasBankAccounts, hasBlockchainWallets } =
    usePaymentMethods(receiverId);

  const features = [
    {
      title: "Currency Conversions",
      description: "Convert between stablecoins and fiat currencies seamlessly",
      href: "/conversions",
      icon: TrendingUp,
      available: isConnected && isKYCComplete && hasPaymentMethods,
    },
    {
      title: "Payment Methods & KYC",
      description: "Manage your payment methods and complete KYC verification",
      href: "/payment-methods",
      icon: CreditCard,
      available: isConnected,
    },
    {
      title: "Transaction History",
      description: "View all your conversion transactions and their status",
      href: "/transactions",
      icon: History,
      available: isConnected,
    },
  ];

  const getSetupStatus = () => {
    if (!isConnected) return "disconnected";
    if (kycLoading) return "loading";
    if (!isKYCComplete) return "kyc_required";
    if (!hasPaymentMethods) return "payment_methods_required";
    return "complete";
  };

  const setupStatus = getSetupStatus();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-6">
            Stablecoin to Fiat Converter
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Convert between stablecoins and fiat currencies seamlessly with your
            Dynamic wallet. Complete KYC verification, manage payment methods,
            and start converting in minutes.
          </p>

          {!isConnected && (
            <Card className="max-w-md mx-auto mb-8">
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                  Connect your wallet to access all features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click the &quot;Connect Wallet&quot; button in the top
                  navigation to get started.
                </p>
              </CardContent>
            </Card>
          )}

          {isConnected && setupStatus !== "complete" && (
            <Card className="max-w-lg mx-auto mb-8">
              <CardHeader>
                <CardTitle>Setup Required</CardTitle>
                <CardDescription>
                  {setupStatus === "loading" && "Checking your setup status..."}
                  {setupStatus === "kyc_required" &&
                    "Complete KYC verification to continue"}
                  {setupStatus === "payment_methods_required" &&
                    "Add payment methods to start converting"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/payment-methods">
                    Complete Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.href} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    className="w-full"
                    disabled={!feature.available}
                  >
                    <Link href={feature.href}>
                      {feature.available ? "Access" : "Setup Required"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
                {!feature.available && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
                )}
              </Card>
            );
          })}
        </div>

        {isConnected && setupStatus === "complete" && (
          <div className="text-center mt-12">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400">
                  Setup Complete!
                </CardTitle>
                <CardDescription>
                  You&apos;re all set to start converting currencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  {hasBankAccounts && (
                    <p className="text-green-600 dark:text-green-400">
                      ✓ Bank accounts configured (offramp enabled)
                    </p>
                  )}
                  {hasBlockchainWallets && (
                    <p className="text-green-600 dark:text-green-400">
                      ✓ Blockchain wallets configured (onramp enabled)
                    </p>
                  )}
                </div>
                <Button asChild className="w-full">
                  <Link href="/conversions">
                    Start Converting
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
