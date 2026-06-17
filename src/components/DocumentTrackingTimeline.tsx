"use client";

import { useState, type ReactNode } from "react";
import {
  formatDispositionLabel,
  isCompletedDisposition,
  RECEIVE_DISPOSITIONS,
  type ReceiveDisposition,
} from "@/lib/dispositions";
import { OFFICE_OPTIONS } from "@/lib/offices";
import { formatDisplayDate, formatDisplayTime } from "@/lib/datetime";

export type TrackingEntry = {
  id: string;
  officeCode: string;
  receivedBy: string | null;
  status: string;
  loggedAt: string;
  notes: string | null;
};

export type SubmissionInfo = {
  referenceNumber: string;
  subject: string;
  drafter: string;
  sentDate: string;
  sentTime: string;
  submitOffice: string;
  submitLoggedAt: string;
};

function formatLoggedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatSentDateTime(sentDate: string, sentTime: string): string {
  try {
    return `${formatDisplayDate(sentDate)} · ${formatDisplayTime(sentTime)}`;
  } catch {
    return `${sentDate} ${sentTime}`;
  }
}

function TimelineConnector({ short }: { short?: boolean }) {
  return (
    <div
      aria-hidden
      className={`mx-auto w-1 bg-slate-400 ${short ? "h-6" : "h-8"}`}
    />
  );
}

function CardField({ label, value }: { label: string; value: string }) {
  return (
    <p className="border-b border-white/10 py-2 text-sm last:border-0">
      <span className="text-white/70">{label}: </span>
      <span className="font-medium text-white">{value}</span>
    </p>
  );
}

function TrackingCardShell({
  office,
  children,
  footer,
  branch,
}: {
  office: string;
  children: ReactNode;
  footer?: ReactNode;
  branch?: boolean;
}) {
  return (
    <div
      className={`w-full max-w-[280px] overflow-hidden rounded-md border-2 border-slate-900 bg-[#1a3f6f] shadow-lg ${
        branch ? "ring-2 ring-emerald-400/60" : ""
      }`}
    >
      <div className="border-b border-white/20 bg-[#15325a] px-4 py-2.5 text-center">
        <h3 className="text-sm font-bold tracking-wide text-white">{office}</h3>
      </div>
      <div className="px-4 py-2">{children}</div>
      {footer && (
        <div className="flex justify-end border-t border-white/10 px-3 py-2">
          {footer}
        </div>
      )}
    </div>
  );
}

function EditRoutingModal({
  entry,
  referenceNumber,
  open,
  onClose,
  onSaved,
}: {
  entry: TrackingEntry;
  referenceNumber: string;
  open: boolean;
  onClose: () => void;
  onSaved: (tracking: TrackingEntry[]) => void;
}) {
  const [office, setOffice] = useState(entry.officeCode);
  const [receivedBy, setReceivedBy] = useState(entry.receivedBy ?? "");
  const [disposition, setDisposition] = useState<ReceiveDisposition>(
    RECEIVE_DISPOSITIONS.includes(entry.status as ReceiveDisposition)
      ? (entry.status as ReceiveDisposition)
      : RECEIVE_DISPOSITIONS[0]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/routing/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: entry.id,
          referenceNumber,
          officeCode: office,
          receivedBy: receivedBy.trim(),
          status: disposition,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update entry.");
      }

      onSaved(data.tracking ?? []);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold">Edit Tracking Entry</h2>
        <p className="mt-1 text-sm text-muted">{entry.officeCode}</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Office</label>
            <select
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              {OFFICE_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Received by</label>
            <input
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Disposition</label>
            <select
              value={disposition}
              onChange={(e) =>
                setDisposition(e.target.value as ReceiveDisposition)
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              {RECEIVE_DISPOSITIONS.map((option) => (
                <option key={option} value={option}>
                  {formatDispositionLabel(option)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-[#1a3f6f] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiveTrackingCard({
  entry,
  referenceNumber,
  onUpdated,
  completed,
}: {
  entry: TrackingEntry;
  referenceNumber: string;
  onUpdated: (tracking: TrackingEntry[]) => void;
  completed?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <TrackingCardShell
        office={entry.officeCode}
        branch={completed}
        footer={
          completed ? (
            <span className="rounded bg-emerald-500 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Completed
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-bold uppercase tracking-wider text-yellow-400 transition hover:text-yellow-300"
            >
              Edit
            </button>
          )
        }
      >
        <CardField label="Received By" value={entry.receivedBy ?? "—"} />
        <CardField
          label="Disposition"
          value={formatDispositionLabel(entry.status)}
        />
        <CardField label="Date/Time" value={formatLoggedAt(entry.loggedAt)} />
      </TrackingCardShell>

      <EditRoutingModal
        entry={entry}
        referenceNumber={referenceNumber}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={onUpdated}
      />
    </>
  );
}

export function DocumentTrackingTimeline({
  submission,
  tracking,
  referenceNumber,
  loading,
  onTrackingUpdated,
}: {
  submission: SubmissionInfo | null;
  tracking: TrackingEntry[];
  referenceNumber: string;
  loading?: boolean;
  onTrackingUpdated?: (tracking: TrackingEntry[]) => void;
}) {
  const receives = tracking.filter((entry) => entry.notes === "Document received");

  let mainReceives = receives;
  let completionEntry: TrackingEntry | null = null;

  if (
    receives.length > 0 &&
    isCompletedDisposition(receives[receives.length - 1].status)
  ) {
    completionEntry = receives[receives.length - 1];
    mainReceives = receives.slice(0, -1);
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-xl bg-slate-100 p-6 text-center text-sm text-muted">
        Loading tracking...
      </div>
    );
  }

  if (!submission && receives.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-muted">
        No tracking history yet.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-700">
        Document Tracking
      </h2>

      <div className="flex flex-col items-center">
        {submission && (
          <>
            <TrackingCardShell office={submission.submitOffice}>
              <CardField label="Subject" value={submission.subject} />
              <CardField
                label="Reference #"
                value={submission.referenceNumber}
              />
              <CardField label="Drafter" value={submission.drafter} />
              <CardField
                label="Date/Time"
                value={formatSentDateTime(
                  submission.sentDate,
                  submission.sentTime
                )}
              />
            </TrackingCardShell>
            {(mainReceives.length > 0 || completionEntry) && <TimelineConnector />}
          </>
        )}

        {mainReceives.map((entry, index) => (
          <div key={entry.id} className="flex flex-col items-center">
            <ReceiveTrackingCard
              entry={entry}
              referenceNumber={referenceNumber}
              onUpdated={(updated) => onTrackingUpdated?.(updated)}
            />
            {(index < mainReceives.length - 1 || completionEntry) && (
              <TimelineConnector />
            )}
          </div>
        ))}

        {completionEntry && (
          <div className="flex w-full max-w-md flex-col items-center gap-0 sm:flex-row sm:items-start sm:justify-center sm:gap-0">
            {mainReceives.length > 0 && (
              <div
                aria-hidden
                className="hidden h-1 w-10 bg-slate-400 sm:block sm:mt-10"
              />
            )}
            <div className="flex flex-col items-center">
              {mainReceives.length === 0 && submission && <TimelineConnector short />}
              <ReceiveTrackingCard
                entry={completionEntry}
                referenceNumber={referenceNumber}
                onUpdated={(updated) => onTrackingUpdated?.(updated)}
                completed
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
