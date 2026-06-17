export function highlightActionInDocument(
  xml: string,
  actionRequested: string
): string {
  const escaped = actionRequested.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(<w:r[^>]*>\\s*<w:rPr>)([\\s\\S]*?)(</w:rPr>\\s*<w:t(?:\\s[^>]*)?>${escaped}</w:t>)`,
    "i"
  );

  return xml.replace(pattern, (match, open, rPrContent, rest) => {
    if (rPrContent.includes("w:highlight")) {
      return match;
    }
    return `${open}${rPrContent}<w:highlight w:val="yellow"/>${rest}`;
  });
}
