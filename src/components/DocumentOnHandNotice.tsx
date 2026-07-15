type DocumentOnHandNoticeProps = {
  office: string;
  referenceNumber: string;
  subject?: string;
};

export function DocumentOnHandNotice({
  office,
  referenceNumber,
  subject,
}: DocumentOnHandNoticeProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-50 shadow-sm">
      <div className="border-b border-sky-100 bg-sky-100/60 px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md">
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
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-sky-950">
              The report you are scanning is currently at your office
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-sky-800/90">
              This document is already on-hand at {office}. Check your Office
              Inbox or the routing timeline below instead of scanning again.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 sm:px-5">
        <p className="font-mono text-sm font-bold text-[#1a3f6f]">
          {referenceNumber}
        </p>
        {subject && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-700">{subject}</p>
        )}
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs leading-relaxed text-slate-600 ring-1 ring-sky-100">
          Current track:{" "}
          <span className="font-semibold text-emerald-700">{office}</span>
        </p>
      </div>
    </div>
  );
}
