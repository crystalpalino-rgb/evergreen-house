#!/usr/bin/env bun
/**
 * Title, colour and last-card-hook fixes for 2026-11-04.
 *
 * Three small, separate repairs to the products table, applied together:
 *
 *   1. Six rows whose name and display_title were a chopped Amazon listing
 *      title. Both columns are set to the clean human title the owner verified
 *      against the live listing today, and full_text_search is refreshed for
 *      those six rows with the same expression scripts/backfill-search.ts uses.
 *      seo_slug is never written, so /product/<slug> keeps resolving to the
 *      same row.
 *   2. The last three authored card_hook lines (laundry and pantry), from
 *      /home/team/shared/curation/card-hooks-batch3-2026-11-04.json. After this
 *      batch no active card falls back to the generic room line.
 *   3. Row 54 colours: "brown" was the wrong colourway. The listing is Black
 *      Oak, so the colors array becomes ["Black Oak"] and search and filtering
 *      stop mislabelling it.
 *
 * Nothing else is touched: price, rating, review_count, availability,
 * price_checked_at and pin_rank stay exactly as the Thanksgiving and
 * pin-priority passes left them. The script proves that by snapshotting every
 * column of every row it touches before the write and diffing it afterwards.
 *
 * Usage (from the site directory):
 *   bun run scripts/apply-title-and-hook-fixes-2026-11-04.mjs           # dry run
 *   bun run scripts/apply-title-and-hook-fixes-2026-11-04.mjs --apply   # write
 *
 * The dry run is the default: it validates everything and prints the exact
 * diff it would write, and changes nothing.
 *
 * All validation runs before any write. The writes go out as one non
 * interactive transaction (the neon HTTP driver batches them), so a half
 * applied pass cannot happen. A second run of the same script finds every
 * target already stored and exits 0 without writing.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import {
  cardHookLine,
  cardRoomLabel,
  hookEndsCleanly,
  HOOK_MAX,
} from "../src/lib/card-copy.ts";

const APPLY = process.argv.includes("--apply");
const HOOKS_FILE =
  "/home/team/shared/curation/card-hooks-batch3-2026-11-04.json";

/** The six truncated titles, with the ASIN each row must already carry. */
const TITLE_FIXES = [
  { id: 2, asin: "B0CRZ48HRZ", title: "DREO Quiet Oscillating Pedestal Fan with Remote, Silver" },
  { id: 11, asin: "B09K8VP4V3", title: "SMEG Pink 50's Retro Style Hand Mixer with Dough Hooks" },
  { id: 12, asin: "B0C85XTX4D", title: "Gold Round Wall Mirror with Metal Frame, 30 Inch" },
  { id: 54, asin: "B0D4PX4784", title: "mopio Quin Round Tambour Coffee Table with Storage" },
  { id: 59, asin: "B01DZW4B68", title: "Teamson Home Arquer Arc Floor Lamp, Black Shade" },
  { id: 173, asin: "B09D3Y8XKN", title: "SMEG Mini 50's Retro Style Electric Kettle, Cream" },
];

/** Row 54's colourway. The stored "brown" is wrong: the listing is Black Oak. */
const COLOR_FIX = { id: 54, from: "brown", to: "Black Oak" };

/** Rooms whose cards the hook batch is meant to close out. */
const HOOK_ROOMS = ["laundry", "pantry"];

/** Columns this pass is allowed to change. Anything else differing is a bug. */
const WRITABLE = new Set([
  "name",
  "display_title",
  "colors",
  "card_hook",
  "full_text_search",
  "updated_at",
]);

/** Google caps a Merchant Center product title at 150 characters. */
const TITLE_MAX = 150;

/** The full_text_search expression, copied from scripts/backfill-search.ts. */
const FTS_EXPR = `
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(full_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(editor_note, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(brand, '')), 'B')`;

