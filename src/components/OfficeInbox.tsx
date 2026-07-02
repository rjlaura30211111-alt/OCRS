"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDisplayDate } from "@/lib/datetime";
import { formatDispositionLabel } from "@/lib/dispositions";
import type { OfficeOption } from "@/lib/offices";
import { officeAuthHeaders } from "@/lib/office-session";
import type { DocumentLookup } from "@/components/ReceivedDocumentCard";

type OfficeInboxProps = {
  office: OfficeOption;
  officeToken: string;
  selectedReference: string | null;
  onSelect: (document: DocumentLookup) => void;
  refreshKey?: number;
};

export function OfficeInbox({
  office,
  officeToken,
  selectedReference,
  onSelect,
  refreshKey = 0,
}: OfficeInboxProps) {
  const [results, setResults] = useState<DocumentLookup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/inbox", {
        headers: officeAuthHeaders(officeToken),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load inbox.");
      }

      setResults((data.results ?? []) as DocumentLookup[]);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Failed to load inbox.");
    } finally {
      setLoading(false);
    }
  }, [officeToken]);

  useEffect(() => {
    void fetchInbox();
  }, [fetchInbox, refreshKey]);

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Office Inbox</h2>
          <p className="mt-0.5 text-xs text-muted">
            Active documents at {office}. Items leave when routed elsewhere or
            marked completed (OLCIMS or Approved-Completed).
          </p>
        </div>
        {results.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="shrink-0 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700"
          >
            {expanded ? "Hide" : "Show"} ({results.length})
          </button>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-blue-200 bg-white px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          Your Office
        </p>
        <p className="mt-0.5 text-base font-bold text-slate-900">{office}</p>
      </div>

      {loading && (
        <p className="mt-3 text-xs text-muted">Loading inbox...</p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="mt-3 rounded-lg bg-white px-3 py-3 text-center text-xs text-muted">
          No active documents at {office}. Scan a QR or search by reference.
        </p>
      )}

      {expanded && !loading && results.length > 0 && (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {results.map((item) => {
            const isSelected =
              selectedReference?.toLowerCase() ===
              item.referenceNumber.toLowerCase();
            const lastStatus =
              item.rawStatus !== "Pending"
                ? formatDispositionLabel(item.rawStatus)
                : "Pending";

            return (
              <li key={item.referenceNumber}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`flex w-full flex-col rounded-lg border px-3 py-3 text-left text-sm transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30"
                      : "border-white bg-white hover:border-blue-200 hover:bg-blue-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {item.referenceNumber}
                    </span>
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                      {lastStatus}
                    </span>
                  </div>
                  <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-700">
                    {item.subject}
                  </span>
                  <span className="mt-1.5 text-[11px] text-muted">
                    {item.drafter}
                    {item.sentDate
                      ? ` · ${formatDisplayDate(item.sentDate)}`
                      : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function getSavedReceivedByName(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem("ocrs-received-by-name") ?? "";
}

export function syncReceiveDefaults(receivedBy: string) {
  if (typeof window === "undefined" || !receivedBy.trim()) {
    return;
  }
  window.localStorage.setItem("ocrs-received-by-name", receivedBy.trim());
}
