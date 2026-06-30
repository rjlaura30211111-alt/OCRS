const OFFICE_TOKEN_PREFIX = "ocrs-office-token:";

export function normalizeOfficeToken(raw: string): string {
  let token = raw.trim();

  if (!token) {
    return "";
  }

  // QR scanners sometimes add line breaks or spaces.
  token = token.replace(/\s+/g, "");

  if (token.startsWith(OFFICE_TOKEN_PREFIX)) {
    token = token.slice(OFFICE_TOKEN_PREFIX.length);
  }

  // Accept prefixed QR payloads like "ORICTMD:orictmd_abc..."
  const officePrefix = token.match(/^[A-Z]{2,8}:(.+)$/);
  if (officePrefix && officePrefix[1].includes("_")) {
    token = officePrefix[1];
  }

  // If a URL was scanned accidentally, pull ?token=...
  if (token.includes("token=")) {
    try {
      const url = token.startsWith("http")
        ? new URL(token)
        : new URL(`https://local.invalid/?${token.replace(/^\?/, "")}`);
      const param = url.searchParams.get("token");
      if (param) {
        token = param;
      }
    } catch {
      // keep original token
    }
  }

  return token.trim();
}

export function officeTokenQrPayload(token: string): string {
  return `${OFFICE_TOKEN_PREFIX}${normalizeOfficeToken(token)}`;
}
