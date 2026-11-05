// Collection admin phase 2a: the server functions behind /admin/collections.
//
// Every function here carries `.middleware([adminOnly])`, so a request without a
// valid admin session cookie is answered 401 before a single row is read or
// written. There is no /api route in this flow and nothing here is reachable
// unauthenticated.
//
// The model (owner decisions 21, 22 and 23, 2026-11-05):
//   - `edits` and `edit_items` are the DRAFT. Every write in this file lands
//     there, and no public page reads them.
//   - `edit_publications` holds the snapshot the public pages render. Only
//     `setEditPublished` writes it, which is why the publish switch is the one
//     and only thing that changes what the public sees.
//   - a price typed on a card is stored on the item as `price_override` plus
//     `price_set_at`, never in the product row, so a later verification pass can
//     overwrite `products.price` without destroying the owner's figure.
//
// The pin guard (src/lib/pin-guard.ts) runs before every write that can change a
// collection's membership, display title or order, and before every publish. A
// write it refuses is never applied: the guard is evaluated against the state
// the write WOULD produce, so nothing has to be rolled back afterwards.

import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import { adminOnly } from "~/lib/admin-fns";
import {
  getPublishedCollections,
  type SnapshotCollection,
  type SnapshotItem,
} from "~/lib/edits";
import { checkPinPages, withEditSubstituted, type PinGuardResult } from "~/lib/pin-guard";

// ── Types ──

export interface AdminEditSummary {
  id: number;
  slug: string;
  title: string;
  status: "draft" | "published";
  sortOrder: number;
  itemCount: number;
  updatedAt: string;
  publishedAt: string | null;
  /** True when the draft has been touched since the collection last went live. */
  hasUnpublishedChanges: boolean;
}

export interface AdminEditItem {
  productId: number;
  position: number;
  displayTitle: string;
  hook: string;
  slug: string;
  name: string;
  rawName: boolean;
  priceOverride: number | null;
  priceSetAt: string | null;
  /* Live product facts, so the screen shows the same card the shopper sees. */
  productName: string | null;
  imageUrl: string | null;
  amazonUrl: string | null;
  verifiedPrice: number | null;
  rating: number | null;
  reviewCount: number | null;
}

export interface AdminEditDetail {
  id: number;
  slug: string;
  title: string;
  headline: string;
  intro: string;
  artNote: string;
  heroImage: string;
  cardImage: string;
  related: string[];
  status: "draft" | "published";
  sortOrder: number;
  updatedAt: string;
  publishedAt: string | null;
  items: AdminEditItem[];
  /** Every collection slug and title, for the related-edits picker. */
  others: { slug: string; title: string }[];
}

export interface SaveResult {
  ok: boolean;
  /** What to show the owner. Empty on success unless there is a warning. */
  message: string;
  /** Present when the pin guard ran. */
  pin?: PinGuardResult;
}

export interface ProductSearchResult {
  id: number;
  name: string;
  imageUrl: string | null;
  amazonUrl: string | null;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  room: string | null;
  slug: string | null;
}

// ── Helpers ──

const num = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const iso = (value: unknown): string | null => {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

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
  status: "draft" | "published";
  sort_order: number;
  updated_at: string | Date;
  published_at: string | Date | null;
}

interface ItemRow {
  product_id: number;
  position: number;
  display_title: string | null;
  hook: string | null;
  slug: string | null;
  name: string | null;
  raw_name: boolean | null;
  price_override: number | null;
  price_set_at: string | Date | null;
}

async function readEditRowBySlug(slug: string): Promise<EditRow | null> {
  const rows = (await sql().query(
    `SELECT id, slug, title, headline, intro, art_note, hero_image, card_image,
            related, status, sort_order, updated_at, published_at
       FROM edits WHERE slug = $1 LIMIT 1`,
    [slug],
  )) as unknown as EditRow[];
  return rows[0] ?? null;
}

async function readItems(editId: number): Promise<ItemRow[]> {
  return (await sql().query(
    `SELECT product_id, position, display_title, hook, slug, name, raw_name,
            price_override, price_set_at
       FROM edit_items WHERE edit_id = $1
      ORDER BY position, id`,
    [editId],
  )) as unknown as ItemRow[];
}

