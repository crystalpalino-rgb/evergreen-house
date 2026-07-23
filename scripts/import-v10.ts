import * as XLSX from "xlsx";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const sql = neon(DATABASE_URL);

const mapRoom = (room: string): string => {
  const r = room.trim().toLowerCase();
  if (r === "living room" || r === "living-room") return "living-room";
  if (r === "bedroom") return "bedroom";
  if (r === "kitchen") return "kitchen";
  if (r === "bathroom") return "bathroom";
  if (r === "patio" || r === "patio & outdoor") return "patio";
  if (r === "office" || r === "work from home") return "office";
  if (r === "organization") return "organization";
  if (r === "entry" || r === "entryway") return "entryway";
  if (r === "pantry") return "pantry";
  // v10: treat empty or unlabeled rows as pantry
  if (r === "") return "pantry";
  return r.replace(/\s+/g, "-");
};

const FILE = "/home/team/shared/Amazon List v10.xlsx";
const wb = XLSX.readFile(FILE);
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
const rows = data.slice(1).filter((r: any) => r[0] && String(r[0]).trim());

let imported = 0;
let skipped = 0;

for (const row of rows) {
  const name = String(row[0] || "").trim();
  const price = row[1] ? parseFloat(row[1]) : null;
  const rating = row[2] ? parseFloat(row[2]) : null;
  const rawRoom = String(row[3] || "").trim();
  const room = mapRoom(rawRoom);
  const amazonUrl = String(row[4] || "").trim();
  const imageUrl = String(row[5] || "").trim();
  const editorNote = String(row[6] || "").trim();

  if (!name || !amazonUrl) { skipped++; continue; }

  const existing = await sql`SELECT id FROM products WHERE amazon_url = ${amazonUrl}`;
  if (existing.length > 0) {
    console.log("SKIP (exists): " + name.substring(0, 60));
    skipped++;
    continue;
  }

  await sql`
    INSERT INTO products (name, room, amazon_url, price, rating, editor_note, image_url)
    VALUES (${name}, ${room}, ${amazonUrl}, ${price}, ${rating}, ${editorNote}, ${imageUrl})
  `;
  console.log("OK: [" + room + "] " + name.substring(0, 60));
  imported++;
}

console.log("---");
console.log("Imported: " + imported + ", Skipped: " + skipped);