const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) {
    // The sandbox exports channel_binding=require, which the neon parser rejects.
    return fromEnv.replace(/&?channel_binding=require/, "");
  }
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (line) {
      return line
        .slice(line.indexOf("=") + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/&?channel_binding=require/, "");
    }
  } catch {
    /* no .env.local - fall through to the error below */
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

/** One reason the pass cannot run, collected so every problem is reported. */
const problems = [];

/** Copy checks shared by the titles and the hooks. */
function checkCopy(label, value, max) {
  const text = String(value ?? "");
  if (!text.trim()) return `${label}: empty`;
  if (text !== text.trim()) return `${label}: leading or trailing whitespace`;
  if (text.includes(EM_DASH) || text.includes(EN_DASH)) return `${label}: em or en dash`;
  // eslint-disable-next-line no-control-regex
  if (!/^[\x20-\x7E]+$/.test(text)) return `${label}: non ASCII text`;
  if (text.length > max) return `${label}: ${text.length} characters, over ${max}`;
  return null;
}

function asinOf(url) {
  const match = /\/dp\/([A-Za-z0-9]{10})(?=[/?]|$)/.exec(url || "");
  return match ? match[1].toUpperCase() : null;
}

function sameArray(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((value, i) => value === b[i]);
}

/**
 * Count active cards in these rooms that would still render the generic
 * "An Evergreen House pick for the ..." line, exactly the way ProductCard
 * decides it: a stored card_hook wins, otherwise cardHookLine derives one.
 */
async function fallbackReport(rooms) {
  const rows = await db.query(
    `SELECT id, room, name, display_title, editor_note, card_hook
       FROM products
      WHERE is_active = true
        AND room = ANY($1::text[])`,
    [rooms],
  );
  const byRoom = {};
  for (const room of rooms) byRoom[room] = { active: 0, withHook: 0, fallback: 0, ids: [] };
  for (const row of rows) {
    const bucket = byRoom[row.room];
    if (!bucket) continue;
    bucket.active += 1;
    const hook = (row.card_hook || "").trim();
    if (hook) {
      bucket.withHook += 1;
      continue;
    }
    const line = cardHookLine(row.editor_note || null, row.name || null, cardRoomLabel(row.room));
    if (/^An Evergreen House pick/.test(line)) {
      bucket.fallback += 1;
      bucket.ids.push(row.id);
    }
  }
  return byRoom;
}

/** Same count across every active row, so the whole-site claim is provable. */
async function siteFallbackCount() {
  const rows = await db.query(
    "SELECT id, room, name, editor_note, card_hook FROM products WHERE is_active = true",
  );
  let fallback = 0;
  for (const row of rows) {
    if ((row.card_hook || "").trim()) continue;
    const line = cardHookLine(row.editor_note || null, row.name || null, cardRoomLabel(row.room));
    if (/^An Evergreen House pick/.test(line)) fallback += 1;
  }
  return { active: rows.length, fallback };
}

function printFallback(label, report) {
  const parts = Object.entries(report)
    .map(([room, r]) => `${room} ${r.fallback} fallback of ${r.active} active (${r.withHook} authored hooks)`)
    .join(", ");
  console.log(`${label}: ${parts}`);
  for (const [room, r] of Object.entries(report)) {
    if (r.fallback) console.log(`  ${room} still falling back: ids ${r.ids.join(", ")}`);
  }
}

async function main() {
  console.log("TITLE / COLOUR / CARD HOOK FIXES, 2026-11-04");
  console.log("=========================================");
  console.log(`Mode: ${APPLY ? "APPLY (writes)" : "DRY RUN (writes nothing)"}`);
  console.log(`Hooks file: ${HOOKS_FILE}\n`);

  // ---- 1. Copy validation, before anything touches the database. ----
  for (const fix of TITLE_FIXES) {
    const problem = checkCopy(`title ${fix.id}`, fix.title, TITLE_MAX);
    if (problem) problems.push(problem);
  }
  const titleIds = TITLE_FIXES.map((f) => f.id);
  const dupTitleIds = titleIds.filter((id, i) => titleIds.indexOf(id) !== i);
  if (dupTitleIds.length) problems.push(`duplicate ids in title fixes: ${dupTitleIds.join(", ")}`);

  const hookFile = JSON.parse(readFileSync(HOOKS_FILE, "utf8"));
  const hooks = Array.isArray(hookFile.hooks) ? hookFile.hooks : [];
  if (!hooks.length) problems.push("hooks file carries no hooks");
  if (Number(hookFile.count) !== hooks.length) {
    problems.push(`hooks count field is ${hookFile.count} but the file carries ${hooks.length}`);
  }
  const hookIds = hooks.map((h) => Number(h.id));
  const dupHookIds = hookIds.filter((id, i) => hookIds.indexOf(id) !== i);
  if (dupHookIds.length) problems.push(`duplicate ids in hooks file: ${dupHookIds.join(", ")}`);
  for (const hook of hooks) {
    const problem = checkCopy(`hook ${hook.id}`, hook.hook, HOOK_MAX);
    if (problem) problems.push(problem);
    if (!hookEndsCleanly(String(hook.hook || ""))) {
      problems.push(`hook ${hook.id}: does not read as a finished thought`);
    }
  }
  const overlap = hookIds.filter((id) => titleIds.includes(id));
  if (overlap.length) problems.push(`ids in both the title and hook sets: ${overlap.join(", ")}`);

  // ---- 2. Row validation. ----
  const ids = [...new Set([...titleIds, ...hookIds, COLOR_FIX.id])];
  const before = await db.query(
    "SELECT * FROM products WHERE id = ANY($1::int[]) ORDER BY id",
    [ids],
  );
  const byId = new Map(before.map((row) => [Number(row.id), row]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) problems.push(`ids not found in products: ${missing.join(", ")}`);

  for (const fix of TITLE_FIXES) {
    const row = byId.get(fix.id);
    if (!row) continue;
    if (row.is_active !== true) problems.push(`title ${fix.id}: row is not active`);
    const asin = asinOf(row.amazon_url);
    if (asin !== fix.asin) {
      problems.push(`title ${fix.id}: amazon_url ASIN is ${asin}, expected ${fix.asin}`);
    }
    if (!row.seo_slug) {
      problems.push(`title ${fix.id}: seo_slug is null, so the live URL is name derived and would move`);
    }
  }

  for (const hook of hooks) {
    const row = byId.get(Number(hook.id));
    if (!row) continue;
    if (row.room !== hook.room) {
      problems.push(`hook ${hook.id}: file room ${hook.room} but database room ${row.room}`);
    }
    const current = typeof row.card_hook === "string" ? row.card_hook.trim() : "";
    if (current && current !== hook.hook) {
      problems.push(`hook ${hook.id}: already carries different copy "${current}"`);
    }
  }

  const colorRow = byId.get(COLOR_FIX.id);
  if (colorRow) {
    const current = Array.isArray(colorRow.colors) ? colorRow.colors : [];
    const isFrom = sameArray(current, [COLOR_FIX.from]);
    const isTo = sameArray(current, [COLOR_FIX.to]);
    if (!isFrom && !isTo) {
      problems.push(
        `colours ${COLOR_FIX.id}: stored as [${current.join(", ")}], expected ["${COLOR_FIX.from}"] or ["${COLOR_FIX.to}"]`,
      );
    }
  }

  if (problems.length) {
    console.log("VALIDATION FAILED, nothing written:");
    for (const problem of problems) console.log(`  - ${problem}`);
    process.exit(1);
  }
  console.log(`Validated: ${TITLE_FIXES.length} titles, ${hooks.length} hooks, 1 colour fix, ${ids.length} rows matched.\n`);

  // ---- 3. What still needs writing (a re-run finds nothing). ----
  // A row needs its search vector rewritten when the stored vector no longer
  // equals what the backfill expression would produce from the row as it stands.
  const stale = await db.query(
    `SELECT id,
            (full_text_search IS NULL OR full_text_search IS DISTINCT FROM (${FTS_EXPR})) AS fts_stale
       FROM products
      WHERE id = ANY($1::int[])`,
    [titleIds],
  );
  const staleById = new Map(stale.map((row) => [Number(row.id), row]));

  const titleWork = TITLE_FIXES.filter((fix) => {
    const row = byId.get(fix.id);
    const fts = staleById.get(fix.id);
    return row.name !== fix.title || row.display_title !== fix.title || fts?.fts_stale === true;
  });
  const colorWork = sameArray(colorRow.colors, [COLOR_FIX.from]);
  const hookWork = hooks.filter((hook) => byId.get(Number(hook.id)).card_hook !== hook.hook);

  const beforeFallback = await fallbackReport(HOOK_ROOMS);
  printFallback("Fallback before", beforeFallback);
  const beforeSite = await siteFallbackCount();
  console.log(`  whole site: ${beforeSite.fallback} of ${beforeSite.active} active cards fall back\n`);

  console.log("PLANNED CHANGES");
  for (const fix of TITLE_FIXES) {
    const row = byId.get(fix.id);
    console.log(`  ${fix.id} name:        "${row.name}"`);
    console.log(`  ${fix.id} ->            "${fix.title}"`);
    console.log(`  ${fix.id} display:     "${row.display_title ?? "(null)"}" -> "${fix.title}"`);
  }
  console.log(`  ${COLOR_FIX.id} colors:      [${(colorRow.colors || []).join(", ")}] -> ["${COLOR_FIX.to}"]`);
  for (const hook of hooks) {
    const row = byId.get(Number(hook.id));
    console.log(`  ${hook.id} card_hook:   "${row.card_hook ?? "(null)"}" -> "${hook.hook}"`);
  }
  console.log(
    `\nRows needing a write: titles ${titleWork.length}, colours ${colorWork ? 1 : 0}, hooks ${hookWork.length}\n`,
  );

  if (!titleWork.length && !colorWork && !hookWork.length) {
    console.log("Already applied: every target is stored exactly as specified. Nothing to write.");
    console.log(`Fallback now: ${Object.values(beforeFallback).reduce((n, r) => n + r.fallback, 0)} in ${HOOK_ROOMS.join(" and ")}.`);
    return;
  }

  if (!APPLY) {
    console.log("Dry run complete. Re-run with --apply to write these changes.");
    return;
  }

  // ---- 4. Write, in one transaction. ----
  const titleValues = TITLE_FIXES.map((_, i) => `($${i * 2 + 1}::int, $${i * 2 + 2}::text)`).join(", ");
  const titleParams = TITLE_FIXES.flatMap((fix) => [fix.id, fix.title]);
  const hookValues = hooks.map((_, i) => `($${i * 2 + 1}::int, $${i * 2 + 2}::text)`).join(", ");
  const hookParams = hooks.flatMap((hook) => [Number(hook.id), String(hook.hook)]);

  const [titleResult, ftsResult, colorResult, hookResult] = await db.transaction((txn) => [
    txn.query(
      `UPDATE products AS p
          SET name = v.title,
              display_title = v.title
         FROM (VALUES ${titleValues}) AS v(id, title)
        WHERE p.id = v.id
     RETURNING p.id, p.name, p.display_title`,
      titleParams,
    ),
    txn.query(
      `UPDATE products
          SET full_text_search = ${FTS_EXPR}
        WHERE id = ANY($1::int[])
     RETURNING id, full_text_search IS NOT NULL AS has_fts`,
      [titleIds],
    ),
    txn.query(
      `UPDATE products
          SET colors = ARRAY[$1::text]
        WHERE id = $2::int
     RETURNING id, colors`,
      [COLOR_FIX.to, COLOR_FIX.id],
    ),
    txn.query(
      `UPDATE products AS p
          SET card_hook = v.hook
         FROM (VALUES ${hookValues}) AS v(id, hook)
        WHERE p.id = v.id
     RETURNING p.id, p.card_hook`,
      hookParams,
    ),
  ]);

  console.log("WROTE");
  console.log(`  titles:  ${titleResult.length} rows updated`);
  console.log(`  search:  ${ftsResult.length} rows reindexed, ${ftsResult.filter((r) => r.has_fts).length} non null`);
  console.log(`  colours: ${colorResult.length} rows updated -> [${(colorResult[0]?.colors || []).join(", ")}]`);
  console.log(`  hooks:   ${hookResult.length} rows updated\n`);

  // ---- 5. Post write proof. ----
  const after = await db.query(
    "SELECT * FROM products WHERE id = ANY($1::int[]) ORDER BY id",
    [ids],
  );
  const afterById = new Map(after.map((row) => [Number(row.id), row]));

  const failures = [];
  for (const fix of TITLE_FIXES) {
    const row = afterById.get(fix.id);
    if (row.name !== fix.title) failures.push(`title ${fix.id}: name is "${row.name}"`);
    if (row.display_title !== fix.title) failures.push(`title ${fix.id}: display_title is "${row.display_title}"`);
    if (row.seo_slug !== byId.get(fix.id).seo_slug) failures.push(`title ${fix.id}: seo_slug changed`);
    if (!row.full_text_search) failures.push(`title ${fix.id}: full_text_search is null`);
  }
  for (const hook of hooks) {
    if (afterById.get(Number(hook.id)).card_hook !== hook.hook) {
      failures.push(`hook ${hook.id}: stored value differs from the file`);
    }
  }
  if (!sameArray(afterById.get(COLOR_FIX.id).colors, [COLOR_FIX.to])) {
    failures.push(`colours ${COLOR_FIX.id}: stored as [${(afterById.get(COLOR_FIX.id).colors || []).join(", ")}]`);
  }

  // Column level diff: nothing outside WRITABLE may have moved.
  const changedColumns = new Map();
  for (const id of ids) {
    const beforeRow = byId.get(id);
    const afterRow = afterById.get(id);
    for (const key of Object.keys(afterRow)) {
      if (WRITABLE.has(key)) continue;
      const a = JSON.stringify(beforeRow[key] ?? null);
      const b = JSON.stringify(afterRow[key] ?? null);
      if (a !== b) {
        failures.push(`row ${id}: column ${key} changed (${a} -> ${b})`);
        changedColumns.set(key, true);
      }
    }
  }

  console.log("PROOF");
  for (const fix of TITLE_FIXES) {
    const row = afterById.get(fix.id);
    console.log(`  ${fix.id}  name="${row.name}"`);
    console.log(`  ${fix.id}  slug="${row.seo_slug}"  price=${row.price}  rating=${row.rating}  reviews=${row.review_count}  stock=${row.availability}`);
  }
  const colorAfter = afterById.get(COLOR_FIX.id);
  console.log(`  ${COLOR_FIX.id}  colors=[${(colorAfter.colors || []).join(", ")}]  price=${colorAfter.price}  rating=${colorAfter.rating}`);
  for (const hook of hooks) {
    console.log(`  ${hook.id}  card_hook="${afterById.get(Number(hook.id)).card_hook}"`);
  }
  console.log(
    `  columns changed across all ${ids.length} rows: ${
      ["name", "display_title", "colors", "card_hook", "full_text_search", "updated_at"]
        .filter((key) => after.some((row) => JSON.stringify(row[key] ?? null) !== JSON.stringify(byId.get(Number(row.id))[key] ?? null)))
        .join(", ") || "none"
    }`,
  );

  const afterFallback = await fallbackReport(HOOK_ROOMS);
  printFallback("Fallback after ", afterFallback);
  const afterSite = await siteFallbackCount();
  console.log(`  whole site: ${afterSite.fallback} of ${afterSite.active} active cards fall back`);

  const remaining = Object.values(afterFallback).reduce((n, r) => n + r.fallback, 0);
  if (remaining !== 0) failures.push(`${remaining} cards in ${HOOK_ROOMS.join(" and ")} still fall back`);

  if (failures.length) {
    console.log("\nPOST WRITE CHECKS FAILED:");
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exit(1);
  }
  console.log("\nAll post write checks passed.");
}

main().catch((error) => {
  console.error(`\nFAILED: ${error.message}`);
  process.exit(1);
});
