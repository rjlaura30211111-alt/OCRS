import type { OfficeOption } from "@/lib/offices";

export function isOcrsOffice(office: string | null | undefined): boolean {
  return office?.trim() === "OCRS";
}

export function canEditTrackingAtOffice(
  documentOffice: string | null | undefined,
  entryOffice: string,
  authOffice: OfficeOption
): boolean {
  return documentOffice === authOffice && entryOffice === authOffice;
}
