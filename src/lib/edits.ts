import { sql } from "~/db";
import manifest from "~/data/edits/manifest.json";

/**
 * "Shop the Edit" collections.
 *
 * The curated data (slug, title, ordered item list, hook per item) is checked
 * into the repo at src/data/edits/manifest.json, copied from the owner-facing
 * curation deliverable /home/team/shared/collections/manifest-2026-10-10.json.
 * The five-collection source file has a fifth entry (winter-capsule-wardrobe)
 * which is deliberately NOT published (owner decision): it is filtered out of
 * the checked-in file, so it has no route and no card.
 *
 * The manifest owns the ORDER and the editorial copy. The database owns the
 * live product facts (name, image, affiliate URL), fetched by id.
 *
 * URL rule (from the curation README): the manifest `slug` is the whole URL and
 * is used verbatim for the product link and nothing is rebuilt from `name`,
 * because 9 of the 47 names are long Amazon listing titles whose name-derived
 * slug is truncated at 120 characters.
 */

export interface EditItem {
  id: number;
  slug: string;
  name: string;
  display_title: string;
  hook: string;
  raw_name: boolean;
}

export interface EditCollection {
  slug: string;
  title: string;
  headline: string;
  intro: string;
  art_note: string;
  hero_image: string;
  card_image: string;
  items: EditItem[];
}

const ALL: EditCollection[] = (manifest as { collections: EditCollection[] })
  .collections;

/** The four published edits, in the order the owner brief lists them. */
export const EDITS: EditCollection[] = ALL;

export const EDIT_SLUGS: string[] = EDITS.map((e) => e.slug);

export function getEdit(slug: string): EditCollection | null {
  return EDITS.find((e) => e.slug === slug) ?? null;
}

/** The other three edits, for the "Related edits" strip. */
export function getRelatedEdits(slug: string, limit = 3): EditCollection[] {
  return EDITS.filter((e) => e.slug !== slug).slice(0, limit);
}

/** Artist-credited hero/card art: webp first, jpg fallback. */
export function artSources(base: string): {
  webp: string;
  jpg: string;
} {
  return { webp: `${base}.webp`, jpg: `${base}.jpg` };
}

export interface EditProduct {
  id: number;
  /** The manifest display title (short form for raw Amazon listing names). */
  title: string;
  /** Canonical /product/<slug> path segment, used verbatim from the manifest. */
  slug: string;
  hook: string;
  imageUrl: string | null;
  imageAlt: string;
  amazonUrl: string;
  hasRealUrl: boolean;
}

interface ProductRow {
  id: number;
  name: string | null;
  image_url: string | null;
  image_alt: string | null;
  amazon_url: string | null;
}

/**
 * Live product rows for one edit, in manifest order.
 *
 * One query for the whole edit, keyed on the integer ids from the curated file
 * (never on names or slugs: 21 slugs in the catalog are shared by more than one
 * row, so slug matching can silently resolve to a different product). An id
 * that has gone missing from the catalog is skipped rather than rendered as a
 * blank card.
 */
export async function getEditProducts(
  edit: EditCollection,
): Promise<EditProduct[]> {
  const ids = edit.items.map((i) => i.id).filter((n) => Number.isInteger(n));
  if (ids.length === 0) return [];
  const db = sql();
  const rows = (await db.query(
    `SELECT id, name, image_url, image_alt, amazon_url FROM products WHERE id IN (${ids.join(
      ",",
    )})`,
    [],
  )) as unknown as ProductRow[];

  const byId = new Map<number, ProductRow>();
  for (const row of rows) byId.set(Number(row.id), row);

  const out: EditProduct[] = [];
  for (const item of edit.items) {
    const row = byId.get(item.id);
    if (!row) continue;
    const amazonUrl = (row.amazon_url || "").trim();
    out.push({
      id: item.id,
      title: item.display_title || item.name,
      slug: item.slug,
      hook: item.hook,
      imageUrl: row.image_url || null,
      imageAlt:
        row.image_alt || `${item.display_title || item.name} - Evergreen House`,
      amazonUrl,
      hasRealUrl: amazonUrl.startsWith("http"),
    });
  }
  return out;
}

/** Product count per edit, for the cards and the /collections list. */
export function editItemCount(edit: EditCollection): number {
  return edit.items.length;
}
