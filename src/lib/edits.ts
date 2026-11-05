import { sql } from "~/db";
import manifest from "~/data/edits/manifest.json";

/**
 * "Shop the Edit" collections.
 *
 * Since the collection admin work (P6adm phase 1, 2026-11-05) the curated data
 * lives in Postgres, not in the repo. Since phase 2a (2026-11-05) it lives there
 * in two layers:
 *
 *   `edits` / `edit_items`      the DRAFT working copy. The curation screens in
 *                               /admin/collections write here and nowhere else.
 *   `edit_publications`         one row per live collection holding the snapshot
 *                               the public pages render, written only by the
 *                               explicit "switch this collection live" control.
 *
 * This module is the only public reader, and it reads `edit_publications` and
 * nothing else. That is the whole of the draft-then-publish guarantee: an edit
 * saved into the draft tables cannot reach a page, because no public code path
 * looks at them. `status = 'published'` is filtered here and nowhere else.
 *
 * The database owns the ORDER and the editorial copy. It also owns the live
 * product facts through `products` (name, image, affiliate URL, plus the
 * verified price, star rating and review count the card prints), fetched by id.
 *
 * A price the owner typed on a card is carried in the snapshot as
 * `price_override` plus `price_set_at`, deliberately separate from
 * `products.price`: a verification pass writes the product row, so the typed
 * figure and the verified figure never overwrite each other and the card can
 * say which of the two it is showing.
 *
 * `src/data/edits/manifest.json` is still checked in, but as a generated export
 * of the published snapshots (`scripts/dump-edits-manifest.ts` writes it), not
 * as the source. Two build scripts read it: `scripts/build-pin-pages.mjs`
 * resolves a pin number to an edit item, and `scripts/build-thanksgiving-edits.mjs`
 * was the writer before the phase 1 migration. It is also the outage fallback
 * below: if the database cannot be read at all, the pages render the last
 * exported snapshot instead of going dark. See the note on `fallbackEdits()`.
 *
 * URL rule (from the curation README): the curated `slug` is the whole URL and
 * is used verbatim for the product link and nothing else is rebuilt from `name`,
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
  /**
   * The price the owner typed on this card, and the day she typed it. Absent or
   * null means the card prints the verified `products.price` instead. Both live
   * in the published snapshot, so a typed price goes live only on publish.
   */
  price_override?: number | null;
  price_set_at?: string | null;
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

/** One item as the published snapshot stores it. */
export interface SnapshotItem {
  id: number;
  slug: string;
  name: string;
  display_title: string;
  hook: string;
  raw_name: boolean;
  price_override?: number | null;
  price_set_at?: string | null;
}

/** One collection as the published snapshot stores it (the manifest shape). */
export interface SnapshotCollection {
  slug: string;
  title: string;
  headline: string;
  intro: string;
  art_note: string;
  hero_image: string;
  card_image: string;
  related?: string[];
  items: SnapshotItem[];
}

/** Manifest snapshot, used only when the database cannot be read at all. */
const SNAPSHOT = (manifest as { collections: EditCollection[] }).collections;

/**
 * Last-resort render path.
 *
 * The checked-in manifest is a dump of the published snapshots, so serving it
 * while the database is unreachable shows the same published set the site had
 * when the export was written. It is never consulted when a query succeeds, and
 * never consulted for a slug that simply is not published (a draft therefore
 * cannot render through this path, because a draft is not in the export). Every
 * use logs the underlying error first.
 */
function fallbackEdits(): EditCollection[] {
  return SNAPSHOT;
}

/** jsonb arrives parsed from the Neon driver; a text column would arrive as a
 *  string. Accept both so a driver change cannot break the public pages. */
function asObject<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as T;
  return null;
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

