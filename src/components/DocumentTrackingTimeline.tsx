"use client";

import { useState, type ReactNode } from "react";
import {
  formatDispositionLabel,
  isCompletedDisposition,
  RECEIVE_DISPOSITIONS,
  type ReceiveDisposition,
} from "@/lib/dispositions";
import { formatDisplayDate, formatDisplayTime } from "@/lib/datetime";
import { canEditTrackingAtOffice } from "@/lib/office-permissions";
import type { OfficeOption } from "@/lib/offices";
import { officeAuthHeaders } from "@/lib/office-session";

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

function dispositionTone(status: string): {
  badge: string;
  accent: string;
} {
  switch (status) {
    case "Approved":
      return {
        badge: "bg-emerald-400/20 text-emerald-100 ring-emerald-300/30",
        accent: "from-emerald-500/20",
      };
    case "For Checking":
      return {
        badge: "bg-amber-400/20 text-amber-100 ring-amber-300/30",
        accent: "from-amber-500/20",
      };
    case "Return for Correction":
      return {
        badge: "bg-orange-400/20 text-orange-100 ring-orange-300/30",
        accent: "from-orange-500/20",
      };
    case "Uploaded at OLCIMS":
      return {
        badge: "bg-emerald-400/25 text-emerald-50 ring-emerald-300/40",
        accent: "from-emerald-400/30",
      };
    default:
      return {
        badge: "bg-white/10 text-white/90 ring-white/15",
        accent: "from-white/5",
      };
  }
}

