import { Globe, Wallet2, CreditCardIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "@/components/credit-cards";
import DynamicLogo from "@/components/dynamic/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GetStartedPromo() {
  return (
    <Card className="max-w-sm mx-auto">
      <CardContent className="space-y-6">
        <CreditCard
          type="gray-dark"
          cardType="visa"
          company={
            <DynamicLogo width={140} height={30} className="text-white" />
          }
          cardNumber=""
          cardCvv=""
          cardExpiration=""
        />
        {/* Main Content */}
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold">Stablecoin Cards</h2>
          <p className="text-sm text-muted-foreground">
            Instantly generate virtual debit cards for your users and businesses
            to spend globally wherever Visa is accepted.
          </p>
        </div>
        {/* Features */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
              <Globe className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">Multi-chain</h3>
              <p className="text-sm text-muted-foreground">
                Works across chains - all in one place.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
              <Wallet2 className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">Gasless</h3>
              <p className="text-sm text-muted-foreground">
                A seamless, gasless experience reducing cost and complexity for
                users.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button className="w-full h-12 text-base" asChild>
            <Link href="/apply">
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Get Started
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
