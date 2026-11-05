#!/usr/bin/env node
/**
 * Clean card titles, 2026-11-05.
 *
 * The owner's Room Card Standard says a card never prints a truncated Amazon
 * listing title: it prints a clean human name for the thing the card sells.
 * 174 rows on public pages still had display_title NULL and a raw listing
 * string in `name`, so the card rendered the listing dump (keyword stuffed,
 * separated by " - ", and cut mid-word at two lines).
 *
 * This pass sets display_title on exactly those rows. It changes nothing else:
 * no price, no rating, no review count, no room, no edit membership, no
 * is_active. The one exception, called out in the decision record, is the two
 * pin-page display titles that are checked-in data rather than rows
 * (src/data/pins/manifest.json), which are regenerated from the edits manifest.
 *
 * Every check runs before the write. Any failure aborts with nothing changed.
 * The write itself is ONE SQL statement, so it lands whole or not at all.
 *
 * Usage:
 *   node scripts/clean-titles-2026-11-05.mjs --dry-run
 *   node scripts/clean-titles-2026-11-05.mjs
 *   node scripts/clean-titles-2026-11-05.mjs --revert   (display_title back to NULL)
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const FILE = "/home/team/shared/curation/clean-titles-2026-11-05.json";

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

/* ── load and validate the decision file ────────────────────────────────── */

let doc;
try {
  doc = JSON.parse(readFileSync(FILE, "utf8"));
} catch (err) {
  fail(`cannot read ${FILE}: ${err.message}`);
}
const rows = doc.rows || [];
if (!rows.length) fail(`${FILE} has no rows.`);

/* style rule: no em dash or en dash anywhere in the deliverable */
if (/[\u2013\u2014]/.test(JSON.stringify(doc))) {
  fail("em dash or en dash in the decision file.");
}

const ids = rows.map((r) => Number(r.id));
if (new Set(ids).size !== ids.length) fail("the decision file repeats a product id.");

for (const r of rows) {
  const where = `row ${r.id}`;
  if (!r.listing_url || !/^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}$/.test(String(r.listing_url))) {
    fail(`${where} has no clean listing_url.`);
  }
  if (!r.listing_title_read || !String(r.listing_title_read).trim()) {
    fail(`${where} has no listing_title_read (the title the clean name was read from).`);
  }
  if (!r.verified_at || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.verified_at))) {
    fail(`${where} has no verified_at date.`);
  }
  if (!Array.isArray(r.pages) || !r.pages.length) fail(`${where} names no public page.`);
  if (!r.old_title || !String(r.old_title).trim()) fail(`${where} has no old_title.`);
}

/* ── every new title has to look like a card title ──────────────────────── */

