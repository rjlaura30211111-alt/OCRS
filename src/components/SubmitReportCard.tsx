"use client";

import { useEffect, useRef, useState } from "react";
import { ACTION_REQUESTED_OPTIONS, type ActionRequested } from "@/lib/actions";
import {
  formatDisplayDate,
  formatDisplayTime,
  getDefaultDateValue,
  getDefaultTimeValue,
} from "@/lib/datetime";
import { ConfirmSubmitModal } from "@/components/ConfirmSubmitModal";
import { SubmitAlertModal } from "@/components/SubmitAlertModal";
import { OFFICE_OPTIONS, type OfficeOption } from "@/lib/offices";

function isDuplicateReferenceError(message: string): boolean {
  return /reference number already exists/i.test(message);
}

export function SubmitReportCard() {
  const [subject, setSubject] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [drafter, setDrafter] = useState("");
  const [officeDivision, setOfficeDivision] = useState<OfficeOption | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [ready, setReady] = useState(false);
  const [actionRequested, setActionRequested] = useState<ActionRequested>(
    ACTION_REQUESTED_OPTIONS[0]
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDate(getDefaultDateValue());
    setTime(getDefaultTimeValue());
    setReady(true);
  }, []);

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
    if (!officeDivision) {
      setError("Please select an office/division.");
      return false;
    }
    if (!date) {
      setError("Please select a date.");
      return false;
    }
    if (!time) {
      setError("Please select a time.");
      return false;
    }
    setError(null);
    return true;
  }

  function handleSubmitClick() {
    if (!validateForm()) return;
    setShowConfirm(true);
  }

  async function handleConfirmSubmit() {
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          referenceNumber: referenceNumber.trim(),
          drafter: drafter.trim(),
          officeDivision,
          date,
          time,
          actionRequested,
          openWord: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Submit failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = referenceNumber.trim().replace(/[^\w\-]/g, "_").slice(0, 50);
      link.href = url;
      link.download = `reference-${safeName}.docx`;
      link.click();
      URL.revokeObjectURL(url);

      setShowConfirm(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit report.";

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
      setSubmitting(false);
    }
  }

  function handleAlertClose() {
    setAlertModal(null);
    window.setTimeout(() => referenceInputRef.current?.focus(), 0);
  }

  return (
    <>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Document Tracker
          </h1>
          <p className="mt-1 text-sm text-muted">Submit Report</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="subject" className="mb-2 block text-sm font-medium">
              Subject:
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Submission of Communications Technology Report"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="reference"
              className="mb-2 block text-sm font-medium"
            >
              Reference Number:
            </label>
            <input
              id="reference"
              ref={referenceInputRef}
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. REF-2026-001234"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="drafter" className="mb-2 block text-sm font-medium">
              Drafter:
            </label>
            <input
              id="drafter"
              type="text"
              value={drafter}
              onChange={(e) => setDrafter(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="office" className="mb-2 block text-sm font-medium">
              Office/Division:
            </label>
            <select
              id="office"
              value={officeDivision}
              onChange={(e) =>
                setOfficeDivision(e.target.value as OfficeOption)
              }
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select office/division...</option>
              {OFFICE_OPTIONS.map((office) => (
                <option key={office} value={office}>
                  {office}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date" className="mb-2 block text-sm font-medium">
                Date:
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="time" className="mb-2 block text-sm font-medium">
                Time:
              </label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="action" className="mb-2 block text-sm font-medium">
              Action Requested:
            </label>
            <select
              id="action"
              value={actionRequested}
              onChange={(e) =>
                setActionRequested(e.target.value as ActionRequested)
              }
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {ACTION_REQUESTED_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={submitting}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit Report
          </button>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {ready && date && time && (
            <p className="text-center text-xs text-muted">
              {formatDisplayDate(date)} · {formatDisplayTime(time)}
            </p>
          )}
        </div>
      </div>

      <ConfirmSubmitModal
        open={showConfirm}
        subject={subject.trim()}
        referenceNumber={referenceNumber.trim()}
        drafter={drafter.trim()}
        officeDivision={officeDivision}
        actionRequested={actionRequested}
        submitting={submitting}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
      />

      <SubmitAlertModal
        open={alertModal !== null}
        title={alertModal?.title ?? ""}
        message={alertModal?.message ?? ""}
        onClose={handleAlertClose}
      />
    </>
  );
}
