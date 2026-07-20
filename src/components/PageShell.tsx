import { BackToHomePill } from "@/components/BackToHomePill";
import {
  PAGE_CONTENT_WIDTH,
  PAGE_FULL_WIDTH,
  PAGE_WIDE_WIDTH,
} from "@/lib/layout-widths";

type PageShellProps = {
  children: React.ReactNode;
  showBack?: boolean;
  wide?: boolean;
  /** Full-screen edge-to-edge layout (default). */
  full?: boolean;
  align?: "center" | "top";
};

export function PageShell({
  children,
  showBack = true,
  wide = false,
  full = true,
  align = "center",
}: PageShellProps) {
  if (full) {
    return (
      <main className="flex h-full min-h-0 flex-col overflow-hidden">
        {showBack && (
          <div className="shrink-0 border-b border-border/70 bg-card/90 px-4 py-2 backdrop-blur-sm sm:px-6">
            <BackToHomePill />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto page-scroll">
          {children}
        </div>
      </main>
    );
  }

  const widthClass = wide ? PAGE_WIDE_WIDTH : PAGE_CONTENT_WIDTH;

  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto page-scroll">
      {showBack && (
        <div className={`shrink-0 border-b border-border/70 px-4 py-2 sm:px-6 ${widthClass}`}>
          <BackToHomePill />
        </div>
      )}

      <div
        className={`flex w-full flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6 ${
          align === "center" ? "justify-center" : "justify-start pt-2 sm:pt-3"
        } ${widthClass}`}
      >
        {children}
      </div>
    </main>
  );
}
