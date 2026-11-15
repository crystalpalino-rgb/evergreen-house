/**
 * Retired collection URLs: old short paths to their live "-edit" pages.
 *
 * Each of these paths was a published collection page before the edits were
 * renamed to `/collections/<slug>-edit`. Live Pinterest pins still point at the
 * short form, so every one of them has to answer a permanent redirect instead of
 * a 404. The mapping is one to one: the short path only ever had one page
 * behind it. One short path (thanksgiving-welcome) now lands on Entryway, where
 * its set was folded in 2026-11-15, rather than on its own edit page.
 *
 * This map is the single source for the two places the app answers from:
 * - `src/routes/collections/$editSlug.tsx` beforeLoad, which covers the vite
 *   dev server and any request that reaches the app;
 * - `LEGACY_REDIRECTS` at the top of `serve.ts`, which covers the published
 *   server before the app is reached.
 *
 * The same eight redirects are also written into the "redirects" block of
 * `vercel.json` and of `.vercel/output/config.json` (build-vercel.sh), so
 * production answers them at the edge, before any function runs.
 */
export const LEGACY_COLLECTION_REDIRECTS: Record<string, string> = {
  "/collections/luxe-christmas-tree":
    "/collections/luxe-christmas-tree-edit",
  "/collections/cozy-christmas-bedroom":
    "/collections/cozy-christmas-bedroom-edit",
  "/collections/heritage-christmas": "/collections/heritage-christmas-edit",
  "/collections/holiday-hosting": "/collections/holiday-hosting-edit",
  "/collections/thanksgiving-table": "/collections/thanksgiving-table-edit",
  "/collections/moody-thanksgiving": "/collections/moody-thanksgiving-edit",
  "/collections/thanksgiving-hosting":
    "/collections/thanksgiving-hosting-edit",
  /* 2026-11-15, shop audit item 4: the Welcome set is folded into Entryway, so
     this short path goes straight to Entryway instead of taking a second hop
     through the edit page below. */
  "/collections/thanksgiving-welcome": "/room/entryway",
};

/**
 * A published edit that is retired as a page, with the URL it now lands on.
 *
 * Separate from the short-path map above because these are not renames: the
 * edit itself stops being published, so there is no `-edit` page behind the
 * URL any more. Every one of them still has a live pin pointing at it, and a
 * pin that lands on a 404 is worse than no pin, so each answers a permanent
 * redirect to the page that now carries the same products.
 *
 * Read by `src/routes/collections/$editSlug.tsx` beforeLoad (dev server and any
 * request that reaches the app) and by `LEGACY_REDIRECTS` in `serve.ts`.
 */
export const RETIRED_EDIT_REDIRECTS: Record<string, string> = {
  /* 2026-11-15, shop audit item 4: The Thanksgiving Welcome Edit is folded
     into Entryway. Its 12 products (wreaths, doormat, urn planters, baskets,
     dried stems, cattail pumpkins) now list on /room/entryway, and the tile
     comes off Shop the Edits. The live pin on the
     THANKSGIVING WELCOME board points here, so the URL redirects rather than
     404s. The edit row stays in the table as a draft, so the fold is
     reversible. */
  "/collections/thanksgiving-welcome-edit": "/room/entryway",
};

/**
 * By Style is retired (owner decision 37, 2026-11-14): the site has one point
 * of view, not five styles, so Rooms and the Edits carry the shopping.
 *
 * Both halves of every style URL answer a permanent redirect, and they all land
 * on /collections. No style maps cleanly onto one room page: each style mixes
 * products across rooms (Coastal carries coolers, garden tools and bedding), so
 * a room target would drop most of the set and show a shopper a different
 * collection from the one the URL promised. Organic Modern holds 0 products, so
 * it must land on /collections and never on an empty page.
 *
 * The style pages the app used to serve are /style/<style> (from the hardcoded
 * style list, which also carried modern, boho, glam and traditional) and the
 * /collection/<style> rows in the collections table, plus the /styles index.
 */
export const RETIRED_STYLE_REDIRECTS: Record<string, string> = {
  "/styles": "/collections",
  "/style/organic-modern": "/collections",
  "/style/minimalist": "/collections",
  "/style/farmhouse": "/collections",
  "/style/coastal": "/collections",
  "/style/cozy": "/collections",
  "/style/modern": "/collections",
  "/style/boho": "/collections",
  "/style/glam": "/collections",
  "/style/traditional": "/collections",
  "/collection/organic-modern": "/collections",
  "/collection/minimalist": "/collections",
  "/collection/farmhouse": "/collections",
  "/collection/coastal": "/collections",
  "/collection/cozy": "/collections",
};

/**
 * Outdoor Living and Patio & Outdoor were two tiles over the same 18 products
 * and the same photo (owner decision 37, 2026-11-14). "Patio & Outdoor" is the
 * survivor: its slug is the room value every one of the 18 rows carries, and
 * /room/patio is already the page the header links. The Outdoor Living tile and
 * the empty /room/outdoor page (0 rows carry room = 'outdoor') redirect here.
 */
