#!/usr/bin/env node
/**
 * Duplicates and titles, 2026-11-04.
 *
 * Two owner-approved data cleanups in one pass:
 *
 *  1. Six products were listed twice, once on /room/bedroom (the correct room,
 *     lower id) and once on /room/fall (the duplicate, higher id). The bedroom
 *     copy survives in every pair; the fall copy is set is_active = false.
 *     Rows are suppressed, not deleted: every field stays on the row, so the
 *     one-line rollback is
 *       UPDATE products SET is_active = true WHERE id IN (232,233,234,235,236,237);
 *  2. Eighteen display_title values were truncated Amazon listing titles that
 *     rendered broken on the cards. Each one is rewritten as a clean human
 *     product name read from the real listing.
 *
 * Every check runs before the write. Any failure aborts with nothing changed.
 * The write itself is ONE SQL statement, so it lands whole or not at all.
 *
 * Usage:
 *   node scripts/duplicates-and-titles-2026-11-04.mjs --dry-run
 *   node scripts/duplicates-and-titles-2026-11-04.mjs
 *   node scripts/duplicates-and-titles-2026-11-04.mjs --revert   (titles off, fall rows back on)
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const FILE = "/home/team/shared/curation/duplicates-and-titles-2026-11-04.json";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const REVERT = args.has("--revert");

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    /* fall through */
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());
const fail = (msg) => {
  console.error(`\nABORT - nothing was written.\n  ${msg}\n`);
  process.exit(1);
};

/* ── the expected shape of this task, fixed here so the file cannot drift ── */

const FALL_DUPLICATES = [232, 233, 234, 235, 236, 237];
const BEDROOM_SURVIVORS = [1, 4, 89, 65, 197, 198];
const TITLE_IDS = [16, 20, 30, 32, 41, 42, 43, 44, 52, 63, 65, 197, 235, 236, 241, 242, 251, 252];
const BEFORE_FALL = 45;
const BEFORE_BEDROOM = 38;

const same = (a, b) => [...a].sort((x, y) => x - y).join(",") === [...b].sort((x, y) => x - y).join(",");

/* ── load and validate the decision file ────────────────────────────────── */

let doc;
try {
  doc = JSON.parse(readFileSync(FILE, "utf8"));
} catch (err) {
  fail(`cannot read ${FILE}: ${err.message}`);
}
const rows = doc.rows || [];
if (!rows.length) fail(`${FILE} has no rows.`);

const ids = rows.map((r) => Number(r.id));
if (new Set(ids).size !== ids.length) fail("the decision file repeats a product id.");

for (const r of rows) {
  if (!r.reason || !String(r.reason).trim()) fail(`row ${r.id} has no reason.`);
  if (!r.evidence || !String(r.evidence).trim()) fail(`row ${r.id} has no evidence.`);
  if (!["keep", "deactivate", "none"].includes(r.duplicate_decision)) {
    fail(`row ${r.id} has duplicate_decision "${r.duplicate_decision}".`);
  }
  if (!r.old_title || !String(r.old_title).trim()) fail(`row ${r.id} has no old_title.`);
}

/* style rule: no em dash or en dash anywhere in the deliverable */
if (/[\u2013\u2014]/.test(JSON.stringify(doc))) {
  fail("em dash or en dash in the decision file.");
}

const deactivateIds = rows.filter((r) => r.duplicate_decision === "deactivate").map((r) => Number(r.id));
const keepIds = rows.filter((r) => r.duplicate_decision === "keep").map((r) => Number(r.id));
const titledRows = rows.filter((r) => r.new_title !== null && r.new_title !== undefined);
const titledIds = titledRows.map((r) => Number(r.id));

if (!same(deactivateIds, FALL_DUPLICATES)) {
  fail(`deactivate set is [${deactivateIds.join(",")}], expected [${FALL_DUPLICATES.join(",")}].`);
}
if (!same(keepIds, BEDROOM_SURVIVORS)) {
  fail(`keep set is [${keepIds.join(",")}], expected [${BEDROOM_SURVIVORS.join(",")}].`);
}
if (!same(titledIds, TITLE_IDS)) {
  fail(`title set is [${titledIds.join(",")}], expected [${TITLE_IDS.join(",")}].`);
}

/* ── every new title has to look like a card title ──────────────────────── */

