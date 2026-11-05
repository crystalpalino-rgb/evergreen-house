import { sql } from "~/db";
import manifest from "~/data/edits/manifest.json";

/**
 * "Shop the Edit" collections.
 *
 * Since the collection admin work (P6adm phase 1, 2026-11-05) the curated data
 * lives in Postgres, not in the repo: `edits` holds one row per published edit
 * and `edit_items` holds its ordered product list. This module is the only
 * reader. The page loaders are async because of it; the `EditCollection` and
 * `EditProduct` shapes are unchanged, so `getCuratedProducts` and every card
 * component were not touched.
 *
 * The database owns the ORDER and the editorial copy. It also owns the live
 * product facts through `products` (name, image, affiliate URL, plus the
 * verified price, star rating and review count the card prints), fetched by id.
 *
 * `src/data/edits/manifest.json` is still checked in, but as a generated export
 * of these tables (`scripts/dump-edits-manifest.ts` writes it), not as the
 * source. Two build scripts read it: `scripts/build-pin-pages.mjs` resolves a
 * pin number to an edit item, and `scripts/build-thanksgiving-edits.mjs` was the
 * writer before this migration. It is also the outage fallback below: if the
 * database cannot be read at all, the pages render the last exported snapshot
 * instead of going dark. See the note on `fallbackEdits()`.
 *
 * URL rule (from the curation README): the curated `slug` is the whole URL and
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
  /** Optional edit-authored related list, in strip order. The two Thanksgiving
   *  edits name each other plus the holiday hosting edit; the older edits leave
   *  it unset and fall back to the first three published edits. */
  related?: string[];
  items: EditItem[];
}

/**
 * What a "Shop the Edit" card renders: art, title, link and the piece count.
 *
 * The card is used on the homepage row, the /collections list and the related
 * strip, none of which needs the ordered item list. Those surfaces therefore
 * pass this projection rather than a whole `EditCollection`, which keeps the
 * serialised loader payload small (all eight edits and their 166 items would
 * otherwise be inlined into every page that shows a card).
 */
export interface EditCardData {
  slug: string;
  title: string;
  card_image: string;
  /** Number of pieces in the edit, for the /collections card count. */
  itemCount: number;
}

/** A published edit as the list surfaces and the related strip need it. */
export interface EditSummary extends EditCardData {
  /** Edit-authored related list, in strip order. Absent on the older edits. */
  related?: string[];
}

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

interface EditItemRow {
  edit_id: number;
  product_id: number;
  position: number;
  display_title: string | null;
  hook: string | null;
  slug: string | null;
  name: string | null;
  raw_name: boolean | null;
}

/** Manifest snapshot, used only when the database cannot be read at all. */
const SNAPSHOT = (manifest as { collections: EditCollection[] }).collections;

/**
 * Last-resort render path.
 *
 * The checked-in manifest is a dump of the `edits` and `edit_items` tables, so
 * serving it while the database is unreachable shows the same published set the
 * site had when the export was written. It is never consulted when a query
 * succeeds, and never consulted for a slug that simply is not published (a
 * draft therefore cannot render through this path, because a draft is not in
 * the export). Every use logs the underlying error first.
 */
function fallbackEdits(): EditCollection[] {
  return SNAPSHOT;
}

/** The manifest snapshot in the shape the list surfaces take. */
function toSummaries(edits: EditCollection[]): EditSummary[] {
  return edits.map((edit) => {
    const summary: EditSummary = {
      slug: edit.slug,
      title: edit.title,
      card_image: edit.card_image,
      itemCount: edit.items.length,
    };
    if (edit.related && edit.related.length > 0) summary.related = edit.related;
    return summary;
  });
}

function toEdit(row: EditRow, items: EditItem[]): EditCollection {
  const edit: EditCollection = {
    slug: row.slug,
    title: row.title,
    headline: row.headline ?? "",
    intro: row.intro ?? "",
    art_note: row.art_note ?? "",
    hero_image: row.hero_image ?? "",
    card_image: row.card_image ?? "",
  };
  /* Key order matters: the manifest dump writes `related` between `card_image`
     and `items`, exactly as the original file had it. */
  if (row.related && row.related.length > 0) edit.related = row.related;
  edit.items = items;
  return edit;
}

