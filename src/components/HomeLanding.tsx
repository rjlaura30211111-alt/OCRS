"use client";

import Link from "next/link";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";
import { OfficeAccessBanner } from "@/components/OfficeAccessBanner";

function SubmitIcon({ className = "h-7 w-7" }: { className?: string }) {
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
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 18H15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 15 4.5h-4.5A2.25 2.25 0 0 0 8.25 6.75v11.25A2.25 2.25 0 0 0 10.5 20.25Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 8.25h-3m3 3.75h-3m3 3.75h-3"
      />
    </svg>
  );
}

function ScanIcon({ className = "h-7 w-7" }: { className?: string }) {
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
        d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 15.75h4.5M15.75 14.25v4.5"
      />
    </svg>
  );
}

function TrackIcon({ className = "h-7 w-7" }: { className?: string }) {
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
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-primary sm:hidden"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

const menuItems = [
  {
    href: "/submit",
    title: "Submit Report",
    description: "Fill in details, generate QR code, and export your routing slip.",
    action: "Submit now",
    icon: SubmitIcon,
    accent: "from-blue-500 to-blue-600",
    iconBg:
      "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    ring: "group-hover:ring-blue-200",
  },
  {
    href: "/scan",
    title: "Received a Document",
    description: "Search by reference number or scan QR to view document details.",
    action: "Open",
    icon: ScanIcon,
    accent: "from-emerald-500 to-emerald-600",
    iconBg:
      "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    ring: "group-hover:ring-emerald-200",
  },
  {
    href: "/track",
    title: "Track my Reports",
    description: "View all submitted reports and follow each document's routing progress.",
    action: "View reports",
    icon: TrackIcon,
    accent: "from-violet-500 to-violet-600",
    iconBg:
      "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
    ring: "group-hover:ring-violet-200",
  },
] as const;

export function HomeLanding() {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-5 sm:px-6 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_#ede9fe_0%,_transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-20 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl"
      />

      <div className="relative w-full max-w-4xl">
        <OfficeAccessBanner className="mb-4 sm:mb-6" />
        <InstallAppPrompt />

        <header className="mb-4 text-center sm:mb-10">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-black/5 sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl">
            <svg
              aria-hidden
              className="h-5 w-5 text-blue-600 sm:h-7 sm:w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9 4.423a48.11 48.11 0 0 1-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Document Tracker
          </h1>
          <p className="mx-auto mt-1.5 hidden max-w-md text-sm leading-relaxed text-muted sm:mt-3 sm:block sm:text-base">
            Submit routing slips with QR codes and track your documents in one
            place.
          </p>
        </header>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/60 bg-white/80 p-3.5 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg hover:ring-2 sm:flex-col sm:items-stretch sm:rounded-2xl sm:p-6 sm:hover:-translate-y-1 sm:hover:shadow-xl ${item.ring}`}
              >
                <div
                  aria-hidden
                  className={`absolute inset-x-0 top-0 hidden h-1 bg-gradient-to-r sm:block ${item.accent} opacity-0 transition group-hover:opacity-100`}
                />

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition duration-300 sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl ${item.iconBg}`}
                >
                  <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                </div>

                <div className="min-w-0 flex-1 sm:flex sm:flex-col">
                  <h2 className="text-sm font-semibold text-slate-900 sm:text-lg">
                    {item.title}
                  </h2>
                  <p className="mt-0.5 hidden text-sm leading-relaxed text-muted sm:mt-2 sm:block">
                    {item.description}
                  </p>
                </div>

                <ChevronIcon />

                <span className="mt-5 hidden items-center gap-1.5 text-sm font-semibold text-slate-700 transition group-hover:gap-2.5 group-hover:text-primary sm:inline-flex">
                  {item.action}
                  <svg
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