function TimelineConnector({
  short,
  branch,
}: {
  short?: boolean;
  branch?: boolean;
}) {
  if (branch) {
    return (
      <div aria-hidden className="flex w-full max-w-[300px] items-center justify-center py-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-400 to-slate-500" />
        <div className="mx-2 size-2 rounded-full border-2 border-slate-400 bg-white shadow-sm" />
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-400 to-slate-500" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={`relative flex flex-col items-center ${short ? "h-7" : "h-10"}`}
    >
      <div className="w-0.5 flex-1 bg-gradient-to-b from-slate-400 to-[#2563eb]/70" />
      <div className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-[#2563eb] bg-white shadow-[0_0_0_3px_rgba(37,99,235,0.15)]" />
    </div>
  );
}

function CardField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="border-b border-white/10 px-4 py-2.5 last:border-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200/75">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-sm leading-snug ${
          highlight ? "font-semibold text-white" : "font-medium text-white/95"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function TrackingCardShell({
  office,
  children,
  footer,
  variant = "receive",
  completed,
  dispositionStatus,
}: {
  office: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "submit" | "receive";
  completed?: boolean;
  dispositionStatus?: string;
}) {
  const tone = dispositionStatus
    ? dispositionTone(dispositionStatus)
    : dispositionTone("");

  return (
    <article
      className={`group relative w-full max-w-[300px] overflow-hidden rounded-xl border shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] transition-transform duration-200 hover:-translate-y-0.5 ${
        completed
          ? "border-emerald-400/50 ring-2 ring-emerald-400/35"
          : variant === "submit"
            ? "border-[#0f2744] ring-1 ring-white/10"
            : "border-[#0f2744] ring-1 ring-white/5"
      }`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.accent} via-transparent to-transparent opacity-80`}
      />

      <div
        className={`relative border-b px-4 py-3 text-center ${
          variant === "submit"
            ? "border-white/15 bg-gradient-to-r from-[#0c2440] via-[#15325a] to-[#0c2440]"
            : completed
              ? "border-emerald-400/25 bg-gradient-to-r from-[#0d3d2a] via-[#14532d] to-[#0d3d2a]"
              : "border-white/15 bg-gradient-to-r from-[#0c2440] via-[#1a3f6f] to-[#0c2440]"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {variant === "submit" && (
            <span className="rounded-full bg-sky-400/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-sky-100 ring-1 ring-sky-300/25">
              Submitted
            </span>
          )}
          {completed && (
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/90 text-white">
              <svg aria-hidden className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
          )}
          <h3 className="text-base font-bold tracking-[0.12em] text-white">
            {office}
          </h3>
        </div>
      </div>

      <dl className="relative bg-gradient-to-b from-[#1a3f6f] to-[#15325a]">
        {children}
      </dl>

      {footer && (
        <div className="relative flex justify-end border-t border-white/10 bg-[#122d52]/90 px-3 py-2.5 backdrop-blur-sm">
          {footer}
        </div>
      )}
    </article>
  );
}

function DispositionBadge({ status }: { status: string }) {
  const tone = dispositionTone(status);
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone.badge}`}
    >
      {formatDispositionLabel(status)}
    </span>
  );
}

function EditRoutingModal({
  entry,
  referenceNumber,
  authOffice,
  officeToken,
  open,
  onClose,
  onSaved,
}: {
  entry: TrackingEntry;
  referenceNumber: string;
  authOffice: OfficeOption;
  officeToken: string;
  open: boolean;
  onClose: () => void;
  onSaved: (tracking: TrackingEntry[]) => void;
}) {
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
        headers: {
          "Content-Type": "application/json",
          ...officeAuthHeaders(officeToken),
        },
        body: JSON.stringify({
          id: entry.id,
          referenceNumber,
          officeCode: authOffice,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#15325a] to-[#1a3f6f] px-5 py-4 text-white">
          <h2 className="text-lg font-semibold">Edit Tracking Entry</h2>
          <p className="mt-0.5 text-sm text-blue-100/80">{entry.officeCode}</p>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Office</label>
            <div className="rounded-lg border border-border bg-slate-50 px-3 py-2.5 text-sm font-semibold">
              {authOffice}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Received by</label>
            <input
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Disposition</label>
            <select
              value={disposition}
              onChange={(e) =>
                setDisposition(e.target.value as ReceiveDisposition)
              }
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
            >
              {RECEIVE_DISPOSITIONS.map((option) => (
                <option key={option} value={option}>
                  {formatDispositionLabel(option)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
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
              className="flex-1 rounded-lg bg-gradient-to-r from-[#1a3f6f] to-[#2563eb] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiveTrackingCard({
  entry,
  referenceNumber,
  authOffice,
  officeToken,
  documentCurrentOffice,
  onUpdated,
  completed,
  step,
}: {
  entry: TrackingEntry;
  referenceNumber: string;
  authOffice: OfficeOption | null;
  officeToken: string;
  documentCurrentOffice: string | null;
  onUpdated: (tracking: TrackingEntry[]) => void;
  completed?: boolean;
  step?: number;
}) {
  const [editing, setEditing] = useState(false);
  const canEdit =
    !!authOffice &&
    !!officeToken &&
    !completed &&
    canEditTrackingAtOffice(documentCurrentOffice, entry.officeCode, authOffice);

  return (
    <>
      <div className="relative w-full max-w-[300px]">
        {step !== undefined && (
          <span
            aria-hidden
            className="absolute -right-2 -top-2 z-10 flex size-6 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white shadow-md ring-2 ring-white"
          >
            {step}
          </span>
        )}

        <TrackingCardShell
          office={entry.officeCode}
          completed={completed}
          dispositionStatus={entry.status}
          footer={
            completed ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]">
                <svg aria-hidden className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Completed
              </span>
          ) : canEdit ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md bg-amber-400/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-300/30 transition hover:bg-amber-400/25 hover:text-amber-200"
            >
              Edit
            </button>
          ) : (
            <span className="text-[10px] uppercase tracking-wide text-white/45">
              View only
            </span>
          )
        }
        >
          <CardField label="Received By" value={entry.receivedBy ?? "—"} />
          <div className="border-b border-white/10 px-4 py-2.5 last:border-0">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200/75">
              Disposition
            </dt>
            <dd className="mt-1.5">
              <DispositionBadge status={entry.status} />
            </dd>
          </div>
          <CardField label="Date/Time" value={formatLoggedAt(entry.loggedAt)} />
        </TrackingCardShell>
      </div>

      <EditRoutingModal
        entry={entry}
        referenceNumber={referenceNumber}
        authOffice={authOffice!}
        officeToken={officeToken}
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
  authOffice,
  documentCurrentOffice,
  officeToken,
  onTrackingUpdated,
}: {
  submission: SubmissionInfo | null;
  tracking: TrackingEntry[];
  referenceNumber: string;
  loading?: boolean;
  authOffice: OfficeOption | null;
  documentCurrentOffice: string | null;
  officeToken: string;
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
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-8 text-center shadow-inner">
        <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-[#1a3f6f] border-t-transparent" />
        <p className="text-sm text-muted">Loading tracking...</p>
      </div>
    );
  }

  if (!submission && receives.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
        <p className="text-sm font-medium text-slate-600">No tracking history yet</p>
        <p className="mt-1 text-xs text-muted">
          Receive entries will appear here as the document moves between offices.
        </p>
      </div>
    );
  }

  const totalSteps = (submission ? 1 : 0) + receives.length;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-100 via-white to-slate-50 p-4 shadow-sm sm:p-6">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a3f6f] to-[#2563eb] text-white shadow-md">
          <svg aria-hidden className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9 4.423a48.11 48.11 0 0 1-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
          Document Tracking
        </h2>
        {totalSteps > 0 && (
          <p className="mt-1 text-xs text-muted">
            {totalSteps} step{totalSteps === 1 ? "" : "s"} recorded
          </p>
        )}
      </div>

      <div className="relative flex flex-col items-center">
        {submission && (
          <>
            <TrackingCardShell office={submission.submitOffice} variant="submit">
              <CardField label="Subject" value={submission.subject} highlight />
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
            {(mainReceives.length > 0 || completionEntry) && (
              <TimelineConnector />
            )}
          </>
        )}

        {mainReceives.map((entry, index) => (
          <div key={entry.id} className="flex w-full flex-col items-center">
            <ReceiveTrackingCard
              entry={entry}
              referenceNumber={referenceNumber}
              authOffice={authOffice}
              officeToken={officeToken}
              documentCurrentOffice={documentCurrentOffice}
              onUpdated={(updated) => onTrackingUpdated?.(updated)}
              step={(submission ? 2 : 1) + index}
            />
            {(index < mainReceives.length - 1 || completionEntry) && (
              <TimelineConnector />
            )}
          </div>
        ))}

        {completionEntry && (
          <div className="flex w-full max-w-[340px] flex-col items-center">
            {mainReceives.length > 0 && (
              <>
                <TimelineConnector short branch />
                <div className="flex w-full items-start justify-center gap-0 sm:gap-2">
                  <div
                    aria-hidden
                    className="mt-10 hidden h-0.5 w-8 bg-gradient-to-r from-slate-400 to-emerald-400 sm:block"
                  />
                  <ReceiveTrackingCard
                    entry={completionEntry}
                    referenceNumber={referenceNumber}
                    authOffice={authOffice}
                    officeToken={officeToken}
                    documentCurrentOffice={documentCurrentOffice}
                    onUpdated={(updated) => onTrackingUpdated?.(updated)}
                    completed
                    step={(submission ? 2 : 1) + mainReceives.length}
                  />
                </div>
              </>
            )}
            {mainReceives.length === 0 && (
              <>
                {submission && <TimelineConnector short />}
                <ReceiveTrackingCard
                  entry={completionEntry}
                  referenceNumber={referenceNumber}
                  authOffice={authOffice}
                  officeToken={officeToken}
                  documentCurrentOffice={documentCurrentOffice}
                  onUpdated={(updated) => onTrackingUpdated?.(updated)}
                  completed
                  step={submission ? 2 : 1}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
