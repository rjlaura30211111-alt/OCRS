"use client";

import { useOfficeSession } from "@/components/OfficeSessionProvider";

type OfficeAccessBannerProps = {
  className?: string;
};

export function OfficeAccessBanner({ className = "" }: OfficeAccessBannerProps) {
  const { session, ready, openModal, signOut } = useOfficeSession();

  if (!ready) {
    return null;
  }

  if (session) {
    return (
      <div
        className={`flex items-center justify-between gap-3 border-b border-slate-200/80 pb-2 ${className}`}
      >
        <p className="min-w-0 truncate text-[11px] text-slate-600">
          <span className="font-semibold text-emerald-800">{session.office}</span>
          <span className="text-slate-500"> · access token active</span>
        </p>
        <button
          type="button"
          onClick={signOut}
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openModal}
      className={`group flex w-full items-center gap-3 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-left shadow-sm transition hover:border-amber-400 hover:shadow-md ${className}`}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200">
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
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">
          No Access Token Detected
        </p>
        <p className="text-sm font-semibold text-amber-950 group-hover:text-amber-900">
          Click to Enter Access Token
        </p>
        <p className="mt-0.5 text-xs text-amber-800/80">
          View-only mode — enter token for receive &amp; edit privileges
        </p>
      </div>
      <svg
        aria-hidden
        className="size-4 shrink-0 text-amber-600 transition group-hover:translate-x-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}
