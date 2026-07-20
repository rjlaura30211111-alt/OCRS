"use client";

import { useEffect, useState } from "react";
import { useOfficeSession } from "@/components/OfficeSessionProvider";
import { syncReceiveDefaults } from "@/components/OfficeInbox";
import { isOcrsOffice } from "@/lib/office-permissions";

function SettingsIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.431l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function maskToken(token: string) {
  if (token.length <= 12) {
    return "••••••••";
  }

  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

export function SettingsCard() {
  const { session, openModal, signOut } = useOfficeSession();
  const [receivedByDefault, setReceivedByDefault] = useState("");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const canView = session ? isOcrsOffice(session.office) : false;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setReceivedByDefault(window.localStorage.getItem("ocrs-received-by-name") ?? "");
  }, []);

  function handleSaveDefaults() {
    syncReceiveDefaults(receivedByDefault);
    setSavedMessage("Default receiver name saved on this device.");
    window.setTimeout(() => setSavedMessage(null), 2500);
  }

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <SettingsIcon />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Settings</h1>
            <p className="text-sm text-muted">OCRS administration and device preferences</p>
          </div>
        </div>
      </div>

      {!session && (
        <div className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-center">
          <p className="text-sm text-muted">Office token required for OCRS settings.</p>
          <button
            type="button"
            onClick={openModal}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Enter office token
          </button>
        </div>
      )}

      {session && !canView && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This page is only available when signed in with the OCRS office token.
        </p>
      )}

      {canView && session && (
        <div className="space-y-6">
          <section className="rounded-xl border border-border/70 bg-background/70 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Office session</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Signed in as</dt>
                <dd className="font-semibold text-slate-900">{session.office}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Access token</dt>
                <dd className="font-mono text-xs text-slate-700">{maskToken(session.token)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={signOut}
              className="mt-4 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </section>

          <section className="rounded-xl border border-border/70 bg-background/70 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Receive defaults</h2>
            <p className="mt-1 text-sm text-muted">
              Pre-fills the &quot;Received by&quot; field when receiving documents on this device.
            </p>
            <label htmlFor="received-by-default" className="mt-4 mb-1.5 block text-sm font-medium">
              Default receiver name
            </label>
            <input
              id="received-by-default"
              type="text"
              value={receivedByDefault}
              onChange={(event) => setReceivedByDefault(event.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={handleSaveDefaults}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Save on this device
            </button>
            {savedMessage && (
              <p className="mt-2 text-sm text-emerald-700">{savedMessage}</p>
            )}
          </section>

          <section className="rounded-xl border border-border/70 bg-background/70 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Application</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">App name</dt>
                <dd className="font-medium text-slate-900">OCRS Document Tracker</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Version</dt>
                <dd className="font-medium text-slate-900">0.1.0</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Live URL</dt>
                <dd>
                  <a
                    href="https://ocrs-cyan.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    ocrs-cyan.vercel.app
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border/70 bg-background/70 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Quick links</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="/deletion-requests" className="font-medium text-primary hover:underline">
                  Request for Deletion
                </a>
              </li>
              <li>
                <a href="/archive" className="font-medium text-primary hover:underline">
                  Archive
                </a>
              </li>
              <li>
                <a href="/reports-statistics" className="font-medium text-primary hover:underline">
                  Reports &amp; Statistics
                </a>
              </li>
              <li>
                <a href="/backup-restore" className="font-medium text-primary hover:underline">
                  Backup &amp; Restore
                </a>
              </li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
