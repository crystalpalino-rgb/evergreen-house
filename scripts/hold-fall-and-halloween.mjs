/**
 * Shop audit item 7 (2026-11-15): Halloween and fall out.
 *
 * Two moves, neither of them a delete. Every row stays in the catalog with its
 * facts, its product page and its affiliate link; only the two columns that
 * decide which page a row lists on are touched.
 *
 *   1. HALLOWEEN OFF /apparel. Five rows are parked with is_active = false, the
 *      same lever the Valentine's pieces use. Nothing is deleted, so un-parking
 *      is one UPDATE back. This is the right lever here and not a room move
 *      because /apparel lists every apparel row that is active: a room move
 *      would leave all five on the page, and the owner asked for Halloween off
 *      it. 34 of the 39 active apparel rows stay, so the page keeps its stock.
 *      Three of the five carried pin_rank 1 to 3 for the retired "Most Pinned
 *      Pieces" row; the rank is left on the row so un-parking restores the order.
 *
 *   2. FALL INTO ONE SEASONAL TILE. The fall pieces that were listed on
 *      Entryway, Kitchen and Patio move to room = 'fall', which is the Autumn
 *      Warmth season tile (/collection/fall, also /room/fall). The tile's rule is
 *      `style contains fall`, so the three rows that carry no style get 'fall'
 *      appended; otherwise they would sit on /room/fall and be missing from the
 *      tile a shopper actually lands on.
 *
 * Usage:
 *   node scripts/hold-fall-and-halloween.mjs [--dry-run] [--revert]
 *
 * DATABASE_URL falls back to site/.env.local, like the other apply scripts.
 * Every check runs before the first write; a failed check prints
 * "ABORT - nothing was written" and exits 1.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

/** Halloween: parked off /apparel. */
const PARK_IDS = [405, 406, 407, 408, 409];
const PARK_FROM_ROOM = "loungewear";

/** Fall pieces listed on a room page: moved to the season tile. */
const MOVE_TO_ROOM = "fall";
const MOVE = [
  { id: 341, from: "entryway" },
  { id: 342, from: "entryway" },
  { id: 343, from: "entryway" },
  { id: 344, from: "entryway" },
  { id: 345, from: "entryway" },
  { id: 346, from: "entryway" },
  { id: 347, from: "entryway" },
  { id: 348, from: "entryway" },
  { id: 615, from: "entryway" },
  { id: 625, from: "entryway" },
  { id: 626, from: "entryway" },
  { id: 358, from: "kitchen" },
  { id: 412, from: "patio" },
];

/** The moved rows that carry no 'fall' style and need it to reach the tile. */
const STYLE_IDS = [615, 625, 626];

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const REVERT = args.has("--revert");

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL is not set and .env.local has no DATABASE_URL line.");
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const sql = neon(resolveDatabaseUrl());

function abort(reason) {
  console.error(`ABORT - nothing was written: ${reason}`);
  process.exit(1);
}

async function snapshot() {
  const [apparel, rooms, rows] = await Promise.all([
    sql`SELECT count(*)::int n FROM products WHERE product_type = 'apparel' AND is_active = true`,
    sql`SELECT room, count(*)::int n FROM products WHERE is_active = true AND room IN ('entryway','kitchen','patio','fall','loungewear') GROUP BY room ORDER BY room`,
    sql`SELECT id, name, room, style, is_active, product_type, pin_rank FROM products WHERE id = ANY(${[...PARK_IDS, ...MOVE.map((m) => m.id)]}) ORDER BY id`,
  ]);
  return { apparel: apparel[0].n, rooms, rows };
}

const before = await snapshot();
const byId = new Map(before.rows.map((r) => [r.id, r]));

