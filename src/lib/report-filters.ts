import { isCompletedDisposition } from "@/lib/dispositions";

export type TrackingPhase = "pending" | "on-process" | "completed";

export type DateRangePreset =
  | "today"
  | "last3"
  | "last7"
  | "month"
  | "all"
  | "custom";

export type TrackingPhaseFilter = TrackingPhase | "all";

export const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "last3", label: "Last 3 Days" },
  { value: "last7", label: "Last 7 Days" },
  { value: "month", label: "Whole Month" },
  { value: "all", label: "View All" },
  { value: "custom", label: "Custom Date" },
];

export const TRACKING_PHASE_OPTIONS: {
  value: TrackingPhaseFilter;
  label: string;
}[] = [
  { value: "pending", label: "Pending" },
  { value: "on-process", label: "On-Process" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "View All" },
];

export function deriveTrackingPhase(input: {
  status: string;
  submitOffice: string;
  currentOffice: string | null;
}): TrackingPhase {
  if (isCompletedDisposition(input.status)) {
    return "completed";
  }

  const origin = input.submitOffice.trim();
  const current = (input.currentOffice ?? "").trim();

  if (origin && current && current !== origin) {
    return "on-process";
  }

  return "pending";
}

export function formatTrackingPhaseLabel(phase: TrackingPhase): string {
  switch (phase) {
    case "pending":
      return "Pending";
    case "on-process":
      return "On-Process";
    case "completed":
      return "Completed";
  }
}

function toLocalDateKey(isoTimestamp: string): string | null {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function shiftLocalDate(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function todayLocalDateKey(): string {
  return shiftLocalDate(0);
}

function startOfCurrentMonthKey(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function matchesDateRange(
  createdAt: string,
  preset: DateRangePreset,
  customFrom: string,
  customTo: string
): boolean {
  const createdKey = toLocalDateKey(createdAt);
  if (!createdKey) {
    return false;
  }

  switch (preset) {
    case "all":
      return true;
    case "today":
      return createdKey === todayLocalDateKey();
    case "last3":
      return createdKey >= shiftLocalDate(-2);
    case "last7":
      return createdKey >= shiftLocalDate(-6);
    case "month":
      return (
        createdKey >= startOfCurrentMonthKey() &&
        createdKey <= todayLocalDateKey()
      );
    case "custom": {
      if (!customFrom && !customTo) {
        return true;
      }
      if (customFrom && createdKey < customFrom) {
        return false;
      }
      if (customTo && createdKey > customTo) {
        return false;
      }
      return true;
    }
  }
}

export function matchesTrackingPhase(
  phase: TrackingPhase,
  filter: TrackingPhaseFilter
): boolean {
  return filter === "all" || phase === filter;
}
