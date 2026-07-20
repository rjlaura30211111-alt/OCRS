import { BackToHomePill } from "@/components/BackToHomePill";
import { PAGE_CONTENT_WIDTH, PAGE_WIDE_WIDTH } from "@/lib/layout-widths";

type PageShellProps = {
  children: React.ReactNode;
  showBack?: boolean;
  wide?: boolean;
  align?: "center" | "top";
};

export function PageShell({
  children,
  showBack = true,
  wide = false,
  align = "center",
}: PageShellProps) {
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
