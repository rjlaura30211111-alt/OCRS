export const OFFICE_OPTIONS = [
  "ORD",
  "ODRDA",
  "ODRDO",
  "OCRS",
  "ORPRMD",
  "ORID",
  "OROD",
  "ORLDDD",
  "ORCADD",
  "ORCD",
  "ORIDMD",
  "ORETD",
  "ORPSMD",
  "ORICTMD",
  "ORESPO",
  "RHSU",
  "RPSMU",
  "RHRU",
  "RDEU",
  "ORLRDD",
  "RMDU",
  "RPIO",
  "RCEU",
  "RITO",
] as const;

export type OfficeOption = (typeof OFFICE_OPTIONS)[number];

/** @deprecated use OFFICE_OPTIONS */
export const OFFICE_DIVISIONS = OFFICE_OPTIONS;

export type OfficeDivision = OfficeOption;

export const RECEIVE_OFFICE_OPTIONS = OFFICE_OPTIONS;

export function isValidOfficeOption(value: string): value is OfficeOption {
  return (OFFICE_OPTIONS as readonly string[]).includes(value);
}

export function isValidOfficeDivision(value: string): value is OfficeOption {
  return isValidOfficeOption(value);
}

export function isValidReceiveOffice(value: string): boolean {
  return isValidOfficeOption(value);
}
