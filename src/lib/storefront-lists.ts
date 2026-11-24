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

/**
 * Secret Santa Gifts They Will Actually Want, the eighth storefront list to get
 * a page of its own (owner decision 61, 2026-11-22). The list URL and its tag
 * come from the merchandiser's manifest for that list, byte for byte.
 */
export const SECRET_SANTA_LIST: StorefrontList = {
  key: "secret-santa",
  name: "Secret Santa Gifts They Will Actually Want (All Under $25)",
  line: "Eight Secret Santa gifts under $25, chosen so the person who opens one actually uses it.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/3FUPDWOF4IBK3?tag=crystalpalino-20",
  pageHref: "/secret-santa",
};

/**
 * New Year's Eve at Home, the ninth storefront list to get a page of its own
 * (owner decision 64, 2026-11-23). The list URL and its tag come from the
 * merchandiser's manifest for that list, byte for byte.
 */
export const NEW_YEARS_EVE_LIST: StorefrontList = {
  key: "new-years-eve",
  name: "New Year's Eve at Home: Black and Gold Party Finds for a Grown-Up Countdown",
  line: "Eleven black and gold pieces for a grown-up countdown at home, with the year where you can see it.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/26YM6D7RDM1CD?tag=crystalpalino-20",
  pageHref: "/new-years-eve",
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
  line: "Eighteen small things for a teen girl's stocking, all under $25, and all of it beauty, hair and jewelry she will use.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/2FOMRFZ0JOQHZ?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
  pageHref: "/stocking-teen-girls",
};

/**
 * The four January lists, one page each (owner decisions 48 and 49, 2026-11-22).
 * The list URLs and names are the merchandiser's live read of the four lists on
 * 2026-11-22 (curation/january-reset-lists-four-2026-11-22); the tag is the
 * storefront tag, byte for byte. New Year, Organized Home is the featured one
 * for January: the homepage schedule names it from 2026-12-28.
 */
export const NEW_YEAR_ORGANIZED_HOME_LIST: StorefrontList = {
  key: "new-year-organized-home",
  name: "New Year, Organized Home: Home Organization Finds for a Fresh Start",
  line: "Eight pieces for the January reset: containers, labels and drawers that make the shelves finally make sense.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/1C0RC9SUR9SST?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
  pageHref: "/new-year-organized-home",
};

/** Meal Prep Kitchen Reset. */
export const MEAL_PREP_KITCHEN_RESET_LIST: StorefrontList = {
  key: "meal-prep-kitchen-reset",
  name: "Meal Prep Kitchen Reset: Containers, Tools and Gadgets That Make Weeknights Easier",
  line: "Eight kitchen pieces that shorten the distance between getting home and eating something good.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/1BOWI8N1Q76O4?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
  pageHref: "/meal-prep-kitchen-reset",
};

/** Small-Space Home Fitness. */
export const SMALL_SPACE_HOME_FITNESS_LIST: StorefrontList = {
  key: "small-space-home-fitness",
  name: "Small-Space Home Fitness: Apartment Friendly Workout Gear That Stores Away",
  line: "Seven pieces of workout gear that store away, for the room that has to be a living room the rest of the day.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/1MXA4U6MM1SQH?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
  pageHref: "/small-space-home-fitness",
};

/** Wellness at Home. */
export const WELLNESS_AT_HOME_LIST: StorefrontList = {
  key: "wellness-at-home",
  name: "Wellness at Home: Sleep, Calm and Self-Care Favorites for a Softer New Year",
  line: "Eight quiet pieces for the part of January that is not about doing more.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/32XY2XVINP1G7?ref_=aipsflist&tag=crystalpalino-20&originMarketplaceId=ATVPDKIKX0DER",
  pageHref: "/wellness-at-home",
};

/**
 * Closet Organization Ideas, the tenth storefront list to get a page of its own
 * (owner decision 54, 2026-11-22). The list URL and its tag come from the
 * merchandiser's manifest for that list
 * (curation/closet-pantry-2026-11-23/closet-list-manifest.json), byte for byte.
 */
