/** Legacy centered pages — still full viewport width. */
export const PAGE_CONTENT_WIDTH = "w-full max-w-none";

/** Full-screen pages: flush to both edges on all screen sizes. */
export const PAGE_FULL_WIDTH = "w-full max-w-none";

export const PAGE_WIDE_WIDTH = "w-full max-w-none";

/** Full-screen panel — no floating card, fills the content area. */
export const PAGE_CARD_SHELL =
  "flex min-h-0 w-full flex-1 flex-col bg-card px-4 py-3 sm:px-6 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]";

export const APP_SHELL_WIDTH = "w-full px-4 sm:px-6";

export const HOME_LANDING_WIDTH = "w-full max-w-none";

export const TRACKING_CARD_WIDTH = "w-full max-w-none";

export const PAGE_HEADING_CLASS =
  "text-lg font-semibold tracking-tight text-slate-900 sm:text-xl";

export const PAGE_SUBHEADING_CLASS = "mt-0.5 text-xs text-muted";

export const FORM_LABEL_CLASS = "mb-1 block text-xs font-medium sm:text-sm";

export const FORM_INPUT_CLASS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export const FORM_BUTTON_CLASS =
  "w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";

/** Multi-column forms that use the full screen width on desktop. */
export const FORM_GRID_CLASS =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