/** The edit as the public pages would render it if it were published now. */
function toSnapshot(edit: EditRow, items: ItemRow[]): SnapshotCollection {
  const snapshot: SnapshotCollection = {
    slug: edit.slug,
    title: edit.title,
    headline: edit.headline ?? "",
    intro: edit.intro ?? "",
    art_note: edit.art_note ?? "",
    hero_image: edit.hero_image ?? "",
    card_image: edit.card_image ?? "",
    items: items.map((item) => {
      const out: SnapshotItem = {
        id: Number(item.product_id),
        slug: item.slug ?? "",
        name: item.name ?? "",
        display_title: item.display_title ?? "",
        hook: item.hook ?? "",
        raw_name: Boolean(item.raw_name),
      };
      if (item.price_override != null) {
        out.price_override = Number(item.price_override);
        out.price_set_at = iso(item.price_set_at);
      }
      return out;
    }),
  };
  if (edit.related && edit.related.length > 0) snapshot.related = edit.related;
  return snapshot;
}

/**
 * Run the pin build against the state this edit would publish.
 *
 * A collection that is not live is not substituted in: no pin page points at a
 * draft, and the published set is what the pin pages are built from.
 */
async function guardItems(edit: EditRow, items: ItemRow[]): Promise<PinGuardResult> {
  const published = await getPublishedCollections();
  const candidate = withEditSubstituted(
    published,
    edit.status === "published",
    toSnapshot(edit, items),
  );
  return checkPinPages(candidate);
}

/** The guard against the draft as it stands, with no change applied. */
async function runPinGuard(edit: EditRow): Promise<PinGuardResult> {
  return guardItems(edit, await readItems(edit.id));
}

function refusal(pin: PinGuardResult): SaveResult {
  const detail = pin.errors.join(" ");
  return {
    ok: false,
    pin,
    message:
      "Not saved. This change would leave a Pinterest landing page out of date, and a pin " +
      `page that disagrees with the collection it describes is worse than a failed build. ${detail}`,
  };
}

function success(pin: PinGuardResult, message: string): SaveResult {
  const warning = pin.warnings.length > 0 ? ` ${pin.warnings.join(" ")}` : "";
  return { ok: true, pin, message: `${message}${warning}` };
}

/** Positions may be sparse after a removal; this keeps the order contiguous. */
async function normalisePositions(editId: number): Promise<void> {
  await sql().query(
    `WITH ordered AS (
       SELECT id, row_number() OVER (ORDER BY position, id) - 1 AS rn
         FROM edit_items WHERE edit_id = $1
     )
     UPDATE edit_items i SET position = o.rn
       FROM ordered o
      WHERE i.id = o.id AND i.position <> o.rn`,
    [editId],
  );
}

// ── Reads ──

/** The eight (or however many) collections, draft and live alike. */
export const listAdminEdits = createServerFn({ method: "GET" })
  .middleware([adminOnly])
  .handler(async (): Promise<AdminEditSummary[]> => {
    const rows = (await sql().query(
      `SELECT e.id, e.slug, e.title, e.status, e.sort_order, e.updated_at, e.published_at,
              COALESCE(c.n, 0)::int AS item_count
         FROM edits e
         LEFT JOIN (SELECT edit_id, count(*) AS n FROM edit_items GROUP BY edit_id) c
           ON c.edit_id = e.id
        ORDER BY e.sort_order, e.id`,
      [],
    )) as unknown as {
      id: number;
      slug: string;
      title: string;
      status: "draft" | "published";
      sort_order: number;
      updated_at: string | Date;
      published_at: string | Date | null;
      item_count: number;
    }[];

    return rows.map((row) => {
      const updatedAt = iso(row.updated_at) ?? "";
      const publishedAt = iso(row.published_at);
      return {
        id: Number(row.id),
        slug: row.slug,
        title: row.title,
        status: row.status,
        sortOrder: Number(row.sort_order),
        itemCount: Number(row.item_count),
        updatedAt,
        publishedAt,
        hasUnpublishedChanges:
          row.status !== "published" || !publishedAt || updatedAt > publishedAt,
      };
    });
  });

