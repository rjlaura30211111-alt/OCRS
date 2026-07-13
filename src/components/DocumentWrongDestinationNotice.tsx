type DocumentWrongDestinationNoticeProps = {
  destinationOffice: string;
  sessionOffice: string;
  referenceNumber: string;
  subject?: string;
};

export function DocumentWrongDestinationNotice({
  destinationOffice,
  sessionOffice,
  referenceNumber,
  subject,
}: DocumentWrongDestinationNoticeProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm">
      <div className="border-b border-amber-100 bg-amber-100/60 px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
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
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-950">
              Wrong receiving office
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-900/90">
              This document is not for {sessionOffice}. Please proceed to{" "}
              <span className="font-semibold">{destinationOffice}</span> to
              receive it.
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
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs leading-relaxed text-slate-600 ring-1 ring-amber-100">
          Office destination:{" "}
          <span className="font-semibold text-amber-800">
            {destinationOffice}
          </span>
        </p>
      </div>
    </div>
  );
}
