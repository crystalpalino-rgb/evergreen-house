#!/usr/bin/env node
/**
 * Build src/data/pins/manifest.json, the checked-in data behind the five
 * Pinterest landing pages at /pin/<slug> (project P3).
 *
 * Dry run by default: prints what it would write and changes nothing.
 * `--apply` copies any missing pin art into public/images/ and writes the
 * manifest. Re-running on unchanged inputs produces a byte-identical file, so
 * the script is safe to run in a loop.
 *
 * Inputs
 *   /home/team/shared/pinterest/pin-kit-2026-10-11/disc-map.json
 *     The numbered discs baked into four of the five live pins (v3 discs).
 *   /home/team/shared/pinterest/pin-kit-2026-10-11/render-v2.py
 *     The tablescape pin (pin-holiday-hosting-table.jpg) is not in the disc map:
 *     its five numbered pills exist only as code in this renderer, so the
 *     labels and their order are read from the PIN config there.
 *   /home/team/shared/pinterest/pin-pages-copy-2026-11-04.json
 *     Marketing's page copy. Authoritative for the page title, headline, intro,
 *     alt, meta description and for the per-number label wording and order.
 *   src/data/edits/manifest.json
 *     The destination edits: supplies the display title, hook and product slug
 *     for every numbered product that is on sale.
 *   src/data/holiday-hidden-products.json
 *     Products verified to have no Amazon buy box. A number that lands here is
 *     rendered honestly (numeral, label, image, "not available") with no Amazon
 *     link and no price, and it is never dropped or renumbered.
 *
 * Rules this script enforces, because a silently wrong pin page is worse than a
 * failed build:
 *   - a product id that resolves to no edit item and no hidden product is a hard
 *     failure, never a dropped card;
 *   - the label in the copy file and the label on the disc must match;
 *   - the copy file's number list must cover every disc on the pin, in the same
 *     order, so the page count always equals the pin count;
 *   - the destination edit named by the copy file must be the edit the pin was
 *     built against.
 */

import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHARED = "/home/team/shared";

const DISC_MAP = join(SHARED, "pinterest/pin-kit-2026-10-11/disc-map.json");
const RENDER_V2 = join(SHARED, "pinterest/pin-kit-2026-10-11/render-v2.py");
const COPY_FILE = join(SHARED, "pinterest/pin-pages-copy-2026-11-04.json");
const PIN_ART_DIR = join(SHARED, "pinterest/pin-kit-2026-10-11/images-v4");

const EDITS = join(ROOT, "src/data/edits/manifest.json");
const HIDDEN = join(ROOT, "src/data/holiday-hidden-products.json");
const OUT = join(ROOT, "src/data/pins/manifest.json");
const PUBLIC_IMAGES = join(ROOT, "public/images");

/** The one pin that has no entry in the disc map. */
const TABLESCAPE_PIN = "pin-holiday-hosting-table.jpg";

/**
 * Product ids for the tablescape pin's pills, keyed by the label printed on the
 * ART, not the label printed on the page. Four of the five labels also appear on
 * another pin's disc, so they resolve from the disc map by label; the pitcher
 * appears only here, and its id is the row that replaced the Spode pitcher on
 * 2026-11-04 (the Spode piece had no Amazon buy box, so the owner approved the
 * swap).
 *
 * Owner rule (2026-11-05): the pin carries the broad label (GLASS PITCHER) and
 * the landing page carries the exact product name the card sells (CUT CRYSTAL
 * PITCHER). So the page's displayed label comes from the copy file's `numbers`,
 * while the art's pill label only has to resolve to a product id here.
 */
const TABLESCAPE_LABEL_IDS = {
  "GLASS PITCHER": 628,
};

const apply = process.argv.includes("--apply");

function fail(message) {
  console.error(`\nBUILD FAILED: ${message}\n`);
  process.exit(1);
}

