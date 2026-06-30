import Link from "next/link";

type PageShellProps = {
  children: React.ReactNode;
  showBack?: boolean;
  wide?: boolean;
};

export function PageShell({ children, showBack = true, wide = false }: PageShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      {showBack && (
        <div className={`mb-4 w-full ${wide ? "max-w-6xl" : "max-w-md"}`}>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted transition hover:text-primary"
          >
            ← Back to Home
          </Link>
        </div>
      )}
      {children}
    </main>
  );
}
