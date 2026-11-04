/**
 * Which rooms are public.
 *
 * This is the one place that decides whether /room/<slug> exists. The database
 * does not decide: a product's `room` column is a merchandising label, so a
 * sourcing move can invent a room value that the owner has never approved a page
 * for. That is exactly what happened on 2026-11-04, when the bedroom clothing
 * (30 active rows) was moved to room = 'loungewear' so /apparel could keep
 * listing it, and a live /room/loungewear page appeared as a side effect.
 *
 * Every consumer of room slugs reads this list: the /room/$room route, the
 * /rooms index, the related-rooms block, the product page room links and
 * breadcrumbs, /collection/$collection and scripts/generate-sitemaps.ts.
 *
 * HIDDEN_ROOMS holds rooms whose products are real and active but whose page is
 * not approved. To publish one, delete its single line below and add its label,
 * photo and editorial copy in src/routes/room/$room.tsx. Nothing else changes.
 *
 * The data is already waiting: 30 rows carry room = 'loungewear' and
 * is_active = true, ready for the day the owner approves the loungewear
 * collection.
 *
 * 2026-11-04: the 52 Thanksgiving 2026 products carry room = 'thanksgiving'.
 * They are seasonal collection stock that lives on /collections/<slug>-edit,
 * not evergreen room stock, so the room stays hidden here and the room
 * sitemap stays at 16 rooms.
 */
export const HIDDEN_ROOMS: readonly string[] = [
  "loungewear", // 30 active clothing rows, waiting on owner approval
  "thanksgiving", // 52 seasonal collection rows, live on the Thanksgiving edits
];

const HIDDEN_ROOM_SET = new Set<string>(HIDDEN_ROOMS);

/** True when /room/<slug> is an approved, publicly reachable room page. */
export function isRoomPublic(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return !HIDDEN_ROOM_SET.has(slug);
}

/** De-duplicated, sorted room slugs from a product list, public rooms only. */
export function publicRoomSlugs(rooms: readonly string[]): string[] {
  return [...new Set(rooms.filter(Boolean))].filter(isRoomPublic).sort();
}
