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
 * Seasonal placements:
 *   homepage THE CURRENT EDIT       the dated table in ~/data/homepage-schedule
 *                                   decides which cards show, and from which day
 *                                   (the Under $19 card comes off 2026-12-26)
 *   SHOW_UNDER19_ON_HOLIDAY_ROOM    one flag, flipped by hand in January
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
  /**
   * The list's own page on this site, when it has one (owner, 2026-11-14).
   * Where it is set, the card opens that page instead of Amazon, and the page
   * itself carries the link out to the storefront list.
   */
  pageHref?: string;
}

/** Secret Santa and Stocking Stuffers Under $19. */
export const UNDER19_LIST: StorefrontList = {
  key: "under19",
  name: "Secret Santa and Stocking Stuffers Under $19",
  line: "Everything on this list is under $19, and none of it looks it.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/3PLWY2F3JA9TR?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
  // The list has its own page since 2026-11-14 (owner decision 34). Both
  // placements open the page; the page carries the Amazon link.
  pageHref: "/stocking-stuffers",
};

/**
 * The three stocking lists that got their own pages on 2026-11-22
 * (owner decision 48). Each page leads with its own list card, which is the one
 * link out to the storefront; the hub and the other pages open the page.
 */
export const MEN_STOCKING_LIST: StorefrontList = {
  key: "stocking-men",
  name: "Stocking Stuffers for Men He Will Actually Use (All Under $25)",
  line: "Fourteen small gifts for the man who needs nothing, all under $25 and all of them things he will actually use.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/36P8XO4LU4JFW?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
  pageHref: "/stocking-men",
};

/** Stocking Stuffers for Teen Boys. */
export const TEEN_BOYS_STOCKING_LIST: StorefrontList = {
  key: "stocking-teen-boys",
  name: "Stocking Stuffers for Teen Boys: Tech, Games and Gear Under $25",
  line: "Twenty things for a teen boy's stocking, all under $25: earbuds, gear and the card games that actually get played.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/1FOFL50K23O31?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
  pageHref: "/stocking-teen-boys",
};

/** Stocking Stuffers for Teen Girls. */
export const TEEN_GIRLS_STOCKING_LIST: StorefrontList = {
  key: "stocking-teen-girls",
  name: "Stocking Stuffers for Teen Girls: Beauty, Jewelry and Hair Favorites Under $25",
  line: "Twenty small things for a teen girl's stocking, all under $25, and all of it beauty, hair and jewelry she will use.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/2FOMRFZ0JOQHZ?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
  pageHref: "/stocking-teen-girls",
};

/** Heritage Nativity and Mantel Gifts. */
export const HERITAGE_NATIVITY_LIST: StorefrontList = {
  key: "heritage-nativity",
  name: "Heritage Nativity and Mantel Gifts",
  line: "For the mantel that gets dressed properly: a nativity, and the quiet pieces around it.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/1Y71DS50M16G8?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
};

/** The Reset List. Not seasonal: it stays up all year. */
export const RESET_LIST: StorefrontList = {
  key: "reset-list",
  name: "The Reset List",
  line: "Planners, meal prep, and a home that runs itself.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/2166TVSTETD4A?tag=crystalpalino-20",
};

/**
 * The Reset List is not seasonal, so it has ONE flag with no switch-off date.
 * It governs every placement: homepage THE CURRENT EDIT, /room/kitchen and
 * /room/office.
 */
export const SHOW_RESET_LIST = true;

/**
 * Placement 1, the gifting area on /room/holiday. Seasonal: de-featured in
 * January. One edit turns it off.
 */
export const SHOW_UNDER19_ON_HOLIDAY_ROOM = true;

/** Every list defined above, by key. The registry the season table reads. */
const LISTS_BY_KEY: Record<string, StorefrontList> = {
  [UNDER19_LIST.key]: UNDER19_LIST,
  [HERITAGE_NATIVITY_LIST.key]: HERITAGE_NATIVITY_LIST,
  [RESET_LIST.key]: RESET_LIST,
};

/**
 * The list cards a season names, in its order.
 *
 * A key with no definition yet is skipped rather than rendered empty: the
 * January list pages are a separate build, so the 2026-12-28 row in the
 * homepage schedule names a list that does not exist until that build lands.
 * Until then the slot is filled from the lists that do exist, so the homepage
 * never renders a hole, and the card appears the day the list is defined.
 */
export function getListsByKey(keys: string[]): StorefrontList[] {
  const out: StorefrontList[] = [];
  for (const key of keys) {
    const list = LISTS_BY_KEY[key];
    if (list) out.push(list);
  }
  return out;
}

/**
 * Placement 2, inside a Shop the Edit collection, keyed by collection slug.
 * The card lives in the page template, not in the published snapshot: the
 * snapshot holds product rows only, and a list is not a product.
 * Removing an entry removes the card from that edit.
 */
export const EDIT_STOREFRONT_LISTS: Record<string, StorefrontList> = {
  "heritage-christmas-edit": HERITAGE_NATIVITY_LIST,
};