for (const r of rows) {
  const t = String(r.new_title || "");
  const where = `row ${r.id} ("${t}")`;
  if (t !== t.trim()) fail(`${where} has leading or trailing space.`);
  if (t.length < 25) fail(`${where} is under 25 characters.`);
  if (t.length > 60) fail(`${where} is over 60 characters.`);
  if (/\s{2,}/.test(t)) fail(`${where} has a double space.`);
  if (/[\u2013\u2014]/.test(t)) fail(`${where} contains an em dash or en dash.`);
  if (t.includes(" - ")) fail(`${where} still carries a listing separator.`);
  if (t === r.old_title) fail(`${where} is unchanged.`);
  if (/(^|\s)(\S{4,})(\s+\2)+/i.test(t)) fail(`${where} repeats a word.`);
  if (/\bamazon\b/i.test(t)) fail(`${where} names Amazon; the disclosure owns that word.`);
  // British spellings the US standard replaced on 2026-11-04.
  if (/\b(colour|grey|centre|favourite|jewellery|organiser|organisers|metre|litre)\b/i.test(t)) {
    fail(`${where} uses a British spelling.`);
  }
  // No brand spam: at most one all-caps token longer than 3 letters.
  const caps = t.split(/\s+/).filter((w) => /^[A-Z0-9&.']{4,}$/.test(w));
  if (caps.length > 1) fail(`${where} has more than one all-caps token: ${caps.join(", ")}.`);
}

/* ── revert mode ────────────────────────────────────────────────────────── */

if (REVERT) {
  // Restores display_title to exactly what it held before this pass: NULL for
  // 173 rows, and its original (over-long) string for row 595.
  const restored = await db.query(
    `WITH t AS (
       SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id int, old_display_title text, new_title text)
     ), upd AS (
       UPDATE products p
          SET display_title = t.old_display_title,
              updated_at = now()
         FROM t
        WHERE p.id = t.id AND p.display_title IS NOT DISTINCT FROM t.new_title
        RETURNING p.id
     )
     SELECT count(*)::int AS n FROM upd`,
    [
      JSON.stringify(
        rows.map((r) => ({
          id: Number(r.id),
          old_display_title: r.old_display_title ?? null,
          new_title: String(r.new_title),
        })),
      ),
    ],
  );
  console.log(`\nreverted: ${restored[0].n} of ${rows.length} display_title(s) restored to their pre-pass value.`);
  process.exit(0);
}

/* ── validation 1: the file matches the live rows, exactly ──────────────── */

const live = await db.query(
  `SELECT id, name, display_title, room, is_active, amazon_url, price, rating, review_count
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
  if (!dbRow.is_active) fail(`row ${r.id} is not active, so it is not on a public page.`);
  const asin = String(r.listing_url).slice(-10);
  if (!String(dbRow.amazon_url || "").includes(asin)) {
    fail(`row ${r.id}: listing_url ASIN ${asin} is not the ASIN on the row's amazon_url.`);
  }
  const oldDt = dbRow.display_title === null || dbRow.display_title === undefined ? null : String(dbRow.display_title);
  const declared = r.old_display_title === undefined ? null : r.old_display_title;
  if (oldDt !== (declared === null ? null : String(declared))) {
    fail(`row ${r.id}: old_display_title in the file does not match the row (${JSON.stringify(oldDt)}).`);
  }
}

/* ── validation 2: no two cards on one page end up with the same title ──── */

const after = new Map(rows.map((r) => [Number(r.id), String(r.new_title)]));
const byRoom = new Map();
for (const r of live) {
  const room = r.room;
  if (!byRoom.has(room)) byRoom.set(room, []);
  byRoom.get(room).push(r);
}
for (const [room, mates] of byRoom) {
  const seen = new Map();
  for (const m of mates) {
    const title = after.get(Number(m.id)) ?? ((m.display_title || "").trim() || (m.name || "").trim());
    if (seen.has(title)) {
      fail(`rows ${seen.get(title)} and ${m.id} would both read "${title}" on /room/${room}.`);
    }
    seen.set(title, m.id);
  }
}

/* ── validation 3: the pages the file names are public and unchanged ────── */

const HIDDEN_ROOMS = ["loungewear", "thanksgiving"];
const publishedEdits = new Set(
  (await db.query(`SELECT slug FROM edits WHERE status = 'published'`)).map((r) => r.slug),
);
for (const r of rows) {
  for (const page of r.pages) {
    if (page.startsWith("/room/")) {
      const room = page.slice("/room/".length);
      if (HIDDEN_ROOMS.includes(room)) fail(`row ${r.id} names a hidden room page ${page}.`);
      if (byId.get(Number(r.id)).room !== room) fail(`row ${r.id} does not live on ${page}.`);
    } else if (page.startsWith("/collections/")) {
      const slug = page.slice("/collections/".length);
      if (!publishedEdits.has(slug)) fail(`row ${r.id} names ${page}, which is not a published edit.`);
    } else if (page !== "/" && !page.startsWith("/pin/")) {
      fail(`row ${r.id} names an unknown page ${page}.`);
    }
  }
}

/* ── report the plan ────────────────────────────────────────────────────── */

const beforeActive = (await db.query(`SELECT count(*)::int AS n FROM products WHERE is_active = true`))[0].n;
console.log(`decision file     ${FILE}`);
console.log(`rows in file      ${rows.length}`);
console.log(`active products   ${beforeActive} (unchanged by this pass)`);
const perPage = new Map();
for (const r of rows) for (const p of r.pages) perPage.set(p, (perPage.get(p) || 0) + 1);
console.log(`pages touched     ${[...perPage.keys()].sort().length}`);
for (const p of [...perPage.keys()].sort()) console.log(`  ${p.padEnd(38)} ${perPage.get(p)} title(s)`);
console.log(`could not read    ${(doc.skipped || []).length} row(s) left alone (see decision record)`);

if (DRY_RUN) {
  console.log("\n--dry-run: no rows written.");
  process.exit(0);
}

/* ── the write: one statement, so it lands whole or not at all ──────────── */

const payload = JSON.stringify(
  rows.map((r) => ({
    id: Number(r.id),
    new_title: String(r.new_title),
    old_display_title: r.old_display_title ?? null,
  })),
);

const written = await db.query(
  `WITH t AS (
     SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id int, new_title text, old_display_title text)
   ), upd AS (
     UPDATE products p
        SET display_title = t.new_title,
            updated_at = now()
       FROM t
      WHERE p.id = t.id AND p.display_title IS NOT DISTINCT FROM t.old_display_title
      RETURNING p.id
   )
   SELECT count(*)::int AS n FROM upd`,
  [payload],
);

if (Number(written[0].n) !== rows.length) {
  console.error(
    `WARNING: expected ${rows.length} rows touched, the statement reported ${written[0].n}. Inspect before doing anything else.`,
  );
  process.exitCode = 1;
}

/* ── read back ──────────────────────────────────────────────────────────── */

const readBack = await db.query(
  `SELECT id, room, display_title, name, price, rating, review_count, is_active
     FROM products WHERE id = ANY($1::int[]) ORDER BY id`,
  [ids],
);
const activeAfter = (await db.query(`SELECT count(*)::int AS n FROM products WHERE is_active = true`))[0].n;

console.log("\nread back:");
console.log(`  active products       ${activeAfter} (was ${beforeActive})`);
const wrong = readBack.filter((r) => String(r.display_title || "") !== String(after.get(Number(r.id))));
console.log(`  titles as planned     ${readBack.length - wrong.length}/${readBack.length}`);
if (wrong.length) console.error(`  WARNING: ${wrong.map((r) => r.id).join(", ")} do not hold the planned title.`);
const stillRaw = readBack.filter((r) => {
  const t = (r.display_title || "").trim() || (r.name || "").trim();
  return t.includes(" - ") || t.length > 60;
});

if (stillRaw.length) console.error(`  WARNING: still a raw listing string: ${stillRaw.map((r) => r.id).join(", ")}`);

console.log("\nDone. Rollback: node scripts/clean-titles-2026-11-05.mjs --revert");
