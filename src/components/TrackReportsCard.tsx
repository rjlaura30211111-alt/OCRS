"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  TrackingDetailModal,
  type ReportSummary,
} from "@/components/TrackingDetailModal";
import { getDefaultDateValue } from "@/lib/datetime";
import { formatDispositionLabel } from "@/lib/dispositions";
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
  const tone =
    disposition === "Approved-Completed" || disposition === "Uploaded to OLCIMS"
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
      title="Status is computed automatically from document routing."
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

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/reports");
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
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

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
              </div>
            </div>
            <p className="max-w-xl text-sm text-muted">
              Browse submitted reports and tap a row to view its full routing
              tree from submit to current office.
            </p>
          </div>

          <div className="w-full sm:max-w-xs">
            <label htmlFor="report-search" className="mb-1.5 block text-sm font-medium">
              Search reports
            </label>
            <input
              id="report-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Reference, subject, office..."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
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
            label="View by Status (automatic)"
            options={TRACKING_PHASE_OPTIONS}
            value={phaseFilter}
            onChange={setPhaseFilter}
            activeClassName="bg-violet-600 text-white shadow-sm"
          />

          <div className="space-y-1.5 text-xs leading-relaxed text-muted">
            <p>
              <span className="font-semibold text-slate-700">Disposition</span> —
              set manually when an office receives or edits a document (Checking,
              Approved, OLCIMS, etc.).
            </p>
            <p>
              <span className="font-semibold text-slate-700">Status</span> —
              appears automatically from routing. No need to select or edit this.
            </p>
            <p className="pt-0.5">
              <span className="font-semibold text-slate-600">Pending</span> — still
              at originating office.{" "}
              <span className="font-semibold text-slate-600">On-Process</span> —
              routed to another office.{" "}
              <span className="font-semibold text-slate-600">Completed</span> —
              uploaded to OLCIMS or Approved-Completed at OCRS.
            </p>
          </div>
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
                        ["Reference Number", null],
                        ["Subject", null],
                        ["Office", null],
                        ["Drafter", null],
                        ["Current Track", null],
                        ["Disposition", "Set on receive"],
                        ["Status", "Automatic"],
                      ] as const
                    ).map(([heading, hint]) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-white"
                      >
                        {heading}
                        {hint && (
                          <span className="mt-0.5 block text-[9px] font-medium normal-case tracking-normal text-blue-100/90">
                            {hint}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row, index) => (
                    <tr
                      key={row.referenceNumber}
                      className={`cursor-pointer transition hover:bg-violet-50/70 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                      }`}
                      onClick={() => setSelected(row)}
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
                  className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-sm font-bold text-[#1a3f6f]">
                      {row.referenceNumber}
                    </p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] font-medium text-slate-500">
                        Status · auto
                      </span>
                      <TrackingPhasePill phase={row.trackingPhase} />
                      <span className="text-[10px] font-medium text-slate-500">
                        Disposition
                      </span>
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

      <TrackingDetailModal report={selected} onClose={() => setSelected(null)} />
    </>
  );
}
