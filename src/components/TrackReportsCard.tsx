"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConfirmArchiveModal } from "@/components/ConfirmArchiveModal";
import { QrScannerModal } from "@/components/QrScannerModal";
import { useOfficeSession } from "@/components/OfficeSessionProvider";
import {
  TrackingDetailModal,
  type ReportSummary,
} from "@/components/TrackingDetailModal";
import { getDefaultDateValue } from "@/lib/datetime";
import { formatDispositionLabel, isCompletedDisposition } from "@/lib/dispositions";
import { officeAuthHeaders } from "@/lib/office-session";
import {
  DATE_RANGE_OPTIONS,
  formatTrackingPhaseLabel,
  matchesDateRange,
  matchesTrackingPhase,
  TRACKING_PHASE_OPTIONS,
  type DateRangePreset,
  type TrackingPhase,
  type TrackingPhaseFilter,
} from "@/lib/report-filters";

type ReportRow = ReportSummary & {
  trackingPhase: TrackingPhase;
  createdAt: string;
  updatedAt: string;
};

function TrackIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    </svg>
  );
}

function ScanQrButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scan QR code"
      className="flex shrink-0 items-center justify-center rounded-lg bg-violet-600 px-3 py-2.5 text-white transition hover:bg-violet-700 sm:px-4"
    >
      <svg
        aria-hidden
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.25 15.75h4.5M15.75 14.25v4.5"
        />
      </svg>
      <span className="ml-2 hidden text-sm font-medium sm:inline">Scan QR</span>
    </button>
  );
}

function FilterToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  activeClassName,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  activeClassName: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? activeClassName
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DispositionPill({ disposition }: { disposition: string }) {
  const label = formatDispositionLabel(disposition);
  const tone = isCompletedDisposition(disposition)
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : disposition === "Approved"
        ? "bg-blue-50 text-blue-800 ring-blue-200"
        : disposition === "For Checking"
          ? "bg-amber-50 text-amber-800 ring-amber-200"
          : disposition === "Return for Correction"
            ? "bg-orange-50 text-orange-800 ring-orange-200"
            : "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone}`}
    >
      {label}
    </span>
  );
}