function readJson(path, label) {
  if (!existsSync(path)) fail(`${label} not found at ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`${label} is not valid JSON (${path}): ${err.message}`);
  }
}

/** Pin slug from its file name: pin-luxe-christmas-tree.jpg -> luxe-christmas-tree */
function slugFromPinFile(file) {
  return file.replace(/^pin-/, "").replace(/\.jpg$/, "");
}

/**
 * Width and height read straight out of the JPEG SOF marker, so the manifest
 * declares the art's real size instead of a number someone typed.
 */
function jpegSize(path) {
  const buf = readFileSync(path);
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // SOF0..SOF15, excluding DHT (0xc4), JPG (0xc8) and DAC (0xcc).
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9) {
      i += 2;
      continue;
    }
    const length = buf.readUInt16BE(i + 2);
    if (length < 2) return null;
    i += 2 + length;
  }
  return null;
}

/**
 * The tablescape pin's numbered pills, read out of its config block in
 * render-v2.py. The block runs from the pin's key to the closing "]),".
 */
function readTablescapePills() {
  const source = readFileSync(RENDER_V2, "utf8");
  const start = source.indexOf(`"${TABLESCAPE_PIN}": dict(`);
  if (start === -1) fail(`render-v2.py has no config block for ${TABLESCAPE_PIN}`);
  const end = source.indexOf("]),", start);
  if (end === -1) fail(`could not find the end of the ${TABLESCAPE_PIN} block in render-v2.py`);
  const block = source.slice(start, end);
  const pills = [...block.matchAll(/dict\(\s*n=(\d+),\s*label="([^"]+)"/g)].map((m) => ({
    n: Number(m[1]),
    label: m[2].trim(),
  }));
  if (pills.length === 0) fail(`no numbered pills parsed out of ${TABLESCAPE_PIN}`);
  return pills;
}

// ── Load inputs ─────────────────────────────────────────────────────────────

const discMap = readJson(DISC_MAP, "disc map");
const copy = readJson(COPY_FILE, "pin page copy");
const edits = readJson(EDITS, "edits manifest");
const hidden = readJson(HIDDEN, "hidden products list");

const editBySlug = new Map(edits.collections.map((c) => [c.slug, c]));
const hiddenById = new Map(hidden.hidden.map((h) => [Number(h.id), h]));

/** label -> product id, from every disc on every pin (labels repeat across pins). */
const labelToId = new Map();
for (const pin of discMap.pins) {
  for (const disc of pin.discs) {
    const label = disc.label.trim();
    const existing = labelToId.get(label);
    if (existing !== undefined && existing !== Number(disc.product_id)) {
      fail(`label "${label}" maps to two product ids (${existing} and ${disc.product_id})`);
    }
    labelToId.set(label, Number(disc.product_id));
  }
}

/** Every pin we know about, keyed by the slug its landing page uses. */
const pinsBySlug = new Map();
for (const pin of discMap.pins) {
  pinsBySlug.set(slugFromPinFile(pin.pin), {
    pinFile: pin.pin,
    collectionSlug: pin.collection_slug,
    discs: pin.discs.map((d) => ({ n: Number(d.n), label: d.label.trim(), id: Number(d.product_id) })),
  });
}
pinsBySlug.set(slugFromPinFile(TABLESCAPE_PIN), {
  pinFile: TABLESCAPE_PIN,
  collectionSlug: "holiday-hosting-edit",
  discs: readTablescapePills().map((pill) => {
    const id = labelToId.get(pill.label) ?? TABLESCAPE_LABEL_IDS[pill.label];
    if (id === undefined) {
      fail(`no product id for tablescape pill ${pill.n} "${pill.label}" (not in the disc map, not in TABLESCAPE_LABEL_IDS)`);
    }
    return { n: pill.n, label: pill.label, id: Number(id) };
  }),
});

// ── Build the pages ─────────────────────────────────────────────────────────

const pages = [];
const problems = [];

for (const page of copy.pages) {
  const slug = page.slug.replace(/^\/pin\//, "");
  const known = pinsBySlug.get(slug);
  if (!known) fail(`copy file has a page for /pin/${slug} but no pin of that name exists`);

  const destination = page.destination;
  const expectedDestination = `/collections/${known.collectionSlug}`;
  if (destination !== expectedDestination) {
    fail(`/pin/${slug} points at ${destination} but the pin was built for ${expectedDestination}`);
  }

  const edit = editBySlug.get(known.collectionSlug);
  if (!edit) fail(`destination edit ${known.collectionSlug} is not in src/data/edits/manifest.json`);
  const editItems = new Map(edit.items.map((i) => [Number(i.id), i]));

  const discByN = new Map(known.discs.map((d) => [d.n, d]));
  const copyNumbers = [...page.numbers].sort((a, b) => a.n - b.n);

  // Count check: the page must carry exactly the discs the pin carries.
  if (copyNumbers.length !== known.discs.length) {
    fail(`/pin/${slug}: copy file lists ${copyNumbers.length} numbers, the pin has ${known.discs.length} discs`);
  }

  const numbers = [];
  for (const entry of copyNumbers) {
    const disc = discByN.get(entry.n);
    if (!disc) fail(`/pin/${slug}: number ${entry.n} has no disc on the pin`);
    const label = entry.label.trim();
    if (label !== disc.label) {
      fail(`/pin/${slug} number ${entry.n}: copy label "${label}" does not match the disc label "${disc.label}"`);
    }
    // The label printed on the page is normally the label printed on the art, so
    // a shopper matching a disc to a card never has to translate. The owner can
    // override that per number with `page_label` when the art carries a broad
    // name and the card sells a specific piece (tablescape pill 1: art says
    // GLASS PITCHER, page says CUT CRYSTAL PITCHER). `label` must still match the
    // art, so the override can never drift from the pin it belongs to.
    const pageLabel = (entry.page_label ?? entry.label).trim();

    const item = editItems.get(disc.id);
    const hiddenRow = hiddenById.get(disc.id);
    if (!item && !hiddenRow) {
      fail(
        `/pin/${slug} number ${entry.n}: product id ${disc.id} ("${label}") is in neither ` +
          `${known.collectionSlug} nor src/data/holiday-hidden-products.json`,
      );
    }
    if (!item && hiddenRow) {
      problems.push(
        `/pin/${slug} number ${entry.n}: id ${disc.id} "${label}" is off sale (no Amazon buy box) - ` +
          `renders as a numbered card with no link and no price`,
      );
    }
    if (item && hiddenRow) {
      fail(
        `/pin/${slug} number ${entry.n}: id ${disc.id} is both on sale in ${known.collectionSlug} ` +
          `and on the no-buy-box list - one of the two files is stale`,
      );
    }

    numbers.push({
      n: entry.n,
      label: pageLabel,
      product_id: disc.id,
      display_title: item ? item.display_title : hiddenRow.display_title,
      product_slug: item ? item.slug : null,
      hook: item ? item.hook : null,
      unavailable: !item,
    });
  }

  const imagePath = `/images/pin-v4-${slug}.jpg`;
  const artSource = join(PIN_ART_DIR, known.pinFile);
  const artTarget = join(PUBLIC_IMAGES, `pin-v4-${slug}.jpg`);
  if (!existsSync(artTarget) && !existsSync(artSource)) {
    fail(`pin art for ${slug} is missing (neither ${artTarget} nor ${artSource} exists)`);
  }
  const size = jpegSize(existsSync(artTarget) ? artTarget : artSource);
  if (!size) fail(`could not read the pixel size of the pin art for ${slug}`);

  pages.push({
    slug,
    destination,
    title: page.title,
    headline: page.headline,
    intro: page.intro,
    alt: page.alt,
    meta_description: page.meta_description,
    image: imagePath,
    image_width: size.width,
    image_height: size.height,
    numbers,
  });

  if (apply && !existsSync(artTarget)) {
    copyFileSync(artSource, artTarget);
    console.log(`copied ${known.pinFile} -> public${imagePath}`);
  }
}

// Copy order follows the copy file; keep it stable and independent of the
// iteration order of any map.
pages.sort((a, b) => copy.pages.findIndex((p) => p.slug === `/pin/${a.slug}`) - copy.pages.findIndex((p) => p.slug === `/pin/${b.slug}`));

const manifest = {
  note:
    "Generated by scripts/build-pin-pages.mjs from the Pinterest pin kit disc map, the tablescape pin's renderer config and marketing's page copy. Do not edit by hand: re-run the script.",
  source: {
    disc_map: "pinterest/pin-kit-2026-10-11/disc-map.json",
    tablescape_pills: "pinterest/pin-kit-2026-10-11/render-v2.py",
    copy: "pinterest/pin-pages-copy-2026-11-04.json",
    art: "pinterest/pin-kit-2026-10-11/images-v4",
  },
  pages,
};

const serialised = `${JSON.stringify(manifest, null, 2)}\n`;
const previous = existsSync(OUT) ? readFileSync(OUT, "utf8") : null;
const unchanged = previous === serialised;

console.log("");
for (const page of pages) {
  const onSale = page.numbers.filter((n) => !n.unavailable).length;
  console.log(
    `/pin/${page.slug.padEnd(24)} ${page.numbers.length} numbers (${onSale} on sale, ` +
      `${page.numbers.length - onSale} off sale) -> ${page.destination} [${page.image_width}x${page.image_height}]`,
  );
  for (const n of page.numbers) {
    console.log(
      `   ${String(n.n).padStart(2)} ${n.label.padEnd(26)} id ${String(n.product_id).padEnd(4)} ` +
        `${n.unavailable ? "OFF SALE (no link, no price)" : n.display_title}`,
    );
  }
}
console.log("");
for (const problem of problems) console.log(`note: ${problem}`);
console.log("");

if (!apply) {
  console.log(
    unchanged
      ? "dry run: src/data/pins/manifest.json is already up to date (re-run with --apply to write)"
      : "dry run: src/data/pins/manifest.json would change (re-run with --apply to write)",
  );
  process.exit(0);
}

writeFileSync(OUT, serialised);
console.log(
  unchanged
    ? `wrote src/data/pins/manifest.json (no change)`
    : `wrote src/data/pins/manifest.json (${serialised.length} bytes)`,
);
