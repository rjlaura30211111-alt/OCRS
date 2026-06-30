"use client";

import { useState } from "react";
import type { OfficeOption } from "@/lib/offices";
import {
  clearOfficeSession,
  type OfficeSession,
  writeOfficeSession,
} from "@/lib/office-session";

type OfficeAccessGateProps = {
  session: OfficeSession | null;
  onSessionChange: (session: OfficeSession | null) => void;
  children: React.ReactNode;
};

export function OfficeAccessGate({
  session,
  onSessionChange,
  children,
}: OfficeAccessGateProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleActivate() {
    const token = tokenInput.trim();
    if (!token) {
      setError("Please enter your office access token.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/office-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Invalid office access token.");
      }

      const nextSession: OfficeSession = {
        office: data.office as OfficeOption,
        token,
      };

      writeOfficeSession(nextSession);
      onSessionChange(nextSession);
      setTokenInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify token.");
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    clearOfficeSession();
    onSessionChange(null);
    setTokenInput("");
    setError(null);
  }

  if (!session) {
    return (
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Office Access
          </h1>
          <p className="mt-1 text-sm text-muted">
            Enter your office token to receive and edit documents.
          </p>
        </div>

        <label htmlFor="office-token" className="mb-2 block text-sm font-medium">
          Office Access Token
        </label>
        <input
          id="office-token"
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="e.g. ocrs_..."
          autoComplete="off"
          className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />

        <button
          type="button"
          onClick={handleActivate}
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Activate Office Access"}
        </button>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-muted">
          Each office has its own token. Personnel can only receive and edit
          tracking for documents currently at their office.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Signed in as
          </p>
          <p className="text-lg font-bold text-emerald-900">{session.office}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
        >
          Switch Office
        </button>
      </div>
      {children}
    </div>
  );
}
