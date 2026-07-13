export function isDocumentOnHandAtOffice(
  currentOffice: string | null | undefined,
  office: string
): boolean {
  const current = (currentOffice ?? "").trim();
  const viewer = office.trim();
  return Boolean(current && viewer && current === viewer);
}