/** One collection with its draft items and the live facts behind each card. */
export const getAdminEdit = createServerFn({ method: "GET" })
  .middleware([adminOnly])
  .validator((data: { slug?: unknown }) => ({
    slug: typeof data?.slug === "string" ? data.slug : "",
  }))
  .handler(async ({ data }): Promise<AdminEditDetail | null> => {
    const edit = await readEditRowBySlug(data.slug);
    if (!edit) return null;
    const items = await readItems(edit.id);

    const ids = items.map((item) => Number(item.product_id));
    const productRows = ids.length
      ? ((await sql().query(
          `SELECT id, name, image_url, amazon_url, price, rating, review_count
             FROM products WHERE id IN (${ids.join(",")})`,
          [],
        )) as unknown as {
          id: number;
          name: string | null;
          image_url: string | null;
          amazon_url: string | null;
          price: number | string | null;
          rating: number | string | null;
          review_count: number | string | null;
        }[])
      : [];
    const byId = new Map(productRows.map((row) => [Number(row.id), row]));

    const otherRows = (await sql().query(
      `SELECT slug, title FROM edits WHERE id <> $1 ORDER BY sort_order, id`,
      [edit.id],
    )) as unknown as { slug: string; title: string }[];

    return {
      id: Number(edit.id),
      slug: edit.slug,
      title: edit.title,
      headline: edit.headline ?? "",
      intro: edit.intro ?? "",
      artNote: edit.art_note ?? "",
      heroImage: edit.hero_image ?? "",
      cardImage: edit.card_image ?? "",
      related: edit.related ?? [],
      status: edit.status,
      sortOrder: Number(edit.sort_order),
      updatedAt: iso(edit.updated_at) ?? "",
      publishedAt: iso(edit.published_at),
      items: items.map((item) => {
        const product = byId.get(Number(item.product_id));
        return {
          productId: Number(item.product_id),
          position: Number(item.position),
          displayTitle: item.display_title ?? "",
          hook: item.hook ?? "",
          slug: item.slug ?? "",
          name: item.name ?? "",
          rawName: Boolean(item.raw_name),
          priceOverride: num(item.price_override),
          priceSetAt: iso(item.price_set_at),
          productName: product?.name ?? null,
          imageUrl: product?.image_url ?? null,
          amazonUrl: product?.amazon_url ?? null,
          verifiedPrice: num(product?.price),
          rating: num(product?.rating),
          reviewCount: num(product?.review_count),
        };
      }),
      others: otherRows,
    };
  });

/** Catalog search for the add-a-product box: by title, by ASIN, or by id. */
export const searchAdminProducts = createServerFn({ method: "GET" })
  .middleware([adminOnly])
  .validator((data: { q?: unknown }) => ({
    q: typeof data?.q === "string" ? data.q.trim() : "",
  }))
  .handler(async ({ data }): Promise<ProductSearchResult[]> => {
    if (data.q.length < 2) return [];
    const like = `%${data.q}%`;
    const rows = (await sql().query(
      `SELECT id, name, image_url, amazon_url, price, rating, review_count, room, seo_slug
         FROM products
        WHERE is_active = true
          AND (name ILIKE $1 OR full_name ILIKE $1 OR amazon_url ILIKE $1 OR CAST(id AS TEXT) = $2)
        ORDER BY quality_score DESC NULLS LAST, id
        LIMIT 20`,
      [like, data.q],
    )) as unknown as {
      id: number;
      name: string | null;
      image_url: string | null;
      amazon_url: string | null;
      price: number | string | null;
      rating: number | string | null;
      review_count: number | string | null;
      room: string | null;
      seo_slug: string | null;
    }[];

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name ?? "",
      imageUrl: row.image_url,
      amazonUrl: row.amazon_url,
      price: num(row.price),
      rating: num(row.rating),
      reviewCount: num(row.review_count),
      room: row.room,
      slug: row.seo_slug,
    }));
  });

// ── Writes: the collection itself ──

/**
 * Save the collection's editorial metadata into the draft.
 *
 * No pin page prints any of these fields, so the pin guard does not run here.
 * Nothing goes public until the publish switch.
 */
