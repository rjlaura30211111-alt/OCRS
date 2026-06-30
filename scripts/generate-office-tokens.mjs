import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OFFICES = [
  "ORD",
  "ODRDA",
  "ODRDO",
  "OCRS",
  "ORPRMD",
  "ORID",
  "OROD",
  "ORLDDD",
  "ORCADD",
  "ORCD",
  "ORIDMD",
  "ORETD",
  "ORPSMD",
  "ORICTMD",
  "ORESPO",
  "RHSU",
  "RPSMU",
  "RHRU",
  "RDEU",
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function createToken(officeCode) {
  const suffix = crypto.randomBytes(24).toString("hex");
  return `${officeCode.toLowerCase()}_${suffix}`;
}

function formatGeneratedDate(date) {
  return date.toLocaleString("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

async function createQrBuffer(token) {
  const payload = `ocrs-office-token:${token.trim()}`;
  return QRCode.toBuffer(payload, {
    type: "png",
    width: 240,
    margin: 1,
    errorCorrectionLevel: "H",
  });
}

async function writeTokensPdf(rows, outputPath, generatedAt) {
  const qrByOffice = {};
  for (const row of rows) {
    qrByOffice[row.office_code] = await createQrBuffer(row.access_token);
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "OCRS Office Access Tokens",
        Author: "OCRS Document Tracker",
      },
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;

    function drawHeader(title, subtitle) {
      doc
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .fontSize(22)
        .text(title, left, doc.y, { width: pageWidth, align: "center" });

      doc.moveDown(0.4);

      doc
        .fillColor("#475569")
        .font("Helvetica")
        .fontSize(10)
        .text(subtitle, left, doc.y, { width: pageWidth, align: "center" });

      doc.moveDown(1.2);
    }

    function drawConfidentialNotice() {
      doc
        .roundedRect(left, doc.y, pageWidth, 42, 6)
        .fillAndStroke("#fef3c7", "#f59e0b");

      doc
        .fillColor("#92400e")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("CONFIDENTIAL", left + 14, doc.y - 34, { continued: true })
        .font("Helvetica")
        .text(
          " — Share each token only with personnel of the matching office. Do not publish or commit to git."
        );

      doc.moveDown(2);
    }

    // Summary page
    drawHeader("OCRS Office Access Tokens", `Generated: ${formatGeneratedDate(generatedAt)}`);
    drawConfidentialNotice();

    doc
      .fillColor("#0f172a")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Master Token List", left, doc.y);

    doc.moveDown(0.6);

    const colOffice = left;
    const colToken = left + 90;
    const tokenWidth = pageWidth - 90;
    const rowHeight = 22;

    doc
      .rect(colOffice, doc.y, pageWidth, rowHeight)
      .fill("#1e3a5f");

    const headerY = doc.y + 6;
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Office", colOffice + 10, headerY, { width: 70 })
      .text("Access Token", colToken + 4, headerY, { width: tokenWidth - 8 });

    doc.y = headerY + rowHeight - 6;

    rows.forEach((row, index) => {
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
        doc.y = doc.page.margins.top;
      }

      const y = doc.y;
      const fill = index % 2 === 0 ? "#f8fafc" : "#ffffff";

      doc.rect(colOffice, y, pageWidth, rowHeight).fill(fill);

      doc
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(row.office_code, colOffice + 10, y + 6, { width: 70 })
        .font("Courier")
        .fontSize(8.5)
        .text(row.access_token, colToken + 4, y + 7, { width: tokenWidth - 8 });

      doc.y = y + rowHeight;
    });

    // Per-office handout pages (OMI-style with QR)
    for (const row of rows) {
      doc.addPage();

      const headerTop = doc.page.margins.top;
      doc.rect(left, headerTop, pageWidth, 78).fill("#1a3f6f");

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("OCRS Document Tracker", left, headerTop + 18, {
          width: pageWidth,
          align: "center",
        });

      doc
        .font("Helvetica")
        .fontSize(11)
        .text("Office Access Authorization", left, headerTop + 48, {
          width: pageWidth,
          align: "center",
        });

      doc.y = headerTop + 98;

      doc
        .fillColor("#64748b")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("OFFICE", left, doc.y, { width: pageWidth, align: "center" });

      doc.moveDown(0.3);

      doc
        .fillColor("#1a3f6f")
        .font("Helvetica-Bold")
        .fontSize(36)
        .text(row.office_code, left, doc.y, { width: pageWidth, align: "center" });

      doc.moveDown(1.2);

      const qrSize = 132;
      const framePad = 14;
      const frameSize = qrSize + framePad * 2;
      const frameX = left + (pageWidth - frameSize) / 2;
      const frameY = doc.y;

      doc
        .roundedRect(frameX, frameY, frameSize, frameSize, 10)
        .fillAndStroke("#ffffff", "#1a3f6f");

      doc.image(qrByOffice[row.office_code], frameX + framePad, frameY + framePad, {
        width: qrSize,
        height: qrSize,
      });

      doc.y = frameY + frameSize + 14;

      doc
        .fillColor("#1a3f6f")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("SCAN QR TO ACTIVATE", left, doc.y, { width: pageWidth, align: "center" });

      doc.moveDown(0.8);

      doc
        .fillColor("#64748b")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("OR ENTER TOKEN MANUALLY", left, doc.y, { width: pageWidth, align: "center" });

      doc.moveDown(0.4);

      const tokenBoxY = doc.y;
      const tokenBoxHeight = 48;

      doc
        .roundedRect(left + 24, tokenBoxY, pageWidth - 48, tokenBoxHeight, 8)
        .fillAndStroke("#f8fafc", "#cbd5e1");

      doc
        .fillColor("#0f172a")
        .font("Courier")
        .fontSize(9.5)
        .text(row.access_token, left + 36, tokenBoxY + 17, {
          width: pageWidth - 72,
          align: "center",
        });

      doc.y = tokenBoxY + tokenBoxHeight + 20;

      doc
        .fillColor("#334155")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("How to use:", left + 30, doc.y, { width: pageWidth - 60, align: "left" });

      doc.moveDown(0.35);

      doc.font("Helvetica").fontSize(9.5);

      const steps = [
        "1. Open OCRS and tap No Access Token Detected on the home page.",
        "2. Scan this QR code or enter the token manually.",
        "3. All personnel in " + row.office_code + " may share this same token.",
        "4. Receive documents with office auto-selected to " + row.office_code + ".",
        "5. Edit tracking only for documents currently at your office.",
      ];

      for (const step of steps) {
        doc.text(step, left + 30, doc.y, { width: pageWidth - 60 });
        doc.moveDown(0.2);
      }

      doc
        .fillColor("#94a3b8")
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Generated ${formatGeneratedDate(generatedAt)} · OCRS Document Tracker · Keep this page secure`,
          left,
          doc.page.height - 50,
          { width: pageWidth, align: "center" }
        );
    }

    doc.end();
  });
}

const localOnly = process.argv.includes("--local-only");

loadEnvFile(path.join(__dirname, "..", ".env.local"));

const generatedAt = new Date();

function loadExistingTokensFromFile() {
  const tokenPath = path.join(__dirname, "..", "office-tokens.generated.txt");
  if (!fs.existsSync(tokenPath)) {
    return new Map();
  }

  const existing = new Map();

  for (const line of fs.readFileSync(tokenPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    const tab = trimmed.indexOf("\t");
    if (tab === -1) {
      continue;
    }

    const office = trimmed.slice(0, tab).trim();
    const token = trimmed.slice(tab + 1).trim();
    if (office && token) {
      existing.set(office, token);
    }
  }

  return existing;
}

const existingTokens = loadExistingTokensFromFile();

const rows = OFFICES.map((office) => ({
  office_code: office,
  access_token: existingTokens.get(office) ?? createToken(office),
  updated_at: generatedAt.toISOString(),
}));

if (!localOnly) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    console.error("Use --local-only to generate PDF/txt without saving to Supabase.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("office_access_tokens").upsert(rows, {
    onConflict: "office_code",
  });

  if (error) {
    console.error("Failed to save office tokens:", error.message);
    console.error(
      "Run supabase/migrations/20260629120000_office_access_tokens.sql in Supabase SQL Editor first."
    );
    console.error("Or use --local-only to generate PDF/txt only.");
    process.exit(1);
  }

  console.log("Saved tokens to Supabase.");
}

const rootDir = path.join(__dirname, "..");
const txtPath = path.join(rootDir, "office-tokens.generated.txt");
const pdfPath = path.join(rootDir, "office-tokens.generated.pdf");

const lines = [
  "OCRS Office Access Tokens",
  "Generated: " + generatedAt.toISOString(),
  "Keep this file private. Share each token only with the matching office.",
  "",
  ...rows.map((row) => `${row.office_code}\t${row.access_token}`),
  "",
];

fs.writeFileSync(txtPath, lines.join("\n"), "utf8");
await writeTokensPdf(rows, pdfPath, generatedAt);

console.log(`Saved ${rows.length} office tokens to:`);
console.log(`  ${txtPath}`);
console.log(`  ${pdfPath}`);
for (const row of rows) {
  console.log(`${row.office_code}: ${row.access_token}`);
}
