/**
 * schema.org Product JSON-LD for the cards a room or collection page lists.
 *
 * The rule (Pinterest brief, item 4; owner guardrail): a Product node is built
 * ONLY from what the card already renders, and a card with no price is left
 * unmarked. So:
 *   - name is the card's clean human title (display_title, listing name
 *     otherwise) - the same string the card prints;
 *   - description is the card's one editorial line, stored hook first, derived
 *     from the editor note otherwise - exactly the line the card shows;
 *   - image is the card's own image, made absolute;
 *   - offers.price is the exact figure the card prints, including a price the
 *     owner typed by hand on a card (that is still the price the page shows);
 *   - offers.availability is the state the product row records (in stock or out
 *     of stock), and is left off when the row records no state we can state
 *     (no buy box, never verified).
 * Nothing here invents a price, an availability state or copy, and nothing here
 * changes what a card displays: the formatting comes from src/lib/card-copy.ts,
 * the same helpers the cards use.
 */

import {
  cardHookLine,
  cardPrice,
  cardRoomLabel,
  cardTitle,
} from "./card-copy";
import { SITE_URL } from "./schema";

/** What a card already knows. Both card shapes map onto this. */
export interface CardProductFacts {
  /** The listing name (products.name). */
  name?: string | null;
  /** The clean human title the card prints, when the row has one. */
  displayTitle?: string | null;
  /** Stored one-line editorial hook, when the row has one. */
  cardHook?: string | null;
  /** Long editor note, used to derive the line when there is no stored hook. */
  editorNote?: string | null;
  /** Room slug, used only for the derived line's fallback copy. */
  room?: string | null;
  /** The card's image. */
  imageUrl?: string | null;
  /** Verified price from the row. */
  price?: number | string | null;
  /** A price the owner typed on the card, which wins over the verified one. */
  priceOverride?: number | null;
  /** The row's recorded stock state (products.availability). */
  availability?: string | null;
  /** The on-site product page the card's title links to. */
  productUrl: string;
}

/**
 * The card's recorded stock state as a schema.org availability, or null when
 * the row does not record one we can state. `no_buy_box` (the listing has no
 * buy box) and `unverified` (never checked) are deliberately left out: the page
 * does not know either way, and an availability we cannot stand behind is not
 * written at all.
 */
function availabilityUrl(state: string | null | undefined): string | null {
  switch ((state || "").trim().toLowerCase()) {
    case "in_stock":
      return "https://schema.org/InStock";
    case "out_of_stock":
      return "https://schema.org/OutOfStock";
    default:
      return null;
  }
}

/** The exact number the card prints, or null when the card prints no price. */
function shownPrice(facts: CardProductFacts): number | null {
  const value = facts.priceOverride != null ? facts.priceOverride : facts.price;
  // cardPrice is the single gate the cards use, so the label and this number
  // can never disagree: no label means no price on the page, no Product node.
  if (!cardPrice(value)) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

/** Absolute image URL, or null when the row has no image to point at. */
function absoluteImage(url: string | null | undefined): string | null {
  const value = (url || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

/** The one editorial line the card prints. Empty only when the card prints none. */
function cardLine(facts: CardProductFacts): string {
  const stored = (facts.cardHook || "").trim();
  if (stored) return stored;
  const name = (facts.name || "").trim();
  if (!name) return "";
  return cardHookLine(
    facts.editorNote || null,
    name,
    cardRoomLabel(facts.room || ""),
  );
}

/**
 * One Product node for one card, or null when the card shows no price (a card
 * with no price, and a suppressed product, both land here: neither is on the
 * page with a figure, so neither gets a Product node).
 */
export function getCardProductSchema(
  facts: CardProductFacts,
): Record<string, unknown> | null {
  const price = shownPrice(facts);
  if (price === null) return null;
  const name = cardTitle(facts.displayTitle, facts.name);
  if (!name) return null;

  const node: Record<string, unknown> = { "@type": "Product", name };
  const description = cardLine(facts);
  if (description) node.description = description;
  const image = absoluteImage(facts.imageUrl);
  if (image) node.image = image;
  if (facts.productUrl) node.url = facts.productUrl;
  const offer: Record<string, unknown> = {
    "@type": "Offer",
    price,
    priceCurrency: "USD",
  };
  const availability = availabilityUrl(facts.availability);
  if (availability) offer.availability = availability;
  node.offers = offer;
  return node;
}

/** Product nodes for a whole grid, in card order, price-less cards dropped. */
export function getCardProductSchemas(
  cards: CardProductFacts[],
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const card of cards) {
    const node = getCardProductSchema(card);
    if (node) out.push(node);
  }
  return out;
}

/**
 * The single JSON-LD block a page emits, or null when no card shows a price
 * (an empty Product block is worse than none). One block per page keeps the
 * page weight down on the 90 card holiday room.
 */
export function getProductGraphSchema(
  cards: CardProductFacts[],
): Record<string, unknown> | null {
  const nodes = getCardProductSchemas(cards);
  if (nodes.length === 0) return null;
  return { "@context": "https://schema.org", "@graph": nodes };
}