export const saveEditMeta = createServerFn({ method: "POST" })
  .middleware([adminOnly])
  .validator((data: {
    slug?: unknown;
    title?: unknown;
    headline?: unknown;
    intro?: unknown;
    artNote?: unknown;
    heroImage?: unknown;
    cardImage?: unknown;
    related?: unknown;
  }) => ({
    slug: typeof data?.slug === "string" ? data.slug : "",
    title: typeof data?.title === "string" ? data.title.trim() : "",
    headline: typeof data?.headline === "string" ? data.headline.trim() : "",
    intro: typeof data?.intro === "string" ? data.intro.trim() : "",
    artNote: typeof data?.artNote === "string" ? data.artNote.trim() : "",
    heroImage: typeof data?.heroImage === "string" ? data.heroImage.trim() : "",
    cardImage: typeof data?.cardImage === "string" ? data.cardImage.trim() : "",
    related: Array.isArray(data?.related)
      ? (data.related as unknown[]).filter((v): v is string => typeof v === "string")
      : [],
  }))
  .handler(async ({ data }): Promise<SaveResult> => {
    const edit = await readEditRowBySlug(data.slug);
    if (!edit) return { ok: false, message: "That collection no longer exists." };
    if (!data.title) return { ok: false, message: "The title cannot be empty." };

    /* An image value is a base path under /images with no extension, exactly as
     * the shipped art is stored, so the page can serve webp with a jpg fallback. */
    for (const [label, value] of [
      ["Hero image", data.heroImage],
      ["Card image", data.cardImage],
    ] as const) {
      if (value && !value.startsWith("/images/")) {
        return { ok: false, message: `${label} must be one of the images on the site.` };
      }
    }

    const related = data.related.filter((slug) => slug !== edit.slug);
    await sql().query(
      `UPDATE edits
          SET title = $2, headline = $3, intro = $4, art_note = $5,
              hero_image = $6, card_image = $7, related = $8, updated_at = NOW()
        WHERE id = $1`,
      [
        edit.id,
        data.title,
        data.headline,
        data.intro,
        data.artNote,
        data.heroImage,
        data.cardImage,
        related,
      ],
    );
    return {
      ok: true,
      message:
        edit.status === "published"
          ? "Saved to the draft. The live page still shows the published version until you switch it live."
          : "Saved to the draft. This collection is not live yet.",
    };
  });

/**
 * The one control that changes what the public sees.
 *
 * Going live writes the snapshot FIRST and flips the status second, so a failure
 * between the two leaves the collection unpublished rather than published with
 * no page. The pin guard runs first, against the exact snapshot that would go
 * live, so a collection that would break or stale a pin page is never published.
 */
export const setEditPublished = createServerFn({ method: "POST" })
  .middleware([adminOnly])
  .validator((data: { slug?: unknown; live?: unknown }) => ({
    slug: typeof data?.slug === "string" ? data.slug : "",
    live: data?.live === true,
  }))
  .handler(async ({ data }): Promise<SaveResult> => {
    const edit = await readEditRowBySlug(data.slug);
    if (!edit) return { ok: false, message: "That collection no longer exists." };

    const snapshot = toSnapshot(edit, await readItems(edit.id));

    if (data.live) {
      const pin = await runPinGuard(edit);
      if (!pin.ok) return refusal(pin);
      if (snapshot.items.length === 0) {
        return { ok: false, message: "An empty collection cannot go live. Add at least one piece." };
      }
      await sql().query(
        `INSERT INTO edit_publications (edit_id, published_at, snapshot)
         VALUES ($1, NOW(), $2::jsonb)
         ON CONFLICT (edit_id) DO UPDATE
           SET published_at = NOW(), snapshot = EXCLUDED.snapshot`,
        [edit.id, JSON.stringify(snapshot)],
      );
      await sql().query(
        `UPDATE edits SET status = 'published', published_at = NOW() WHERE id = $1`,
        [edit.id],
      );
      return success(pin, "This collection is live. The public page now shows exactly what you saved.");
    }

    /* Taking a collection offline is a public change too: refuse it when a pin
     * page points at this collection, because the pin build fails without its
     * destination. */
    const pin = await runPinGuard(edit);
    const pinErrors = pin.errors.filter((error) => error.includes("would not be live"));
    if (pinErrors.length > 0) {
      return {
        ok: false,
        pin,
        message:
          `Not taken offline. ${pinErrors.length} Pinterest landing page(s) point at this ` +
          `collection and would break. ${pinErrors.join(" ")}`,
      };
    }
    await sql().query(`UPDATE edits SET status = 'draft' WHERE id = $1`, [edit.id]);
    return { ok: true, pin, message: "This collection is offline. Its page is no longer served." };
  });

// ── Writes: the products in it ──

