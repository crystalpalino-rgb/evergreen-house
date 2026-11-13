/**
 * Storefront list cards: pointers to a list on the owner's own Amazon
 * storefront (2026-11-13).
 *
 * A list card is NOT a product card. It carries the list name as its heading,
 * one editorial line and one link. No star rating, no review count, no price,
 * no "Price set by hand" label, no image. If it read as a product at a glance
 * it would be wrong, because nothing on it is verified product data.
 *
 * The links below are the owner's own, byte for byte, including the storefront
 * tag `crystalpalino-20`. Do not rewrite, shorten or re-tag them.
 *
 * Seasonal placements are each ONE flag:
 *   SHOW_UNDER19_ON_HOMEPAGE      flip to false at the Christmas flip, 2026-12-26
 *   SHOW_UNDER19_ON_HOLIDAY_ROOM  flip to false in January
 * The Heritage edit card has no switch-off date (owner, 2026-11-13).
 */

export interface StorefrontList {
  /** Stable key, used for the element id and nothing else. */
  key: string;
  /** The list name, exactly as it stands on the storefront. */
  name: string;
  /** One editorial line, owner-approved copy, verbatim. */
  line: string;
  /** The owner's storefront list URL, byte for byte. */
  href: string;
}

/** Secret Santa and Stocking Stuffers Under $19. */
export const UNDER19_LIST: StorefrontList = {
  key: "under19",
  name: "Secret Santa and Stocking Stuffers Under $19",
  line: "Everything on this list is under $19, and none of it looks it.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/3PLWY2F3JA9TR?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
};

/** Heritage Nativity and Mantel Gifts. */
export const HERITAGE_NATIVITY_LIST: StorefrontList = {
  key: "heritage-nativity",
  name: "Heritage Nativity and Mantel Gifts",
  line: "For the mantel that gets dressed properly: a nativity, and the quiet pieces around it.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/1Y71DS50M16G8?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
};

/**
 * Placement 1, homepage THE CURRENT EDIT. Seasonal: de-featured at the
 * Christmas flip, 2026-12-26. One edit turns it off.
 */
export const SHOW_UNDER19_ON_HOMEPAGE = true;

/**
 * Placement 1, the gifting area on /room/holiday. Seasonal: de-featured in
 * January. One edit turns it off.
 */
export const SHOW_UNDER19_ON_HOLIDAY_ROOM = true;

/**
 * Placement 2, inside a Shop the Edit collection, keyed by collection slug.
 * The card lives in the page template, not in the published snapshot: the
 * snapshot holds product rows only, and a list is not a product.
 * Removing an entry removes the card from that edit.
 */
export const EDIT_STOREFRONT_LISTS: Record<string, StorefrontList> = {
  "heritage-christmas-edit": HERITAGE_NATIVITY_LIST,
};
