import DynamicEmbeddedWidget from "@/components/dynamic/dynamic-embedded-widget";
import { PageLayout } from "@/components/ui/page-layout";

export default function Main() {
  return (
    <PageLayout maxWidth="sm">
      <DynamicEmbeddedWidget />
    </PageLayout>
  );
}
