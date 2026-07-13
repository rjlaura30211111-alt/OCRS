export function isWrongReceivingOffice(
  sessionOffice: string,
  destinationOffice: string | null | undefined
): boolean {
  const destination = destinationOffice?.trim();
  if (!destination) {
    return false;
  }

  return sessionOffice.trim() !== destination;
}

export function getWrongDestinationMessage(destinationOffice: string): string {
  return `Wrong receiving office. This document is for ${destinationOffice}. Please proceed to ${destinationOffice}.`;
}
