"use client";

import { useCallback, useEffect, useState } from "react";
import { useOfficeSession } from "@/components/OfficeSessionProvider";
import { PageCard } from "@/components/PageCard";
import { formatArchivedTimestamp } from "@/lib/datetime";
import { isOcrsOffice } from "@/lib/office-permissions";
import { officeAuthHeaders } from "@/lib/office-session";
import { formatTrackingPhaseLabel, type TrackingPhase } from "@/lib/report-filters";
import type { StatisticsSnapshot } from "@/lib/statistics";

function ChartIcon({ className = "h-5 w-5" }: { className?: string }) {
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

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums tracking-tight ${accent}`}>
        {value}
      </p>
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = rows[0]?.count ?? 1;

  return (
    <section className="rounded-xl border border-border/70 bg-background/70 p-4">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.slice(0, 12).map((row) => (
            <li key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-slate-800">{row.label}</span>
                <span className="shrink-0 tabular-nums text-muted">{row.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600"
                  style={{ width: `${Math.max(8, (row.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const phaseLabels: TrackingPhase[] = ["pending", "on-process", "completed"];

export function ReportsStatisticsCard() {
  const { session, openModal } = useOfficeSession();
  const [stats, setStats] = useState<StatisticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = session ? isOcrsOffice(session.office) : false;

  const loadStats = useCallback(async () => {
    if (!session || !canView) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/statistics", {
        headers: officeAuthHeaders(session.token),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load statistics.");
      }

      setStats(data as StatisticsSnapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [canView, session]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <PageCard>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ChartIcon />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                Reports &amp; Statistics
              </h1>
              <p className="text-sm text-muted">
                System-wide counts and breakdowns for OCRS
              </p>
            </div>
          </div>
          {stats && (
            <p className="text-xs text-muted">
              Updated {formatArchivedTimestamp(stats.generatedAt)}
            </p>
          )}
        </div>

        {canView && (
          <button
            type="button"
            onClick={() => void loadStats()}
            disabled={loading}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </div>

      {!session && (
        <div className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-center">
          <p className="text-sm text-muted">Office token required for OCRS statistics.</p>
          <button
            type="button"
            onClick={openModal}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Enter office token
          </button>
        </div>
      )}

      {session && !canView && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This page is only available when signed in with the OCRS office token.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {canView && loading && !stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl border border-border/70 bg-slate-100"
            />
          ))}
        </div>
      )}

      {canView && stats && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Active reports" value={stats.totals.active} accent="text-indigo-700" />
            <StatTile label="Archived" value={stats.totals.archived} accent="text-rose-700" />
            <StatTile
              label="Pending deletions"
              value={stats.totals.pendingDeletionRequests}
              accent="text-red-700"
            />
            <StatTile
              label="Completed (active)"
              value={stats.totals.byPhase.completed}
              accent="text-emerald-700"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {phaseLabels.map((phase) => (
              <StatTile
                key={phase}
                label={formatTrackingPhaseLabel(phase)}
                value={stats.totals.byPhase[phase]}
                accent={
                  phase === "completed"
                    ? "text-emerald-700"
                    : phase === "on-process"
                      ? "text-sky-700"
                      : "text-amber-700"
                }
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownTable title="By submitting office" rows={stats.bySubmitOffice} />
            <BreakdownTable title="By current office" rows={stats.byCurrentOffice} />
            <BreakdownTable title="By disposition" rows={stats.byStatus} />
            <BreakdownTable title="Archived by office" rows={stats.byArchivedOffice} />
          </div>
        </div>
      )}
    </PageCard>
  );
}
