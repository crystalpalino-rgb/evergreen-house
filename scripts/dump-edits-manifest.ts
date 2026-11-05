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

interface SnapshotItemRow {
  id: number;
  slug: string;
  name: string;
  display_title: string;
  hook: string;
  raw_name: boolean;
  price_override?: number | null;
  price_set_at?: string | null;
}

interface SnapshotRow {
  slug: string;
  snapshot: {
    slug: string;
    title: string;
    headline: string;
    intro: string;
    art_note: string;
    hero_image: string;
    card_image: string;
    related?: string[];
    items: SnapshotItemRow[];
  };
}

async function main() {
  /* Since collection admin phase 2a the public pages render the published
     snapshot in `edit_publications`, not the draft in `edits` / `edit_items`.
     The manifest is the outage fallback for those same pages, so it is dumped
     from the same place: dumping the draft would make the fallback show an
     unpublished change. */
  const snapshotRows = (await db`
    SELECT e.slug, p.snapshot
      FROM edits e
      JOIN edit_publications p ON p.edit_id = e.id
     WHERE e.status = 'published'
     ORDER BY e.sort_order, e.id
  `) as unknown as SnapshotRow[];

  const metaRows = (await db`
    SELECT key, value FROM edits_manifest_meta
  `) as unknown as { key: string; value: string | null }[];

  const meta = new Map(metaRows.map((r) => [r.key, r.value ?? ""]));

  /* Key order is part of the contract: it is what makes the dump reproduce the
     pre-migration file byte for byte. Do not reorder. */
  const collections = snapshotRows.map((row) => {
    const edit = row.snapshot;
    const items = (edit.items ?? []).map((item) => {
      const out: Record<string, unknown> = {
        id: Number(item.id),
        slug: item.slug ?? "",
        name: item.name ?? "",
        display_title: item.display_title ?? "",
        hook: item.hook ?? "",
        raw_name: Boolean(item.raw_name),
      };
      /* Present only on a card the owner typed a price on, so an edit with no
         typed price dumps exactly as it did before phase 2a. */
      if (item.price_override != null) {
        out.price_override = Number(item.price_override);
        out.price_set_at = item.price_set_at ?? null;
      }
      return out;
    });
    const out: Record<string, unknown> = {
      slug: edit.slug ?? row.slug,
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

  const itemCount = collections.reduce(
    (total, collection) => total + (collection.items as unknown[]).length,
    0,
  );

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
        `OK: src/data/edits/manifest.json matches the published snapshots exactly (${collections.length} edits, ${itemCount} items, ${serialised.length} bytes).`,
      );
      return;
    }
    const at = firstDifference(current, serialised);
    console.error(
      `MISMATCH: src/data/edits/manifest.json differs from the published snapshots at byte ${at}.`,
    );
    console.error(`  file:     ${JSON.stringify(current.slice(at, at + 120))}`);
    console.error(`  database: ${JSON.stringify(serialised.slice(at, at + 120))}`);
    process.exit(1);
  }

  writeFileSync(OUT, serialised);
  console.log(
    `Wrote src/data/edits/manifest.json (${collections.length} edits, ${itemCount} items, ${serialised.length} bytes)`,
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
