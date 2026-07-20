"use client";

import { useCallback, useRef, useState } from "react";
import { useOfficeSession } from "@/components/OfficeSessionProvider";
import { PageCard } from "@/components/PageCard";
import type { BackupPreview } from "@/lib/database-backup";
import { formatArchivedTimestamp } from "@/lib/datetime";
import { isOcrsOffice } from "@/lib/office-permissions";
import { officeAuthHeaders } from "@/lib/office-session";

function DatabaseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
      />
    </svg>
  );
}

function PreviewCounts({ preview }: { preview: BackupPreview }) {
  return (
    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      <div className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
        <dt className="text-muted">Active documents</dt>
        <dd className="font-semibold tabular-nums">{preview.documents}</dd>
      </div>
      <div className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
        <dt className="text-muted">Routing logs</dt>
        <dd className="font-semibold tabular-nums">{preview.documentRoutingLogs}</dd>
      </div>
      <div className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
        <dt className="text-muted">Archived documents</dt>
        <dd className="font-semibold tabular-nums">{preview.archivedDocuments}</dd>
      </div>
      <div className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
        <dt className="text-muted">Archived routing logs</dt>
        <dd className="font-semibold tabular-nums">{preview.archivedDocumentRoutingLogs}</dd>
      </div>
      <div className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">
        <dt className="text-muted">Deletion requests</dt>
        <dd className="font-semibold tabular-nums">{preview.deletionRequests}</dd>
      </div>
    </dl>
  );
}

export function BackupRestoreCard() {
  const { session, openModal } = useOfficeSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [backupPayload, setBackupPayload] = useState<unknown>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const canManage = session ? isOcrsOffice(session.office) : false;

  const handleExport = useCallback(async () => {
    if (!session || !canManage) {
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/documents/backup", {
        headers: officeAuthHeaders(session.token),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to export backup.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `ocrs-backup-${date}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setSuccess("Backup downloaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export backup.");
    } finally {
      setExporting(false);
    }
  }, [canManage, session]);

  async function handleFileChange(file: File | null) {
    setError(null);
    setSuccess(null);
    setBackupPayload(null);
    setPreview(null);
    setConfirmText("");

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      if (
        !parsed ||
        typeof parsed !== "object" ||
        !Array.isArray((parsed as { documents?: unknown }).documents)
      ) {
        throw new Error("Invalid backup file format.");
      }

      const payload = parsed as {
        version?: number;
        exportedAt?: string;
        documents: unknown[];
        documentRoutingLogs?: unknown[];
        archivedDocuments?: unknown[];
        archivedDocumentRoutingLogs?: unknown[];
        deletionRequests?: unknown[];
      };

      setBackupPayload(parsed);
      setPreview({
        version: payload.version ?? null,
        exportedAt: payload.exportedAt ?? null,
        documents: payload.documents.length,
        documentRoutingLogs: payload.documentRoutingLogs?.length ?? 0,
        archivedDocuments: payload.archivedDocuments?.length ?? 0,
        archivedDocumentRoutingLogs: payload.archivedDocumentRoutingLogs?.length ?? 0,
        deletionRequests: payload.deletionRequests?.length ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read backup file.");
    }
  }

  async function handleRestore() {
    if (!session || !canManage || !backupPayload) {
      return;
    }

    setRestoring(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/documents/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...officeAuthHeaders(session.token),
        },
        body: JSON.stringify({
          backup: backupPayload,
          confirm: confirmText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to restore backup.");
      }

      setSuccess("Backup restored. Existing records were updated where reference numbers or IDs matched.");
      setBackupPayload(null);
      setPreview(null);
      setConfirmText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore backup.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <PageCard>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <DatabaseIcon />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Backup &amp; Restore Database
            </h1>
            <p className="text-sm text-muted">
              Export or merge-restore OCRS document data (office tokens are not included)
            </p>
          </div>
        </div>
      </div>

      {!session && (
        <div className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-center">
          <p className="text-sm text-muted">Office token required for database backup.</p>
          <button
            type="button"
            onClick={openModal}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Enter office token
          </button>
        </div>
      )}

      {session && !canManage && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This page is only available when signed in with the OCRS office token.
        </p>
      )}

      {canManage && (
        <div className="space-y-6">
          <section className="rounded-xl border border-border/70 bg-background/70 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Export backup</h2>
            <p className="mt-1 text-sm text-muted">
              Downloads a JSON file with active documents, routing logs, archive records, and
              deletion requests.
            </p>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              className="mt-4 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
            >
              {exporting ? "Preparing backup..." : "Download backup"}
            </button>
          </section>

          <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
            <h2 className="text-sm font-semibold text-amber-950">Restore backup</h2>
            <p className="mt-1 text-sm text-amber-900/90">
              Restores by merging records (upsert). Matching reference numbers and IDs are
              updated; new records are inserted. This cannot undo data already in the database.
            </p>

            <div className="mt-4">
              <label htmlFor="backup-file" className="mb-1.5 block text-sm font-medium">
                Backup file (.json)
              </label>
              <input
                id="backup-file"
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>

            {preview && (
              <>
                <p className="mt-3 text-xs text-muted">
                  Backup version {preview.version ?? "unknown"}
                  {preview.exportedAt
                    ? ` · exported ${formatArchivedTimestamp(preview.exportedAt)}`
                    : ""}
                </p>
                <PreviewCounts preview={preview} />

                <div className="mt-4">
                  <label htmlFor="restore-confirm" className="mb-1.5 block text-sm font-medium">
                    Type RESTORE to confirm
                  </label>
                  <input
                    id="restore-confirm"
                    type="text"
                    value={confirmText}
                    onChange={(event) => setConfirmText(event.target.value)}
                    placeholder="RESTORE"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void handleRestore()}
                  disabled={restoring || confirmText.trim() !== "RESTORE"}
                  className="mt-4 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-50"
                >
                  {restoring ? "Restoring..." : "Restore backup"}
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </p>
      )}
    </PageCard>
  );
}
