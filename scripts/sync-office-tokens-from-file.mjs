/**
 * Upsert office tokens from office-tokens.generated.txt into Supabase
 * without generating new tokens (keeps PDF/QR codes valid).
 *
 * Usage: node scripts/sync-office-tokens-from-file.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function parseTokenFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Token file not found: ${filePath}`);
    console.error("Run: npm run generate-office-tokens -- --local-only");
    process.exit(1);
  }

  const rows = [];

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("OCRS Office") || trimmed.startsWith("Generated:") || trimmed.startsWith("Keep this")) {
      continue;
    }

    const tab = trimmed.indexOf("\t");
    if (tab === -1) {
      continue;
    }

    const office_code = trimmed.slice(0, tab).trim();
    const access_token = trimmed.slice(tab + 1).trim();

    if (office_code && access_token) {
      rows.push({
        office_code,
        access_token,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return rows;
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

const tokenPath = path.join(__dirname, "..", "office-tokens.generated.txt");
const rows = parseTokenFile(tokenPath);

if (rows.length === 0) {
  console.error("No office tokens found in office-tokens.generated.txt");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase.from("office_access_tokens").upsert(rows, {
  onConflict: "access_token",
  ignoreDuplicates: false,
});

if (error) {
  console.error("Failed to sync office tokens:", error.message);
  if (/office_access_tokens/.test(error.message)) {
    console.error(
      "Run supabase/migrations/20260629120000_office_access_tokens.sql in Supabase SQL Editor first."
    );
  }
  process.exit(1);
}

console.log(`Synced ${rows.length} office tokens from ${tokenPath}`);
for (const row of rows) {
  console.log(`${row.office_code}: ${row.access_token}`);
}
