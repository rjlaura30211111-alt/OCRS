export type TrackingEntry = {
  id: string;
  officeCode: string;
  receivedBy: string | null;
  status: string;
  loggedAt: string;
  notes: string | null;
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function DocumentTrackingTimeline({
  tracking,
  loading,
}: {
  tracking: TrackingEntry[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-muted">
        Loading tracking...
      </div>
    );
  }

  if (tracking.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-muted">
        No tracking history yet.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Document Tracking</h2>
      <p className="mt-1 text-xs text-muted">
        Routing history per office (oldest to latest)
      </p>

      <ol className="mt-4 space-y-0">
        {tracking.map((entry, index) => {
          const isLast = index === tracking.length - 1;

          return (
            <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5 bg-emerald-200"
                />
              )}

              <span
                aria-hidden
                className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isLast
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {index + 1}
              </span>

              <div
                className={`min-w-0 flex-1 rounded-lg border p-3 text-sm ${
                  isLast
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">
                    {entry.officeCode}
                  </span>
                  <span className="text-xs text-muted">
                    {formatTimestamp(entry.loggedAt)}
                  </span>
                </div>

                <p className="mt-1.5">
                  <span className="text-muted">Received by:</span>{" "}
                  {entry.receivedBy ?? "—"}
                </p>
                <p className="mt-1">
                  <span className="text-muted">Disposition:</span>{" "}
                  <span className="font-medium">{entry.status}</span>
                </p>
                {entry.notes && (
                  <p className="mt-1 text-xs text-muted">{entry.notes}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