/* ---------- checks: all of them run before the first write ---------- */
for (const id of PARK_IDS) {
  const row = byId.get(id);
  if (!row) abort(`halloween row ${id} is not in the catalog`);
  if (REVERT) continue;
  if (row.is_active !== true) abort(`halloween row ${id} is already parked`);
  if (row.room !== PARK_FROM_ROOM) abort(`halloween row ${id} is in room ${row.room}, not ${PARK_FROM_ROOM}`);
  if (row.product_type !== "apparel") abort(`halloween row ${id} is not product_type apparel`);
}
for (const { id, from } of MOVE) {
  const row = byId.get(id);
  if (!row) abort(`fall row ${id} is not in the catalog`);
  if (REVERT) continue;
  if (row.is_active !== true) abort(`fall row ${id} is not active`);
  if (row.room !== from) abort(`fall row ${id} is in room ${row.room}, not ${from}`);
  if (row.room === MOVE_TO_ROOM) abort(`fall row ${id} already sits on the season tile`);
}
if (!REVERT && before.apparel - PARK_IDS.length < 20) {
  abort(`parking would leave /apparel with ${before.apparel - PARK_IDS.length} rows`);
}

console.log("BEFORE", JSON.stringify(before.rooms));

if (DRY_RUN) {
  console.log(`DRY RUN - would park ${PARK_IDS.length} rows, move ${MOVE.length} rows to room '${MOVE_TO_ROOM}', style ${STYLE_IDS.length} rows.`);
  for (const row of before.rows) console.log(` ${row.id}\t${row.room}\tactive=${row.is_active}\t${row.name.slice(0, 58)}`);
  process.exit(0);
}

/* ---------- writes: one statement each, guarded, counted ---------- */
if (REVERT) {
  const parked = await sql`
    UPDATE products SET is_active = true
    WHERE id = ANY(${PARK_IDS}) AND room = ${PARK_FROM_ROOM} AND is_active = false
    RETURNING id`;
  if (parked.length !== PARK_IDS.length) abort(`un-park touched ${parked.length} of ${PARK_IDS.length} rows`);
  let moved = 0;
  for (const { id, from } of MOVE) {
    const back = await sql`
      UPDATE products SET room = ${from}
      WHERE id = ${id} AND room = ${MOVE_TO_ROOM} AND is_active = true
      RETURNING id`;
    moved += back.length;
  }
  if (moved !== MOVE.length) abort(`room revert touched ${moved} of ${MOVE.length} rows`);
  const unstyled = await sql`
    UPDATE products SET style = array_remove(style, 'fall')
    WHERE id = ANY(${STYLE_IDS}) AND style @> ARRAY['fall']::text[]
    RETURNING id`;
  console.log(`REVERTED: un-parked ${parked.length}, moved back ${moved}, dropped style on ${unstyled.length}`);
} else {
  const parked = await sql`
    UPDATE products SET is_active = false
    WHERE id = ANY(${PARK_IDS}) AND room = ${PARK_FROM_ROOM} AND is_active = true
    RETURNING id`;
  if (parked.length !== PARK_IDS.length) abort(`park touched ${parked.length} of ${PARK_IDS.length} rows`);

  const moved = await sql`
    UPDATE products SET room = ${MOVE_TO_ROOM}
    WHERE id = ANY(${MOVE.map((m) => m.id)})
      AND room = ANY(${MOVE.map((m) => m.from)})
      AND is_active = true
    RETURNING id`;
  if (moved.length !== MOVE.length) abort(`room move touched ${moved.length} of ${MOVE.length} rows`);

  const styled = await sql`
    UPDATE products SET style = array_append(style, 'fall')
    WHERE id = ANY(${STYLE_IDS}) AND NOT (style @> ARRAY['fall']::text[])
    RETURNING id`;
  console.log(`WROTE: parked ${parked.length}, moved ${moved.length}, styled ${styled.length}`);
}

const after = await snapshot();
console.log("AFTER ", JSON.stringify(after.rooms));
console.log(`apparel active: ${before.apparel} -> ${after.apparel}`);
for (const row of after.rows) {
  console.log(` ${row.id}\t${row.room}\tactive=${row.is_active}\t${row.name.slice(0, 58)}`);
}
