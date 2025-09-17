import { MarketsInterface } from "@/components/MarketsInterface";

export default function Main() {
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <MarketsInterface />
    </div>
  );
}
