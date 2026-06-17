import Link from "next/link";

export function TrackDocumentCard() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Track My Document
        </h1>
        <p className="mt-1 text-sm text-muted">Document Tracker</p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">To be developed</p>
        <p className="mt-2 text-sm text-muted">
          Document tracking feature is coming soon.
        </p>
      </div>

      <Link
        href="/"
        className="mt-6 block w-full rounded-lg border border-border px-4 py-3 text-center text-sm font-medium transition hover:bg-slate-50"
      >
        Back to Home
      </Link>
    </div>
  );
}
