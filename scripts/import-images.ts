import { neon } from "@neondatabase/serverless";
import XLSX from "xlsx";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env
const envFile = readFileSync(resolve(import.meta.dir, "..", ".env"), "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
}

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = neon(url);

const wb = XLSX.readFile("/home/team/shared/Amazon List.xlsx");
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
const rows = data.slice(1);

let updated = 0;
let skipped = 0;

for (const row of rows) {
  const amazonUrl = String(row[2] || "").trim();
  const imageUrl = String(row[3] || "").trim();

  if (!amazonUrl || !imageUrl || !imageUrl.startsWith("http")) {
    skipped++;
    continue;
  }

  await sql`UPDATE products SET image_url = ${imageUrl} WHERE amazon_url = ${amazonUrl}`;
  updated++;
}

console.log(`Updated: ${updated}  Skipped: ${skipped}`);
const cnt = await sql`SELECT count(*) as c FROM products WHERE image_url IS NOT NULL`;
console.log(`Total with images: ${cnt[0].c} / 67`);
