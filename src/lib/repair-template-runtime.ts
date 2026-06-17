import fs from "fs";
import PizZip from "pizzip";
import { findTemplatePath } from "@/lib/project-paths";
import { applyQrReferenceLayout, QR_REFERENCE_BLOCK } from "@/lib/qr-template-layout";

const REQUIRED_TAGS = [
  "{subject}",
  "{%qrCode}",
  "{referenceNumber}",
  "{date}",
  "{time}",
];

function repairSplitPlaceholders(xml: string): string {
  if (xml.includes("{%qrCode}") && xml.includes("{referenceNumber}")) {
    return xml;
  }

  const qrToken = "<w:t>{%</w:t>";
  const refToken = "<w:t>referenceNumber</w:t>";
  const qrIdx = xml.indexOf(qrToken);
  const refIdx = xml.indexOf(refToken);

  if (qrIdx === -1 || refIdx === -1) {
    return xml;
  }

  const paragraphStart = xml.lastIndexOf("<w:p ", qrIdx);
  const paragraphEnd = xml.indexOf("</w:p>", refIdx) + "</w:p>".length;

  if (paragraphStart === -1 || paragraphEnd <= paragraphStart) {
    return xml;
  }

  return xml.slice(0, paragraphStart) + QR_REFERENCE_BLOCK + xml.slice(paragraphEnd);
}

function repairDatePlaceholders(xml: string): string {
  if (xml.includes("{date}") && xml.includes("{time}")) {
    return xml;
  }

  const datePattern =
    /<w:t>June<\/w:t><\/w:r><w:r w:rsidR="00622F7A">[\s\S]*?<w:t>6<\/w:t><\/w:r>/;

  if (!datePattern.test(xml)) {
    return xml;
  }

  return xml.replace(
    datePattern,
    `<w:t>{date}</w:t></w:r><w:r w:rsidR="00622F7A"><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve"> {time}</w:t></w:r>`
  );
}

export function repairTemplateBuffer(input: Buffer): Buffer {
  const zip = new PizZip(input);
  let xml = zip.file("word/document.xml")?.asText() ?? "";

  xml = repairSplitPlaceholders(xml);
  xml = applyQrReferenceLayout(xml);
  xml = repairDatePlaceholders(xml);

  const missing = REQUIRED_TAGS.filter((tag) => !xml.includes(tag));
  if (missing.length > 0) {
    throw new Error(
      `Word template is missing placeholders: ${missing.join(", ")}. ` +
        "Run: npm run repair-template"
    );
  }

  if (/<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*<w:p\b/.test(xml)) {
    throw new Error(
      "Word template XML is invalid. Run: npm run repair-template"
    );
  }

  zip.file("word/document.xml", xml);
  return zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;
}

export function repairTemplateIfNeeded(): Buffer {
  const templatePath = findTemplatePath();
  const repaired = repairTemplateBuffer(fs.readFileSync(templatePath));

  try {
    fs.writeFileSync(templatePath, repaired);
  } catch {
    // Read-only filesystem (e.g. Vercel serverless).
  }

  return repaired;
}
