export const RECEIVE_DISPOSITIONS = [
  "For Checking",
  "Approved",
  "For Approval",
  "Return for Correction",
  "Uploaded at OLCIMS",
] as const;

export type ReceiveDisposition = (typeof RECEIVE_DISPOSITIONS)[number];

export function isValidReceiveDisposition(
  value: string
): value is ReceiveDisposition {
  return (RECEIVE_DISPOSITIONS as readonly string[]).includes(value);
}
