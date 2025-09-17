"use client";

import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/ui/page-layout";
import GetStartedPromo from "../components/get-started-promo";

export default function Main() {
  const router = useRouter();

  return (
    <PageLayout>
      <GetStartedPromo />
    </PageLayout>
  );
}
