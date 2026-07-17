import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OFFICE = "ORPRMD-DLOS";
const LEGACY_TOKEN = "rprmddlos_88a3795a322f0d2392c4dabeadb5d500be07809a065b6995";

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

function createToken() {
  return `orprmddlos_${crypto.randomBytes(24).toString("hex")}`;
}

function updateTokenFile(office, token) {
  const txtPath = path.join(__dirname, "..", "office-tokens.generated.txt");
  const lines = fs.existsSync(txtPath)
    ? fs.readFileSync(txtPath, "utf8").split(/\r?\n/)
    : [];

  const merged = new Map();
  for (const line of lines) {
    const tab = line.indexOf("\t");
    if (tab === -1) {
      continue;
    }
    const code = line.slice(0, tab).trim();
    const value = line.slice(tab + 1).trim();
    if (code && value) {
      merged.set(code, value);
    }
  }

  merged.set(office, token);
  merged.delete("RPRMD-DLOS");

  const header = [
    "OCRS Office Access Tokens",
    `Generated: ${new Date().toISOString()}`,
    "Keep this file private. Share each token only with the matching office.",
    "",
  ];

  const body = [...merged.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, value]) => `${code}\t${value}`);

  fs.writeFileSync(txtPath, [...header, ...body, ""].join("\n"), "utf8");
}

loadEnvFile(path.join(__dirname, "..", ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const newToken = createToken();

const { data: existing, error: fetchError } = await supabase
  .from("office_access_tokens")
  .select("office_code, access_token")
  .eq("office_code", OFFICE)
  .maybeSingle();

if (fetchError) {
  console.error("Failed to read current token:", fetchError.message);
  process.exit(1);
}

if (existing) {
  const { error: updateError } = await supabase
    .from("office_access_tokens")
    .update({
      access_token: newToken,
      updated_at: new Date().toISOString(),
    })
    .eq("office_code", OFFICE);

  if (updateError) {
    console.error("Failed to update ORPRMD-DLOS token:", updateError.message);
    process.exit(1);
  }
} else {
  const { error: insertError } = await supabase.from("office_access_tokens").insert({
    office_code: OFFICE,
    access_token: newToken,
  });

  if (insertError) {
    console.error("Failed to insert ORPRMD-DLOS token:", insertError.message);
    process.exit(1);
  }
}

const { error: legacyError } = await supabase.from("office_access_tokens").insert({
  office_code: OFFICE,
  access_token: LEGACY_TOKEN,
});

if (legacyError) {
  console.warn(
    "Legacy RPRMD-DLOS token was not added (multi-token migration may be pending):",
    legacyError.message
  );
  console.warn(
    "Run supabase/migrations/20260717160000_orprmd_dlos_token_fix.sql in Supabase SQL Editor to keep old PDFs working."
  );
} else {
  console.log("Legacy RPRMD-DLOS token restored for older printed QRs.");
}

updateTokenFile(OFFICE, newToken);

console.log("ORPRMD-DLOS token updated in Supabase.");
console.log("New token:", newToken);
console.log("");
console.log("Next: npm run generate-office-tokens:orprmd-dlos -- --pdf-out office-tokens-orprmd-dlos.pdf");