/** Append a product from the catalog to the draft, at the end of the order. */
export const addEditItem = createServerFn({ method: "POST" })
  .middleware([adminOnly])
  .validator((data: { slug?: unknown; productId?: unknown }) => ({
    slug: typeof data?.slug === "string" ? data.slug : "",
    productId: Number(data?.productId) || 0,
  }))
  .handler(async ({ data }): Promise<SaveResult> => {
    const edit = await readEditRowBySlug(data.slug);
    if (!edit) return { ok: false, message: "That collection no longer exists." };
    if (!data.productId) return { ok: false, message: "Pick a product first." };

    const productRows = (await sql().query(
      `SELECT id, name, seo_slug FROM products WHERE id = $1 LIMIT 1`,
      [data.productId],
    )) as unknown as { id: number; name: string | null; seo_slug: string | null }[];
    const product = productRows[0];
    if (!product) return { ok: false, message: "That product is not in the catalog." };

    const existing = (await sql().query(
      `SELECT 1 FROM edit_items WHERE edit_id = $1 AND product_id = $2`,
      [edit.id, data.productId],
    )) as unknown as unknown[];
    if (existing.length > 0) {
      return { ok: false, message: "That product is already in this collection." };
    }

    const maxRows = (await sql().query(
      `SELECT COALESCE(MAX(position), -1)::int AS max_position FROM edit_items WHERE edit_id = $1`,
      [edit.id],
    )) as unknown as { max_position: number }[];
    const position = Number(maxRows[0]?.max_position ?? -1) + 1;

    const name = product.name ?? "";
    const slug = product.seo_slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);

    /* The guard runs against the row this add WOULD create, before anything is
     * written, so a refused add leaves the draft exactly as it was. */
    const candidateItems: ItemRow[] = [
      ...(await readItems(edit.id)),
      {
        product_id: data.productId,
        position,
        display_title: name,
        hook: "",
        slug,
        name,
        raw_name: true,
        price_override: null,
        price_set_at: null,
      },
    ];
    const pin = await guardItems(edit, candidateItems);
    if (!pin.ok) return refusal(pin);

    await sql().query(
      `INSERT INTO edit_items
         (edit_id, product_id, position, display_title, hook, slug, name, raw_name)
       VALUES ($1, $2, $3, $4, '', $5, $6, true)`,
      [edit.id, data.productId, position, name, slug, name],
    );
    return success(pin, "Added to the draft at the end of the order.");
  });

/**
 * Remove a product from the draft.
 *
 * This is the write the pin guard exists for: removing a pinned product makes
 * the pin build fail, so it is refused and the row is left where it was.
 */
export const removeEditItem = createServerFn({ method: "POST" })
  .middleware([adminOnly])
  .validator((data: { slug?: unknown; productId?: unknown }) => ({
    slug: typeof data?.slug === "string" ? data.slug : "",
    productId: Number(data?.productId) || 0,
  }))
  .handler(async ({ data }): Promise<SaveResult> => {
    const edit = await readEditRowBySlug(data.slug);
    if (!edit) return { ok: false, message: "That collection no longer exists." };
    const current = await readItems(edit.id);
    if (!current.some((row) => Number(row.product_id) === data.productId)) {
      return { ok: false, message: "That product is not in this collection." };
    }
    /* Guard the state AFTER the removal: a pinned product leaving its edit is
     * exactly the change the pin build fails on. */
    const pin = await guardItems(
      edit,
      current.filter((row) => Number(row.product_id) !== data.productId),
    );
    if (!pin.ok) return refusal(pin);

    await sql().query(
      `DELETE FROM edit_items WHERE edit_id = $1 AND product_id = $2`,
      [edit.id, data.productId],
    );
    await normalisePositions(edit.id);
    return success(pin, "Removed from the draft.");
  });

