import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "..", "templates", "document-template.docx");

const QR_REFERENCE_BLOCK = `<w:p w14:paraId="OCRSQR" w14:textId="OCRSQR" w:rsidR="00B230EC" w:rsidRDefault="00B230EC" w:rsidP="00B230EC"><w:pPr><w:spacing w:after="80" w:line="240" w:lineRule="auto"/><w:jc w:val="right"/><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>{%qrCode}</w:t></w:r></w:p><w:p w14:paraId="OCRSREF" w14:textId="OCRSREF" w:rsidR="00B230EC" w:rsidRDefault="00B230EC" w:rsidP="00B230EC"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="right"/><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>{referenceNumber}</w:t></w:r></w:p>`;

function applyQrReferenceLayout(xml) {
  if (xml.includes('w14:paraId="OCRSQR"') && xml.includes('w14:paraId="OCRSREF"')) {
    return xml;
  }

  const inlinePattern =
    /<w:p w14:paraId="OCRSINLINE"[\s\S]*?<w:t>\{%qrCode\}<\/w:t>[\s\S]*?<\/w:p>/;

  if (inlinePattern.test(xml)) {
    return xml.replace(inlinePattern, QR_REFERENCE_BLOCK);
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

  return xml.slice(0, paragraphStart) + QR_REFERENCE_BLOCK + xml.slice(paragraphEnd);
}

function repairSplitPlaceholders(xml) {
  if (xml.includes("{%qrCode}") && xml.includes("{referenceNumber}")) {
    return xml;
  }

  const qrToken = "<w:t>{%</w:t>";
  const refToken = "<w:t>referenceNumber</w:t>";
  const qrIdx = xml.indexOf(qrToken);
  const refIdx = xml.indexOf(refToken);

  if (qrIdx === -1 || refIdx === -1) {
    throw new Error("Could not find split QR/reference placeholders.");
  }

  const paragraphStart = xml.lastIndexOf("<w:p ", qrIdx);
  const paragraphEnd = xml.indexOf("</w:p>", refIdx) + "</w:p>".length;

  return xml.slice(0, paragraphStart) + QR_REFERENCE_BLOCK + xml.slice(paragraphEnd);
}

function repairPreparedByPlaceholder(xml) {
  if (xml.includes("{drafter}")) {
    return xml;
  }

  const preparedByRun =
    /<w:r w:rsidR="00E026C8"><w:rPr>[\s\S]*?<\/w:rPr><w:t>Pat Renzo T Ranas<\/w:t><\/w:r>/;

  if (preparedByRun.test(xml)) {
    return xml.replace(
      preparedByRun,
      `<w:r w:rsidR="00E026C8"><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="18"/><w:szCs w:val="20"/><w:u w:val="single"/></w:rPr><w:t>{drafter}</w:t></w:r>`
    );
  }

  return xml.replace(
    /(<w:t xml:space="preserve">Prepared by: <\/w:t><\/w:r>)(<w:r[^>]*>[\s\S]*?<w:t>)[^<{][^<]*(<\/w:t><\/w:r>)/,
    `$1<w:r w:rsidR="00E026C8"><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="18"/><w:szCs w:val="20"/><w:u w:val="single"/></w:rPr><w:t>{drafter}</w:t></w:r>`
  );
}

function repairDatePlaceholders(xml) {
  if (xml.includes("{date}") && xml.includes("{time}")) {
    return xml;
  }

  const datePattern =
    /<w:t>June<\/w:t><\/w:r><w:r w:rsidR="00622F7A">[\s\S]*?<w:t>6<\/w:t><\/w:r>/;

  if (!datePattern.test(xml)) {
    throw new Error("Could not find date section to patch.");
  }

  return xml.replace(
    datePattern,
    `<w:t>{date}</w:t></w:r><w:r w:rsidR="00622F7A"><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve"> {time}</w:t></w:r>`
  );
}

const zip = new PizZip(fs.readFileSync(templatePath));
let xml = zip.file("word/document.xml").asText();
xml = repairSplitPlaceholders(xml);
xml = applyQrReferenceLayout(xml);
xml = repairDatePlaceholders(xml);
xml = repairPreparedByPlaceholder(xml);

for (const tag of ["{subject}", "{%qrCode}", "{referenceNumber}", "{date}", "{time}", "{drafter}"]) {
  if (!xml.includes(tag)) {
    throw new Error(`Missing placeholder ${tag} after repair.`);
  }
}

if (/<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*<w:p\b/.test(xml)) {
  throw new Error("Template still contains invalid paragraph-inside-run XML.");
}

zip.file("word/document.xml", xml);
fs.writeFileSync(
  templatePath,
  zip.generate({ type: "nodebuffer", compression: "DEFLATE" })
);
console.log("Template repaired: QR right-aligned, reference number below, drafter on Prepared by");
