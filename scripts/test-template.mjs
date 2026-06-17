import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import PizZip from "pizzip";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "..", "templates", "document-template.docx");

const qrPng = await QRCode.toBuffer("REF-TEST", { type: "png", width: 300 });
const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);

const imageModule = new ImageModule({
  centered: false,
  getImage(tagValue) {
    return Buffer.from(tagValue, "base64");
  },
  getSize() {
    return [200, 200];
  },
});

const doc = new Docxtemplater(zip, {
  modules: [imageModule],
  paragraphLoop: true,
  linebreaks: true,
});

doc.render({
  referenceNumber: "REF-TEST",
  qrCode: qrPng.toString("base64"),
});

const out = doc.getZip().generate({ type: "nodebuffer" });
fs.writeFileSync(path.join(__dirname, "..", "test-out.docx"), out);
console.log("OK", out.length);
