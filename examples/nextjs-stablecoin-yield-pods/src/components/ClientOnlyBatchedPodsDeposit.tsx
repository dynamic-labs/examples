"use client";

import dynamic from "next/dynamic";

const BatchedPodsDeposit = dynamic(
  () =>
    import("@/components/BatchedPodsDeposit").then((m) => ({
      default: m.BatchedPodsDeposit,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 text-sm text-[#606060]">Loading wallet client</div>
    ),
  },
);

export function ClientOnlyBatchedPodsDeposit() {
  return <BatchedPodsDeposit />;
}
