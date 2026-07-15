"use client";

import { useEffect, useState } from "react";
import {
  DocumentTrackingTimeline,
  type SubmissionInfo,
  type TrackingEntry,
} from "@/components/DocumentTrackingTimeline";
import { formatArchivedTimestamp } from "@/lib/datetime";
import { officeAuthHeaders } from "@/lib/office-session";

export type ReportSummary = {
  referenceNumber: string;
  subject: string;
  office: string;
  drafter: string;
  currentTrack: string | null;
  status: string;
};

type ArchiveInfo = {
  archivedAt: string;
  archivedByOffice: string;
};

type TrackingDetailModalProps = {
  report: ReportSummary | null;
  onClose: () => void;
  source?: "active" | "archived";
  officeToken?: string;
};

export function TrackingDetailModal({
  report,
  onClose,
  source = "active",
  officeToken = "",
}: TrackingDetailModalProps) {
  const [tracking, setTracking] = useState<TrackingEntry[]>([]);
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null);
  const [archiveInfo, setArchiveInfo] = useState<ArchiveInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!report) {
      setTracking([]);
      setSubmission(null);
      setArchiveInfo(null);
      setError(null);
      return;
    }

    const activeReport = report;
    let active = true;

    async function loadTracking() {
      setLoading(true);
      setError(null);

      try {
        const endpoint =
          source === "archived"
            ? `/api/documents/archived/tracking?ref=${encodeURIComponent(activeReport.referenceNumber)}`
            : `/api/documents/tracking?ref=${encodeURIComponent(activeReport.referenceNumber)}`;

        const response = await fetch(endpoint, {
          headers:
            source === "archived" && officeToken
              ? officeAuthHeaders(officeToken)
              : undefined,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? data.message ?? "Failed to load tracking.");
        }

        if (!active) {
          return;
        }

        setTracking((data.tracking ?? []) as TrackingEntry[]);
        setArchiveInfo(
          source === "archived" && data.archived
            ? {
                archivedAt: data.archived.archivedAt,
                archivedByOffice: data.archived.archivedByOffice,
              }
            : null
        );

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
            actionRequested: doc.actionRequested,
          });
        } else {
          setSubmission(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load tracking.");
          setTracking([]);
          setSubmission(null);
          setArchiveInfo(null);
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
  }, [officeToken, report, source]);

  if (!report) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div
          className={`border-b border-slate-200 px-5 py-4 text-white sm:px-6 ${
            source === "archived"
              ? "bg-gradient-to-r from-red-800 to-red-600"
              : "bg-gradient-to-r from-[#1a3f6f] to-[#2563eb]"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
                {source === "archived"
                  ? "Archived Report · View Only"
                  : "Tracking Tree · View Only"}
              </p>
              <h2 className="mt-1 truncate font-mono text-lg font-bold">
                {report.referenceNumber}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-white/85">
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
            {archiveInfo && (
              <>
                <span className="rounded-md bg-white/20 px-2 py-1 font-semibold ring-1 ring-white/25">
                  Archived {formatArchivedTimestamp(archiveInfo.archivedAt)}
                </span>
                <span className="rounded-md bg-white/15 px-2 py-1">
                  By: <strong>{archiveInfo.archivedByOffice}</strong>
                </span>
              </>
            )}
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
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
