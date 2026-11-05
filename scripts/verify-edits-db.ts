/**
 * Proof harness for the collection admin data layer (P6adm phase 1).
 *
 * Compares the `edits` and `edit_items` tables against the checked-in export
 * (src/data/edits/manifest.json) field by field, in order, and fails on the
 * first difference. This is the acceptance test for the backfill and for any
 * later admin write that is expected to leave the export unchanged.
 *
 * Usage: bun run scripts/verify-edits-db.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "../src/db";
import { loadDatabaseUrl } from "./lib/load-env";

loadDatabaseUrl();
const db = sql();

const MANIFEST = join(import.meta.dir, "..", "src", "data", "edits", "manifest.json");

const EDIT_FIELDS = [
  "slug",
  "title",
  "headline",
  "intro",
  "art_note",
  "hero_image",
  "card_image",
] as const;

const ITEM_FIELDS = [
  "slug",
  "name",
  "display_title",
  "hook",
  "raw_name",
] as const;

type Row = Record<string, unknown>;

interface Manifest {
  manifest_version: string;
  note: string;
  collections: (Row & { items: Row[] })[];
}

let failures = 0;

function check(label: string, expected: unknown, actual: unknown) {
  const ok = JSON.stringify(expected) === JSON.stringify(actual);
  if (!ok) {
    failures++;
    console.log(`  FAIL ${label}`);
    console.log(`       manifest: ${JSON.stringify(expected)}`);
    console.log(`       database: ${JSON.stringify(actual)}`);
  }
  return ok;
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;

  const editRows = (await db`
    SELECT id, slug, title, headline, intro, art_note, hero_image, card_image,
           related, status, sort_order
      FROM edits
     ORDER BY sort_order, id
  `) as unknown as Row[];

  const itemRows = (await db`
    SELECT edit_id, product_id, position, display_title, hook, slug, name,
           raw_name
      FROM edit_items
     ORDER BY edit_id, position, id
  `) as unknown as Row[];

  const metaRows = (await db`
    SELECT key, value FROM edits_manifest_meta
  `) as unknown as { key: string; value: string }[];
  const meta = new Map(metaRows.map((r) => [r.key, r.value]));

  console.log(
    `Manifest: ${manifest.collections.length} edits, ${manifest.collections.reduce((n, c) => n + c.items.length, 0)} items`,
  );
  console.log(`Database: ${editRows.length} edits, ${itemRows.length} items\n`);

  check("manifest_version", manifest.manifest_version, meta.get("manifest_version"));
  check("note", manifest.note, meta.get("note"));
  check("edit count", manifest.collections.length, editRows.length);

  for (let i = 0; i < Math.min(manifest.collections.length, editRows.length); i++) {
    const want = manifest.collections[i];
    const got = editRows[i];
    const before = failures;
    for (const field of EDIT_FIELDS) check(`edit[${i}].${field}`, want[field], got[field]);
    check(`edit[${i}].status`, "published", got.status);
    check(`edit[${i}].sort_order`, i, got.sort_order);
    const wantRelated = Array.isArray(want.related) && want.related.length > 0 ? want.related : null;
    check(`edit[${i}].related`, wantRelated, got.related ?? null);

    const wantItems = want.items;
    const gotItems = itemRows.filter((r) => Number(r.edit_id) === Number(got.id));
    check(`edit[${i}].items.length`, wantItems.length, gotItems.length);
    for (let p = 0; p < Math.min(wantItems.length, gotItems.length); p++) {
      const wi = wantItems[p];
      const gi = gotItems[p];
      check(`edit[${i}].items[${p}].position`, p, gi.position);
      check(`edit[${i}].items[${p}].id`, wi.id, Number(gi.product_id));
      for (const field of ITEM_FIELDS) {
        check(`edit[${i}].items[${p}].${field}`, wi[field], gi[field]);
      }
    }
    console.log(
      `${failures === before ? "OK  " : "FAIL"} ${String(want.slug).padEnd(30)} ${String(gotItems.length).padStart(3)} items, all fields ${failures === before ? "equal" : "DIFFER"}`,
    );
  }

  console.log(
    failures === 0
      ? "\nPASS: the database matches the manifest field for field, in order."
      : `\nFAIL: ${failures} difference(s).`,
  );
  if (failures > 0) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((err: Error) => {
    console.error("Verify failed:", err.message);
    process.exit(1);
  });
