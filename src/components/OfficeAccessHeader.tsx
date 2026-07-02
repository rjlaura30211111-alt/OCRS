"use client";

import Link from "next/link";
import { useOfficeSession } from "@/components/OfficeSessionProvider";

export function OfficeAccessHeader() {
  const { session, ready, openModal, signOut } = useOfficeSession();

  if (!ready) {
    return null;
  }

  if (session) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="hidden shrink-0 text-xs font-bold tracking-wide text-[#1a3f6f] sm:inline"
            >
              OCRS
            </Link>
            <p className="min-w-0 truncate text-xs text-slate-600 sm:text-sm">
              <span className="font-semibold text-emerald-800">{session.office}</span>
              <span className="hidden text-slate-500 sm:inline">
                {" "}
                · access token active
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:text-xs"
          >
            Sign out
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-200 bg-amber-50/95 backdrop-blur-md">
      <button
        type="button"
        onClick={openModal}
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-amber-100/60 sm:px-6"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">
            No Access Token
          </p>
          <p className="truncate text-xs font-medium text-amber-950 sm:text-sm">
            View-only mode — tap to enter access token
          </p>
        </div>
        <svg
          aria-hidden
          className="size-4 shrink-0 text-amber-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </header>
  );
}
