import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "..", "templates", "routine.docx");
const outputPath = path.join(__dirname, "..", "templates", "document-template.docx");

const zip = new PizZip(fs.readFileSync(templatePath));
let xml = zip.file("word/document.xml").asText();

const subjectPattern =
  /<w:t>Submission<\/w:t><\/w:r>(?:<w:proofErr[^/]*\/>)*<w:r w:rsidR="00022B48" w:rsidRPr="00022B48"><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"\/><w:b\/><w:bCs\/><w:sz w:val="24"\/><w:szCs w:val="24"\/><\/w:rPr><w:t xml:space="preserve"> of Percentage of Communications Technology Compliant PNP Offices\/Units Report<\/w:t><\/w:r>/;

if (!subjectPattern.test(xml)) {
  throw new Error("Could not find subject text to replace in routine.docx");
}

xml = xml.replace(subjectPattern, "<w:t>{subject}</w:t></w:r>");

const controlPattern = /<w:t>Control Number<\/w:t><\/w:r><\/w:p><\/w:tc><\/w:tr><\/w:tbl>/;

if (!controlPattern.test(xml)) {
  throw new Error("Could not find Control Number section in routine.docx");
}

xml = xml.replace(
  controlPattern,
  `<w:t>Control Number: {referenceNumber}</w:t></w:r></w:p><w:p w14:paraId="OCRSQR01" w14:textId="OCRSQR01" w:rsidR="003945FE" w:rsidRDefault="003945FE"><w:pPr><w:jc w:val="center"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>{%qrCode}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`
);

zip.file("word/document.xml", xml);
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(outputPath, out);
try {
  fs.writeFileSync(templatePath, out);
} catch {
  console.warn("Could not update routine.docx (file may be open). document-template.docx was updated.");
}
console.log("Patched template with {subject}, {referenceNumber}, {%qrCode}");
