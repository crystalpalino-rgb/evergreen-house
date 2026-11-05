/**
 * Pin disc replacements, 2026-11-04: the checked-in data half.
 *
 * Runs after scripts/apply-pin-disc-replacements.mjs has written the two product
 * rows. It reads the ids back from that script's proof file, so no id is typed
 * by hand here.
 *
 * What it changes, and nothing else:
 *
 *   1. src/data/edits/manifest.json
 *        luxe-christmas-tree-edit      new ornaments row at position 2 (index 1)
 *        holiday-hosting-edit          new pitcher row at position 1 (index 0)
 *      Every other item keeps its content and its relative order. The retired
 *      rows (81, 483) are NOT in this file and are not added: they stay in the
 *      catalog, suppressed and unlisted.
 *
 *   2. /home/team/shared/pinterest/pin-kit-2026-10-11/disc-map.json
 *        luxe disc 2   label WHITE PEARL ORNAMENTS -> WHITE GLASS ORNAMENTS,
 *                      product_id 81 -> the new row, display_title and
 *                      product_slug follow it
 *
 *   3. /home/team/shared/pinterest/pin-pages-copy-2026-11-04.json
 *        /pin/luxe-christmas-tree number 2 label -> WHITE GLASS ORNAMENTS
 *        /pin/holiday-hosting-table number 1 label -> CUT CRYSTAL PITCHER
 *      (build-pin-pages.mjs fails if a copy label and a disc label disagree.)
 *
 * The tablescape pin's own disc label lives in the pin kit's renderer config
 * (render-v2.py) and in TABLESCAPE_LABEL_IDS in scripts/build-pin-pages.mjs;
 * both are edited by hand in the same commit, because the owner is redrawing
 * that disc and the two must change together.
 *
 * Dry run by default, --apply to write. Idempotent: a file that already carries
 * the new value is left alone.
 *
 * Usage:
 *   bun run scripts/patch-pin-disc-edits.mjs
 *   bun run scripts/patch-pin-disc-edits.mjs --apply
 */
