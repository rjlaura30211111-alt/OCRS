export const OFFICE_CODES = [
  "R1",
  "R2",
  "R4",
  "R6",
  "OCRS",
  "Regional Director",
  "OLCIMS",
] as const;

export type OfficeCode = (typeof OFFICE_CODES)[number];

export function isValidOfficeCode(value: string): boolean {
  return value.trim().length > 0;
}
