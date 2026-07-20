"use client";

import Link from "next/link";
import { HomeStatusSummary } from "@/components/HomeStatusSummary";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";
import { useOfficeSession } from "@/components/OfficeSessionProvider";
import { HOME_LANDING_WIDTH } from "@/lib/layout-widths";

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

function ArchiveMenuIcon({ className = "h-7 w-7" }: { className?: string }) {
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
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25v3.75M14 11.25v3.75M5.25 7.5h13.5M9.75 7.5V5.625A1.125 1.125 0 0 1 10.875 4.5h2.25A1.125 1.125 0 0 1 14.25 5.625V7.5"
      />
    </svg>
  );
}

function DeletionRequestIcon({ className = "h-7 w-7" }: { className?: string }) {
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
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function StatisticsIcon({ className = "h-7 w-7" }: { className?: string }) {
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

function BackupIcon({ className = "h-7 w-7" }: { className?: string }) {
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

function SettingsIcon({ className = "h-7 w-7" }: { className?: string }) {
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

const baseMenuItems = [
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
    requiresToken: false,
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
    requiresToken: true,
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
    requiresToken: true,
  },
] as const;

const ocrsMenuItems = [
  {
    href: "/deletion-requests",
    title: "Request for Deletion",
    description: "Review office deletion requests and approve before archiving.",
    action: "Review queue",
    icon: DeletionRequestIcon,
    accent: "from-red-500 to-red-600",
    iconBg:
      "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white",
    ring: "group-hover:ring-red-200",
    requiresToken: true,
  },
  {
    href: "/archive",
    title: "Archive",
    description: "View deleted reports with copied information and audit details.",
    action: "Open archive",
    icon: ArchiveMenuIcon,
    accent: "from-rose-500 to-rose-600",
    iconBg:
      "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
    ring: "group-hover:ring-rose-200",
    requiresToken: true,
  },
  {
    href: "/reports-statistics",
    title: "Reports & Statistics",
    description: "View system-wide counts, phases, and office breakdowns.",
    action: "View stats",
    icon: StatisticsIcon,
    accent: "from-indigo-500 to-indigo-600",
    iconBg:
      "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
    ring: "group-hover:ring-indigo-200",
    requiresToken: true,
  },
  {
    href: "/backup-restore",
    title: "Backup & Restore",
    description: "Export or merge-restore document database records as JSON.",
    action: "Manage backup",
    icon: BackupIcon,
    accent: "from-teal-500 to-teal-600",
    iconBg:
      "bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white",
    ring: "group-hover:ring-teal-200",
    requiresToken: true,
  },
  {
    href: "/settings",
    title: "Settings",
    description: "OCRS session, device defaults, and administration links.",
    action: "Open settings",
    icon: SettingsIcon,
    accent: "from-slate-500 to-slate-600",
    iconBg:
      "bg-slate-100 text-slate-700 group-hover:bg-slate-600 group-hover:text-white",
    ring: "group-hover:ring-slate-200",
    requiresToken: true,
  },
] as const;

type MenuItem = (typeof baseMenuItems)[number] | (typeof ocrsMenuItems)[number];

function MenuCard({
  item,
  disabled,
  onDisabledClick,
}: {
  item: MenuItem;
  disabled: boolean;
  onDisabledClick: () => void;
}) {
  const Icon = item.icon;
  const className = `group relative flex min-h-0 flex-1 items-center gap-2 overflow-hidden rounded-xl border border-white/60 bg-white/80 p-2.5 shadow-sm backdrop-blur-sm transition duration-300 sm:flex-col sm:items-stretch sm:gap-3 sm:rounded-2xl sm:p-6 ${
    disabled
      ? "cursor-not-allowed opacity-45 grayscale"
      : `hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg hover:ring-2 sm:hover:-translate-y-1 sm:hover:shadow-xl ${item.ring}`
  }`;

  const content = (
    <>
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 hidden h-1 bg-gradient-to-r sm:block ${item.accent} ${
          disabled ? "opacity-0" : "opacity-0 transition group-hover:opacity-100"
        }`}
      />

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition duration-300 sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl ${item.iconBg}`}
      >
        <Icon className="h-4 w-4 sm:h-7 sm:w-7" />
      </div>

      <div className="min-w-0 flex-1 sm:flex sm:flex-col">
        <h2 className="text-[13px] font-semibold leading-tight text-slate-900 sm:text-lg">
          {item.title}
        </h2>
        <p className="mt-0.5 hidden text-sm leading-relaxed text-muted sm:mt-2 sm:block">
          {item.description}
        </p>
        {disabled && (
          <p className="mt-1 text-[10px] font-medium text-slate-500 sm:text-xs">
            Office token required
          </p>
        )}
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
    </>
  );

  if (disabled) {
    return (
      <button
        type="button"
        aria-disabled
        onClick={onDisabledClick}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

export function HomeLanding() {
  const { session, openModal } = useOfficeSession();
  const menuItems: MenuItem[] =
    session?.office === "OCRS"
      ? [...baseMenuItems, ...ocrsMenuItems]
      : [...baseMenuItems];

  return (
    <main className="relative h-full min-h-0 overflow-y-auto page-scroll">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_#ede9fe_0%,_transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -left-24 top-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-24 bottom-20 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl"
      />

      <div className={`relative flex min-h-full flex-col px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 sm:min-h-0 sm:justify-center sm:px-6 sm:py-10 ${HOME_LANDING_WIDTH}`}>
        <InstallAppPrompt />

        <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 sm:block sm:flex-none sm:gap-0">
          <header className="shrink-0 text-center">
            <div className="mx-auto mb-1 flex justify-center sm:mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/app-icons/PRO4A.png"
                alt="Police Regional Office 4A"
                className="h-11 w-auto object-contain drop-shadow-md sm:h-28"
              />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-4xl">
              Document Tracker
            </h1>
            <p className="mx-auto mt-1 hidden max-w-md text-sm leading-relaxed text-muted sm:mt-3 sm:block sm:text-base">
              Submit routing slips with QR codes and track your documents in one
              place.
            </p>
          </header>

          <HomeStatusSummary />

          <div className="grid min-h-0 flex-1 auto-rows-min gap-1.5 sm:mt-8 sm:flex-none sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {menuItems.map((item) => (
              <MenuCard
                key={item.href}
                item={item}
                disabled={item.requiresToken && !session}
                onDisabledClick={openModal}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
