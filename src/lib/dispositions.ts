export const RECEIVE_DISPOSITIONS = [
  "For Checking",
  "Approved",
  "Return for Correction",
  "Uploaded to OLCIMS",
] as const;

export type ReceiveDisposition = (typeof RECEIVE_DISPOSITIONS)[number];

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
      return "Uploaded to OLCIMS";
    default:
      return status;
  }
}

export function isCompletedDisposition(status: string): boolean {
  return status === "Uploaded to OLCIMS";
}
