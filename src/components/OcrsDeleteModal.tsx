"use client";

import { useEffect, useState } from "react";
import { formatDisplayDate, formatDisplayTime } from "@/lib/datetime";

export type OcrsDeleteEntryInfo = {
  referenceNumber: string;
  subject: string;
  drafter?: string;
  actionRequested?: string;
  requestedByOffice?: string;
  currentOffice?: string | null;
  documentStatus?: string;
  sentDate?: string;
  sentTime?: string;
};

type OcrsDeleteModalProps = {
  open: boolean;
  entry: OcrsDeleteEntryInfo | null;
  deleting: boolean;
  onConfirm: (deletedBy: string) => void;
  onCancel: () => void;
};

export function OcrsDeleteModal({
  open,
  entry,
  deleting,
  onConfirm,
  onCancel,
}: OcrsDeleteModalProps) {
  const [deletedBy, setDeletedBy] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setDeletedBy("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, entry?.referenceNumber]);

  if (!open || !entry) {
    return null;
  }

  const deletedAt = new Date();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ocrs-delete-title"
    >
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 id="ocrs-delete-title" className="text-lg font-semibold text-red-700">
          You want to delete this Entry?
        </h2>
        <p className="mt-2 text-sm text-muted">
          All information below will be copied to the Archive before this entry is
          removed from active tracking.
        </p>

        <dl className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
          <div>
            <dt className="font-medium text-muted">Reference Number</dt>
            <dd className="mt-1 font-mono">{entry.referenceNumber}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Subject</dt>
            <dd className="mt-1">{entry.subject}</dd>
          </div>
          {entry.drafter && (
            <div>
              <dt className="font-medium text-muted">Drafter</dt>
              <dd className="mt-1">{entry.drafter}</dd>
            </div>
          )}
          {entry.actionRequested && (
            <div>
              <dt className="font-medium text-muted">Action Requested</dt>
              <dd className="mt-1">{entry.actionRequested}</dd>
            </div>
          )}
          {entry.requestedByOffice && (
            <div>
              <dt className="font-medium text-muted">Requested By Office</dt>
              <dd className="mt-1">{entry.requestedByOffice}</dd>
            </div>
          )}
          {entry.currentOffice && (
            <div>
              <dt className="font-medium text-muted">Current Office</dt>
              <dd className="mt-1">{entry.currentOffice}</dd>
            </div>
          )}
          {entry.documentStatus && (
            <div>
              <dt className="font-medium text-muted">Disposition</dt>
              <dd className="mt-1">{entry.documentStatus}</dd>
            </div>
          )}
          {entry.sentDate && entry.sentTime && (
            <div>
              <dt className="font-medium text-muted">Sent Date / Time</dt>
              <dd className="mt-1">
                {formatDisplayDate(entry.sentDate)} · {formatDisplayTime(entry.sentTime)}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="deleted-at" className="mb-1.5 block text-sm font-medium">
              Time Deleted
            </label>
            <input
              id="deleted-at"
              readOnly
              value={deletedAt.toLocaleString("en-PH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              className="w-full rounded-lg border border-border bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </div>
          <div>
            <label htmlFor="deleted-by" className="mb-1.5 block text-sm font-medium">
              Deleted by
            </label>
            <input
              id="deleted-by"
              type="text"
              value={deletedBy}
              onChange={(e) => setDeletedBy(e.target.value)}
              placeholder="Name of OCRS personnel"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
          >
            No
          </button>
          <button
            type="button"
            onClick={() => onConfirm(deletedBy.trim())}
            disabled={deleting || !deletedBy.trim()}
            className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
