/**
 * Product 567 price alignment (2026-11-20).
 *
 * The Cozy Fall post card for product 567 (Romadedi Gold Glass Hurricane
 * Candle Holders, Set of 3) carries the price read from the listing on
 * 2026-11-20: $28.99, verified that day. The products row still held the
 * 2026-11-04 read of $25.99, so the card and the product page disagreed.
 *
 * This script writes the price that was read on the listing into the products
 * row and dates it, so every surface that renders from the row (product page,
 * room page, related cards, feed) says the same thing as the blog card.
 *
 *   - the price written is the one already verified on the card, 28.99
 *   - price_checked_at is set to 2026-11-20, the day it was read
 *   - nothing else on the row is touched
 *   - the before values are written to a backup file before the update
 *
 * Backup: /home/team/shared/curation/product-567-price-backup-2026-11-20.json
 *
 * Usage:
 *   bun run scripts/apply-product-567-price-2026-11-20.mjs            # apply
 *   bun run scripts/apply-product-567-price-2026-11-20.mjs --dry-run  # checks only
 *   bun run scripts/apply-product-567-price-2026-11-20.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const ROOT = new URL("../", import.meta.url);
const BACKUP = "/home/team/shared/curation/product-567-price-backup-2026-11-20.json";
const POST = new URL("src/routes/blog/cozy-fall-decor-finds.tsx", ROOT);

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

const PRODUCT_ID = 567;
const EXPECTED_NAME = "Romadedi Glass Hurricane Candle Holders for Candlestick, Gold, Set of 3";
const NEW_PRICE = "28.99";
const NEW_CHECKED_AT = "2026-11-20";
/** The values on the row before this pass, also the revert target. */
const OLD_PRICE = "25.99";
const OLD_CHECKED_AT = "2026-11-04";

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  for (const f of ["../.env.local", "../.env"]) {
    try {
      const raw = readFileSync(new URL(f, import.meta.url), "utf8");
      const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
      if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    } catch {
      /* try the next file */
    }
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

function fail(msg) {
  console.error(`ABORT - nothing was written. ${msg}`);
  process.exit(1);
}

function dayOf(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

function money(value) {
  if (value === null || value === undefined) return null;
  return Number(value).toFixed(2);
}

const sql = neon(resolveDatabaseUrl());

const rows = await sql`select id, name, price, price_checked_at, is_active from products where id = ${PRODUCT_ID}`;
if (rows.length !== 1) fail(`Expected exactly one row for product ${PRODUCT_ID}, found ${rows.length}.`);
const row = rows[0];

/* ---- revert ------------------------------------------------------------- */
if (REVERT) {
  if (!existsSync(BACKUP)) fail(`No backup at ${BACKUP}, nothing to revert from.`);
  const backup = JSON.parse(readFileSync(BACKUP, "utf8"));
  if (backup.id !== PRODUCT_ID) fail(`Backup is for product ${backup.id}, not ${PRODUCT_ID}.`);
  const current = money(row.price);
  if (current !== NEW_PRICE) fail(`Row price is ${current}, expected ${NEW_PRICE} before reverting.`);
  console.log(`REVERT product ${PRODUCT_ID}: ${current} (${dayOf(row.price_checked_at)}) -> ${backup.price} (${backup.price_checked_at})`);
  if (!DRY) {
    await sql`update products set price = ${backup.price}, price_checked_at = ${backup.price_checked_at} where id = ${PRODUCT_ID}`;
    console.log("Reverted. Row restored to the backed up values.");
  }
  process.exit(0);
}

/* ---- checks ------------------------------------------------------------- */
if (row.name !== EXPECTED_NAME) fail(`Row ${PRODUCT_ID} is "${row.name}", not the hurricane candle holders.`);
if (!row.is_active) fail(`Row ${PRODUCT_ID} is parked (is_active = false); a parked row is not the one on the card.`);

const currentPrice = money(row.price);
const currentDay = dayOf(row.price_checked_at);

if (currentPrice === NEW_PRICE && currentDay === NEW_CHECKED_AT) {
  console.log(`ALREADY APPLIED - product ${PRODUCT_ID} is ${NEW_PRICE} dated ${NEW_CHECKED_AT}. Nothing to do.`);
  process.exit(0);
}
if (currentPrice !== OLD_PRICE) fail(`Row price is ${currentPrice}, expected ${OLD_PRICE} before this pass.`);
if (currentDay !== OLD_CHECKED_AT) fail(`Row price_checked_at is ${currentDay}, expected ${OLD_CHECKED_AT} before this pass.`);

// The blog card this row has to agree with.
const post = readFileSync(POST, "utf8");
const cardBlock = post.split(`id: ${PRODUCT_ID},`)[1];
if (!cardBlock) fail(`The Cozy Fall post has no card for product ${PRODUCT_ID}.`);
const card = cardBlock.slice(0, 700);
if (!/price:\s*28\.99,/.test(card)) fail(`The Cozy Fall card for ${PRODUCT_ID} does not carry price 28.99.`);
if (!/verifiedOn:\s*"2026-11-20"/.test(card)) fail(`The Cozy Fall card for ${PRODUCT_ID} is not dated 2026-11-20.`);

/* ---- backup ------------------------------------------------------------- */
const backupFile = {
  id: PRODUCT_ID,
  name: row.name,
  price: currentPrice,
  price_checked_at: currentDay,
  saved_at: new Date().toISOString(),
  reason: "Price alignment with the Cozy Fall post card, 2026-11-20",
};

console.log("CHECKS PASSED");
console.log(`  row ${PRODUCT_ID}: ${row.name}`);
console.log(`  price ${currentPrice} (${currentDay}) -> ${NEW_PRICE} (${NEW_CHECKED_AT})`);
console.log(`  Cozy Fall card: price 28.99, verified 2026-11-20`);
console.log(`  backup: ${BACKUP}`);

if (DRY) {
  console.log("DRY RUN - nothing written.");
  process.exit(0);
}

writeFileSync(BACKUP, JSON.stringify(backupFile, null, 2) + "\n");
console.log(`Backup written: ${BACKUP}`);

await sql`update products set price = ${NEW_PRICE}, price_checked_at = ${NEW_CHECKED_AT} where id = ${PRODUCT_ID}`;

const after = await sql`select id, price, price_checked_at from products where id = ${PRODUCT_ID}`;
const nowPrice = money(after[0].price);
const nowDay = dayOf(after[0].price_checked_at);
if (nowPrice !== NEW_PRICE || nowDay !== NEW_CHECKED_AT) {
  fail(`Read back ${nowPrice} (${nowDay}) after the update, expected ${NEW_PRICE} (${NEW_CHECKED_AT}).`);
}
console.log(`APPLIED - product ${PRODUCT_ID} is ${nowPrice} dated ${nowDay}.`);
