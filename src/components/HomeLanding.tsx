import Link from "next/link";

function SubmitIcon() {
  return (
    <svg
      aria-hidden
      className="h-7 w-7"
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

function TrackIcon() {
  return (
    <svg
      aria-hidden
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
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
    iconBg: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    ring: "group-hover:ring-blue-200",
  },
  {
    href: "/track",
    title: "Track My Document",
    description: "Look up the status and location of a submitted document.",
    action: "Track document",
    icon: TrackIcon,
    accent: "from-violet-500 to-violet-600",
    iconBg: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
    ring: "group-hover:ring-violet-200",
  },
] as const;

export function HomeLanding() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
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

      <div className="relative w-full max-w-3xl">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-black/5">
            <svg
              aria-hidden
              className="h-7 w-7 text-blue-600"
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
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Document Tracker
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted">
            Submit routing slips with QR codes and track your documents in one place.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:ring-2 ${item.ring}`}
              >
                <div
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent} opacity-0 transition group-hover:opacity-100`}
                />

                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition duration-300 ${item.iconBg}`}
                >
                  <Icon />
                </div>

                <h2 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition group-hover:gap-2.5 group-hover:text-primary">
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