export const MERGED_COLLECTION_REDIRECTS: Record<string, string> = {
  "/collection/outdoor": "/room/patio",
  "/room/outdoor": "/room/patio",
  /* 2026-11-15, shop audit item 4: the Laundry Room and Home Essentials tiles
     come off /collections, and their pages follow them.
     Laundry held 3 products and all 3 now list on the pages they belong to (the
     storage basket on Bathroom, the storage bins and the pedal bin on Kitchen),
     so the room resolves 0 products. Home Essentials was a room = 'storage'
     rule over one product, a pantry basket, which now lists on Pantry.
     Both rows stay in the collections table: nothing is deleted, the tile and
     the page simply stop being offered, and Bathroom and Kitchen are the pages
     a shopper looking for a laundry room is actually after. */
  "/collection/laundry": "/room/bathroom",
  "/room/laundry": "/room/bathroom",
  "/collection/home-essentials": "/room/kitchen",
  "/room/home-essentials": "/room/kitchen",
  /* 2026-11-15, shop audit item 9: the Home Office room page has always lived at
     /room/office (the slug every office row carries, and the URL the header, the
     footer and the homepage Explore tile link). /room/home-office was never a
     page and answered 404, so the obvious guess redirects to the real one. */
  "/room/home-office": "/room/office",
};

/**
 * One route per room (shop audit item 5, 2026-11-15).
 *
 * Every room used to answer on two URLs, /room/<slug> and /collection/<slug>,
 * with a different sort on each. That split the room's products, its ranking
 * and its search signal across two pages that said the same thing.
 *
 * The canonical route is /room/<slug>: it is the URL the header nav, the footer
 * and the homepage Explore block already link, it is the one the room sitemap
 * lists, and it is the one the Room Card Standard and the room editorial copy
 * were written for. /collection/<slug> answers a permanent redirect (301) to it
 * for the ten shopping rooms below.
 *
 * Holiday is the one exception, and it points the other way. /collection/holiday
 * is the Christmas hub every entry point uses (the HOLIDAY nav item, the
 * homepage banner, the hero button, the four Holiday edit tiles), so it stays
 * where it is and /room/holiday redirects to it.
 *
 * Seasons (fall, spring, summer) keep both routes: this item names the nine
 * rooms and holiday, and the seasonal pages are a separate question.
 *
 * Every target below answers 200. A redirect to a redirect is never written
 * here: the merged-room entries above already point straight at /room/<slug>.
 */
export const ROOM_ROUTE_REDIRECTS: Record<string, string> = {
  "/collection/bedroom": "/room/bedroom",
  "/collection/bathroom": "/room/bathroom",
  "/collection/kitchen": "/room/kitchen",
  "/collection/dining-room": "/room/dining-room",
  "/collection/living-room": "/room/living-room",
  "/collection/office": "/room/office",
  "/collection/patio": "/room/patio",
  "/collection/entryway": "/room/entryway",
  "/collection/nursery": "/room/nursery",
  /* 2026-11-15, shop audit item 9: Pantry becomes the tenth shopping room. Its
     page has been live at /room/pantry all along, but there was no collections
     row behind it, so /collection/pantry answered 404 and the room was missing
     from /collections. The row and its room rule are added by
     scripts/add-pantry-collection-item9.mjs, and the collection URL answers the
     same permanent redirect as every other room. */
  "/collection/pantry": "/room/pantry",
  "/room/holiday": "/collection/holiday",
};

/** The ten room slugs whose canonical page is /room/<slug>. */
export const CANONICAL_ROOM_SLUGS: readonly string[] = Object.keys(
  ROOM_ROUTE_REDIRECTS
)
  .filter((path) => path.startsWith("/collection/"))
  .map((path) => path.slice("/collection/".length));

/**
 * The one URL a shopper should be sent to for a collection slug, so a tile, a
 * card or a related-collection link never points at a page that only redirects.
 * Rooms go to /room/<slug>, everything else (seasons, holiday) keeps
 * /collection/<slug>.
 */
export function collectionPageHref(slug: string): string {
  return CANONICAL_ROOM_SLUGS.includes(slug)
    ? `/room/${slug}`
    : `/collection/${slug}`;
}

/**
 * Collection slugs whose /collection/<slug> page is retired and answers a
 * redirect. The /collections index reads this so it can never link a tile the
 * shopper cannot land on. Derived from the two maps above, so adding a redirect
 * also takes the tile off the index.
 */
export const RETIRED_COLLECTION_SLUGS: readonly string[] = [
  ...Object.keys(RETIRED_STYLE_REDIRECTS),
  ...Object.keys(MERGED_COLLECTION_REDIRECTS),
]
  .filter((path) => path.startsWith("/collection/"))
  .map((path) => path.slice("/collection/".length));
