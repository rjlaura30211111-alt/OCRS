/** Mobile-first page widths: full width on small screens, progressively wider on desktop. */
export const PAGE_CONTENT_WIDTH =
  "w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl";

/** Full-view pages: edge-to-edge on phones, wider card on desktop. */
export const PAGE_FULL_WIDTH =
  "w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl";

export const PAGE_WIDE_WIDTH = "w-full lg:max-w-6xl xl:max-w-7xl";

/** Shared card shell: whole-view on mobile, rounded card on sm+. */
export const PAGE_CARD_SHELL =
  "min-h-0 w-full flex-1 flex-col border-y border-border bg-card px-3 py-3 shadow-sm sm:rounded-2xl sm:border sm:p-6 sm:shadow-lg lg:p-8 pb-[max(0.75rem,env(safe-area-inset-bottom))]";

export const APP_SHELL_WIDTH = "mx-auto w-full max-w-6xl xl:max-w-7xl";

export const HOME_LANDING_WIDTH =
  "mx-auto w-full max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl";

export const TRACKING_CARD_WIDTH =
  "w-full sm:max-w-sm lg:max-w-md xl:max-w-lg";
