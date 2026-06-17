export const OFFICE_DIVISIONS = [
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "R7",
  "R8",
  "R9",
  "R10",
  "RHSU",
  "ORESPO",
  "RPSMU",
  "RHRD",
] as const;

export type OfficeDivision = (typeof OFFICE_DIVISIONS)[number];

/** Offices for receive/routing — includes divisions plus workflow destinations */
export const RECEIVE_OFFICE_OPTIONS = [
  ...OFFICE_DIVISIONS,
  "OCRS",
  "Regional Director",
  "OLCIMS",
] as const;

export function isValidOfficeDivision(value: string): value is OfficeDivision {
  return (OFFICE_DIVISIONS as readonly string[]).includes(value);
}

export function isValidReceiveOffice(value: string): boolean {
  return value.trim().length > 0;
}
