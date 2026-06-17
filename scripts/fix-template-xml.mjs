import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "..", "templates", "document-template.docx");

const zip = new PizZip(fs.readFileSync(templatePath));
let xml = zip.file("word/document.xml").asText();

const brokenPattern =
  /<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"\/><w:sz w:val="20"\/><w:szCs w:val="20"\/><\/w:rPr><w:t xml:space="preserve">\s+<\/w:t><\/w:r><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"\/><w:sz w:val="20"\/><w:szCs w:val="20"\/><\/w:rPr><w:p w14:paraId="OCRSINLINE"[\s\S]*?<w:t>\{%qrCode\} \{referenceNumber\}<\/w:t><\/w:r><\/w:p>/;

const fixedParagraph = `</w:p><w:p w14:paraId="OCRSINLINE" w14:textId="OCRSINLINE" w:rsidR="00B230EC" w:rsidRDefault="00B230EC" w:rsidP="00B230EC"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>{%qrCode}</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve"> {referenceNumber}</w:t></w:r></w:p>`;

if (!brokenPattern.test(xml)) {
  throw new Error("Could not find broken inline QR section to repair.");
}

xml = xml.replace(brokenPattern, fixedParagraph);

if (/<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*<w:p\b/.test(xml)) {
  throw new Error("Template still contains invalid paragraph-inside-run XML.");
}

zip.file("word/document.xml", xml);
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(templatePath, out);
console.log("Repaired document-template.docx XML structure");
