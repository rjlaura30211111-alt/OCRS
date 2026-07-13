export const OCRS_COMPLETED_DISPOSITIONS = [
  "Approved by CRS",
  "Noted By CRS",
  "Approved by RD",
  "Noted by RD",
] as const;

export const RECEIVE_DISPOSITIONS = [
  "For Checking",
  "Approved",
  "Return for Correction",
  "Uploaded to OLCIMS",
  "Approved-Completed",
  ...OCRS_COMPLETED_DISPOSITIONS,
] as const;

export type ReceiveDisposition = (typeof RECEIVE_DISPOSITIONS)[number];

export const OCRS_ONLY_DISPOSITIONS = [
  "Uploaded to OLCIMS",
  "Approved-Completed",
  ...OCRS_COMPLETED_DISPOSITIONS,
] as const;

export const COMPLETED_DISPOSITIONS = [
  "Uploaded to OLCIMS",
  "Uploaded at OLCIMS",
  "Approved-Completed",
  ...OCRS_COMPLETED_DISPOSITIONS,
] as const;

const STANDARD_RECEIVE_DISPOSITIONS: ReceiveDisposition[] = [
  "For Checking",
  "Approved",
  "Return for Correction",
];

export function getReceiveDispositionOptions(office: string): ReceiveDisposition[] {
  const trimmed = office.trim();
  if (trimmed === "OCRS") {
    return [
      ...STANDARD_RECEIVE_DISPOSITIONS,
      ...OCRS_COMPLETED_DISPOSITIONS,
      "Uploaded to OLCIMS",
      "Approved-Completed",
    ];
  }
  return [...STANDARD_RECEIVE_DISPOSITIONS];
}

export function canUseReceiveDisposition(
  office: string,
  disposition: string
): boolean {
  return getReceiveDispositionOptions(office).includes(
    disposition as ReceiveDisposition
  );
}

export function isValidReceiveDisposition(
  value: string
): value is ReceiveDisposition {
  return (RECEIVE_DISPOSITIONS as readonly string[]).includes(value);
}

export function formatDispositionLabel(status: string): string {
  switch (status) {
    case "For Checking":
      return "Checking";
    case "Return for Correction":
      return "Returned for Correction";
    case "Uploaded to OLCIMS":
    case "Uploaded at OLCIMS":
      return "Uploaded to OLCIMS";
    case "Approved-Completed":
      return "Approved-Completed";
    case "Approved by CRS":
    case "Noted By CRS":
    case "Approved by RD":
    case "Noted by RD":
      return status;
    default:
      return status;
  }
}

export function isCompletedDisposition(status: string): boolean {
  return (COMPLETED_DISPOSITIONS as readonly string[]).includes(status);
}

export function getCompletedDispositionMessage(status: string): string {
  if (status === "Approved-Completed") {
    return "Marked as Approved-Completed at OCRS.";
  }
  if (
    (OCRS_COMPLETED_DISPOSITIONS as readonly string[]).includes(
      status as (typeof OCRS_COMPLETED_DISPOSITIONS)[number]
    )
  ) {
    return `Marked as ${formatDispositionLabel(status)} at OCRS.`;
  }
  if (isCompletedDisposition(status)) {
    return "Uploaded to OLCIMS.";
  }
  return "This document is complete and no longer appears in your receive queue.";
}
