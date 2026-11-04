/**
 * Generate the checked-in holiday page data from the verified curation file:
 *
 *   src/data/holiday-sets.json             the three owner-approved sets, in
 *                                          order, membership by product id
 *   src/data/holiday-hidden-products.json  products with no Amazon buy box,
 *                                          hidden from the holiday pages but
 *                                          still active in the catalog
 *
 * The order of a set is the order the rows appear in the curation file, which
 * is the order the merchandiser approved them in.
 *
 * The hidden list comes from two places, both checked in below or in the
 * curation file, never hand-typed into the JSON: rows the curation file marks
 * bucket "unavailable", plus NO_BUY_BOX_RECHECKED, the products the lead
 * re-checked live on 2026-11-04 and found to have no buy box while the curation
 * file still lists them under a live bucket.
 *
 * Usage: node scripts/build-holiday-sets.mjs [path/to/room-cards.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SRC =
  process.argv[2] || "/home/team/shared/curation/room-cards-2026-11-04.json";
const SETS_OUT = new URL("../src/data/holiday-sets.json", import.meta.url);
const HIDDEN_OUT = new URL("../src/data/holiday-hidden-products.json", import.meta.url);

/** The three sets, in page order, with the owner-approved intro lines. */
const SET_DEFS = [
  {
    id: "hosting-table",
    bucket: "hosting-table",
    title: "The Hosting Table",
    intro: "China, glass, linen and candlelight, set for the long dinner.",
  },
  {
    id: "tree-and-mantel",
    bucket: "tree-and-mantel",
    title: "Tree and Mantel",
    intro: "Ornaments, garland and greenery, gathered where the room glows.",
  },
  {
    id: "porch",
    bucket: "porch",
    title: "The Porch",
    intro: "The first thing guests see and the last thing you switch off.",
  },
];

/**
 * Products that the curation file still lists under a live bucket, but that the
 * lead re-checked on Amazon on 2026-11-04 and found to have no buy box: no Add
 * to Cart, no Buy Now, "See All Buying Options" only, listing not unavailable.
 *
 * The rule they break: no page a pin points at may carry a card a visitor
 * cannot buy. They are suppressed, never deleted: they stay active in the
 * catalog and stay in room=holiday, so they come back by themselves when Amazon
 * restores a buy box and the file is regenerated. Every reason names the
 * re-check that retired it, the same shape as the four bucket-derived entries.
 */
const NO_BUY_BOX_RECHECKED = [
  {
    id: 81,
    reason:
      "Re-checked 2026-11-04: still no buy box, See All Buying Options only. Listing is not unavailable. Hidden from More Christmas Finds: a visitor cannot add it to a cart. ASIN B0FHK4714F, $5.99, 4.6 stars. Not deleted, still active in room=holiday.",
  },
  {
    id: 115,
    reason:
      "Re-checked 2026-11-04: still no buy box, See All Buying Options only. Listing is not unavailable. Hidden from More Christmas Finds: a visitor cannot add it to a cart. ASIN B0D9H6QKCK, $9.99, 3.9 stars. Not deleted, still active in room=holiday.",
  },
  {
    id: 523,
    reason:
      "Re-checked 2026-11-04: still no buy box, See All Buying Options only. Listing is not unavailable. Hidden from More Christmas Finds: a visitor cannot add it to a cart. ASIN B0HCNFB3PV, $19.99, 4.6 stars. Not deleted, still active in room=holiday.",
  },
];

/** Buckets that actually render on /room/holiday and /collection/holiday. */
const PAGE_BUCKETS = new Set([
  ...SET_DEFS.map((def) => def.bucket),
  "full-inventory-only",
  "pinned",
]);

const rows = JSON.parse(readFileSync(SRC, "utf8"));
const byBucket = (bucket) => rows.filter((r) => r.bucket === bucket);

const sets = SET_DEFS.map((def) => {
  const members = byBucket(def.bucket);
  if (!members.length) throw new Error(`no rows for bucket ${def.bucket}`);
  return {
    id: def.id,
    title: def.title,
    intro: def.intro,
    productIds: members.map((r) => Number(r.id)),
  };
});

const hiddenRows = byBucket("unavailable");
const fromBucket = hiddenRows.map((r) => ({
  id: Number(r.id),
  display_title: r.display_title,
  reason: r.notes || "No Amazon buy box on the verification date.",
  verified_at: r.verified_at,
}));

// The re-checked three: every id must exist in the curation file and must sit
// in a bucket that renders on the holiday pages, otherwise hiding it would do
// nothing and the real problem is upstream in the file.
const fromRecheck = NO_BUY_BOX_RECHECKED.map((entry) => {
  const row = rows.find((r) => Number(r.id) === entry.id);
  if (!row) {
    throw new Error(
      `suppressed product ${entry.id} is not in the curation file ${SRC}`,
    );
  }
  if (!PAGE_BUCKETS.has(row.bucket)) {
    throw new Error(
      `suppressed product ${entry.id} sits in bucket ${row.bucket}, which does not render on the holiday pages`,
    );
  }
  return {
    id: Number(entry.id),
    display_title: row.display_title,
    reason: entry.reason,
    verified_at: "2026-11-04",
  };
});

const hidden = [...new Map([...fromBucket, ...fromRecheck].map((h) => [h.id, h])).values()];

if (hidden.length !== fromBucket.length + fromRecheck.length) {
  throw new Error("a suppressed product is listed twice: check the curation file");
}

mkdirSync(dirname(new URL(SETS_OUT).pathname), { recursive: true });
writeFileSync(
  SETS_OUT,
  `${JSON.stringify(
    {
      note:
        "Generated by scripts/build-holiday-sets.mjs from the verified curation file. Set order is page order; each set renders its productIds in this order. Regenerate, never hand-edit.",
      source: SRC,
      generated_for: "2026-11-04",
      sets,
    },
    null,
    2,
  )}\n`,
);
writeFileSync(
  HIDDEN_OUT,
  `${JSON.stringify(
    {
      note:
        "Products with no Amazon buy box on the verification date. Hidden from /room/holiday and /collection/holiday only: they stay active in the catalog and stay in room=holiday, so they come back by themselves when Amazon restores stock. Generated by scripts/build-holiday-sets.mjs.",
      source: SRC,
      verified_at: "2026-11-04",
      hidden,
    },
    null,
    2,
  )}\n`,
);

for (const s of sets) console.log(`${s.id}: ${s.productIds.length} ids`);
console.log(`hidden: ${hidden.map((h) => h.id).join(", ")}`);