function TrackingPhasePill({ phase }: { phase: TrackingPhase }) {
  const label = formatTrackingPhaseLabel(phase);
  const tone =
    phase === "completed"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : phase === "on-process"
        ? "bg-sky-50 text-sky-800 ring-sky-200"
        : "bg-amber-50 text-amber-900 ring-amber-200";

  return (
    <span
      className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone}`}
    >
      {label}
    </span>
  );
}

function initialPhaseFilter(
  statusParam: string | null
): TrackingPhaseFilter {
  if (
    statusParam === "pending" ||
    statusParam === "on-process" ||
    statusParam === "completed"
  ) {
    return statusParam;
  }

  return "all";
}

export function TrackReportsCard() {
  const searchParams = useSearchParams();
  const { session } = useOfficeSession();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReportSummary | null>(null);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [phaseFilter, setPhaseFilter] = useState<TrackingPhaseFilter>(() =>
    initialPhaseFilter(searchParams.get("status"))
  );
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState(getDefaultDateValue());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: ReportRow;
  } | null>(null);
  const [highlightedRef, setHighlightedRef] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ReportRow | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/reports", {
        headers: session ? officeAuthHeaders(session.token) : undefined,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load reports.");
      }

      setReports((data.results ?? []) as ReportRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const closeMenu = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setContextMenu(null);
      }
    };

    const closeMenuNow = () => {
      setContextMenu(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("mousedown", closeMenu);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", closeMenuNow, true);

    return () => {
      window.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", closeMenuNow, true);
    };
  }, [contextMenu]);

  const openRowContextMenu = useCallback(
    (event: React.MouseEvent, row: ReportRow) => {
      if (!session) {
        return;
      }

      event.preventDefault();
      setHighlightedRef(row.referenceNumber);
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        row,
      });
    },
    [session]
  );

  const handleArchiveConfirm = useCallback(async () => {
    if (!archiveTarget || !session) {
      return;
    }

    setArchiving(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...officeAuthHeaders(session.token),
        },
        body: JSON.stringify({
          referenceNumber: archiveTarget.referenceNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete report.");
      }

      setArchiveTarget(null);
      setHighlightedRef(null);
      setContextMenu(null);
      if (selected?.referenceNumber === archiveTarget.referenceNumber) {
        setSelected(null);
      }
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete report.");
    } finally {
      setArchiving(false);
    }
  }, [archiveTarget, loadReports, selected, session]);

  const handleScan = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }

      setQuery(trimmed);

      const match = reports.find(
        (row) => row.referenceNumber.toLowerCase() === trimmed.toLowerCase()
      );

      if (match) {
        setSelected(match);
      }
    },
    [reports]
  );

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    return reports.filter((row) => {
      if (!matchesDateRange(row.createdAt, datePreset, customFrom, customTo)) {
        return false;
      }

      if (!matchesTrackingPhase(row.trackingPhase, phaseFilter)) {
        return false;
      }

      if (!trimmed) {
        return true;
      }

      return (
        row.referenceNumber.toLowerCase().includes(trimmed) ||
        row.subject.toLowerCase().includes(trimmed) ||
        row.drafter.toLowerCase().includes(trimmed) ||
        row.office.toLowerCase().includes(trimmed) ||
        (row.currentTrack ?? "").toLowerCase().includes(trimmed) ||
        row.status.toLowerCase().includes(trimmed) ||
        formatDispositionLabel(row.status).toLowerCase().includes(trimmed) ||
        formatTrackingPhaseLabel(row.trackingPhase).toLowerCase().includes(trimmed)
      );
    });
  }, [customFrom, customTo, datePreset, phaseFilter, query, reports]);

  const hasActiveFilters =
    datePreset !== "all" || phaseFilter !== "all" || query.trim().length > 0;

  return (
    <>
      <div className="w-full max-w-6xl rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-md">
                <TrackIcon />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Track my Reports
                </h1>
                <p className="text-sm text-muted">Document Tracker</p>
                {session && (
                  <p className="mt-1 text-xs font-medium text-emerald-800">
                    Showing {session.office} documents only
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full sm:max-w-xs">
            <label htmlFor="report-search" className="mb-1.5 block text-sm font-medium">
              Search reports
            </label>
            <div className="flex gap-2">
              <input
                id="report-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Reference, subject, office..."
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <ScanQrButton onClick={() => setScannerOpen(true)} />
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <FilterToggleGroup
            label="View by Date"
            options={DATE_RANGE_OPTIONS}
            value={datePreset}
            onChange={setDatePreset}
            activeClassName="bg-[#1a3f6f] text-white shadow-sm"
          />

          {datePreset === "custom" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="custom-from" className="mb-1.5 block text-xs font-medium text-slate-700">
                  From
                </label>
                <input
                  id="custom-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label htmlFor="custom-to" className="mb-1.5 block text-xs font-medium text-slate-700">
                  To
                </label>
                <input
                  id="custom-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>
          )}

          <FilterToggleGroup
            label="View by Status"
            options={TRACKING_PHASE_OPTIONS}
            value={phaseFilter}
            onChange={setPhaseFilter}
            activeClassName="bg-violet-600 text-white shadow-sm"
          />
        </div>

        {loading && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-[#1a3f6f] border-t-transparent" />
            <p className="text-sm text-muted">Loading reports...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">No reports found</p>
            <p className="mt-1 text-sm text-muted">
              {hasActiveFilters
                ? "Try adjusting your filters or search term."
                : "Submitted documents will appear here."}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
              {filtered.length} report{filtered.length === 1 ? "" : "s"}
              {reports.length !== filtered.length
                ? ` of ${reports.length}`
                : ""}
            </p>

            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-[#1a3f6f] to-[#2563eb]">
                  <tr>
                    {(
                      [
                        "Reference Number",
                        "Subject",
                        "Office",
                        "Drafter",
                        "Current Track",
                        "Disposition",
                        "Status",
                      ] as const
                    ).map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-white"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row, index) => (
                    <tr
                      key={row.referenceNumber}
                      className={`cursor-pointer transition hover:bg-violet-50/70 ${
                        highlightedRef === row.referenceNumber
                          ? "bg-violet-100/80 ring-1 ring-inset ring-violet-300"
                          : index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                      }`}
                      onClick={() => setSelected(row)}
                      onContextMenu={(event) => openRowContextMenu(event, row)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold text-[#1a3f6f]">
                        {row.referenceNumber}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-sm text-slate-800">
                        {row.subject}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                        {row.office}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                        {row.drafter}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-emerald-700">
                        {row.currentTrack ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <DispositionPill disposition={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <TrackingPhasePill phase={row.trackingPhase} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {filtered.map((row) => (
                <button
                  key={row.referenceNumber}
                  type="button"
                  onClick={() => setSelected(row)}
                  onContextMenu={(event) => openRowContextMenu(event, row)}
                  className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md ${
                    highlightedRef === row.referenceNumber
                      ? "border-violet-400 ring-2 ring-violet-200"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-sm font-bold text-[#1a3f6f]">
                      {row.referenceNumber}
                    </p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <TrackingPhasePill phase={row.trackingPhase} />
                      <DispositionPill disposition={row.status} />
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-900">
                    {row.subject}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                    <div>
                      <span className="font-semibold text-slate-600">Office:</span>{" "}
                      {row.office}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Drafter:</span>{" "}
                      {row.drafter}
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-slate-600">Current Track:</span>{" "}
                      <span className="font-semibold text-emerald-700">
                        {row.currentTrack ?? "—"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {contextMenu && session && (
        <div
          ref={contextMenuRef}
          role="menu"
          className="fixed z-40 min-w-[148px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 160),
            top: Math.min(contextMenu.y, window.innerHeight - 56),
          }}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
            onClick={() => {
              setArchiveTarget(contextMenu.row);
              setContextMenu(null);
            }}
          >
            <svg
              aria-hidden
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            Delete
          </button>
        </div>
      )}

      <ConfirmArchiveModal
        open={archiveTarget !== null}
        referenceNumber={archiveTarget?.referenceNumber ?? ""}
        subject={archiveTarget?.subject ?? ""}
        archiving={archiving}
        onConfirm={() => void handleArchiveConfirm()}
        onCancel={() => {
          if (!archiving) {
            setArchiveTarget(null);
          }
        }}
      />

      <TrackingDetailModal report={selected} onClose={() => setSelected(null)} />

      <QrScannerModal
        open={scannerOpen}
        title="Scan Document QR"
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}
