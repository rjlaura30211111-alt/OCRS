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
  /** Full-view layout: edge-to-edge card on mobile (default). */
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
    const widthClass = wide ? PAGE_WIDE_WIDTH : PAGE_FULL_WIDTH;

    return (
      <main className="flex h-full min-h-0 flex-col overflow-y-auto page-scroll">
        <div className={`mx-auto flex min-h-full w-full flex-col ${widthClass}`}>
          {showBack && (
            <div className="shrink-0 px-3 pt-2 sm:px-0 sm:pt-3">
              <BackToHomePill />
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </main>
    );
  }

  const widthClass = wide ? PAGE_WIDE_WIDTH : PAGE_CONTENT_WIDTH;

  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto page-scroll">
      {showBack && (
        <div
          className={`mx-auto shrink-0 px-4 pt-3 sm:px-6 sm:pt-4 ${widthClass}`}
        >
          <BackToHomePill />
        </div>
      )}

      <div
        className={`flex w-full flex-1 flex-col items-center px-4 pb-4 sm:px-6 sm:pb-6 ${
          align === "center" ? "justify-center" : "justify-start pt-2 sm:pt-3"
        }`}
      >
        <div className={widthClass}>{children}</div>
      </div>
    </main>
  );
}
