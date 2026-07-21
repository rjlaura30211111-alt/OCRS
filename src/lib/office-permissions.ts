import type { OfficeOption } from "@/lib/offices";
import { isCompletedDisposition } from "@/lib/dispositions";

export function isOcrsOffice(office: string | null | undefined): boolean {
  return office?.trim() === "OCRS";
}

export function canEditReportAtOffice(
  documentOffice: string | null | undefined,
  authOffice: OfficeOption,
  rawStatus: string
): boolean {
  if (isCompletedDisposition(rawStatus)) {
    return false;
  }

  return (documentOffice ?? "").trim() === authOffice;
}

export function canEditSubmissionAtOffice(
  documentOffice: string | null | undefined,
  submitOffice: string,
  authOffice: OfficeOption
): boolean {
  return documentOffice === authOffice && submitOffice === authOffice;
}

export function canEditTrackingAtOffice(
  documentOffice: string | null | undefined,
  entryOffice: string,
  authOffice: OfficeOption
): boolean {
  return documentOffice === authOffice && entryOffice === authOffice;
}
