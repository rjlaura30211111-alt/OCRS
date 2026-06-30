import type { OfficeOption } from "@/lib/offices";

export const OFFICE_SESSION_KEY = "ocrs-office-session";

export type OfficeSession = {
  office: OfficeOption;
  token: string;
};

export function readOfficeSession(): OfficeSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OFFICE_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as OfficeSession;
    if (!parsed?.office || !parsed?.token) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeOfficeSession(session: OfficeSession): void {
  window.localStorage.setItem(OFFICE_SESSION_KEY, JSON.stringify(session));
}

export function clearOfficeSession(): void {
  window.localStorage.removeItem(OFFICE_SESSION_KEY);
}

export function officeAuthHeaders(token: string): HeadersInit {
  return {
    "X-Office-Token": token,
  };
}
