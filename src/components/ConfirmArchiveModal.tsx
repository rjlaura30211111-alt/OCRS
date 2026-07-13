"use client";

import { useEffect } from "react";

type ConfirmArchiveModalProps = {
  open: boolean;
  referenceNumber: string;
  subject: string;
  archiving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmArchiveModal({
  open,
  referenceNumber,
  subject,
  archiving,
  onConfirm,
  onCancel,
}: ConfirmArchiveModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-archive-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 id="confirm-archive-title" className="text-lg font-semibold text-red-700">
          Delete report?
        </h2>
        <p className="mt-2 text-sm text-muted">
          This report will be removed from active tracking and moved to the archived
          database. This action cannot be undone from the app.
        </p>

        <dl className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
          <div>
            <dt className="font-medium text-muted">Reference Number</dt>
            <dd className="mt-1 font-mono">{referenceNumber}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Subject</dt>
            <dd className="mt-1">{subject}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={archiving}
            className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={archiving}
            className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {archiving ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