import { readFileSync, writeFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const PROOF = "/home/team/shared/pin-disc-replacements-apply-2026-11-04.json";
const EDITS = new URL("../src/data/edits/manifest.json", import.meta.url).pathname;
const DISC_MAP = "/home/team/shared/pinterest/pin-kit-2026-10-11/disc-map.json";
const COPY = "/home/team/shared/pinterest/pin-pages-copy-2026-11-04.json";

const problems = [];
const changes = [];
const fail = (msg) => problems.push(msg);

const proof = JSON.parse(readFileSync(PROOF, "utf8"));
const rowFor = (asin) => proof.rows.find((r) => r.asin === asin);
const ornaments = rowFor("B09BV75CL3");
const pitcher = rowFor("B000VA4D1G");
if (!ornaments) fail("proof file has no row for B09BV75CL3");
if (!pitcher) fail("proof file has no row for B000VA4D1G");
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const ORNAMENTS = {
  id: Number(ornaments.id),
  slug: ornaments.seo_slug,
  name: ornaments.name,
  display_title: ornaments.display_title,
  hook: ornaments.card_hook,
  raw_name: false,
};
const PITCHER = {
  id: Number(pitcher.id),
  slug: pitcher.seo_slug,
  name: pitcher.name,
  display_title: pitcher.display_title,
  hook: pitcher.card_hook,
  raw_name: false,
};

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Re-serialise exactly the way the file was written: 2 spaces, and the same
 *  trailing-newline answer it already had, so the diff carries only real edits. */
function writeJsonLike(path, value) {
  const raw = readFileSync(path, "utf8");
  const trailing = raw.endsWith("\n") ? "\n" : "";
  writeFileSync(path, `${JSON.stringify(value, null, 2)}${trailing}`);
}

/* ── 1. the edits manifest ───────────────────────────────────────────────── */

const edits = readJson(EDITS);
const editBySlug = new Map(edits.collections.map((c) => [c.slug, c]));

function placeItem(collectionSlug, position, item) {
  const edit = editBySlug.get(collectionSlug);
  if (!edit) {
    fail(`edits manifest has no collection ${collectionSlug}`);
    return;
  }
  const at = edit.items.findIndex((i) => Number(i.id) === item.id);
  if (at === position - 1) return; // already in place
  if (at !== -1) {
    edit.items.splice(at, 1);
    changes.push(`${collectionSlug}: moved id ${item.id} from position ${at + 1} to ${position}`);
  } else {
    changes.push(`${collectionSlug}: inserted id ${item.id} at position ${position} (was ${edit.items.length} items)`);
  }
  edit.items.splice(position - 1, 0, item);
}

placeItem("luxe-christmas-tree-edit", 2, ORNAMENTS);
placeItem("holiday-hosting-edit", 1, PITCHER);

const NOTE_APPEND =
  " 2026-11-04 (pin disc replacements): the two pinned products that had no Amazon buy box were replaced at owner approval. luxe-christmas-tree-edit position 2 is now id " +
  `${ORNAMENTS.id} ${ORNAMENTS.display_title} (was the VioraWhite pearl set, id 81, still in the catalog but unlisted); holiday-hosting-edit position 1 is now id ${PITCHER.id} ` +
  `${PITCHER.display_title} (was the Spode pitcher, id 483, still in the catalog but unlisted). Both new rows were read live on Amazon on 2026-11-04.`;
if (!String(edits.note).includes("pin disc replacements")) {
  edits.note = `${edits.note}${NOTE_APPEND}`;
  changes.push("edits manifest: note extended with the 2026-11-04 pin disc replacement record");
}

/* ── 2. the disc map ─────────────────────────────────────────────────────── */

const discMap = readJson(DISC_MAP);
const luxePin = discMap.pins.find((p) => p.pin === "pin-luxe-christmas-tree.jpg");
if (!luxePin) fail("disc map has no pin-luxe-christmas-tree.jpg");
else {
  const disc = luxePin.discs.find((d) => Number(d.n) === 2);
  if (!disc) fail("disc map luxe pin has no disc 2");
  else {
    const before = { label: disc.label, product_id: disc.product_id, display_title: disc.display_title, product_slug: disc.product_slug };
    disc.label = "WHITE GLASS ORNAMENTS";
    disc.product_id = ORNAMENTS.id;
    disc.display_title = ORNAMENTS.display_title;
    disc.product_slug = ORNAMENTS.slug;
    if (JSON.stringify(before) !== JSON.stringify({ label: disc.label, product_id: disc.product_id, display_title: disc.display_title, product_slug: disc.product_slug })) {
      changes.push(`disc map luxe disc 2: ${before.label} (id ${before.product_id}) -> ${disc.label} (id ${disc.product_id})`);
    }
  }
}

/* ── 3. the pin page copy ────────────────────────────────────────────────── */

const copy = readJson(COPY);
function relabel(pageSlug, n, label) {
  const page = copy.pages.find((p) => p.slug === pageSlug);
  if (!page) {
    fail(`copy file has no page ${pageSlug}`);
    return;
  }
  const entry = page.numbers.find((x) => Number(x.n) === n);
  if (!entry) {
    fail(`copy file ${pageSlug} has no number ${n}`);
    return;
  }
  if (entry.label !== label) {
    changes.push(`copy ${pageSlug} number ${n}: "${entry.label}" -> "${label}"`);
    entry.label = label;
  }
}
relabel("/pin/luxe-christmas-tree", 2, "WHITE GLASS ORNAMENTS");
relabel("/pin/holiday-hosting-table", 1, "CUT CRYSTAL PITCHER");

/* ── report ──────────────────────────────────────────────────────────────── */

console.log("Pin disc replacements: checked-in data");
console.log(`  mode  ${APPLY ? "APPLY" : "dry run (nothing is written)"}`);
console.log(`  rows  ${ORNAMENTS.id} ${ORNAMENTS.display_title}`);
console.log(`        ${PITCHER.id} ${PITCHER.display_title}`);
console.log("");
if (changes.length === 0) console.log("  nothing to change: every file already carries the new values");
else {
  console.log("  changes");
  for (const change of changes) console.log(`   - ${change}`);
}

const luxe = editBySlug.get("luxe-christmas-tree-edit");
const hosting = editBySlug.get("holiday-hosting-edit");
console.log("");
console.log(`  luxe-christmas-tree-edit  ${luxe.items.length} items, position 2 = id ${luxe.items[1].id} ${luxe.items[1].display_title}`);
console.log(`  holiday-hosting-edit      ${hosting.items.length} items, position 1 = id ${hosting.items[0].id} ${hosting.items[0].display_title}`);

if (problems.length) {
  console.log("");
  console.error(`ABORT - ${problems.length} problem(s), nothing was written.`);
  for (const p of problems) console.error(`  * ${p}`);
  process.exit(1);
}

if (!APPLY) {
  console.log("");
  console.log("Dry run complete. Re-run with --apply to write.");
  process.exit(0);
}

writeJsonLike(EDITS, edits);
writeJsonLike(DISC_MAP, discMap);
writeJsonLike(COPY, copy);
console.log("");
console.log("wrote src/data/edits/manifest.json");
console.log(`wrote ${DISC_MAP}`);
console.log(`wrote ${COPY}`);
console.log("next: bun run scripts/build-pin-pages.mjs --apply");
