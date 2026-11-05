/**
 * Backfill the curated "Shop the Edit" collections into Postgres.
 *
 * Collection admin (P6adm) phase 1: the eight published edits move out of the
 * git-resident manifest (src/data/edits/manifest.json) and into the `edits` and
 * `edit_items` tables. The manifest is the source for this one pass only; after
 * it, the database is the source of truth and
 * `scripts/dump-edits-manifest.ts` writes the manifest back out as an export.
 *
 * Additive and idempotent. Every insert is `ON CONFLICT DO NOTHING` against the
 * natural key, so a second run inserts nothing and changes nothing, and no
 * existing row is ever updated or deleted:
 *   edits              -> slug (UNIQUE)
 *   edit_items         -> (edit_id, product_id) (UNIQUE)
 *   edits_manifest_meta-> key (PRIMARY KEY)
 *
 * Usage: bun run scripts/backfill-edits.ts [--apply]
 *   Dry run by default: it reports what it would insert and writes nothing.
 */
import { sql } from "../src/db";
import { loadDatabaseUrl } from "./lib/load-env";
import manifest from "../src/data/edits/manifest.json";

loadDatabaseUrl();
const db = sql();

const APPLY = process.argv.includes("--apply");

interface ManifestItem {
  id: number;
  slug: string;
  name: string;
  display_title: string;
  hook: string;
  raw_name: boolean;
}

interface ManifestEdit {
  slug: string;
  title: string;
  headline: string;
  intro: string;
  art_note: string;
  hero_image: string;
  card_image: string;
  related?: string[];
  items: ManifestItem[];
}

const manifestEdit = manifest as unknown as {
  manifest_version: string;
  note: string;
  collections: ManifestEdit[];
};

/** Postgres text[] literal. Slugs are [a-z0-9-], but quote everything anyway. */
function textArray(values: string[] | undefined): string | null {
  if (!values || values.length === 0) return null;
  return `{${values.map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;
}

async function main() {
  const collections = manifestEdit.collections;
  console.log(
    `Backfilling ${collections.length} edits from src/data/edits/manifest.json${APPLY ? "" : " (dry run)"}\n`,
  );

  if (!APPLY) {
    for (const edit of collections) {
      console.log(`  ${edit.slug.padEnd(30)} ${String(edit.items.length).padStart(3)} items`);
    }
    console.log("\nDry run. Re-run with --apply to write.");
    return;
  }

  let editsInserted = 0;
  let editsSkipped = 0;
  let itemsInserted = 0;
  let itemsSkipped = 0;

  for (let i = 0; i < collections.length; i++) {
    const edit = collections[i];
    const related = textArray(edit.related);

    const inserted = (await db`
      INSERT INTO edits
        (slug, title, headline, intro, art_note, hero_image, card_image,
         related, status, sort_order)
      VALUES
        (${edit.slug}, ${edit.title}, ${edit.headline}, ${edit.intro},
         ${edit.art_note}, ${edit.hero_image}, ${edit.card_image},
         ${related}::text[], 'published', ${i})
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `) as unknown as { id: number }[];

    let editId: number;
    if (inserted.length > 0) {
      editId = Number(inserted[0].id);
      editsInserted++;
    } else {
      const existing = (await db`
        SELECT id FROM edits WHERE slug = ${edit.slug}
      `) as unknown as { id: number }[];
      editId = Number(existing[0].id);
      editsSkipped++;
    }

    for (let p = 0; p < edit.items.length; p++) {
      const item = edit.items[p];
      const row = (await db`
        INSERT INTO edit_items
          (edit_id, product_id, position, display_title, hook, slug, name, raw_name)
        VALUES
          (${editId}, ${item.id}, ${p}, ${item.display_title}, ${item.hook},
           ${item.slug}, ${item.name}, ${item.raw_name})
        ON CONFLICT (edit_id, product_id) DO NOTHING
        RETURNING id
      `) as unknown as { id: number }[];
      if (row.length > 0) itemsInserted++;
      else itemsSkipped++;
    }

    console.log(
      `  ${edit.slug.padEnd(30)} edit ${inserted.length > 0 ? "inserted" : "already present"}, ${edit.items.length} items`,
    );
  }

  const meta = (await db`
    INSERT INTO edits_manifest_meta (key, value)
    VALUES ('manifest_version', ${manifestEdit.manifest_version}),
           ('note', ${manifestEdit.note})
    ON CONFLICT (key) DO NOTHING
    RETURNING key
  `) as unknown as { key: string }[];

  console.log(`\nedits:              ${editsInserted} inserted, ${editsSkipped} already present`);
  console.log(`edit_items:         ${itemsInserted} inserted, ${itemsSkipped} already present`);
  console.log(`manifest meta rows: ${meta.length} inserted`);
  console.log(
    meta.length === 0 && editsInserted === 0 && itemsInserted === 0
      ? "\nNothing to do: the database already holds this manifest."
      : "\nBackfill complete.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err: Error) => {
    console.error("Backfill failed:", err.message);
    process.exit(1);
  });
