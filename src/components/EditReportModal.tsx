"use client";

import { useEffect, useRef, useState } from "react";
import { ACTION_REQUESTED_OPTIONS, type ActionRequested } from "@/lib/actions";
import { SubmitAlertModal } from "@/components/SubmitAlertModal";
import type { ReportSummary } from "@/components/TrackingDetailModal";
import {
  formatDisplayDate,
  formatDisplayTime,
} from "@/lib/datetime";
import {
  FORM_BUTTON_CLASS,
  FORM_INPUT_CLASS,
  FORM_LABEL_CLASS,
} from "@/lib/layout-widths";
import { officeAuthHeaders } from "@/lib/office-session";

type EditReportModalProps = {
  open: boolean;
  report: ReportSummary | null;
  originalReferenceNumber: string;
  officeToken: string;
  onClose: () => void;
  onSaved: () => void;
};

type LoadedDocument = {
  referenceNumber: string;
  subject: string;
  drafter: string;
  sentDate: string;
  sentTime: string;
  submitOffice: string;
  actionRequested: ActionRequested;
};

function isDuplicateReferenceError(message: string): boolean {
  return /reference number already exists/i.test(message);
}

function downloadDocx(blob: Blob, referenceNumber: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = referenceNumber.trim().replace(/[^\w\-]/g, "_").slice(0, 50);
  link.href = url;
  link.download = `reference-${safeName}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}

export function EditReportModal({
  open,
  report,
  originalReferenceNumber,
  officeToken,
  onClose,
  onSaved,
}: EditReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [drafter, setDrafter] = useState("");
  const [officeDivision, setOfficeDivision] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [actionRequested, setActionRequested] = useState<ActionRequested>(
    ACTION_REQUESTED_OPTIONS[0]
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !report) {
      return;
    }

    let active = true;

    async function loadDocument() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(
          `/api/documents/tracking?ref=${encodeURIComponent(originalReferenceNumber)}`
        );
        const data = await response.json();

        if (!response.ok || !data.found) {
          throw new Error(data.error ?? data.message ?? "Failed to load report.");
        }

        if (!active) {
          return;
        }

        const document = data.document as LoadedDocument;
        setSubject(document.subject);
        setReferenceNumber(document.referenceNumber);
        setDrafter(document.drafter);
        setOfficeDivision(document.submitOffice);
        setDate(document.sentDate);
        setTime(document.sentTime);
        setActionRequested(
          ACTION_REQUESTED_OPTIONS.includes(
            document.actionRequested as ActionRequested
          )
            ? (document.actionRequested as ActionRequested)
            : ACTION_REQUESTED_OPTIONS[0]
        );
        setError(null);
      } catch (err) {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load report."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      active = false;
    };
  }, [open, originalReferenceNumber, report]);

  useEffect(() => {
    if (!open) {
      setShowConfirm(false);
      setError(null);
      setLoadError(null);
      setSaving(false);
      setPrinting(false);
    }
  }, [open]);

  function validateForm(): boolean {
    if (!subject.trim()) {
      setError("Please enter a subject.");
      return false;
    }
    if (!referenceNumber.trim()) {
      setError("Please enter a reference number.");
      return false;
    }
    if (!drafter.trim()) {
      setError("Please enter a drafter.");
      return false;
    }
    setError(null);
    return true;
  }

  async function saveChanges(): Promise<string | null> {
    const trimmedReference = referenceNumber.trim();
    const payload = {
      referenceNumber: originalReferenceNumber,
      newReferenceNumber:
        trimmedReference.toLowerCase() !== originalReferenceNumber.toLowerCase()
          ? trimmedReference
          : undefined,
      subject: subject.trim(),
      drafter: drafter.trim(),
      actionRequested,
    };

    const response = await fetch("/api/documents/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...officeAuthHeaders(officeToken),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to update report.");
    }

    return data.document?.referenceNumber ?? trimmedReference;
  }

  async function printReport(reference: string) {
    const response = await fetch("/api/documents/reprint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...officeAuthHeaders(officeToken),
      },
      body: JSON.stringify({
        referenceNumber: reference,
        openWord: true,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to print report.");
    }

    const blob = await response.blob();
    downloadDocx(blob, reference);
  }

  async function handleConfirmSave(printAfterSave: boolean) {
    if (!validateForm()) {
      return;
    }

    if (printAfterSave) {
      setPrinting(true);
    } else {
      setSaving(true);
    }
    setError(null);

    try {
      const savedReference = await saveChanges();
      if (!savedReference) {
        throw new Error("Failed to update report.");
      }

      if (printAfterSave) {
        await printReport(savedReference);
      }

      setShowConfirm(false);
      onSaved();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update report.";

      if (isDuplicateReferenceError(message)) {
        setShowConfirm(false);
        setError(null);
        setAlertModal({
          title: "Reference Number Already Exists",
          message:
            "This reference number is already registered in the system. Please enter a different reference number and try again.",
        });
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
      setPrinting(false);
    }
  }

  function handleAlertClose() {
    setAlertModal(null);
    window.setTimeout(() => referenceInputRef.current?.focus(), 0);
  }

  if (!open || !report) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-report-title"
      >
        <div className="my-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 bg-gradient-to-r from-[#15325a] to-[#1a3f6f] px-5 py-4 text-white">
            <h2 id="edit-report-title" className="text-lg font-semibold">
              Edit Report
            </h2>
            <p className="mt-0.5 text-sm text-blue-100/80">
              Update details while the document is pending at your office
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-[#1a3f6f] border-t-transparent" />
              <p className="text-sm text-muted">Loading report...</p>
            </div>
          ) : loadError ? (
            <div className="space-y-4 p-5">
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {loadError}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-5">
              <div>
                <label htmlFor="edit-subject" className={FORM_LABEL_CLASS}>
                  Subject:
                </label>
                <input
                  id="edit-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={FORM_INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-reference" className={FORM_LABEL_CLASS}>
                    Reference Number:
                  </label>
                  <input
                    id="edit-reference"
                    ref={referenceInputRef}
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className={FORM_INPUT_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="edit-drafter" className={FORM_LABEL_CLASS}>
                    Drafter:
                  </label>
                  <input
                    id="edit-drafter"
                    type="text"
                    value={drafter}
                    onChange={(e) => setDrafter(e.target.value)}
                    className={FORM_INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className={FORM_LABEL_CLASS}>Office/Division:</label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
                  {officeDivision || report.office}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={FORM_LABEL_CLASS}>Date:</label>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                    {date ? formatDisplayDate(date) : "—"}
                  </div>
                </div>
                <div>
                  <label className={FORM_LABEL_CLASS}>Time:</label>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                    {time ? formatDisplayTime(time) : "—"}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="edit-action" className={FORM_LABEL_CLASS}>
                  Action Requested:
                </label>
                <select
                  id="edit-action"
                  value={actionRequested}
                  onChange={(e) =>
                    setActionRequested(e.target.value as ActionRequested)
                  }
                  className={FORM_INPUT_CLASS}
                >
                  {ACTION_REQUESTED_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving || printing}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateForm()) {
                      setShowConfirm(true);
                    }
                  }}
                  disabled={saving || printing}
                  className="flex-1 rounded-lg bg-[#1a3f6f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#153358] disabled:opacity-60"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateForm()) {
                      void handleConfirmSave(true);
                    }
                  }}
                  disabled={saving || printing}
                  className={`flex-1 ${FORM_BUTTON_CLASS}`}
                >
                  {printing ? "Printing..." : "Save & Print"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Confirm Changes</h3>
            <p className="mt-2 text-sm text-muted">
              Save the updated report details?
            </p>
            <dl className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
              <div>
                <dt className="font-medium text-muted">Subject</dt>
                <dd className="mt-1">{subject.trim()}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Reference Number</dt>
                <dd className="mt-1 font-mono">{referenceNumber.trim()}</dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmSave(false)}
                disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Yes, Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SubmitAlertModal
        open={alertModal !== null}
        title={alertModal?.title ?? ""}
        message={alertModal?.message ?? ""}
        onClose={handleAlertClose}
      />
    </>
  );
}
