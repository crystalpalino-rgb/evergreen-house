/**
 * Apply the owner's pin-priority change: the products her top Pinterest pins
 * open must sit at the top of the page those pins land on, and the price and
 * rating shown on those cards must be today's verified figures.
 *
 * Source of truth for price, rating, review count and availability is the
 * verification file, read at runtime. Nothing in this script invents a number:
 *
 *   /home/team/shared/curation/pin-priority-verification-2026-11-04.json
 *
 * Three separate writes, all inside ONE transaction, so a half-applied change
 * cannot exist:
 *
 *   1. verified facts  - price, rating, review_count, availability,
 *                        price_checked_at = 2026-11-04, for every row that
 *                        verified with a live buy box (11 rows).
 *   2. pin_rank        - the page order the owner asked for. 403 keeps a null
 *                        rank because it failed the 4.3 star gate; 413 and 419
 *                        keep the rank 1 they already hold.
 *   3. display_title   - two listing titles that drifted away from what the
 *                        product actually is (293 clamps, 27 is gusseted).
 *
 * Availability is stored in the column's own vocabulary: 'in_stock'. The
 * verification file writes prose ("In Stock", and for one row "Only 19 left in
 * stock (more on the way)"); every one of those rows has a live buy box and is
 * buyable, which is what the token means. The merchant feed maps both spellings
 * to "in stock" (scripts/generate-merchant-feed.ts), so the storefront and the
 * feed agree either way, and the other 480 rows stay in one vocabulary.
 *
 * 483 (Spode) is never touched. It verified with no buy box, it stays
 * suppressed, and the script asserts it is unchanged before it commits.
 *
 * Usage:
 *   bun run scripts/apply-pin-priority.mjs            # dry run, prints the plan
 *   bun run scripts/apply-pin-priority.mjs --apply    # writes, in one transaction
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const VERIFICATION =
  "/home/team/shared/curation/pin-priority-verification-2026-11-04.json";
const CHECKED_AT = "2026-11-04";
const APPLY = process.argv.includes("--apply");

/** The page order the owner approved. Any id not listed keeps its rank. */
const PIN_RANKS = [
  // /room/office - the four pins that open the office page.
  { id: 293, pin_rank: 1 },
  { id: 297, pin_rank: 2 },
  { id: 300, pin_rank: 3 },
  { id: 318, pin_rank: 4 },
  // /room/bedroom - 413 stays at 1; these three plus 44 fill the first group.
  { id: 36, pin_rank: 2 },
  { id: 27, pin_rank: 3 },
  { id: 44, pin_rank: 4 },
  // /room/dining-room - 419 stays at 1; the Libbey glasses join the top group.
  { id: 243, pin_rank: 2 },
  { id: 28, pin_rank: 3 },
  { id: 90, pin_rank: 4 },
  // /apparel featured row - the three pinned pieces, in this order.
  { id: 405, pin_rank: 1 },
  { id: 406, pin_rank: 2 },
  { id: 407, pin_rank: 3 },
];

/** Title repairs: the live listing drifted, the product did not. */
const DISPLAY_TITLES = [
  { id: 293, display_title: "LED Desk Lamp with Clamp" },
  { id: 27, display_title: "Utopia Bedding Gusset Bed Pillow, Hotel Pillows" },
];

/** Rows the owner named as untouchable, with the reason kept next to them. */
const UNTOUCHED = {
  483: "no live buy box: stays suppressed and out of the Holiday Hosting Table set",
};

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
  if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

const FACTS =
  "id, room, name, display_title, price, rating, review_count, availability, price_checked_at, pin_rank, is_active";

async function readRows(ids) {
  const rows = await db.query(`SELECT ${FACTS} FROM products WHERE id = ANY($1::int[]) ORDER BY id`, [
    ids,
  ]);
  return new Map(rows.map((row) => [Number(row.id), row]));
}

function fmt(row) {
  if (!row) return "missing";
  return (
    `price=${row.price} rating=${row.rating} reviews=${row.review_count} ` +
    `avail=${row.availability} checked=${row.price_checked_at ? String(row.price_checked_at).slice(0, 10) : "null"} ` +
    `pin_rank=${row.pin_rank} title=${JSON.stringify(row.display_title)}`
  );
}

function sameDay(value) {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 10) === CHECKED_AT;
}

