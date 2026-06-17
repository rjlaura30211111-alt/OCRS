import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import PizZip from "pizzip";
import type { ActionRequested } from "@/lib/actions";
import { formatDisplayDate, formatDisplayTime } from "@/lib/datetime";
import { highlightActionInDocument } from "@/lib/highlight-action";
import { QR_WORD_SIZE_PX } from "@/lib/qr-config";
import { readTemplateBuffer, TEMPLATE_FILENAME } from "@/lib/project-paths";
import { repairTemplateIfNeeded } from "@/lib/repair-template-runtime";

export { TEMPLATE_FILENAME };

export type FillReportInput = {
  subject: string;
  referenceNumber: string;
  date: string;
  time: string;
  actionRequested: ActionRequested;
  qrPng: Buffer;
};

export const TEMPLATE_PLACEHOLDERS = {
  subject: "{subject}",
  referenceNumber: "{referenceNumber}",
  date: "{date}",
  time: "{time}",
  qrCode: "{%qrCode}",
} as const;

function validateTemplatePlaceholders(templateBuffer: Buffer): void {
  const zip = new PizZip(templateBuffer);
  const xml = zip.file("word/document.xml")?.asText() ?? "";

  const missing = Object.values(TEMPLATE_PLACEHOLDERS).filter(
    (tag) => !xml.includes(tag)
  );

  if (missing.length > 0) {
    throw new Error(
      `Word template is missing placeholders: ${missing.join(", ")}. ` +
        "Run: node scripts/repair-template.mjs"
    );
  }

  if (/<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*<w:p\b/.test(xml)) {
    throw new Error(
      "Word template XML is invalid. Run: node scripts/repair-template.mjs"
    );
  }
}

function loadTemplateBuffer(): Buffer {
  try {
    const buffer = readTemplateBuffer();
    validateTemplatePlaceholders(buffer);
    return buffer;
  } catch {
    return repairTemplateIfNeeded();
  }
}

export async function fillWordTemplate(input: FillReportInput): Promise<Buffer> {
  const templateBuffer = loadTemplateBuffer();
  const zip = new PizZip(templateBuffer);

  const imageModule = new ImageModule({
    centered: false,
    getImage(tagValue: string) {
      return Buffer.from(tagValue, "base64");
    },
    getSize() {
      return [QR_WORD_SIZE_PX, QR_WORD_SIZE_PX];
    },
  });

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
  });

  try {
    doc.render({
      subject: input.subject.trim(),
      referenceNumber: input.referenceNumber.trim(),
      date: formatDisplayDate(input.date),
      time: formatDisplayTime(input.time),
      qrCode: input.qrPng.toString("base64"),
    });
  } catch (error) {
    const details =
      error && typeof error === "object" && "properties" in error
        ? (error as { properties?: { explanation?: string } }).properties
            ?.explanation
        : undefined;
    throw new Error(details ?? "Could not fill the Word template.");
  }

  const outputZip = doc.getZip();
  const documentXml = outputZip.file("word/document.xml")?.asText() ?? "";
  outputZip.file(
    "word/document.xml",
    highlightActionInDocument(documentXml, input.actionRequested)
  );

  return outputZip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;
}
