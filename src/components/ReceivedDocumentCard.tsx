"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";

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
};

function formatTimestamp(value: string): string {
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

function DocumentDetails({ document }: { document: DocumentLookup }) {
  return (
    <dl className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
      <div>
        <dt className="font-medium text-muted">Reference Number</dt>
        <dd className="mt-0.5 font-mono font-semibold text-slate-900">
          {document.referenceNumber}
        </dd>
      </div>
      <div>
        <dt className="font-medium text-muted">Subject</dt>
        <dd className="mt-0.5">{document.subject}</dd>
      </div>
      <div>
        <dt className="font-medium text-muted">Drafter</dt>
        <dd className="mt-0.5">{document.drafter}</dd>
      </div>
      <div>
        <dt className="font-medium text-muted">Action Requested</dt>
        <dd className="mt-0.5">{document.actionRequested}</dd>
      </div>
      <div>
        <dt className="font-medium text-muted">Received by</dt>
        <dd className="mt-0.5">{document.receivedBy ?? "—"}</dd>
      </div>
      <div>
        <dt className="font-medium text-muted">Status</dt>
        <dd className="mt-0.5 font-semibold text-slate-900">{document.status}</dd>
      </div>
      <div>
        <dt className="font-medium text-muted">TimeStamp</dt>
        <dd className="mt-0.5">{formatTimestamp(document.timestamp)}</dd>
      </div>
    </dl>
  );
}

function ScanQrButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scan QR code"
      className="flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-3 py-3 text-white transition hover:bg-emerald-700 sm:px-4"
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

function QrScannerModal({
  open,
  onClose,
  onScan,
}: {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}) {
  const scannerId = useId().replace(/:/g, "");
  const readerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    const reader = new Html5Qrcode(`qr-reader-${scannerId}`);
    readerRef.current = reader;
    setError(null);

    reader
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onScan(decodedText.trim());
          onClose();
        },
        () => {}
      )
      .catch(() => {
        if (active) {
          setError("Could not access camera. Check browser permissions.");
        }
      });

    return () => {
      active = false;
      const instance = readerRef.current;
      readerRef.current = null;
      if (instance?.isScanning) {
        void instance.stop().then(() => instance.clear());
      } else {
        instance?.clear();
      }
    };
  }, [open, onClose, onScan, scannerId]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Scan QR Code</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div
          id={`qr-reader-${scannerId}`}
          className="overflow-hidden rounded-xl bg-black"
        />
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export function ReceivedDocumentCard() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [suggestions, setSuggestions] = useState<DocumentLookup[]>([]);
  const [selected, setSelected] = useState<DocumentLookup | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupDocument = useCallback(async (ref: string) => {
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
        setNotFound(false);
        setShowSuggestions(false);
      } else if (response.status === 404) {
        setSelected(null);
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
    setNotFound(false);
    setShowSuggestions(false);
  }

  function handleScan(value: string) {
    setReferenceNumber(value);
    void lookupDocument(value);
  }

  return (
    <>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Received a Document
          </h1>
          <p className="mt-1 text-sm text-muted">Document Tracker</p>
        </div>

        <label htmlFor="reference-search" className="mb-2 block text-sm font-medium">
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
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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

        {selected && <DocumentDetails document={selected} />}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Link
          href="/"
          className="mt-6 block w-full rounded-lg border border-border px-4 py-3 text-center text-sm font-medium transition hover:bg-slate-50"
        >
          Back to Home
        </Link>
      </div>

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}
