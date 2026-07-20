"use client";

import { useCallback, useEffect, useState } from "react";
import { isDocumentOnHandAtOffice } from "@/lib/document-on-hand";
import {
  formatDispositionLabel,
  getCompletedDispositionMessage,
  getReceiveDispositionOptions,
  isCompletedDisposition,
  type ReceiveDisposition,
} from "@/lib/dispositions";
import { type OfficeOption } from "@/lib/offices";
import {
  formatDisplayDate,
  formatDisplayTime,
} from "@/lib/datetime";
import { officeAuthHeaders } from "@/lib/office-session";
import { DocumentOnHandNotice } from "@/components/DocumentOnHandNotice";
import {
  DocumentTrackingTimeline,
  type SubmissionInfo,
  type TrackingEntry,
} from "@/components/DocumentTrackingTimeline";
import { useOfficeSession } from "@/components/OfficeSessionProvider";
import {
  getSavedReceivedByName,
  OfficeInbox,
  syncReceiveDefaults,
} from "@/components/OfficeInbox";
import { QrScannerModal } from "@/components/QrScannerModal";
import { PageCard } from "@/components/PageCard";
import {
  FORM_BUTTON_CLASS,
  FORM_INPUT_CLASS,
  FORM_LABEL_CLASS,
  PAGE_HEADING_CLASS,
  PAGE_SUBHEADING_CLASS,
} from "@/lib/layout-widths";

export type DocumentLookup = {
  referenceNumber: string;
  subject: string;
  drafter: string;
  actionRequested: string;
  receivedBy: string | null;
  status: string;
  rawStatus: string;
  timestamp: string;
  currentOffice: string | null;
  destinationOffice?: string | null;
  sentDate?: string;
  sentTime?: string;
};

type DocumentSelectionSource = "inbox" | "scan" | "search" | null;

function isScanReceiveBlocked(
  document: DocumentLookup,
  sessionOffice: OfficeOption | undefined,
  source: DocumentSelectionSource
): boolean {
  if (!sessionOffice || source === "inbox") {
    return false;
  }

  return isDocumentOnHandAtOffice(document.currentOffice, sessionOffice);
}

function useLiveDateTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!now) {
    return { date: "", time: "", label: "", ready: false };
  }

  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return {
    date,
    time,
    label: `${formatDisplayDate(date)} · ${formatDisplayTime(time)}`,
    ready: true,
  };
}

