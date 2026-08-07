"use client";

import { BatchedPodsDeposit } from "@/components/BatchedPodsDeposit";
import Providers from "@/lib/providers";

export default function BatchedPodsDepositShell() {
  return (
    <Providers>
      <BatchedPodsDeposit />
    </Providers>
  );
}
