export const QR_REFERENCE_BLOCK = `<w:p w14:paraId="OCRSQR" w14:textId="OCRSQR" w:rsidR="00B230EC" w:rsidRDefault="00B230EC" w:rsidP="00B230EC"><w:pPr><w:spacing w:after="80" w:line="240" w:lineRule="auto"/><w:jc w:val="right"/><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>{%qrCode}</w:t></w:r></w:p><w:p w14:paraId="OCRSREF" w14:textId="OCRSREF" w:rsidR="00B230EC" w:rsidRDefault="00B230EC" w:rsidP="00B230EC"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="right"/><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>{referenceNumber}</w:t></w:r></w:p>`;

export function applyQrReferenceLayout(xml: string): string {
  if (xml.includes('w14:paraId="OCRSQR"') && xml.includes('w14:paraId="OCRSREF"')) {
    return xml;
  }

  const inlinePattern =
    /<w:p w14:paraId="OCRSINLINE"[\s\S]*?<w:t>\{%qrCode\}<\/w:t>[\s\S]*?<\/w:p>/;

  if (inlinePattern.test(xml)) {
    return xml.replace(inlinePattern, QR_REFERENCE_BLOCK);
  }

  const splitPattern =
    /<w:p[^>]*>[\s\S]*?<w:t>\{%<\/w:t>[\s\S]*?<w:t>qrCode<\/w:t>[\s\S]*?<\/w:p>\s*<w:p[^>]*>[\s\S]*?<w:t>\{<\/w:t>[\s\S]*?<w:t>referenceNumber<\/w:t>[\s\S]*?<\/w:p>/;

  if (splitPattern.test(xml)) {
    return xml.replace(splitPattern, QR_REFERENCE_BLOCK);
  }

  const qrIdx = xml.indexOf("{%qrCode}");
  if (qrIdx === -1) {
    return xml;
  }

  const paragraphStart = xml.lastIndexOf("<w:p ", qrIdx);
  const refIdx = xml.indexOf("{referenceNumber}", qrIdx);
  const paragraphEnd =
    refIdx === -1
      ? xml.indexOf("</w:p>", qrIdx) + "</w:p>".length
      : xml.indexOf("</w:p>", refIdx) + "</w:p>".length;

  if (paragraphStart === -1 || paragraphEnd <= paragraphStart) {
    return xml;
  }

  return xml.slice(0, paragraphStart) + QR_REFERENCE_BLOCK + xml.slice(paragraphEnd);
}
