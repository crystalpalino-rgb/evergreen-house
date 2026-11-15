/**
 * Lead gate for card order (owner shop audit, item 8, 2026-11-14).
 *
 * The rule this file implements, in the order the gates are applied:
 *
 * 1. **Pin rank outranks every gate.** A product in the Pinterest rotation is
 *    never demoted by this file, whatever it costs and whatever else it fails
 *    (owner Standing Merchandising Rule, 2026-10-19). Among pinned cards the
 *    order stays pin_rank ascending, which is the order the room query already
 *    returns.
 * 2. **A price outlier never leads.** A card priced above the page's own
 *    ceiling moves below every card inside it. The ceiling is 2.5x the median
 *    price of the cards on that page, with a $200 floor, so a page of $30 decor
 *    does not lead with a $1,709 sofa and a page of $200 furniture still leads
 *    with its $200 piece.
 * 3. **An unreviewed card never leads.** No star rating stored means the card
 *    has nothing honest to show at the top of a page.
 * 4. **Off-brief cards move below every on-brief card.** Drinkware and coolers
 *    sitting in a decor room are gear, not home decor, so they are held to the
 *    end of the page they are on rather than removed (owner decision 11:
 *    suppress rather than delete). The list is explicit and checked in here.
 *    A card that fails more than one gate sits in the first gate it fails.
 *
 * The gates decide who may lead. Inside the passing band the page keeps the
 * order it already had (the owner's curated sequence on an Edit, the quality
 * score on a room), because a star rating alone is a bad sort key: a 5.0 with
 * four reviews would leapfrog a 4.6 with six thousand. Nothing is dropped from
 * a page: a gated card still renders, further down.
 *
 * No em-dashes (owner style directive).
 */

/** The fields the gate reads. `pin_rank` is absent on Edit cards. */
export interface LeadGateRow {
  id: number | string;
  price?: number | string | null;
  rating?: number | string | null;
  pin_rank?: number | string | null;
}

/** A page's median price is multiplied by this to find its outlier ceiling. */
const CEILING_MEDIAN_MULTIPLE = 2.5;

/** No card at or under this price is ever called an outlier. */
const CEILING_FLOOR = 200;

/**
 * Products held to the end of one page because they are off brief for it.
 * Keyed by page slug (room slug, collection slug or edit slug).
 *
 * Kitchen and Patio led with YETI drinkware and coolers (owner audit, item 8).
 * They stay on the page and buyable; they just no longer open it.
 */
export const OFF_BRIEF_HELD: Record<string, number[]> = {
  kitchen: [98, 108, 109, 110],
  patio: [21, 22],
};

/** A positive finite number, or null when the row does not carry one. */
function num(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Median of the positive prices on a page. 0 when there are none. */
function medianPrice(prices: number[]): number {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The price above which a card is an outlier for this page. */
export function leadPriceCeiling(rows: LeadGateRow[]): number {
  const prices = rows
    .map((r) => num(r.price))
    .filter((p): p is number => p != null);
  const median = medianPrice(prices);
  return Math.max(CEILING_FLOOR, median * CEILING_MEDIAN_MULTIPLE);
}

/**
 * Cards for one page, in lead order: pinned first (pin_rank ascending), then
 * the on-brief and reviewed cards inside the page's price ceiling, then the
 * gated cards. Stable within each band.
 */
export function orderForLead<T extends LeadGateRow>(
  rows: T[],
  pageKey?: string,
): T[] {
  if (rows.length === 0) return rows;
  const ceiling = leadPriceCeiling(rows);
  const held = new Set(OFF_BRIEF_HELD[pageKey ?? ""] ?? []);

  const bandOf = (row: T): number => {
    // Pin rank ahead of everything, including every gate below.
    if (num(row.pin_rank) != null) return 0;
    if (held.has(Number(row.id))) return 3;
    if (num(row.rating) == null) return 2;
    const price = num(row.price);
    if (price != null && price > ceiling) return 1;
    return 0;
  };

  const decorated = rows.map((row, index) => ({ row, index, band: bandOf(row) }));
  decorated.sort((a, b) => {
    if (a.band !== b.band) return a.band - b.band;
    // Pin rank, ascending. Unpinned cards all carry Infinity here.
    const pa = num(a.row.pin_rank);
    const pb = num(b.row.pin_rank);
    if (pa != null || pb != null) {
      const va = pa ?? Number.POSITIVE_INFINITY;
      const vb = pb ?? Number.POSITIVE_INFINITY;
      if (va !== vb) return va - vb;
    }
    // Inside a band the page keeps the order it arrived in: the owner's
    // curated sequence on an Edit, the quality-score order on a room.
    return a.index - b.index;
  });
  return decorated.map((d) => d.row);
}
