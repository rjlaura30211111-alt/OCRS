"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "ocrs-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const showIosHelp = isIosDevice() && !installed && !dismissed;

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1");
    setInstalled(isStandaloneMode());

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    setInstalling(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } finally {
      setInstalling(false);
    }
  }

  if (installed || dismissed) {
    return null;
  }

  if (!deferredPrompt && !showIosHelp) {
    return null;
  }

  return (
    <section className="mb-4 rounded-xl border border-[#1a3f6f]/15 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:mb-6 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a3f6f] to-[#2563eb] text-xs font-bold text-white shadow-md">
          OCRS
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
            Install App
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
            {showIosHelp
              ? "Add OCRS to your home screen for faster access when receiving and tracking documents."
              : "Install OCRS on this device for quick access from your home screen or app drawer."}
          </p>

          {showIosHelp ? (
            <ol className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
              <li>1. Tap the Share button in Safari</li>
              <li>2. Choose Add to Home Screen</li>
              <li>3. Tap Add</li>
            </ol>
          ) : (
            <button
              type="button"
              onClick={() => void handleInstall()}
              disabled={installing}
              className="mt-3 rounded-lg bg-[#1a3f6f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#153358] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {installing ? "Installing..." : "Install App"}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <svg
            aria-hidden
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
