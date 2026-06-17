import Link from "next/link";

type PageShellProps = {
  children: React.ReactNode;
  showBack?: boolean;
};

export function PageShell({ children, showBack = true }: PageShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      {showBack && (
        <div className="mb-4 w-full max-w-md">
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
