/** Mobile-first page widths: full width on small screens, progressively wider on desktop. */
export const PAGE_CONTENT_WIDTH =
  "w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl";

/** Compact full-view pages: edge-to-edge on phones, narrow focused card on desktop. */
export const PAGE_FULL_WIDTH =
  "w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl";

export const PAGE_WIDE_WIDTH = "w-full md:max-w-2xl lg:max-w-4xl xl:max-w-5xl";

/** Shared card shell: whole-view on mobile, compact rounded card on sm+. */
export const PAGE_CARD_SHELL =
  "w-full flex-col border-y border-border bg-card px-3 py-2 shadow-sm sm:rounded-xl sm:border sm:p-4 sm:shadow-md pb-[max(0.5rem,env(safe-area-inset-bottom))]";

export const APP_SHELL_WIDTH = "mx-auto w-full max-w-6xl xl:max-w-7xl";

export const HOME_LANDING_WIDTH =
  "mx-auto w-full max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl";

export const TRACKING_CARD_WIDTH =
  "w-full sm:max-w-xs lg:max-w-sm xl:max-w-md";

export const PAGE_HEADING_CLASS =
  "text-lg font-semibold tracking-tight text-slate-900 sm:text-xl";

export const PAGE_SUBHEADING_CLASS = "mt-0.5 text-xs text-muted";

export const FORM_LABEL_CLASS = "mb-1 block text-xs font-medium sm:text-sm";

export const FORM_INPUT_CLASS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export const FORM_BUTTON_CLASS =
  "w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";
