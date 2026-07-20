export const LEGACY_AUTO_COMPLETED_DISPOSITIONS = [
  "Approved by CRS",
  "Noted By CRS",
  "Approved by RD",
  "Noted by RD",
] as const;

export const AUTO_COMPLETED_DISPOSITIONS = [
  "Signed by RD",
  "Signed by CRS",
  ...LEGACY_AUTO_COMPLETED_DISPOSITIONS,
] as const;

export const WORKFLOW_DISPOSITIONS = [
  "Pull-out",
  "Hand Carry",
  "For Concur",
  "HWI",
] as const;

const STANDARD_RECEIVE_DISPOSITIONS = [
  "For Checking",
  "Approved",
  "Return for Correction",
] as const;

export const RECEIVE_DISPOSITIONS = [
  ...STANDARD_RECEIVE_DISPOSITIONS,
  ...AUTO_COMPLETED_DISPOSITIONS,
  ...WORKFLOW_DISPOSITIONS,
  "Uploaded to OLCIMS",
  "Approved-Completed",
] as const;

export type ReceiveDisposition = (typeof RECEIVE_DISPOSITIONS)[number];

export const COMPLETED_DISPOSITIONS = [
  "Uploaded to OLCIMS",
  "Uploaded at OLCIMS",
  "Approved-Completed",
  ...AUTO_COMPLETED_DISPOSITIONS,
] as const;

export function getReceiveDispositionOptions(_office?: string): ReceiveDisposition[] {
  return [...RECEIVE_DISPOSITIONS];
}

export function canUseReceiveDisposition(
  _office: string,
  disposition: string
): boolean {
  return isValidReceiveDisposition(disposition);
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
  if (
    (AUTO_COMPLETED_DISPOSITIONS as readonly string[]).includes(
      status as (typeof AUTO_COMPLETED_DISPOSITIONS)[number]
    )
  ) {
    return `Document marked as ${formatDispositionLabel(status)}.`;
  }
  if (isCompletedDisposition(status)) {
    return "Uploaded to OLCIMS.";
  }
  return "This document is complete and no longer appears in your receive queue.";
}
