/**
 * Dump the `edits` and `edit_items` tables back out to
 * src/data/edits/manifest.json.
 *
 * Collection admin (P6adm) phase 1: the database is the source of truth for the
 * curated edits, and the checked-in manifest is a generated export of it. Two
 * build scripts still read the file, so it has to stay in the repo and stay
 * exact:
 *   - scripts/build-pin-pages.mjs resolves a pin number to an edit item and
 *     hard-fails if it stops resolving.
 *   - scripts/build-thanksgiving-edits.mjs was the writer before this migration.
 *
 * The output is byte-identical to the file the manifest had before the move:
 * `JSON.stringify(value, null, 2)` plus a trailing newline, with the keys in the
 * original order (the collection objects are rebuilt by hand for that reason,
 * not spread from the row).
 *
 * Usage:
 *   bun run scripts/dump-edits-manifest.ts           write the file
 *   bun run scripts/dump-edits-manifest.ts --check    fail if the file differs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "../src/db";
import { loadDatabaseUrl } from "./lib/load-env";

loadDatabaseUrl();
const db = sql();

const CHECK = process.argv.includes("--check");
const OUT = join(import.meta.dir, "..", "src", "data", "edits", "manifest.json");

interface EditRow {
  id: number;
  slug: string;
  title: string;
  headline: string | null;
  intro: string | null;
  art_note: string | null;
  hero_image: string | null;
  card_image: string | null;
  related: string[] | null;
}

interface ItemRow {
  edit_id: number;
  product_id: number;
  position: number;
  display_title: string | null;
  hook: string | null;
  slug: string | null;
  name: string | null;
  raw_name: boolean | null;
}

async function main() {
  const editRows = (await db`
    SELECT id, slug, title, headline, intro, art_note, hero_image, card_image,
           related
      FROM edits
     WHERE status = 'published'
     ORDER BY sort_order, id
  `) as unknown as EditRow[];

  const itemRows = (await db`
    SELECT edit_id, product_id, position, display_title, hook, slug, name,
           raw_name
      FROM edit_items
     ORDER BY edit_id, position, id
  `) as unknown as ItemRow[];

  const metaRows = (await db`
    SELECT key, value FROM edits_manifest_meta
  `) as unknown as { key: string; value: string | null }[];

  const meta = new Map(metaRows.map((r) => [r.key, r.value ?? ""]));

  const byEdit = new Map<number, ItemRow[]>();
  for (const row of itemRows) {
    const key = Number(row.edit_id);
    const list = byEdit.get(key);
    if (list) list.push(row);
    else byEdit.set(key, [row]);
  }

  /* Key order is part of the contract: it is what makes the dump reproduce the
     pre-migration file byte for byte. Do not reorder. */
  const collections = editRows.map((edit) => {
    const items = (byEdit.get(Number(edit.id)) ?? []).map((item) => ({
      id: Number(item.product_id),
      slug: item.slug ?? "",
      name: item.name ?? "",
      display_title: item.display_title ?? "",
      hook: item.hook ?? "",
      raw_name: Boolean(item.raw_name),
    }));
    const out: Record<string, unknown> = {
      slug: edit.slug,
      title: edit.title,
      headline: edit.headline ?? "",
      intro: edit.intro ?? "",
      art_note: edit.art_note ?? "",
      hero_image: edit.hero_image ?? "",
      card_image: edit.card_image ?? "",
    };
    if (edit.related && edit.related.length > 0) out.related = edit.related;
    out.items = items;
    return out;
  });

  const manifest = {
    manifest_version: meta.get("manifest_version") ?? "",
    note: meta.get("note") ?? "",
    collections,
  };

  const serialised = `${JSON.stringify(manifest, null, 2)}\n`;
  const current = readFileSync(OUT, "utf8");

  if (CHECK) {
    if (current === serialised) {
      console.log(
        `OK: src/data/edits/manifest.json matches the database exactly (${collections.length} edits, ${itemRows.length} items, ${serialised.length} bytes).`,
      );
      return;
    }
    const at = firstDifference(current, serialised);
    console.error(
      `MISMATCH: src/data/edits/manifest.json differs from the database at byte ${at}.`,
    );
    console.error(`  file:     ${JSON.stringify(current.slice(at, at + 120))}`);
    console.error(`  database: ${JSON.stringify(serialised.slice(at, at + 120))}`);
    process.exit(1);
  }

  writeFileSync(OUT, serialised);
  console.log(
    `Wrote src/data/edits/manifest.json (${collections.length} edits, ${itemRows.length} items, ${serialised.length} bytes)`,
  );
}

function firstDifference(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  for (let i = 0; i < max; i++) if (a[i] !== b[i]) return i;
  return max;
}

main()
  .then(() => process.exit(0))
  .catch((err: Error) => {
    console.error("Dump failed:", err.message);
    process.exit(1);
  });
