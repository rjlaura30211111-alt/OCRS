import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "..", "templates", "document-template.docx");

const zip = new PizZip(fs.readFileSync(templatePath));
let xml = zip.file("word/document.xml").asText();

xml = xml.replace(
  /<w:t>\{<\/w:t><\/w:r><w:proofErr w:type="gramEnd"\/><w:r w:rsidR="00022B48" w:rsidRPr="00022B48"><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"\/><w:b\/><w:bCs\/><w:sz w:val="24"\/><w:szCs w:val="24"\/><\/w:rPr><w:t>subject\}<\/w:t>/,
  "<w:t>{subject}</w:t>"
);

const inlineQrPattern =
  /<w:t>\{%<\/w:t><\/w:r><w:proofErr w:type="spellStart"\/><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"\/><w:sz w:val="20"\/><w:szCs w:val="20"\/><\/w:rPr><w:t>qrCode<\/w:t><\/w:r><w:proofErr w:type="spellEnd"\/><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"\/><w:sz w:val="20"\/><w:szCs w:val="20"\/><\/w:rPr><w:t>\}<\/w:t><\/w:r><\/w:p><w:p w14:paraId="7B964549"[\s\S]*?<w:t>\{<\/w:t><\/w:r><w:proofErr w:type="spellStart"\/><w:r><w:rPr>[\s\S]*?<w:t>referenceNumber<\/w:t><\/w:r><w:proofErr w:type="spellEnd"\/><w:r><w:rPr>[\s\S]*?<w:t>\}<\/w:t><\/w:r><\/w:p>/;

const inlineParagraph = `<w:p w14:paraId="OCRSINLINE" w14:textId="OCRSINLINE" w:rsidR="00B230EC" w:rsidRDefault="00B230EC" w:rsidP="00B230EC"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Times New Roman" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>{%qrCode} {referenceNumber}</w:t></w:r></w:p>`;

if (!inlineQrPattern.test(xml)) {
  throw new Error("Could not find QR + reference section to patch.");
}

xml = xml.replace(inlineQrPattern, inlineParagraph);

zip.file("word/document.xml", xml);
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(templatePath, out);
console.log("Template updated: inline {%qrCode} before {referenceNumber}");
