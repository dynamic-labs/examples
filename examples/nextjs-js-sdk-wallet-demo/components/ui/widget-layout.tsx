import { PoweredByFooter } from "@/components/powered-by-footer";

interface WidgetLayoutProps {
  children: React.ReactNode;
}

/**
 * Centered page layout for the widget
 * Server component - renders immediately without JavaScript
 */
export function WidgetLayout({ children }: WidgetLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4 bg-(--widget-page-bg)">
      <div className="w-full max-w-[400px]">{children}</div>
      <PoweredByFooter />
    </div>
  );
}
