import type { OfficeOption } from "@/lib/offices";

export function canEditTrackingAtOffice(
  documentOffice: string | null | undefined,
  entryOffice: string,
  authOffice: OfficeOption
): boolean {
  return documentOffice === authOffice && entryOffice === authOffice;
}
