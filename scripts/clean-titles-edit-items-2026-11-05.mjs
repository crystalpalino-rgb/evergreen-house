#!/usr/bin/env node
/**
 * Clean card titles, part 2: the edit pages, 2026-11-05.
 *
 * An edit card prints edit_items.display_title, then edit_items.name, then the
 * product name. products.display_title never reaches an edit page. So after
 * part 1 fixed the room pages, 23 cards across three edits still printed a raw
 * Amazon listing string.
 *
 * This fills edit_items.display_title from the clean products.display_title
 * part 1 wrote. It never invents a title: a row is only touched when the
 * product already carries a clean display_title. Membership, order, images,
 * links and every product column are untouched.
 *
 * Usage:
 *   node scripts/clean-titles-edit-items-2026-11-05.mjs --dry-run
 *   node scripts/clean-titles-edit-items-2026-11-05.mjs
 *   node scripts/clean-titles-edit-items-2026-11-05.mjs --revert
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const REVERT = args.has("--revert");

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
  if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());
const fail = (msg) => {
  console.error(`\nABORT - nothing was written.\n  ${msg}\n`);
  process.exit(1);
};

const bad = (t) => t.includes(" - ") || t.length > 60;

const rows = await db.query(
  `SELECT i.id, i.edit_id, i.product_id, i.display_title AS item_display_title,
          i.name AS item_name, e.slug, p.name AS product_name,
          p.display_title AS product_display_title
     FROM edit_items i
     JOIN edits e ON e.id = i.edit_id AND e.status = 'published'
     JOIN products p ON p.id = i.product_id
    ORDER BY e.slug, i.position, i.id`,
);

const rendered = (r) =>
  (r.item_display_title || "").trim() || (r.item_name || "").trim() || (r.product_name || "").trim();

if (REVERT) {
  const ids = rows.filter((r) => r.item_display_title && !bad(r.item_display_title) && bad(rendered({ ...r, item_display_title: null }))).map((r) => Number(r.id));
  if (!ids.length) fail("nothing looks like it was written by this pass, so there is nothing to revert.");
  const back = await db.query(
    `WITH upd AS (
       UPDATE edit_items SET display_title = NULL WHERE id = ANY($1::int[]) RETURNING id
     ) SELECT count(*)::int AS n FROM upd`,
    [ids],
  );
  console.log(`reverted: ${back[0].n} edit_items.display_title set back to NULL.`);
  process.exit(0);
}

// The raw string can sit in either column: edit_items.display_title is set on
// these cards already, it just holds the listing dump copied over when the edit
// was built. So the test is on what the card actually prints, not on nullness.
const targets = rows.filter(
  (r) =>
    bad(rendered(r)) &&
    (r.product_display_title || "").trim() &&
    rendered(r) !== (r.product_display_title || "").trim(),
);
const noTitle = targets.filter((r) => !(r.product_display_title || "").trim());

console.log(`published edit cards        ${rows.length}`);
console.log(`cards still printing raw    ${targets.length}`);
console.log(`of those, no clean title    ${noTitle.length}${noTitle.length ? ": " + noTitle.map((r) => r.product_id).join(", ") : ""}`);
for (const r of targets) {
  const next = (r.product_display_title || "").trim();
  if (next && bad(next)) fail(`product ${r.product_id} would put another raw string on /collections/${r.slug}: "${next}"`);
  console.log(`  ${r.slug.padEnd(36)} ${String(r.product_id).padStart(4)}  "${rendered(r).slice(0, 50)}" -> "${next}"`);
}
if (noTitle.length) fail(`products ${noTitle.map((r) => r.product_id).join(", ")} have no clean display_title yet.`);

const ids = targets.map((r) => Number(r.id));
if (!ids.length) {
  console.log("\nNothing to do.");
  process.exit(0);
}

if (DRY_RUN) {
  console.log(`\n--dry-run: ${ids.length} rows would be written, nothing was.`);
  process.exit(0);
}

const written = await db.query(
  `WITH upd AS (
     UPDATE edit_items i
        SET display_title = p.display_title
       FROM products p
      WHERE i.product_id = p.id
        AND i.id = ANY($1::int[])
        AND p.display_title IS NOT NULL
      RETURNING i.id
   ) SELECT count(*)::int AS n FROM upd`,
  [ids],
);
console.log(`\nwritten: ${written[0].n} of ${ids.length} edit card titles.`);
if (Number(written[0].n) !== ids.length) process.exitCode = 1;
console.log("Rollback: node scripts/clean-titles-edit-items-2026-11-05.mjs --revert");