for (const r of titledRows) {
  const t = String(r.new_title);
  const where = `row ${r.id} ("${t}")`;
  if (t !== t.trim()) fail(`${where} has leading or trailing space.`);
  if (t.length < 25) fail(`${where} is under 25 characters.`);
  if (t.length > 60) fail(`${where} is over 60 characters.`);
  if (/\s{2,}/.test(t)) fail(`${where} has a double space.`);
  if (/[\u2013\u2014]/.test(t)) fail(`${where} contains an em dash or en dash.`);
  if (t === r.old_title) fail(`${where} is unchanged.`);
  if (/(^|\s)(\S{4,})(\s+\2)+/i.test(t)) fail(`${where} repeats a word.`);
  // No brand spam: at most one all-caps token longer than 3 letters (a brand name).
  const caps = t.split(/\s+/).filter((w) => /^[A-Z0-9&.']{4,}$/.test(w));
  if (caps.length > 1) fail(`${where} has more than one all-caps token: ${caps.join(", ")}.`);
}

/* ── revert mode ────────────────────────────────────────────────────────── */

if (REVERT) {
  const back = await db.query(
    `UPDATE products SET is_active = true, updated_at = now()
      WHERE id = ANY($1::int[]) AND is_active = false RETURNING id`,
    [FALL_DUPLICATES],
  );
  const cleared = await db.query(
    `UPDATE products SET display_title = NULL, updated_at = now()
      WHERE id = ANY($1::int[]) AND display_title IS NOT NULL RETURNING id`,
    [TITLE_IDS],
  );
  console.log(`\nreverted: ${back.length} fall row(s) switched back on, ${cleared.length} display_title(s) cleared.`);
  process.exit(0);
}

/* ── validation 1: the file matches the live rows, exactly ──────────────── */

const live = await db.query(
  `SELECT id, name, display_title, room, is_active, pin_rank, product_type, amazon_url, price, rating, review_count
     FROM products WHERE id = ANY($1::int[]) ORDER BY id`,
  [ids],
);
const byId = new Map(live.map((r) => [Number(r.id), r]));
const missing = ids.filter((id) => !byId.has(id));
if (missing.length) fail(`ids in the decision file that are not in the catalog: ${missing.join(", ")}.`);

for (const r of rows) {
  const dbRow = byId.get(Number(r.id));
  const rendered = (dbRow.display_title || "").trim() || (dbRow.name || "").trim();
  if (rendered !== String(r.old_title).trim()) {
    fail(
      `row ${r.id}: the card renders "${rendered}" but the decision file says "${r.old_title}". ` +
        "Someone changed the row since the file was written; nothing was written.",
    );
  }
}

/* ── validation 2: the pairs are real duplicates and the rooms are right ── */

const asinOf = (url) => {
  const m = String(url || "").match(/\/dp\/([A-Z0-9]{10})/);
  return m ? m[1] : null;
};

for (const pair of doc.pairs || []) {
  const k = byId.get(Number(pair.keep));
  const d = byId.get(Number(pair.deactivate));
  if (!k || !d) fail(`pair (${pair.keep}, ${pair.deactivate}) is not in the catalog.`);
  const ka = asinOf(k.amazon_url);
  const da = asinOf(d.amazon_url);
  if (!ka || !da) fail(`pair (${pair.keep}, ${pair.deactivate}) has no readable ASIN.`);
  if (ka !== da) fail(`pair (${pair.keep}, ${pair.deactivate}) points at different ASINs (${ka} vs ${da}).`);
  if (ka !== pair.asin) fail(`pair (${pair.keep}, ${pair.deactivate}) is ${ka}, the file says ${pair.asin}.`);
}
if ((doc.pairs || []).length !== 6) fail(`the file lists ${(doc.pairs || []).length} pairs, expected 6.`);

for (const id of BEDROOM_SURVIVORS) {
  const r = byId.get(id);
  if (r.room !== "bedroom") fail(`survivor ${id} is in room "${r.room}", expected bedroom.`);
  if (!r.is_active) fail(`survivor ${id} is not active.`);
}
for (const id of FALL_DUPLICATES) {
  const r = byId.get(id);
  if (r.room !== "fall") fail(`fall copy ${id} is in room "${r.room}", expected fall.`);
  if (!r.is_active) fail(`fall copy ${id} is already inactive; the file is stale.`);
  if (r.pin_rank !== null && r.pin_rank !== undefined) {
    fail(`fall copy ${id} is in the Pinterest rotation (pin_rank ${r.pin_rank}); a pin points at it.`);
  }
  if (String(r.product_type || "").toLowerCase() === "apparel") {
    fail(`fall copy ${id} is apparel, so it would move /apparel.`);
  }
}

/* ── validation 3: nothing else on the site holds these six ─────────────── */

const colls = await db.query(`SELECT slug, product_ids FROM collections WHERE product_ids IS NOT NULL`);
for (const c of colls) {
  const list = Array.isArray(c.product_ids) ? c.product_ids.map(Number) : [];
  const hits = list.filter((x) => FALL_DUPLICATES.includes(x));
  if (hits.length) fail(`collection "${c.slug}" holds ${hits.join(", ")} by hand.`);
}

const rel = await db.query(
  `SELECT product_id, related_product_id FROM related_products
    WHERE product_id = ANY($1::int[]) OR related_product_id = ANY($1::int[])`,
  [FALL_DUPLICATES],
);
if (rel.length) {
  fail(
    `related_products references the fall copies: ${rel
      .map((r) => `${r.product_id}->${r.related_product_id}`)
      .join(", ")}.`,
  );
}

/* ── validation 4: the page counts are the ones the task was written on ─── */

const counts = await db.query(
  `SELECT room, count(*)::int AS n FROM products WHERE is_active = true AND room IN ('fall','bedroom') GROUP BY 1`,
);
const countOf = (room) => Number((counts.find((c) => c.room === room) || {}).n || 0);
if (countOf("fall") !== BEFORE_FALL) {
  fail(`/room/fall serves ${countOf("fall")} cards, the task says ${BEFORE_FALL}. Re-count before writing.`);
}
if (countOf("bedroom") !== BEFORE_BEDROOM) {
  fail(`/room/bedroom serves ${countOf("bedroom")} cards, the task says ${BEFORE_BEDROOM}. Re-count before writing.`);
}

/* ── validation 5: a new title must not collide with a live card in its room ── */

const roomMates = await db.query(
  `SELECT id, room, coalesce(nullif(display_title, ''), name) AS rendered
     FROM products WHERE is_active = true AND room = ANY($1::text[])`,
  [[...new Set(titledRows.map((r) => byId.get(Number(r.id)).room))]],
);
for (const r of titledRows) {
  const room = byId.get(Number(r.id)).room;
  const clash = roomMates.find(
    (m) => m.room === room && Number(m.id) !== Number(r.id) && m.rendered === r.new_title,
  );
  if (clash) fail(`row ${r.id}: "${r.new_title}" is already the card title of ${clash.id} in room ${room}.`);
}

/* ── report the plan ────────────────────────────────────────────────────── */

console.log(`decision file       ${FILE}`);
console.log(`/room/fall before   ${countOf("fall")} active cards`);
console.log(`/room/bedroom       ${countOf("bedroom")} active cards (unchanged)`);
console.log(`deactivating        ${deactivateIds.join(", ")}`);
console.log(`survivors kept      ${keepIds.join(", ")}`);
console.log(`titles rewritten    ${titledIds.length}`);
console.log(`/room/fall after    ${countOf("fall") - deactivateIds.length} active cards`);
console.log(`checks passed       titles match live rows, 6 pairs share one ASIN each, no edit / holiday set / pin / related row holds a fall copy`);

if (DRY_RUN) {
  console.log("\n--dry-run: no rows written.");
  process.exit(0);
}

/* ── the write: one statement, so it lands whole or not at all ──────────── */

// Every decided row goes into the payload, titled or not. The UPDATE joins on
// this set, so a row with no new title must still be present (new_title null)
// or its is_active change would silently not happen.
const titlePayload = JSON.stringify(
  rows.map((r) => ({
    id: Number(r.id),
    new_title: r.new_title === null || r.new_title === undefined ? null : String(r.new_title),
  })),
);

const written = await db.query(
  `WITH t AS (
     SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id int, new_title text)
   ), upd AS (
     UPDATE products p
        SET display_title = coalesce(t.new_title, p.display_title),
            is_active = CASE WHEN p.id = ANY($2::int[]) THEN false ELSE p.is_active END,
            updated_at = now()
       FROM t
      WHERE p.id = t.id
      RETURNING p.id
   )
   SELECT count(*)::int AS n FROM upd`,
  [titlePayload, deactivateIds],
);

if (Number(written[0].n) !== ids.length) {
  console.error(
    `WARNING: expected ${ids.length} rows touched, the statement reported ${written[0].n}. Inspect before doing anything else.`,
  );
}

/* ── read back ──────────────────────────────────────────────────────────── */

const after = await db.query(
  `SELECT room, count(*)::int AS n FROM products WHERE is_active = true AND room IN ('fall','bedroom') GROUP BY 1`,
);
const afterOf = (room) => Number((after.find((c) => c.room === room) || {}).n || 0);

const fallRows = await db.query(
  `SELECT id, is_active, room, display_title, price, rating, review_count, amazon_url
     FROM products WHERE id = ANY($1::int[]) ORDER BY id`,
  [FALL_DUPLICATES],
);
const titleRows = await db.query(
  `SELECT id, display_title FROM products WHERE id = ANY($1::int[]) ORDER BY id`,
  [TITLE_IDS],
);

console.log("\nread back:");
console.log(`  /room/fall active      ${afterOf("fall")}`);
console.log(`  /room/bedroom active  ${afterOf("bedroom")}`);
console.log("  fall copies:");
for (const r of fallRows) {
  console.log(
    `    ${r.id} room=${r.room} active=${r.is_active} price=${r.price} rating=${Number(r.rating)} reviews=${r.review_count ?? "none"}`,
  );
}
console.log("  card titles:");
for (const r of titleRows) console.log(`    ${r.id}  ${r.display_title}`);

const badTitles = titleRows.filter((r) => !String(r.display_title || "").trim());
if (badTitles.length) console.error(`WARNING: ${badTitles.map((r) => r.id).join(", ")} still have no display_title.`);
if (afterOf("fall") !== BEFORE_FALL - FALL_DUPLICATES.length) {
  console.error(`WARNING: /room/fall is ${afterOf("fall")}, expected ${BEFORE_FALL - FALL_DUPLICATES.length}.`);
  process.exitCode = 1;
}
if (afterOf("bedroom") !== BEFORE_BEDROOM) {
  console.error(`WARNING: /room/bedroom moved to ${afterOf("bedroom")}, expected ${BEFORE_BEDROOM}.`);
  process.exitCode = 1;
}

console.log("\nDone. Rollback: UPDATE products SET is_active = true WHERE id IN (232,233,234,235,236,237);");
