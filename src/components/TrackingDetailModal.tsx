"use client";

import { useEffect, useState } from "react";
import {
  DocumentTrackingTimeline,
  type SubmissionInfo,
  type TrackingEntry,
} from "@/components/DocumentTrackingTimeline";

export type ReportSummary = {
  referenceNumber: string;
  subject: string;
  office: string;
  drafter: string;
  currentTrack: string | null;
  status: string;
};

type TrackingDetailModalProps = {
  report: ReportSummary | null;
  onClose: () => void;
};

export function TrackingDetailModal({
  report,
  onClose,
}: TrackingDetailModalProps) {
  const [tracking, setTracking] = useState<TrackingEntry[]>([]);
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!report) {
      setTracking([]);
      setSubmission(null);
      setError(null);
      return;
    }

    const activeReport = report;
    let active = true;

    async function loadTracking() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/documents/tracking?ref=${encodeURIComponent(activeReport.referenceNumber)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load tracking.");
        }

        if (!active) {
          return;
        }

        setTracking((data.tracking ?? []) as TrackingEntry[]);

        const doc = data.document;
        if (doc) {
          setSubmission({
            referenceNumber: doc.referenceNumber,
            subject: doc.subject,
            drafter: doc.drafter,
            sentDate: doc.sentDate,
            sentTime: doc.sentTime,
            submitOffice: doc.submitOffice,
            submitLoggedAt: doc.submitLoggedAt,
          });
        } else {
          setSubmission(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load tracking.");
          setTracking([]);
          setSubmission(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTracking();

    return () => {
      active = false;
    };
  }, [report]);

  if (!report) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-[#1a3f6f] to-[#2563eb] px-5 py-4 text-white sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100">
                Tracking Tree
              </p>
              <h2 className="mt-1 truncate font-mono text-lg font-bold">
                {report.referenceNumber}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-blue-100">
                {report.subject}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium transition hover:bg-white/25"
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-white/15 px-2 py-1">
              Office: <strong>{report.office}</strong>
            </span>
            <span className="rounded-md bg-white/15 px-2 py-1">
              Current: <strong>{report.currentTrack ?? "—"}</strong>
            </span>
            <span className="rounded-md bg-white/20 px-2 py-1 font-semibold ring-1 ring-white/25">
              {report.status}
            </span>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <DocumentTrackingTimeline
            submission={submission}
            tracking={tracking}
            referenceNumber={report.referenceNumber}
            loading={loading}
            authOffice={null}
            documentCurrentOffice={report.currentTrack}
            officeToken=""
          />
        </div>
      </div>
    </div>
  );
}