/** Move one product up or down in the draft order. */
export const moveEditItem = createServerFn({ method: "POST" })
  .middleware([adminOnly])
  .validator((data: { slug?: unknown; productId?: unknown; direction?: unknown }) => ({
    slug: typeof data?.slug === "string" ? data.slug : "",
    productId: Number(data?.productId) || 0,
    direction: data?.direction === "up" ? "up" : data?.direction === "down" ? "down" : "",
  }))
  .handler(async ({ data }): Promise<SaveResult> => {
    const edit = await readEditRowBySlug(data.slug);
    if (!edit) return { ok: false, message: "That collection no longer exists." };
    if (!data.direction) return { ok: false, message: "Pick a direction." };

    const items = await readItems(edit.id);
    const index = items.findIndex((item) => Number(item.product_id) === data.productId);
    if (index === -1) return { ok: false, message: "That product is not in this collection." };
    const swapIndex = data.direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) {
      return {
        ok: false,
        message: data.direction === "up" ? "That piece is already first." : "That piece is already last.",
      };
    }

    const a = items[index];
    const b = items[swapIndex];
    /* Guard the order the swap would produce. A pin page does not print the
     * collection order, so this normally passes; it is run because the rule says
     * every membership, title and order write re-runs the pin build first. */
    const pin = await guardItems(
      edit,
      items.map((row) => {
        if (Number(row.product_id) === Number(a.product_id)) return { ...row, position: Number(b.position) };
        if (Number(row.product_id) === Number(b.product_id)) return { ...row, position: Number(a.position) };
        return row;
      }),
    );
    if (!pin.ok) return refusal(pin);

    /* One statement, so the two positions can never half-swap. */
    await sql().query(
      `UPDATE edit_items
          SET position = CASE
                WHEN product_id = $2 THEN $4
                WHEN product_id = $3 THEN $5
                ELSE position
              END
        WHERE edit_id = $1 AND product_id IN ($2, $3)`,
      [edit.id, Number(a.product_id), Number(b.product_id), Number(b.position), Number(a.position)],
    );
    await normalisePositions(edit.id);
    return success(pin, "Order saved in the draft.");
  });

/**
 * Save one card: its display title, its hook line, and the price the owner typed.
 *
 * The typed price is stored on the item with the day it was set, never in the
 * product row, so a verification pass that overwrites products.price leaves the
 * owner's figure intact and the card can print which of the two it shows.
 */
export const saveEditItem = createServerFn({ method: "POST" })
  .middleware([adminOnly])
  .validator((data: {
    slug?: unknown;
    productId?: unknown;
    displayTitle?: unknown;
    hook?: unknown;
    price?: unknown;
  }) => ({
    slug: typeof data?.slug === "string" ? data.slug : "",
    productId: Number(data?.productId) || 0,
    displayTitle: typeof data?.displayTitle === "string" ? data.displayTitle.trim() : "",
    hook: typeof data?.hook === "string" ? data.hook.trim() : "",
    price: data?.price === null || data?.price === "" ? null : Number(data?.price),
  }))
  .handler(async ({ data }): Promise<SaveResult> => {
    const edit = await readEditRowBySlug(data.slug);
    if (!edit) return { ok: false, message: "That collection no longer exists." };
    if (!data.displayTitle) return { ok: false, message: "The card title cannot be empty." };
    if (data.price !== null && (!Number.isFinite(data.price) || data.price <= 0 || data.price > 100000)) {
      return { ok: false, message: "That price is not a number the site can show. Use a figure like 89.99." };
    }

    const current = await readItems(edit.id);
    const item = current.find((row) => Number(row.product_id) === data.productId);
    if (!item) return { ok: false, message: "That product is not in this collection." };

    const previous = num(item.price_override);
    const priceChanged = (previous ?? null) !== (data.price ?? null);
    const setAt = data.price === null ? null : priceChanged ? new Date() : item.price_set_at;

    /* Guard the card as this save would leave it: a new display title on a
     * pinned product is exactly what leaves a pin page stale. */
    const pin = await guardItems(
      edit,
      current.map((row) =>
        Number(row.product_id) === data.productId
          ? {
              ...row,
              display_title: data.displayTitle,
              hook: data.hook,
              price_override: data.price,
              price_set_at: setAt,
            }
          : row,
      ),
    );
    if (!pin.ok) return refusal(pin);

    await sql().query(
      `UPDATE edit_items
          SET display_title = $3, hook = $4, price_override = $5, price_set_at = $6
        WHERE edit_id = $1 AND product_id = $2`,
      [edit.id, data.productId, data.displayTitle, data.hook, data.price, setAt],
    );
    await sql().query(`UPDATE edits SET updated_at = NOW() WHERE id = $1`, [edit.id]);

    const note =
      data.price === null
        ? "Saved. The card shows the verified Amazon price again."
        : `Saved. The card will show ${data.price.toFixed(2)} with the day you set it.`;
    return success(pin, note);
  });