export const CLOSET_ORGANIZATION_LIST: StorefrontList = {
  key: "closet-organization",
  name: "Closet Organization Ideas",
  line: "Eight closet organizers chosen to keep a closet visible and easy to put back, all read and dated on November 23, 2026.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/4VIW04EDDKTP?tag=crystalpalino-20",
  pageHref: "/closet-organization",
};

/** Pantry Organization Ideas, built in the same pass. */
export const PANTRY_ORGANIZATION_LIST: StorefrontList = {
  key: "pantry-organization",
  name: "Pantry Organization Ideas",
  line: "Seven pantry organizers chosen to make a shelf legible, all read and dated on November 23, 2026.",
  href: "https://www.amazon.com/shop/evergreenhouseco/list/56861249GMTD?tag=crystalpalino-20",
  pageHref: "/pantry-organization",
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
  [NEW_YEAR_ORGANIZED_HOME_LIST.key]: NEW_YEAR_ORGANIZED_HOME_LIST,
  [MEAL_PREP_KITCHEN_RESET_LIST.key]: MEAL_PREP_KITCHEN_RESET_LIST,
  [SMALL_SPACE_HOME_FITNESS_LIST.key]: SMALL_SPACE_HOME_FITNESS_LIST,
  [WELLNESS_AT_HOME_LIST.key]: WELLNESS_AT_HOME_LIST,
  [CLOSET_ORGANIZATION_LIST.key]: CLOSET_ORGANIZATION_LIST,
  [PANTRY_ORGANIZATION_LIST.key]: PANTRY_ORGANIZATION_LIST,
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

/**
 * One editorial scene per list, for the placements that show one
 * (owner, 2026-11-22).
 *
 * The scene belongs to the LIST, never to a product on it: it is the same art
 * the list's own page or post opens on, reused so a card cannot invent a look
 * the page does not have. It lives here rather than on the list object so a
 * placement asks for it by key: every placement that does not ask stays
 * text-only, exactly as it was.
 */
export interface StorefrontListImage {
  /** The jpg, which is what every browser can read. */
  src: string;
  /** The webp the same scene was exported to, served first where supported. */
  webp?: string;
  /** Describes the scene itself, not the list. */
  alt: string;
  /**
   * The art's own shape. Landscape is the default and the shipped behaviour;
   * portrait tells the card to hold a 4:5 scene whole rather than crop a flat
   * lay of products down to a landscape slot (owner, 2026-11-22).
   */
  aspect?: "landscape" | "portrait";
}

export const LIST_IMAGES: Record<string, StorefrontListImage> = {
  [UNDER19_LIST.key]: {
    src: "/images/stocking-stuffers-hero.jpg",
    webp: "/images/stocking-stuffers-hero.webp",
    alt: "Kraft wrapped gifts tied with red velvet ribbon and twine beside a cream cable knit stocking on a marble counter, with a lit Christmas tree and a candle behind them",
  },
  [RESET_LIST.key]: {
    src: "/images/blog-reset-list-v2.jpg",
    webp: "/images/blog-reset-list-v2.webp",
    alt: "A bright home office desk holding the Reset List finds: a paper file organizer, an open planner, a memory journal, a sunrise alarm clock and drawer organizers, with a plant at the edge of the desk in soft daylight",
  },
  /*
   * The four January lists' own 4:5 card crops, cut from the same art each
   * page opens on (owner decision 64, the January heroes). A card that links to
   * one of these pages shows that page's own scene, so cards and pages agree
   * (Site Standard rule 5). Portrait: the crop is 1000x1250 and is held whole.
   */
  [NEW_YEAR_ORGANIZED_HOME_LIST.key]: {
    src: "/images/january-new-year-organized-home-hero-card.jpg",
    webp: "/images/january-new-year-organized-home-hero-card.webp",
    alt: "A linen file organizer, an open planner and small oak trays on a light wood desk in a corner office, with a brass lamp and a trailing plant beside a sunlit window.",
    aspect: "portrait",
  },
  [MEAL_PREP_KITCHEN_RESET_LIST.key]: {
    src: "/images/january-meal-prep-kitchen-reset-hero-card.jpg",
    webp: "/images/january-meal-prep-kitchen-reset-hero-card.webp",
    alt: "Glass storage jars of grains and pasta, a wooden board and a bowl of fruit on a pale stone kitchen counter, with a folded linen towel and morning light from a side window.",
    aspect: "portrait",
  },
  [SMALL_SPACE_HOME_FITNESS_LIST.key]: {
    src: "/images/january-small-space-home-fitness-hero-card.jpg",
    webp: "/images/january-small-space-home-fitness-hero-card.webp",
    alt: "A rolled cork mat, small green weights and a resistance band in the corner of a living room, with a folded linen towel, an olive tree and a linen sofa in soft afternoon light.",
    aspect: "portrait",
  },
  [WELLNESS_AT_HOME_LIST.key]: {
    src: "/images/january-wellness-at-home-hero-card.jpg",
    webp: "/images/january-wellness-at-home-hero-card.webp",
    alt: "A lit candle, a stoneware mug and eucalyptus in a small vase on an oak nightstand beside rumpled linen bedding, in warm late afternoon light.",
    aspect: "portrait",
  },
  /*
   * The three stocking lists' own portrait flat lays, the art Crystal supplied
   * on 2026-11-22 (owner decision 60). Each is the same scene its own page's
   * list card carries, registered here so any placement asks for it by key and
   * the hub shows the art of the page it links to (owner fix, 2026-11-23).
   */
  [MEN_STOCKING_LIST.key]: {
    src: "/images/stocking-men-card-v2.jpg",
    webp: "/images/stocking-men-card-v2.webp",
    alt: "Flat lay of stocking gifts for men with a leather card wallet, hot sauce, beard balm and a Carhartt beanie",
    aspect: "portrait",
  },
  [TEEN_BOYS_STOCKING_LIST.key]: {
    src: "/images/stocking-teen-boys-card-v2.jpg",
    webp: "/images/stocking-teen-boys-card-v2.webp",
    alt: "Flat lay of teen stocking gifts with a Wilson football, patterned socks, a power bank, card games and hand warmers",
    aspect: "portrait",
  },
  /*
   * New Year's Eve at Home: the list's own scene is the page's 3:1 hero, which
   * is Crystal's crop of her own pin art (owner decision 64, 2026-11-23). The
   * list card carries no rating, count or price.
   */
  [NEW_YEARS_EVE_LIST.key]: {
    src: "/images/new-years-eve-hero.jpg",
    webp: "/images/new-years-eve-hero.webp",
    alt: "Black and gold New Year's Eve table with a champagne bucket of bottles on ice, gold foil fringe, black and gold balloons, white hydrangea and canapes",
  },
  [TEEN_GIRLS_STOCKING_LIST.key]: {
    src: "/images/stocking-teen-girls-card-v2.jpg",
    webp: "/images/stocking-teen-girls-card-v2.webp",
    alt: "Flat lay of teen stocking gifts with Burt's Bees sets, Tree Hut sugar scrub, a Laneige lip mask, claw clips and a pink hair brush",
    aspect: "portrait",
  },
  /*
   * Closet and Pantry Organization Ideas (owner decision 54, 2026-11-23): each
   * page's list card carries the 4:5 scene the designer exported for that page,
   * the same art its Journal card uses. It is the list's scene, not a product
   * photo, and the card carries no rating, count or price.
   */
  [CLOSET_ORGANIZATION_LIST.key]: {
    src: "/images/january-closet-organization-hero-card.jpg",
    webp: "/images/january-closet-organization-hero-card.webp",
    alt: "Two woven baskets and folded oatmeal linens on the top shelf of a pale oak closet, with a row of matching wooden hangers, a stack of sweaters and a shoe rack below, in warm morning light.",
    aspect: "portrait",
  },
  [PANTRY_ORGANIZATION_LIST.key]: {
    src: "/images/january-pantry-organization-hero-card.jpg",
    webp: "/images/january-pantry-organization-hero-card.webp",
    alt: "Plain glass jars of rice, oats, beans and pasta on pale oak pantry shelves, with a lazy susan of tins, a stack of clear containers and a woven basket of root vegetables below, in warm daylight.",
    aspect: "portrait",
  },
};

/** The scene for a list, when one has been exported. Undefined renders no image. */
export function getListImage(key: string): StorefrontListImage | undefined {
  return LIST_IMAGES[key];
}