function toItem(raw: SnapshotItem): EditItem {
  const item: EditItem = {
    id: Number(raw.id),
    slug: raw.slug ?? "",
    name: raw.name ?? "",
    display_title: raw.display_title ?? "",
    hook: raw.hook ?? "",
    raw_name: Boolean(raw.raw_name),
  };
  /* Only present when the owner typed a price on this card. Absent keeps the
     serialised payload identical for the 166 items that carry no override. */
  if (raw.price_override != null) {
    item.price_override = Number(raw.price_override);
    item.price_set_at = raw.price_set_at ?? null;
  }
  return item;
}

function toEdit(snapshot: SnapshotCollection): EditCollection {
  const edit: EditCollection = {
    slug: snapshot.slug,
    title: snapshot.title,
    headline: snapshot.headline ?? "",
    intro: snapshot.intro ?? "",
    art_note: snapshot.art_note ?? "",
    hero_image: snapshot.hero_image ?? "",
    card_image: snapshot.card_image ?? "",
    items: (snapshot.items ?? []).map(toItem),
  };
  /* Key order matters: the manifest dump writes `related` between `card_image`
     and `items`, exactly as the original file had it. */
  if (snapshot.related && snapshot.related.length > 0) edit.related = snapshot.related;
  return edit;
}

/**
 * The published edits, in curated order: the four holiday edits first, then the
 * four Thanksgiving edits, which is the order the homepage row and the
 * /collections list render them in.
 *
 * One query: the piece count comes from the snapshot itself, so the ordered item
 * lists never leave the database for a page that only shows cards.
 */
export async function getEditSummaries(): Promise<EditSummary[]> {
  try {
    const db = sql();
    const rows = (await db.query(
      `SELECT e.slug,
              COALESCE(p.snapshot->>'title', e.title) AS title,
              COALESCE(p.snapshot->>'card_image', e.card_image) AS card_image,
              ARRAY(SELECT jsonb_array_elements_text(p.snapshot->'related')) AS related,
              COALESCE(jsonb_array_length(p.snapshot->'items'), 0)::int AS item_count
         FROM edits e
         JOIN edit_publications p ON p.edit_id = e.id
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
  try {
    const db = sql();
    const rows = (await db.query(
      `SELECT p.snapshot
         FROM edits e
         JOIN edit_publications p ON p.edit_id = e.id
        WHERE e.slug = $1 AND e.status = 'published'
        LIMIT 1`,
      [slug],
    )) as unknown as { snapshot: unknown }[];
    const snapshot = asObject<SnapshotCollection>(rows[0]?.snapshot);
    if (!snapshot) return null;
    return toEdit(snapshot);
  } catch (err) {
    console.error(`Edit query failed for "${slug}", serving the snapshot:`, err);
    return fallbackEdits().find((e) => e.slug === slug) ?? null;
  }
}

/**
 * Every published collection exactly as the public pages would render it.
 *
 * Used by the curation screens and by the pin guard (src/lib/pin-guard.ts): the
 * guard needs the published set, not the draft, because the pin landing pages
 * are built from what is live.
 */
export async function getPublishedCollections(): Promise<SnapshotCollection[]> {
  const db = sql();
  const rows = (await db.query(
    `SELECT p.snapshot
       FROM edits e
       JOIN edit_publications p ON p.edit_id = e.id
      WHERE e.status = 'published'
      ORDER BY e.sort_order, e.id`,
    [],
  )) as unknown as { snapshot: unknown }[];
  return rows
    .map((row) => asObject<SnapshotCollection>(row.snapshot))
    .filter((value): value is SnapshotCollection => value !== null);
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
  /**
   * The price the owner typed on this card and the day she set it (owner
   * decision 21, 2026-11-05). Null means "no typed price": the card prints the
   * verified `price` above and nothing else changes.
   */
  priceOverride: number | null;
  priceSetAt: string | null;
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
  /** A price typed by the owner, which wins over the verified product price. */
  price_override?: number | null;
  price_set_at?: string | null;
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
      // A typed price is the owner's editorial number and wins over the verified
      // one on the card, dated so the reader can see when it was set.
      priceOverride: item.price_override != null ? Number(item.price_override) : null,
      priceSetAt: item.price_override != null ? (item.price_set_at ?? null) : null,
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
