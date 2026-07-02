export const RECEIVE_DISPOSITIONS = [
  "For Checking",
  "Approved",
  "Return for Correction",
  "Uploaded to OLCIMS",
  "Approved-Completed",
] as const;

export type ReceiveDisposition = (typeof RECEIVE_DISPOSITIONS)[number];

export const OCRS_ONLY_DISPOSITIONS = ["Approved-Completed"] as const;

export const COMPLETED_DISPOSITIONS = [
  "Uploaded to OLCIMS",
  "Uploaded at OLCIMS",
  "Approved-Completed",
] as const;

const BASE_RECEIVE_DISPOSITIONS: ReceiveDisposition[] = [
  "For Checking",
  "Approved",
  "Return for Correction",
  "Uploaded to OLCIMS",
];

export function getReceiveDispositionOptions(office: string): ReceiveDisposition[] {
  const trimmed = office.trim();
  if (trimmed === "OCRS") {
    return [...BASE_RECEIVE_DISPOSITIONS, "Approved-Completed"];
  }
  return [...BASE_RECEIVE_DISPOSITIONS];
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
  if (isCompletedDisposition(status)) {
    return "Uploaded to OLCIMS.";
  }
  return "This document is complete and no longer appears in your receive queue.";
}
