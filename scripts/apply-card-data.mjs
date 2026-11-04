/**
 * Apply the verified room-card data file to the products table.
 *
 * Source of truth: the curation file verified live on Amazon (every row in it
 * carries status=verified, a verified_at date, a price, a star rating and a
 * review count read from the product page). This script never invents a value:
 * it copies what the file says, and it never touches a row that is not in it.
 *
 * For each row it sets:
 *   display_title, card_hook   only when the row carries them (the buckets that
 *                              have not had their copy pass yet keep whatever
 *                              they already have, so nothing is blanked)
 *   price, rating, review_count, availability   always, from the verified row
 *   price_checked_at           the row's verified_at date
 * and it sets pin_rank = 1 on the Pinterest-rotation products.
 *
 * Usage:
 *   DATABASE_URL="<url>" bun run scripts/apply-card-data.mjs [path/to/file.json]
 * Default file: /home/team/shared/curation/room-cards-2026-10-19.json
 *
 * DATABASE_URL falls back to site/.env.local when it is not already in the
 * environment, so the script can be run by hand without exporting anything.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const FILE = process.argv[2] || "/home/team/shared/curation/room-cards-2026-10-19.json";
const PINNED_IDS = [427, 419, 415, 413];

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (line) {
      return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local - fall through to the error below */
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

/** $19.99 style, no rounding beyond the cents the price already has. */
function money(value) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : String(value);
}

function stars(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(Number(value));
}

function reviews(value) {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString("en-US");
}

/** Date column read back as a JS Date by the driver - always print the ISO day. */
function checkedOn(value) {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString().slice(0, 10);
}

function clip(text, n = 44) {
  const s = String(text || "");
  return s.length <= n ? s : `${s.slice(0, n - 1)}...`;
}

async function main() {
  const rows = JSON.parse(readFileSync(FILE, "utf8"));
  console.log(`Source file: ${FILE}`);
  console.log(`Rows in file: ${rows.length}\n`);

  const notVerified = rows.filter((r) => r.status !== "verified");
  if (notVerified.length) {
    throw new Error(
      `refusing to apply: ${notVerified.length} row(s) are not status=verified (ids ${notVerified
        .map((r) => r.id)
        .join(", ")})`,
    );
  }

  const ids = rows.map((r) => Number(r.id));
  const before = await db.query(
    `SELECT id, name, price, rating, review_count, availability, display_title, card_hook, pin_rank
       FROM products WHERE id = ANY($1::int[])`,
    [ids],
  );
  const beforeById = new Map(before.map((r) => [Number(r.id), r]));

  const missing = ids.filter((id) => !beforeById.has(id));
  const summary = {
    rowsInFile: rows.length,
    rowsFound: before.length,
    rowsUpdated: 0,
    rowsMissing: missing.length,
    displayTitlesSet: 0,
    hooksSet: 0,
    priceChanged: 0,
    ratingChanged: 0,
    reviewCountChanged: 0,
    availabilityChanged: 0,
    pinRankSet: 0,
  };

  const changedPrice = [];
  const table = [];

  for (const row of rows) {
    const id = Number(row.id);
    const prev = beforeById.get(id);
    if (!prev) continue;

    const next = {
      display_title: row.display_title || null,
      card_hook: row.hook || null,
      price: row.price ?? null,
      rating: row.rating ?? null,
      review_count: row.review_count ?? null,
      availability: row.availability || null,
      price_checked_at: row.verified_at || null,
      pin_rank: PINNED_IDS.includes(id) ? 1 : prev.pin_rank ?? null,
    };

    // Copy fields only when the file actually carries them.
    const keepTitle = !next.display_title;
    const keepHook = !next.card_hook;

    await db.query(
      `UPDATE products SET
         display_title = COALESCE($2, display_title),
         card_hook = COALESCE($3, card_hook),
         price = $4,
         rating = $5,
         review_count = $6,
         availability = $7,
         price_checked_at = $8::date,
         pin_rank = $9
       WHERE id = $1`,
      [
        id,
        next.display_title,
        next.card_hook,
        next.price,
        next.rating,
        next.review_count,
        next.availability,
        next.price_checked_at,
        next.pin_rank,
      ],
    );

    summary.rowsUpdated += 1;
    if (!keepTitle) summary.displayTitlesSet += 1;
    if (!keepHook) summary.hooksSet += 1;
    if (Number(prev.price) !== Number(next.price)) {
      summary.priceChanged += 1;
      changedPrice.push({
        id,
        name: clip(prev.name, 40),
        before: money(prev.price),
        after: money(next.price),
      });
    }
    if (Number(prev.rating) !== Number(next.rating)) summary.ratingChanged += 1;
    if (Number(prev.review_count) !== Number(next.review_count)) summary.reviewCountChanged += 1;
    if ((prev.availability || null) !== next.availability) summary.availabilityChanged += 1;
    if (next.pin_rank === 1) summary.pinRankSet += 1;

    table.push({
      id,
      bucket: row.bucket,
      name: clip(prev.name, 30),
      price: `${money(prev.price)} -> ${money(next.price)}`,
      rating: `${stars(prev.rating)} -> ${stars(next.rating)}`,
      reviews: `${reviews(prev.review_count)} -> ${reviews(next.review_count)}`,
      title: next.display_title ? "set" : "kept",
      hook: next.card_hook ? "set" : "kept",
      pin: next.pin_rank === 1 ? "1" : "",
    });
  }

  // Before/after table, one row per product touched.
  const header = ["id", "bucket", "name", "price", "rating", "reviews", "title", "hook", "pin"];
  console.log(header.map((h) => h.padEnd(h === "name" ? 31 : h === "price" ? 17 : 13)).join("|"));
  console.log("-".repeat(140));
  for (const r of table) {
    console.log(
      [
        String(r.id).padEnd(13),
        r.bucket.padEnd(13),
        r.name.padEnd(31),
        r.price.padEnd(17),
        r.rating.padEnd(13),
        r.reviews.padEnd(13),
        r.title.padEnd(13),
        r.hook.padEnd(13),
        r.pin.padEnd(13),
      ].join("|"),
    );
  }

  console.log("\nPrice corrections (the point of the pass):");
  for (const c of changedPrice) {
    console.log(`  id ${c.id}  ${c.before} -> ${c.after}  ${c.name}`);
  }

  console.log("\nSummary:");
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v}`);
  if (missing.length) console.log(`  missing ids: ${missing.join(", ")}`);

  // Post-check: read the four pinned products back in page order.
  const pinned = await db.query(
    `SELECT id, display_title, card_hook, price, rating, review_count, availability, price_checked_at, pin_rank, room
       FROM products WHERE id = ANY($1::int[])
       ORDER BY pin_rank NULLS LAST, quality_score DESC NULLS LAST`,
    [PINNED_IDS],
  );
  console.log("\nPinned products read back in room-page order:");
  for (const p of pinned) {
    console.log(
      `  pin_rank=${p.pin_rank} id=${p.id} room=${p.room} ${money(p.price)} ${stars(p.rating)} stars ${reviews(
        p.review_count,
      )} reviews checked=${checkedOn(p.price_checked_at)}`,
    );
    console.log(`    title: ${p.display_title}`);
    console.log(`    hook:  ${p.card_hook}`);
  }

  if (summary.rowsMissing > 0) {
    console.log(`\nWARNING: ${summary.rowsMissing} row(s) in the file have no matching product id.`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
