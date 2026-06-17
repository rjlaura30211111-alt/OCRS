"use client";

type ConfirmSubmitModalProps = {
  open: boolean;
  subject: string;
  referenceNumber: string;
  drafter: string;
  officeDivision: string;
  actionRequested: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSubmitModal({
  open,
  subject,
  referenceNumber,
  drafter,
  officeDivision,
  actionRequested,
  submitting,
  onConfirm,
  onCancel,
}: ConfirmSubmitModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Confirmation</h2>
        <p className="mt-2 text-sm text-muted">
          Are you sure you want to submit this report? Pls Check the Information
        </p>

        <dl className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
          <div>
            <dt className="font-medium text-muted">Subject</dt>
            <dd className="mt-1">{subject}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Reference Number</dt>
            <dd className="mt-1 font-mono">{referenceNumber}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Drafter</dt>
            <dd className="mt-1">{drafter}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Office/Division</dt>
            <dd className="mt-1">{officeDivision}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Action Requested</dt>
            <dd className="mt-1">{actionRequested}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
          >
            No, Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Yes, Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
