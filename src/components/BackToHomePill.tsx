import Link from "next/link";

type BackToHomePillProps = {
  href?: string;
  label?: string;
};

export function BackToHomePill({
  href = "/",
  label = "Back to Home",
}: BackToHomePillProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#1a3f6f] to-[#2563eb] px-4 py-2 text-xs font-semibold text-white shadow-md ring-1 ring-[#1a3f6f]/20 transition hover:-translate-y-px hover:shadow-lg hover:brightness-105 active:translate-y-0 sm:text-sm"
    >
      <svg
        aria-hidden
        className="size-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.25}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
        />
      </svg>
      {label}
    </Link>
  );
}
