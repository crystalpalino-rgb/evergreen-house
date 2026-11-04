/**
 * Regenerate public/evergreen-products.csv from the live catalog.
 *
 * The file is a plain CSV mirror of the active products, for the team's own use
 * (no script produced it before, so it had drifted to a 265 row export from the
 * first import with amzn.to shortlinks). Columns are the ones the file has
 * always had, in the same order:
 *
 *   ID, Name, Room, Price, Rating, Amazon URL, Image URL, Editor Note
 *
 * One row per active product, ordered by id. The editor note is the authored
 * card line where the row has one and the longer editor note otherwise, so the
 * file prints the same sentence a shopper reads on the card. Numbers are the
 * stored values, never rounded or filled in.
 *
 * Usage: node scripts/generate-products-csv.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const SITE = new URL("..", import.meta.url).pathname;

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  const raw = readFileSync(`${SITE}.env.local`, "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
  if (!line) throw new Error("no DATABASE_URL in site/.env.local");
  const value = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  if (!value.startsWith("postgres")) throw new Error("DATABASE_URL is not a postgres URL");
  return value;
}

const db = neon(resolveDatabaseUrl());

const rows = await db`
  SELECT id, name, room, price, rating, amazon_url, image_url, card_hook, editor_note
    FROM products
   WHERE is_active = true
   ORDER BY id
`;

function cell(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/"/g, '""');
}

const lines = ['ID,Name,Room,Price,Rating,Amazon URL,Image URL,Editor Note'];
for (const r of rows) {
  lines.push(
    [
      cell(r.id),
      cell(r.name),
      cell(r.room),
      cell(r.price === null || r.price === undefined ? "" : Number(r.price).toFixed(2)),
      cell(r.rating),
      cell(r.amazon_url),
      cell(r.image_url),
      cell(r.card_hook || r.editor_note || ""),
    ]
      .map((v) => `"${v}"`)
      .join(","),
  );
}

writeFileSync(`${SITE}public/evergreen-products.csv`, lines.join("\n") + "\n");
console.log(`Wrote public/evergreen-products.csv with ${rows.length} products`);
