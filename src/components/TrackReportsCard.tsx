"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OcrsDeleteModal, type OcrsDeleteEntryInfo } from "@/components/OcrsDeleteModal";
import { EditReportModal } from "@/components/EditReportModal";
import { RequestDeletionModal } from "@/components/RequestDeletionModal";
import { QrScannerModal } from "@/components/QrScannerModal";
import { PageCard } from "@/components/PageCard";
import { useOfficeSession } from "@/components/OfficeSessionProvider";
import {
  TrackingDetailModal,
  type ReportSummary,
} from "@/components/TrackingDetailModal";
import { getDefaultDateValue } from "@/lib/datetime";
import { FORM_INPUT_CLASS, FORM_LABEL_CLASS } from "@/lib/layout-widths";
import { formatDispositionLabel, isCompletedDisposition } from "@/lib/dispositions";
import { isOcrsOffice, canEditReportAtOffice } from "@/lib/office-permissions";
import { OFFICE_OPTIONS } from "@/lib/offices";
import { officeAuthHeaders } from "@/lib/office-session";
import {
  matchesOfficeFilter,
  type OfficeFilter,
} from "@/lib/report-scope";
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
  pendingDeletion?: boolean;
};

function ScanQrButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scan QR code"
      className="flex h-[34px] shrink-0 items-center justify-center rounded-lg bg-violet-600 px-2.5 text-white transition hover:bg-violet-700"
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
      <span className="ml-1.5 hidden text-xs font-medium sm:inline">Scan QR</span>
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