function toItem(row: EditItemRow): EditItem {
  return {
    id: Number(row.product_id),
    slug: row.slug ?? "",
    name: row.name ?? "",
    display_title: row.display_title ?? "",
    hook: row.hook ?? "",
    raw_name: Boolean(row.raw_name),
  };
}

/**
 * The published edits, in curated order: the four holiday edits first, then the
 * four Thanksgiving edits, which is the order the homepage row and the
 * /collections list render them in. `status = 'published'` is filtered here and
 * nowhere else, so a draft row can never reach a page.
 *
 * One query: the piece count comes from an aggregate, so the ordered item lists
 * never leave the database for a page that only shows cards.
 */
export async function getEditSummaries(): Promise<EditSummary[]> {
  try {
    const db = sql();
    const rows = (await db.query(
      `SELECT e.slug, e.title, e.card_image, e.related,
              COALESCE(c.n, 0)::int AS item_count
         FROM edits e
         LEFT JOIN (
           SELECT edit_id, count(*) AS n FROM edit_items GROUP BY edit_id
         ) c ON c.edit_id = e.id
        WHERE e.status = 'published'
        ORDER BY e.sort_order, e.id`,
      [],
    )) as unknown as {
      slug: string;
      title: string;
      card_image: string | null;
      related: string[] | null;
      item_count: number;
    }[];
    return rows.map((row) => {
      const summary: EditSummary = {
        slug: row.slug,
        title: row.title,
        card_image: row.card_image ?? "",
        itemCount: Number(row.item_count),
      };
      if (row.related && row.related.length > 0) summary.related = row.related;
      return summary;
    });
  } catch (err) {
    console.error("Edits query failed, serving the exported snapshot:", err);
    return toSummaries(fallbackEdits());
  }
}

/** One published edit by slug, or null when the slug is unknown or a draft. */
export async function getEdit(slug: string): Promise<EditCollection | null> {
  let editRow: EditRow | undefined;
  let itemRows: EditItemRow[];
  try {
    const db = sql();
    const rows = (await db.query(
      `SELECT id, slug, title, headline, intro, art_note, hero_image,
              card_image, related
         FROM edits
        WHERE slug = $1 AND status = 'published'
        LIMIT 1`,
      [slug],
    )) as unknown as EditRow[];
    editRow = rows[0];
    if (!editRow) return null;
    itemRows = (await db.query(
      `SELECT edit_id, product_id, position, display_title, hook, slug, name,
              raw_name
         FROM edit_items
        WHERE edit_id = $1
        ORDER BY position, id`,
      [Number(editRow.id)],
    )) as unknown as EditItemRow[];
  } catch (err) {
    console.error(`Edit query failed for "${slug}", serving the snapshot:`, err);
    return fallbackEdits().find((e) => e.slug === slug) ?? null;
  }
  return toEdit(editRow, itemRows.map(toItem));
}

/**
 * The "Related edits" strip for one edit, in order.
 *
 * An edit that names its own related list wins: the Thanksgiving edits lead with
 * the holiday hosting edit and with each other, which a positional fallback
 * could never express (they sit last, so the fallback would always hand them the
 * Christmas edits). Everything else keeps the old behavior: the first three
 * published edits that are not this one.
 *
 * `edits` is the published summary list the caller already loaded
 * (getEditSummaries), so the strip costs no extra query.
 */
