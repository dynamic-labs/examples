"use client";

import dynamic from "next/dynamic";

const BatchedPodsDepositShell = dynamic(
  () => import("@/components/BatchedPodsDepositShell"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#f7f8fb] p-6 text-sm text-slate-600">
        Loading wallet client
      </div>
    ),
  },
);

export function ClientOnlyBatchedPodsDeposit() {
  return <BatchedPodsDepositShell />;
}