function ReceiveForm({
  document,
  sessionOffice,
  officeToken,
  onSaved,
  onReceiveNext,
}: {
  document: DocumentLookup;
  sessionOffice: OfficeOption;
  officeToken: string;
  onSaved: (
    updated: DocumentLookup,
    tracking: TrackingEntry[],
    previousOffice?: string | null
  ) => void;
  onReceiveNext?: () => void;
}) {
  const liveTime = useLiveDateTime();

  const dispositionOptions = getReceiveDispositionOptions(sessionOffice);

  const [receivedBy, setReceivedBy] = useState("");
  const [disposition, setDisposition] = useState<ReceiveDisposition>(
    dispositionOptions[0]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setReceivedBy(getSavedReceivedByName());
    const options = getReceiveDispositionOptions(sessionOffice);
    setDisposition((current) =>
      options.includes(current) ? current : options[0]
    );
    setSuccess(false);
    setError(null);
    // Reset form when a different document is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.referenceNumber, sessionOffice]);

  async function handleSubmit() {
    if (!receivedBy.trim()) {
      setError("Please enter who received the document.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const previousOffice = document.currentOffice;

    try {
      const response = await fetch("/api/documents/receive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...officeAuthHeaders(officeToken),
        },
        body: JSON.stringify({
          referenceNumber: document.referenceNumber,
          receivedBy: receivedBy.trim(),
          status: disposition,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save receipt.");
      }

      onSaved(
        data.document as DocumentLookup,
        data.tracking ?? [],
        previousOffice
      );
      syncReceiveDefaults(receivedBy.trim());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save receipt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3">
      <h2 className="text-xs font-semibold text-slate-900 sm:text-sm">Receive & Disposition</h2>

      <div className="mt-2 space-y-2.5">
        <div>
          <label className={FORM_LABEL_CLASS}>Office</label>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-sm font-bold text-emerald-900">{sessionOffice}</p>
            <p className="text-[11px] text-emerald-800">
              Auto-set from your office access token.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="received-by" className={FORM_LABEL_CLASS}>
            Received by
          </label>
          <input
            id="received-by"
            type="text"
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
            placeholder="Name of receiver"
            className={`${FORM_INPUT_CLASS} focus:border-emerald-500 focus:ring-emerald-500/20`}
          />
        </div>

        <div>
          <label htmlFor="disposition" className={FORM_LABEL_CLASS}>
            Disposition
          </label>
          <select
            id="disposition"
            value={disposition}
            onChange={(e) =>
              setDisposition(e.target.value as ReceiveDisposition)
            }
            className={`${FORM_INPUT_CLASS} focus:border-emerald-500 focus:ring-emerald-500/20`}
          >
            {dispositionOptions.map((option) => (
              <option key={option} value={option}>
                {formatDispositionLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={FORM_LABEL_CLASS}>Date Received</label>
            <input
              type="text"
              readOnly
              value={liveTime.ready ? formatDisplayDate(liveTime.date) : "—"}
              className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-muted"
            />
          </div>
          <div>
            <label className={FORM_LABEL_CLASS}>Time Received</label>
            <input
              type="text"
              readOnly
              value={liveTime.ready ? formatDisplayTime(liveTime.time) : "—"}
              className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-muted"
            />
          </div>
        </div>

        <p className="text-[11px] text-muted">
          Timestamp is recorded automatically when you save.
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className={`${FORM_BUTTON_CLASS} bg-emerald-600 hover:bg-emerald-700`}
        >
          {saving ? "Saving..." : "Save Receipt"}
        </button>

        {success && (
          <div className="space-y-2">
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Receipt saved at {liveTime.label} for {sessionOffice}.
            </p>
            {onReceiveNext && (
              <button
                type="button"
                onClick={onReceiveNext}
                className="w-full rounded-lg border border-emerald-600 bg-white px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
              >
                Receive Another Document
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function ScanQrButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scan QR code"
      className="flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-2.5 py-2 text-white transition hover:bg-emerald-700 sm:px-3"
    >
      <svg
        aria-hidden
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.25 15.75h4.5M15.75 14.25v4.5"
        />
      </svg>
      <span className="ml-2 hidden text-sm font-medium sm:inline">Scan QR</span>
    </button>
  );
}

export function ReceivedDocumentCard() {
  const { session, openModal } = useOfficeSession();
  const [referenceNumber, setReferenceNumber] = useState("");
  const [suggestions, setSuggestions] = useState<DocumentLookup[]>([]);
  const [selected, setSelected] = useState<DocumentLookup | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<TrackingEntry[]>([]);
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [inboxRefreshKey, setInboxRefreshKey] = useState(0);
  const [selectionSource, setSelectionSource] =
    useState<DocumentSelectionSource>(null);

  const scanReceiveBlocked =
    selected &&
    session &&
    isScanReceiveBlocked(selected, session.office, selectionSource);

  const fetchTracking = useCallback(async (ref: string) => {
    setTrackingLoading(true);
    try {
      const response = await fetch(
        `/api/documents/tracking?ref=${encodeURIComponent(ref)}`
      );
      const data = await response.json();
      if (response.ok) {
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
            actionRequested: doc.actionRequested,
          });
        } else {
          setSubmission(null);
        }
      } else {
        setTracking([]);
        setSubmission(null);
      }
    } catch {
      setTracking([]);
      setSubmission(null);
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected?.referenceNumber) {
      void fetchTracking(selected.referenceNumber);
    } else {
      setTracking([]);
      setSubmission(null);
    }
  }, [selected?.referenceNumber, fetchTracking]);

  function clearSelectedDocument() {
    setSelected(null);
    setReferenceNumber("");
    setSubmission(null);
    setTracking([]);
    setSelectionSource(null);
  }

  function handleDocumentSaved(
    updated: DocumentLookup,
    updatedTracking: TrackingEntry[],
    previousOffice?: string | null
  ) {
    setInboxRefreshKey((key) => key + 1);

    const inboxOffice = session?.office;
    const routedAway =
      inboxOffice &&
      updated.currentOffice &&
      updated.currentOffice !== inboxOffice &&
      previousOffice === inboxOffice;
    const completed = isCompletedDisposition(updated.rawStatus);

    if (routedAway || completed) {
      clearSelectedDocument();
      return;
    }

    setSelected(updated);
    setTracking(updatedTracking);
  }

  function handleSubmissionUpdated(updatedSubmission: SubmissionInfo) {
    setSubmission(updatedSubmission);

    if (!selected) {
      return;
    }

    setSelected({
      ...selected,
      subject: updatedSubmission.subject,
      drafter: updatedSubmission.drafter,
      actionRequested: updatedSubmission.actionRequested ?? selected.actionRequested,
    });
  }

  function handleTrackingUpdated(updatedTracking: TrackingEntry[]) {
    setTracking(updatedTracking);

    const receives = updatedTracking.filter(
      (entry) => entry.notes === "Document received"
    );
    const latestReceive = receives[receives.length - 1];

    if (latestReceive && isCompletedDisposition(latestReceive.status)) {
      setInboxRefreshKey((key) => key + 1);
      clearSelectedDocument();
    }
  }

  function handleInboxSelect(document: DocumentLookup) {
    setReferenceNumber(document.referenceNumber);
    setSelected(document);
    setSelectionSource("inbox");
    setNotFound(false);
    setShowSuggestions(false);
  }

  function handleReceiveNext() {
    setSelected(null);
    setReferenceNumber("");
    setShowSuggestions(false);
    setSubmission(null);
    setTracking([]);
    setInboxRefreshKey((key) => key + 1);
    setScannerOpen(true);
  }

  const lookupDocument = useCallback(async (ref: string, source: DocumentSelectionSource = "scan") => {
    const trimmed = ref.trim();
    if (!trimmed) {
      setSelected(null);
      setNotFound(false);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceNumber: trimmed }),
      });

      const data = await response.json();

      if (response.ok && data.found) {
        setSelected(data.document);
        setSelectionSource(source);
        setNotFound(false);
        setShowSuggestions(false);
      } else if (response.status === 404) {
        setSelected(null);
        setSelectionSource(null);
        setNotFound(true);
      } else {
        throw new Error(data.error ?? "Lookup failed.");
      }
    } catch (err) {
      setSelected(null);
      setNotFound(false);
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = referenceNumber.trim();

    if (!trimmed) {
      setSuggestions([]);
      setSelected(null);
      setNotFound(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/documents/search?q=${encodeURIComponent(trimmed)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Search failed.");
        }

        const results = (data.results ?? []) as DocumentLookup[];
        setSuggestions(results);
        setShowSuggestions(true);

        const exact = results.find(
          (item) =>
            item.referenceNumber.toLowerCase() === trimmed.toLowerCase()
        );

        if (exact) {
          setSelected(exact);
          setSelectionSource("search");
          setNotFound(false);
        } else {
          setSelected(null);
          setNotFound(results.length === 0);
        }
      } catch (err) {
        setSuggestions([]);
        setError(err instanceof Error ? err.message : "Search failed.");
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [referenceNumber]);

  function handleSuggestionClick(document: DocumentLookup) {
    setReferenceNumber(document.referenceNumber);
    setSelected(document);
    setSelectionSource("search");
    setNotFound(false);
    setShowSuggestions(false);
  }

  function handleScan(value: string) {
    setReferenceNumber(value);
    void lookupDocument(value, "scan");
  }

  return (
    <>
      <PageCard>
        <div
          className={
            selected
              ? "flex flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 xl:gap-6"
              : undefined
          }
        >
          <div className="min-w-0">
        <div className="mb-3 text-center lg:text-left">
          <h1 className={PAGE_HEADING_CLASS}>Received a Document</h1>
          <p className={PAGE_SUBHEADING_CLASS}>Document Tracker</p>
        </div>

        {session && (
          <OfficeInbox
            office={session.office}
            officeToken={session.token}
            selectedReference={selected?.referenceNumber ?? null}
            onSelect={handleInboxSelect}
            refreshKey={inboxRefreshKey}
          />
        )}

        <label htmlFor="reference-search" className={FORM_LABEL_CLASS}>
          Enter Reference Number
        </label>

        <div className="relative flex gap-2">
          <input
            id="reference-search"
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search reference number..."
            autoComplete="off"
            className={`min-w-0 flex-1 ${FORM_INPUT_CLASS} focus:border-emerald-500 focus:ring-emerald-500/20`}
          />
          <ScanQrButton onClick={() => setScannerOpen(true)} />
        </div>

        {searching && (
          <p className="mt-2 text-xs text-muted">Searching...</p>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <ul className="mt-2 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            {suggestions.map((item) => (
              <li key={item.referenceNumber}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  className="flex w-full flex-col px-4 py-3 text-left text-sm transition hover:bg-slate-50"
                >
                  <span className="font-mono font-semibold text-slate-900">
                    {item.referenceNumber}
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-muted">
                    {item.subject}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {notFound && referenceNumber.trim() && !searching && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
            No Document Found
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
          </div>

        {selected && (
          <div className="mt-3 min-w-0 lg:mt-0 lg:sticky lg:top-3 lg:[&_article]:max-w-none lg:[&_article]:w-full">
            <DocumentTrackingTimeline
              submission={submission}
              tracking={tracking}
              referenceNumber={selected.referenceNumber}
              loading={trackingLoading}
              authOffice={session?.office ?? null}
              documentCurrentOffice={selected.currentOffice}
              officeToken={session?.token ?? ""}
              onTrackingUpdated={handleTrackingUpdated}
              onSubmissionUpdated={handleSubmissionUpdated}
            />
            {scanReceiveBlocked && session && (
              <DocumentOnHandNotice
                office={session.office}
                referenceNumber={selected.referenceNumber}
                subject={selected.subject}
              />
            )}
            {!session ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <p className="text-sm font-medium text-amber-900">
                  View-only mode
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Enter your office access token to receive documents and edit
                  tracking.
                </p>
                <button
                  type="button"
                  onClick={openModal}
                  className="mt-3 rounded-lg bg-[#1a3f6f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#153358]"
                >
                  Enter Access Token
                </button>
              </div>
            ) : isCompletedDisposition(selected.rawStatus) ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <p className="text-sm font-medium text-emerald-900">
                  Document Completed
                </p>
                <p className="mt-1 text-xs text-emerald-800">
                  {getCompletedDispositionMessage(selected.rawStatus)}
                </p>
              </div>
            ) : scanReceiveBlocked ? null : (
              <ReceiveForm
                document={selected}
                sessionOffice={session.office}
                officeToken={session.token}
                onSaved={handleDocumentSaved}
                onReceiveNext={handleReceiveNext}
              />
            )}
          </div>
        )}
        </div>
      </PageCard>

      <QrScannerModal
        open={scannerOpen}
        title="Scan Document QR"
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}
