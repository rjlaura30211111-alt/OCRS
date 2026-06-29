"use client";

import { useEffect } from "react";

type SubmitAlertModalProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function SubmitAlertModal({
  open,
  title,
  message,
  onClose,
}: SubmitAlertModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="submit-alert-title"
      aria-describedby="submit-alert-message"
    >
      <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg
            aria-hidden
            className="h-6 w-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2
          id="submit-alert-title"
          className="text-center text-lg font-semibold text-slate-900"
        >
          {title}
        </h2>
        <p
          id="submit-alert-message"
          className="mt-2 text-center text-sm leading-relaxed text-slate-600"
        >
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          OK
        </button>
      </div>
    </div>
  );
}