async function main() {
  const file = JSON.parse(readFileSync(VERIFICATION, "utf8"));
  if (file.verified_at !== CHECKED_AT) {
    throw new Error(`verification file is dated ${file.verified_at}, expected ${CHECKED_AT}`);
  }
  const verified = Array.isArray(file.products) ? file.products : [];

  // ---- Which rows the verification says are buyable today. ----
  const buyable = verified.filter((p) => p.buy_box === true);
  const notBuyable = verified.filter((p) => p.buy_box !== true);
  if (buyable.length !== 11) {
    throw new Error(`expected 11 buyable rows in the verification file, found ${buyable.length}`);
  }
  if (notBuyable.length !== 1 || Number(notBuyable[0].id) !== 483) {
    throw new Error(
      `expected exactly one non-buyable row (483), found ${notBuyable.map((p) => p.id).join(", ")}`,
    );
  }

  for (const row of buyable) {
    if (typeof row.price !== "number" || row.price <= 0) {
      throw new Error(`${row.id}: verification carries no usable price (${row.price})`);
    }
    if (typeof row.rating !== "number" || row.rating <= 0) {
      throw new Error(`${row.id}: verification carries no usable rating (${row.rating})`);
    }
    if (!Number.isInteger(row.review_count) || row.review_count <= 0) {
      throw new Error(`${row.id}: verification carries no usable review count (${row.review_count})`);
    }
  }

  // ---- The gate: a row below 4.3 stars is not promoted onto a pin position. ----
  const ranked = new Set(PIN_RANKS.map((p) => p.id));
  const promotedBelowGate = buyable.filter((p) => ranked.has(Number(p.id)) && p.gate !== "PASS");
  if (promotedBelowGate.length) {
    throw new Error(
      `rows ranked on a pin position but below the 4.3 gate: ${promotedBelowGate
        .map((p) => `${p.id} (${p.fail_reason})`)
        .join(", ")}`,
    );
  }
  if (ranked.has(403)) throw new Error("403 failed the 4.3 star gate and must not be ranked");

  // ---- The pages this touches, and the ids that must exist. ----
  const allIds = [
    ...buyable.map((p) => Number(p.id)),
    ...PIN_RANKS.map((p) => p.id),
    ...DISPLAY_TITLES.map((p) => p.id),
    ...Object.keys(UNTOUCHED).map(Number),
    403,
    413,
    419,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const before = await readRows(allIds);
  for (const id of allIds) {
    if (!before.has(id)) throw new Error(`id ${id} is not in products`);
  }
  for (const [id, reason] of Object.entries(UNTOUCHED)) {
    if (!before.get(Number(id))) throw new Error(`untouchable id ${id} is missing: ${reason}`);
  }

  console.log(`Verification file: ${VERIFICATION}`);
  console.log(`Verified at: ${file.verified_at}`);
  console.log(`Buyable rows in file: ${buyable.length}`);
  console.log(`Untouched: ${Object.entries(UNTOUCHED).map(([id, why]) => `${id} (${why})`).join("; ")}\n`);

  console.log("=== BEFORE ===");
  for (const id of allIds) console.log(`${id} [${before.get(id).room}] ${fmt(before.get(id))}`);

  // ---- Plan, printed in full before anything is written. ----
  console.log("\n=== PLAN: verified facts (11 rows) ===");
  for (const row of buyable) {
    console.log(
      `${row.id}: ${before.get(Number(row.id)).price} -> ${row.price} | ` +
        `${before.get(Number(row.id)).rating} -> ${row.rating} | ` +
        `${before.get(Number(row.id)).review_count} -> ${row.review_count} | ` +
        `availability in_stock | checked ${CHECKED_AT}${row.gate !== "PASS" ? "  (gate FAIL, facts only)" : ""}`,
    );
  }
  console.log("\n=== PLAN: pin_rank ===");
  for (const row of PIN_RANKS) {
    console.log(
      `${row.id} [${before.get(row.id).room}] ${before.get(row.id).pin_rank} -> ${row.pin_rank}`,
    );
  }
  console.log("\n=== PLAN: display_title ===");
  for (const row of DISPLAY_TITLES) {
    console.log(`${row.id}: ${JSON.stringify(before.get(row.id).display_title)} -> ${JSON.stringify(row.display_title)}`);
  }

  if (!APPLY) {
    console.log("\nDry run. Nothing written. Re-run with --apply to commit the transaction.");
    return;
  }

  // ---- One transaction. Any failure rolls every write back. ----
  const statements = [];
  for (const row of buyable) {
    statements.push(
      db`UPDATE products
            SET price = ${row.price},
                rating = ${row.rating},
                review_count = ${row.review_count},
                availability = 'in_stock',
                price_checked_at = ${CHECKED_AT}::date
          WHERE id = ${Number(row.id)}
      RETURNING id`,
    );
  }
  for (const row of PIN_RANKS) {
    statements.push(
      db`UPDATE products SET pin_rank = ${row.pin_rank} WHERE id = ${row.id} RETURNING id`,
    );
  }
  for (const row of DISPLAY_TITLES) {
    statements.push(
      db`UPDATE products SET display_title = ${row.display_title} WHERE id = ${row.id} RETURNING id`,
    );
  }

  // The HTTP driver answers each statement with its returned rows, so the count
  // of touched rows comes from RETURNING, not from a driver-specific field.
  const results = await db.transaction(statements);
  const touched = results.reduce((acc, result) => {
    if (Array.isArray(result)) return acc + result.length;
    if (result && Array.isArray(result.rows)) return acc + result.rows.length;
    return acc + Number(result?.count ?? 0);
  }, 0);
  const expected = buyable.length + PIN_RANKS.length + DISPLAY_TITLES.length;
  if (touched !== expected) {
    throw new Error(`transaction matched ${touched} rows, expected ${expected}`);
  }
  console.log(`\nCommitted one transaction: ${results.length} statements, ${touched} rows matched.`);

  // ---- Proof: read it back and compare to the file, not to the plan. ----
  const after = await readRows(allIds);
  const problems = [];

  for (const row of buyable) {
    const got = after.get(Number(row.id));
    if (Number(got.price) !== Number(row.price)) problems.push(`${row.id} price ${got.price} != ${row.price}`);
    if (Number(got.rating) !== Number(row.rating)) problems.push(`${row.id} rating ${got.rating} != ${row.rating}`);
    if (Number(got.review_count) !== Number(row.review_count))
      problems.push(`${row.id} review_count ${got.review_count} != ${row.review_count}`);
    if (got.availability !== "in_stock") problems.push(`${row.id} availability ${got.availability} != in_stock`);
    if (!sameDay(got.price_checked_at)) problems.push(`${row.id} price_checked_at ${got.price_checked_at}`);
  }
  for (const row of PIN_RANKS) {
    const got = after.get(row.id);
    if (Number(got.pin_rank) !== row.pin_rank) problems.push(`${row.id} pin_rank ${got.pin_rank} != ${row.pin_rank}`);
  }
  for (const row of DISPLAY_TITLES) {
    const got = after.get(row.id);
    if (got.display_title !== row.display_title)
      problems.push(`${row.id} display_title ${JSON.stringify(got.display_title)}`);
  }
  if (after.get(403).pin_rank !== null) problems.push(`403 pin_rank ${after.get(403).pin_rank} != null`);
  if (Number(after.get(413).pin_rank) !== 1) problems.push(`413 pin_rank moved to ${after.get(413).pin_rank}`);
  if (Number(after.get(419).pin_rank) !== 1) problems.push(`419 pin_rank moved to ${after.get(419).pin_rank}`);

  // Untouched rows must be identical, field for field.
  for (const id of Object.keys(UNTOUCHED).map(Number)) {
    const b = JSON.stringify(before.get(id));
    const a = JSON.stringify(after.get(id));
    if (a !== b) problems.push(`${id} changed but must not: ${b} -> ${a}`);
  }

  console.log("\n=== AFTER ===");
  for (const id of allIds) console.log(`${id} [${after.get(id).room}] ${fmt(after.get(id))}`);

  if (problems.length) {
    throw new Error(`post-write verification failed:\n  - ${problems.join("\n  - ")}`);
  }
  console.log(`\nVerified: ${buyable.length} verified facts, ${PIN_RANKS.length} pin ranks, ` +
    `${DISPLAY_TITLES.length} titles stored exactly as planned; 403 unranked; 413 and 419 still rank 1; ` +
    `${Object.keys(UNTOUCHED).join(", ")} untouched.`);
}

main().catch((error) => {
  console.error(`\nFAILED: ${error.message}`);
  process.exit(1);
});
