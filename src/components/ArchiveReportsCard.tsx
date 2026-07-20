"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOfficeSession } from "@/components/OfficeSessionProvider";
import {
  TrackingDetailModal,
  type ReportSummary,
} from "@/components/TrackingDetailModal";
import { formatArchivedTimestamp } from "@/lib/datetime";
import { formatDispositionLabel, isCompletedDisposition } from "@/lib/dispositions";
import { isOcrsOffice } from "@/lib/office-permissions";
import { officeAuthHeaders } from "@/lib/office-session";
import {
  formatTrackingPhaseLabel,
  type TrackingPhase,
} from "@/lib/report-filters";

type ArchivedReportRow = ReportSummary & {
  trackingPhase: TrackingPhase;
  archivedAt: string;
  archivedByOffice: string;
};

function ArchiveIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25v3.75M14 11.25v3.75M5.25 7.5h13.5M9.75 7.5V5.625A1.125 1.125 0 0 1 10.875 4.5h2.25A1.125 1.125 0 0 1 14.25 5.625V7.5"
      />
    </svg>
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

export function ArchiveReportsCard() {
  const { session, openModal } = useOfficeSession();
  const [reports, setReports] = useState<ArchivedReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReportSummary | null>(null);

  const canViewArchive = session ? isOcrsOffice(session.office) : false;

  const loadArchivedReports = useCallback(async () => {
    if (!session || !canViewArchive) {
      setReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/archived", {
        headers: officeAuthHeaders(session.token),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load archived reports.");
      }

      setReports((data.results ?? []) as ArchivedReportRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load archived reports.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [canViewArchive, session]);

  useEffect(() => {
    void loadArchivedReports();
  }, [loadArchivedReports]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    return reports.filter((row) => {
      if (!trimmed) {
        return true;
      }

      return (
        row.referenceNumber.toLowerCase().includes(trimmed) ||
        row.subject.toLowerCase().includes(trimmed) ||
        row.drafter.toLowerCase().includes(trimmed) ||
        row.office.toLowerCase().includes(trimmed) ||
        row.archivedByOffice.toLowerCase().includes(trimmed) ||
        (row.currentTrack ?? "").toLowerCase().includes(trimmed) ||
        row.status.toLowerCase().includes(trimmed) ||
        formatDispositionLabel(row.status).toLowerCase().includes(trimmed) ||
        formatTrackingPhaseLabel(row.trackingPhase).toLowerCase().includes(trimmed) ||
        formatArchivedTimestamp(row.archivedAt).toLowerCase().includes(trimmed)
      );
    });
  }, [query, reports]);

  return (
    <>
      <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-700 to-red-600 text-white shadow-md">
                <ArchiveIcon />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Archived Reports
                </h1>
                <p className="text-sm text-muted">OCRS · Document Tracker</p>
                {canViewArchive && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-red-800">
                      Deleted reports moved out of active tracking
                    </p>
                    <Link
                      href="/track"
                      className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#1a3f6f] transition hover:border-[#1a3f6f]/30 hover:bg-slate-50"
                    >
                      Back to Track
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {canViewArchive && (
            <div className="w-full sm:max-w-xs">
              <label htmlFor="archive-search" className="mb-1.5 block text-sm font-medium">
                Search archive
              </label>
              <input
                id="archive-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Reference, subject, office..."
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          )}
        </div>

        {!session && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-amber-950">
              OCRS access token required to view archived reports.
            </p>
            <button
              type="button"
              onClick={openModal}
              className="mt-4 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Enter access token
            </button>
          </div>
        )}

        {session && !canViewArchive && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-red-800">
              View Archive is only available when signed in with the OCRS token.
            </p>
            <Link
              href="/track"
              className="mt-4 inline-flex rounded-lg bg-[#1a3f6f] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Back to Track my Reports
            </Link>
          </div>
        )}

        {canViewArchive && loading && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-red-700 border-t-transparent" />
            <p className="text-sm text-muted">Loading archived reports...</p>
          </div>
        )}

        {canViewArchive && error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {canViewArchive && !loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">No archived reports found</p>
            <p className="mt-1 text-sm text-muted">
              {query.trim()
                ? "Try a different search term."
                : "Reports deleted from Track my Reports will appear here."}
            </p>
          </div>
        )}

        {canViewArchive && !loading && !error && filtered.length > 0 && (
          <>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
              {filtered.length} archived report{filtered.length === 1 ? "" : "s"}
              {reports.length !== filtered.length ? ` of ${reports.length}` : ""}
            </p>

            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-red-800 to-red-600">
                  <tr>
                    {(
                      [
                        "Reference Number",
                        "Subject",
                        "Office",
                        "Archived At",
                        "Archived By",
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
                      key={`${row.referenceNumber}-${row.archivedAt}`}
                      className={`cursor-pointer transition hover:bg-red-50/60 ${
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
                        {formatArchivedTimestamp(row.archivedAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-red-800">
                        {row.archivedByOffice}
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
                  key={`${row.referenceNumber}-${row.archivedAt}`}
                  type="button"
                  onClick={() => setSelected(row)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:shadow-md"
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
                      <span className="font-semibold text-slate-600">Archived by:</span>{" "}
                      <span className="font-semibold text-red-800">
                        {row.archivedByOffice}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-slate-600">Archived at:</span>{" "}
                      {formatArchivedTimestamp(row.archivedAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <TrackingDetailModal
        report={selected}
        onClose={() => setSelected(null)}
        source="archived"
        officeToken={session?.token ?? ""}
      />
    </>
  );
}
