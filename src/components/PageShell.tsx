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
    <main
      className={`flex h-full min-h-0 flex-col items-center overflow-y-auto page-scroll p-4 sm:p-6 ${
        align === "center" ? "justify-center" : "justify-start pt-4 sm:pt-6"
      }`}
    >
      {showBack && (
        <div className={`mb-4 w-full ${wide ? "max-w-6xl" : "max-w-md"}`}>
          <BackToHomePill />
        </div>
      )}
      <div className={`w-full ${wide ? "max-w-6xl" : "max-w-md"}`}>{children}</div>
    </main>
  );
}
