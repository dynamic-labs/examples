"use client";

import PaymentMethods from "@/components/PaymentMethods";
import StablePayReceiverInvite from "@/components/StablePayReceiverInvite";
import SetupProgress from "@/components/SetupProgress";
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

export default function PaymentMethodsPage() {
  const { isConnected } = useAccount();
  const { receiverId, isKYCComplete, isLoading: kycLoading } = useKYCStatus();

  const {
    hasPaymentMethods,
    hasBankAccounts,
    hasBlockchainWallets,
    checkPaymentMethods,
  } = usePaymentMethods(receiverId);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>
                  Connect your wallet to manage payment methods and complete
                  KYC.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click the &quot;Connect Wallet&quot; button in the top
                  navigation to get started.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Payment Methods & KYC</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete your KYC verification and manage your payment methods for
            seamless conversions
          </p>
        </div>

        <div className="space-y-8">
          <SetupProgress
            isKYCComplete={isKYCComplete}
            hasPaymentMethods={hasPaymentMethods}
          />

          {kycLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">
                Checking KYC status...
              </p>
            </div>
          ) : !isKYCComplete ? (
            <div className="max-w-2xl mx-auto">
              <StablePayReceiverInvite />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Payment Methods</h2>
                <p className="text-muted-foreground">
                  Add bank accounts for receiving fiat payments (offramp) or
                  blockchain wallets for receiving stablecoins (onramp)
                </p>
              </div>

              <PaymentMethods onUpdate={checkPaymentMethods} />

              {!hasPaymentMethods && (
                <div className="text-center py-8">
                  <Card className="max-w-md mx-auto">
                    <CardHeader>
                      <CardTitle>Add Payment Methods</CardTitle>
                      <CardDescription>
                        You need to add at least one payment method to start
                        converting:
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-left mb-6 space-y-2">
                        <li>
                          • A bank account for receiving fiat payments (enables
                          offramping), OR
                        </li>
                        <li>
                          • A blockchain wallet for receiving stablecoins
                          (enables onramping)
                        </li>
                      </ul>
                      <p className="text-sm text-muted-foreground">
                        Use the Payment Methods section above to add at least
                        one payment method.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {hasPaymentMethods && (
                <div className="text-center py-6">
                  <Card className="max-w-md mx-auto">
                    <CardHeader>
                      <CardTitle>Setup Complete!</CardTitle>
                      <CardDescription>
                        Your payment methods are configured and ready to use.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
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
                      <p className="text-muted-foreground mt-4">
                        You can now start converting currencies on the
                        Conversions page.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
