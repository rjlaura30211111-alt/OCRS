import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_FILENAME = "document-template.docx";

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: "YOUR DOCUMENT TITLE HERE",
              bold: true,
              size: 32,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Reference Number: ", bold: true, size: 24 }),
            new TextRun({ text: "{referenceNumber}", size: 24 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ text: "{%qrCode}", size: 24 })],
        }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
const dir = path.join(__dirname, "..", "templates");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, TEMPLATE_FILENAME), buffer);
console.log(`Created templates/${TEMPLATE_FILENAME}`);