function PendingDeletionPill() {
  return (
    <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
      Deletion Pending
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
  const [officeFilter, setOfficeFilter] = useState<OfficeFilter>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState(getDefaultDateValue());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: ReportRow;
  } | null>(null);
  const [highlightedRef, setHighlightedRef] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReportRow | null>(null);
  const [editTarget, setEditTarget] = useState<{
    row: ReportRow;
    originalReferenceNumber: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
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

      const isOcrs = isOcrsOffice(session.office);
      const canEdit = canEditReportAtOffice(
        row.currentTrack,
        session.office,
        row.status
      ) && !row.pendingDeletion;
      const canRequest =
        !isOcrs && row.office === session.office && !row.pendingDeletion;
      const canDelete = isOcrs;

      if (!canRequest && !canDelete && !canEdit) {
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

  const handleDeletionRequestConfirm = useCallback(async () => {
    if (!deleteTarget || !session) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/deletion-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...officeAuthHeaders(session.token),
        },
        body: JSON.stringify({
          referenceNumber: deleteTarget.referenceNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to submit deletion request.");
      }

      setDeleteTarget(null);
      setHighlightedRef(null);
      setContextMenu(null);
      if (selected?.referenceNumber === deleteTarget.referenceNumber) {
        setSelected(null);
      }
      await loadReports();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit deletion request."
      );
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, loadReports, selected, session]);

  const handleOcrsDeleteConfirm = useCallback(
    async (deletedBy: string) => {
      if (!deleteTarget || !session) {
        return;
      }

      setDeleting(true);
      setError(null);

      try {
        const response = await fetch("/api/documents/archive", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...officeAuthHeaders(session.token),
          },
          body: JSON.stringify({
            referenceNumber: deleteTarget.referenceNumber,
            deletedBy,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to delete report.");
        }

        setDeleteTarget(null);
        setHighlightedRef(null);
        setContextMenu(null);
        if (selected?.referenceNumber === deleteTarget.referenceNumber) {
          setSelected(null);
        }
        await loadReports();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete report.");
      } finally {
        setDeleting(false);
      }
    },
    [deleteTarget, loadReports, selected, session]
  );

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

      if (
        !matchesOfficeFilter(officeFilter, row.office, row.currentTrack ?? null)
      ) {
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
  }, [customFrom, customTo, datePreset, officeFilter, phaseFilter, query, reports]);

  const hasActiveFilters =
    datePreset !== "all" ||
    phaseFilter !== "all" ||
    officeFilter !== "all" ||
    query.trim().length > 0;

  return (
    <>
      <PageCard className="!py-2 sm:!py-3">
        <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            <div className="space-y-2">
              <FilterToggleGroup
                label="View by Date"
                options={DATE_RANGE_OPTIONS}
                value={datePreset}
                onChange={setDatePreset}
                activeClassName="bg-[#1a3f6f] text-white shadow-sm"
              />

              {datePreset === "custom" && (
                <div className="grid max-w-md grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="custom-from"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      From
                    </label>
                    <input
                      id="custom-from"
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className={`${FORM_INPUT_CLASS} bg-white focus:border-violet-500 focus:ring-violet-500/20`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="custom-to"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      To
                    </label>
                    <input
                      id="custom-to"
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className={`${FORM_INPUT_CLASS} bg-white focus:border-violet-500 focus:ring-violet-500/20`}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="w-full shrink-0 sm:w-36">
                  <label htmlFor="office-filter" className={FORM_LABEL_CLASS}>
                    View by Office
                  </label>
                  <select
                    id="office-filter"
                    value={officeFilter}
                    onChange={(event) =>
                      setOfficeFilter(event.target.value as OfficeFilter)
                    }
                    className={`${FORM_INPUT_CLASS} w-full bg-white focus:border-violet-500 focus:ring-violet-500/20`}
                  >
                    <option value="all">All offices</option>
                    {OFFICE_OPTIONS.map((office) => (
                      <option key={office} value={office}>
                        {office}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0 flex-1 sm:max-w-md">
                  <label htmlFor="report-search" className={FORM_LABEL_CLASS}>
                    Search reports
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="report-search"
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Reference, subject..."
                      className={`min-w-0 flex-1 ${FORM_INPUT_CLASS} focus:border-violet-500 focus:ring-violet-500/20`}
                    />
                    <ScanQrButton onClick={() => setScannerOpen(true)} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <FilterToggleGroup
                label="View by Status"
                options={TRACKING_PHASE_OPTIONS}
                value={phaseFilter}
                onChange={setPhaseFilter}
                activeClassName="bg-violet-600 text-white shadow-sm"
              />
            </div>
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
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
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
                        <div className="flex flex-col gap-1">
                          <span>{row.referenceNumber}</span>
                          {row.pendingDeletion && <PendingDeletionPill />}
                        </div>
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
                    <div>
                      <p className="font-mono text-sm font-bold text-[#1a3f6f]">
                        {row.referenceNumber}
                      </p>
                      {row.pendingDeletion && (
                        <div className="mt-1">
                          <PendingDeletionPill />
                        </div>
                      )}
                    </div>
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
      </PageCard>

      {contextMenu && session && (
        <div
          ref={contextMenuRef}
          role="menu"
          className="fixed z-40 min-w-[168px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 180),
            top: Math.min(contextMenu.y, window.innerHeight - 120),
          }}
        >
          {canEditReportAtOffice(
            contextMenu.row.currentTrack,
            session.office,
            contextMenu.row.status
          ) &&
            !contextMenu.row.pendingDeletion && (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[#1a3f6f] transition hover:bg-violet-50"
                onClick={() => {
                  setEditTarget({
                    row: contextMenu.row,
                    originalReferenceNumber: contextMenu.row.referenceNumber,
                  });
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
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                  />
                </svg>
                Edit Report
              </button>
            )}
          {(isOcrsOffice(session.office) ||
            (contextMenu.row.office === session.office &&
              !contextMenu.row.pendingDeletion)) && (
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
            onClick={() => {
              setError(null);
              setDeleteTarget(contextMenu.row);
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
            {session && isOcrsOffice(session.office)
              ? "Delete"
              : "Request Deletion"}
          </button>
          )}
        </div>
      )}

      {session && editTarget && (
        <EditReportModal
          open={editTarget !== null}
          report={editTarget.row}
          originalReferenceNumber={editTarget.originalReferenceNumber}
          officeToken={session.token}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setHighlightedRef(null);
            void loadReports();
          }}
        />
      )}

      {session && isOcrsOffice(session.office) ? (
        <OcrsDeleteModal
          open={deleteTarget !== null}
          entry={
            deleteTarget
              ? ({
                  referenceNumber: deleteTarget.referenceNumber,
                  subject: deleteTarget.subject,
                  drafter: deleteTarget.drafter,
                  currentOffice: deleteTarget.currentTrack,
                  documentStatus: deleteTarget.status,
                } satisfies OcrsDeleteEntryInfo)
              : null
          }
          deleting={deleting}
          error={deleteTarget ? error : null}
          onConfirm={(deletedBy) => void handleOcrsDeleteConfirm(deletedBy)}
          onCancel={() => {
            if (!deleting) {
              setDeleteTarget(null);
            }
          }}
        />
      ) : (
        <RequestDeletionModal
          open={deleteTarget !== null}
          referenceNumber={deleteTarget?.referenceNumber ?? ""}
          subject={deleteTarget?.subject ?? ""}
          submitting={deleting}
          onConfirm={() => void handleDeletionRequestConfirm()}
          onCancel={() => {
            if (!deleting) {
              setDeleteTarget(null);
            }
          }}
        />
      )}

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
