import { BackToHomePill } from "@/components/BackToHomePill";

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
  return (
    <main className="flex h-full min-h-0 flex-col overflow-y-auto page-scroll">
      {showBack && (
        <div
          className={`mx-auto w-full shrink-0 px-4 pt-3 sm:px-6 sm:pt-4 ${
            wide ? "max-w-6xl" : "max-w-md"
          }`}
        >
          <BackToHomePill />
        </div>
      )}

      <div
        className={`flex w-full flex-1 flex-col items-center px-4 pb-4 sm:px-6 sm:pb-6 ${
          align === "center" ? "justify-center" : "justify-start pt-2 sm:pt-3"
        }`}
      >
        <div className={`w-full ${wide ? "max-w-6xl" : "max-w-md"}`}>{children}</div>
      </div>
    </main>
  );
}
