"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OcrsDeleteModal, type OcrsDeleteEntryInfo } from "@/components/OcrsDeleteModal";
import { useOfficeSession } from "@/components/OfficeSessionProvider";
import { formatArchivedTimestamp } from "@/lib/datetime";
import { isOcrsOffice } from "@/lib/office-permissions";
import { officeAuthHeaders } from "@/lib/office-session";

type DeletionRequestRow = {
  id: string;
  referenceNumber: string;
  requestedByOffice: string;
  requestedAt: string;
  subject: string;
  drafter: string;
  actionRequested: string;
  sentDate: string;
  sentTime: string;
  documentStatus: string;
  receivedBy: string | null;
  currentOffice: string | null;
  destinationOffice: string | null;
  documentCreatedAt: string;
  documentUpdatedAt: string;
};

function TrashRequestIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

export function DeletionRequestsCard() {
  const { session } = useOfficeSession();
  const [requests, setRequests] = useState<DeletionRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeletionRequestRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canReview = session ? isOcrsOffice(session.office) : false;

  const loadRequests = useCallback(async () => {
    if (!session || !canReview) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/deletion-requests", {
        headers: officeAuthHeaders(session.token),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load deletion requests.");
      }

      setRequests((data.results ?? []) as DeletionRequestRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deletion requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [canReview, session]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return requests;
    }

    return requests.filter(
      (row) =>
        row.referenceNumber.toLowerCase().includes(trimmed) ||
        row.subject.toLowerCase().includes(trimmed) ||
        row.drafter.toLowerCase().includes(trimmed) ||
        row.requestedByOffice.toLowerCase().includes(trimmed) ||
        row.documentStatus.toLowerCase().includes(trimmed)
    );
  }, [query, requests]);

  const modalEntry: OcrsDeleteEntryInfo | null = deleteTarget
    ? {
        referenceNumber: deleteTarget.referenceNumber,
        subject: deleteTarget.subject,
        drafter: deleteTarget.drafter,
        actionRequested: deleteTarget.actionRequested,
        requestedByOffice: deleteTarget.requestedByOffice,
        currentOffice: deleteTarget.currentOffice,
        documentStatus: deleteTarget.documentStatus,
        sentDate: deleteTarget.sentDate,
        sentTime: deleteTarget.sentTime,
      }
    : null;

  async function handleApproveDelete(deletedBy: string) {
    if (!deleteTarget || !session) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/deletion-requests/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...officeAuthHeaders(session.token),
        },
        body: JSON.stringify({
          requestId: deleteTarget.id,
          deletedBy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete entry.");
      }

      setDeleteTarget(null);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <TrashRequestIcon />
              </span>
              <div>
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Request for Deletion
                </h1>
                <p className="text-sm text-muted">
                  OCRS approval queue before reports move to Archive
                </p>
              </div>
            </div>
            {canReview && (
              <p className="text-xs text-muted">
                {loading
                  ? "Loading requests..."
                  : `${filtered.length} pending request${filtered.length === 1 ? "" : "s"}`}
              </p>
            )}
          </div>

          {canReview && (
            <div className="w-full sm:max-w-xs">
              <label htmlFor="deletion-search" className="mb-1.5 block text-sm font-medium">
                Search requests
              </label>
              <input
                id="deletion-search"
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
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            OCRS access token required to review deletion requests.
          </p>
        )}

        {session && !canReview && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Request for Deletion is only available when signed in with the OCRS token.
          </p>
        )}

        {canReview && loading && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 size-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
            <p className="text-sm text-muted">Loading deletion requests...</p>
          </div>
        )}

        {canReview && error && !loading && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {canReview && !loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
            <p className="text-sm font-medium text-slate-700">No pending deletion requests</p>
            <p className="mt-1 text-xs text-muted">
              When offices request deletion from Track my Reports, entries appear here for OCRS
              approval.
            </p>
          </div>
        )}

        {canReview && !loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((row) => (
              <article
                key={row.id}
                className="rounded-xl border border-red-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-base font-semibold text-slate-900">
                        {row.referenceNumber}
                      </p>
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                        Pending
                      </span>
                    </div>
                    <p className="font-medium text-slate-800">{row.subject}</p>
                    <div className="grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-700">Requested by:</span>{" "}
                        {row.requestedByOffice}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Requested at:</span>{" "}
                        {formatArchivedTimestamp(row.requestedAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Drafter:</span>{" "}
                        {row.drafter}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Current office:</span>{" "}
                        {row.currentOffice ?? "—"}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="font-semibold text-slate-700">Action requested:</span>{" "}
                        {row.actionRequested}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="shrink-0 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    Review & Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <OcrsDeleteModal
        open={deleteTarget !== null}
        entry={modalEntry}
        deleting={deleting}
        onConfirm={(deletedBy) => void handleApproveDelete(deletedBy)}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
