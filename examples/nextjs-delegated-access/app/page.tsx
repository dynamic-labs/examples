import DelegatedAccess from "@/components/dynamic/delegated-access";
import DynamicEmbeddedWidget from "@/components/dynamic/dynamic-embedded-widget";

export default function Main() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <DelegatedAccess />
      <DynamicEmbeddedWidget />
    </div>
  );
}
