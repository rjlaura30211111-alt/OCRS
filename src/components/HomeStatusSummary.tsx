"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { TrackingPhase } from "@/lib/report-filters";

type ReportRow = {
  trackingPhase: TrackingPhase;
};

function ClockIcon({ className = "h-6 w-6" }: { className?: string }) {
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
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function RouteIcon({ className = "h-6 w-6" }: { className?: string }) {
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
        d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
      />
    </svg>
  );
}

function SummaryCard({
  href,
  label,
  count,
  loading,
  icon: Icon,
  accent,
  iconBg,
  ring,
  glow,
}: {
  href: string;
  label: string;
  count: number;
  loading: boolean;
  icon: typeof ClockIcon;
  accent: string;
  iconBg: string;
  ring: string;
  glow: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 sm:p-5 ${ring}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition group-hover:scale-110 ${glow}`}
      />
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">
            {label}
          </p>
          {loading ? (
            <div
              aria-hidden
              className="mt-2 h-9 w-14 animate-pulse rounded-lg bg-slate-100 sm:h-10 sm:w-16"
            />
          ) : (
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-4xl">
              {count}
            </p>
          )}
          <p className="mt-1.5 hidden text-xs text-muted sm:block">
            Tap to view in Track Reports
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition duration-300 group-hover:scale-105 sm:h-12 sm:w-12 sm:rounded-2xl ${iconBg}`}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </Link>
  );
}

export function HomeStatusSummary() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/documents/reports");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load summary.");
      }

      setReports((data.results ?? []) as ReportRow[]);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const counts = useMemo(() => {
    let pending = 0;
    let onProcess = 0;

    for (const row of reports) {
      if (row.trackingPhase === "pending") {
        pending += 1;
      } else if (row.trackingPhase === "on-process") {
        onProcess += 1;
      }
    }

    return { pending, onProcess };
  }, [reports]);

  return (
    <section
      aria-label="Document status summary"
      className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-8 sm:gap-4"
    >
      <SummaryCard
        href="/track?status=pending"
        label="Total Pending"
        count={counts.pending}
        loading={loading}
        icon={ClockIcon}
        accent="from-amber-400 to-amber-500"
        iconBg="bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white"
        ring="hover:ring-amber-200"
        glow="bg-amber-200/40"
      />
      <SummaryCard
        href="/track?status=on-process"
        label="Total On-Process"
        count={counts.onProcess}
        loading={loading}
        icon={RouteIcon}
        accent="from-sky-400 to-sky-500"
        iconBg="bg-sky-50 text-sky-600 group-hover:bg-sky-500 group-hover:text-white"
        ring="hover:ring-sky-200"
        glow="bg-sky-200/40"
      />
    </section>
  );
}
