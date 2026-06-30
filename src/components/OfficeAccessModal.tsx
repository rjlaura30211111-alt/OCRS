"use client";

import { useState } from "react";
import { QrScannerModal } from "@/components/QrScannerModal";
import { useOfficeSession } from "@/components/OfficeSessionProvider";

export function OfficeAccessModal() {
  const { modalOpen, closeModal, activateToken } = useOfficeSession();
  const [tokenInput, setTokenInput] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!modalOpen) {
    return null;
  }

  async function submitToken(rawToken: string) {
    setLoading(true);
    setError(null);

    try {
      await activateToken(rawToken);
      setTokenInput("");
      setScannerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify token.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setError(null);
    setTokenInput("");
    setScannerOpen(false);
    closeModal();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a3f6f] to-[#2563eb] text-white shadow-md">
              <svg
                aria-hidden
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Office Access Token
            </h2>
            <p className="mt-1 text-sm text-muted">
              Scan or enter your office access token.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1a3f6f]/30 bg-[#1a3f6f]/5 px-4 py-4 text-sm font-semibold text-[#1a3f6f] transition hover:border-[#1a3f6f]/50 hover:bg-[#1a3f6f]/10"
          >
            <svg
              aria-hidden
              className="size-5"
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
            Scan QR Code
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <label htmlFor="office-token-modal" className="mb-2 block text-sm font-medium">
            Enter Access Token
          </label>
          <input
            id="office-token-modal"
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="e.g. ocrs_..."
            autoComplete="off"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm outline-none transition focus:border-[#1a3f6f] focus:ring-2 focus:ring-[#1a3f6f]/20"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submitToken(tokenInput)}
              disabled={loading}
              className="flex-1 rounded-lg bg-[#1a3f6f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#153358] disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Activate"}
            </button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted">
            Each office has one shared token. With a token you can receive
            documents, use your office inbox, and edit tracking at your office.
          </p>
        </div>
      </div>

      <QrScannerModal
        open={scannerOpen}
        title="Scan Access Token QR"
        onClose={() => setScannerOpen(false)}
        onScan={(value) => {
          void submitToken(value);
        }}
      />
    </>
  );
}