export function getRelatedEdits(
  slug: string,
  edits: EditSummary[],
  limit = 3,
): EditSummary[] {
  const self = edits.find((e) => e.slug === slug);
  const named = (self?.related ?? [])
    .filter((other) => other !== slug)
    .map((other) => edits.find((e) => e.slug === other))
    .filter((e): e is EditSummary => e !== undefined);
  const list = named.length > 0 ? named : edits.filter((e) => e.slug !== slug);
  return list.slice(0, limit);
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
  /** The curated display title (short form for raw Amazon listing names). */
  title: string;
  /** Canonical /product/<slug> path segment, used verbatim when curated. */
  slug: string;
  hook: string;
  imageUrl: string | null;
  imageAlt: string;
  amazonUrl: string;
  hasRealUrl: boolean;
  /**
   * Verified facts, straight from the product row and never touched on the way
   * here (owner Room Card Standard extended to edit and homepage cards,
   * 2026-11-04). Same three numbers the room card prints, formatted by the same
   * helpers in src/lib/card-copy.ts, so a 4.2 star row prints 4.2 and a row with
   * no rating prints no stars. Null means "the row does not carry it".
   */
  rating: number | string | null;
  reviewCount: number | string | null;
  price: number | string | null;
  /** Day the price and rating were last read from the Amazon product page. */
  priceCheckedAt: string | Date | null;
}

interface ProductRow {
  id: number;
  name: string | null;
  seo_slug: string | null;
  image_url: string | null;
  image_alt: string | null;
  amazon_url: string | null;
  rating: number | string | null;
  review_count: number | string | null;
  price: number | string | null;
  price_checked_at: string | Date | null;
}

/** The minimum a curated item list says per item. */
export interface CuratedItemRef {
  id: number;
  slug: string;
  display_title?: string;
  name?: string;
  hook?: string;
}

/**
 * Live product rows for a curated item list, in curated order.
 *
 * One query for the whole list, keyed on the integer ids from the curated list
 * (never on names or slugs: 21 slugs in the catalog are shared by more than one
 * row, so slug matching can silently resolve to a different product). An id
 * that has gone missing from the catalog is skipped rather than rendered as a
 * blank card.
 *
 * The link slug comes from the row itself when it carries a stored seo_slug, so
 * the card can never point at a URL the product route does not serve; the
 * curated slug is the fallback. Callers without a curated slug (none today) get
 * the row-derived one.
 */
export async function getCuratedProducts(
  items: CuratedItemRef[],
): Promise<EditProduct[]> {
  const wanted = items.filter((i) => Number.isInteger(i?.id));
  if (wanted.length === 0) return [];
  const ids = wanted.map((i) => i.id);
  const db = sql();
  /* One query for the whole grid, carrying the three verified facts as well as
     the card's identity (owner Room Card Standard, extended to edit and
     homepage cards on 2026-11-04): no second round trip per card, and the
     numbers the card prints are the numbers the room card prints. */
  const rows = (await db.query(
    `SELECT id, name, seo_slug, image_url, image_alt, amazon_url,
            rating, review_count, price, price_checked_at
       FROM products WHERE id IN (${ids.join(",")})`,
    [],
  )) as unknown as ProductRow[];

  const byId = new Map<number, ProductRow>();
  for (const row of rows) byId.set(Number(row.id), row);

  const out: EditProduct[] = [];
  for (const item of wanted) {
    const row = byId.get(item.id);
    if (!row) continue;
    const amazonUrl = (row.amazon_url || "").trim();
    const storedSlug = (row.seo_slug || "").trim();
    out.push({
      id: item.id,
      title: item.display_title || item.name || row.name || "",
      slug: storedSlug || item.slug,
      hook: item.hook || "",
      imageUrl: row.image_url || null,
      imageAlt:
        row.image_alt ||
        `${item.display_title || item.name || row.name || ""} - Evergreen House`,
      amazonUrl,
      hasRealUrl: amazonUrl.startsWith("http"),
      // Facts pass through untouched: the card decides what it can honestly
      // show, and src/lib/card-copy.ts does the formatting for every renderer.
      rating: row.rating ?? null,
      reviewCount: row.review_count ?? null,
      price: row.price ?? null,
      priceCheckedAt: row.price_checked_at ?? null,
    });
  }
  return out;
}

/** Live product rows for one edit, in curated order. */
export async function getEditProducts(
  edit: EditCollection,
): Promise<EditProduct[]> {
  return getCuratedProducts(edit.items);
}

/** Product count per edit, for the cards and the /collections list. */
export function editItemCount(edit: EditCollection): number {
  return edit.items.length;
}
