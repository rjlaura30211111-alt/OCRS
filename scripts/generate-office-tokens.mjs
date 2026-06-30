import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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

loadEnvFile(path.join(__dirname, "..", ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rows = OFFICES.map((office) => ({
  office_code: office,
  access_token: createToken(office),
  updated_at: new Date().toISOString(),
}));

const { error } = await supabase.from("office_access_tokens").upsert(rows, {
  onConflict: "office_code",
});

if (error) {
  console.error("Failed to save office tokens:", error.message);
  process.exit(1);
}

const outputPath = path.join(__dirname, "..", "office-tokens.generated.txt");
const lines = [
  "OCRS Office Access Tokens",
  "Generated: " + new Date().toISOString(),
  "Keep this file private. Share each token only with the matching office.",
  "",
  ...rows.map((row) => `${row.office_code}\t${row.access_token}`),
  "",
];

fs.writeFileSync(outputPath, lines.join("\n"), "utf8");

console.log(`Saved ${rows.length} office tokens to ${outputPath}`);
for (const row of rows) {
  console.log(`${row.office_code}: ${row.access_token}`);
}
