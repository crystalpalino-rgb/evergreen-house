/**
 * Evergreen House analytics - the single push point to the GTM dataLayer.
 *
 * The GTM container GTM-WCVMWDLG owns GA4 (the measurement id lives in the
 * container, not in this repo), so every shopper action below is pushed to
 * window.dataLayer as a named event and forwarded to GA4 by a container tag.
 * No other module in this codebase pushes to dataLayer.
 *
 * Rules this module keeps:
 * - SSR safe: every helper is a no-op when window / dataLayer is missing, and
 *   no helper ever throws (analytics must never break a page or a click).
 * - One event per action: helpers are called from click handlers or from a
 *   single mount effect (see src/components/AnalyticsList.tsx), never per card.
 * - No em-dashes (owner style directive): plain hyphens only.
 */

export type DeviceType = "mobile" | "tablet" | "desktop";

/** GA4 ecommerce item shape. */
export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  price?: number;
  quantity?: number;
  index?: number;
};

export type AnalyticsParams = Record<string, unknown>;

/** Loose product shape: cards and routes pass snake_case or camelCase rows. */
type ProductLike = {
  id?: string | number | null;
  product_id?: string | number | null;
  productId?: string | number | null;
  name?: string | null;
  item_name?: string | null;
  brand?: string | null;
  room?: string | null;
  category?: string | null;
  style?: string | null;
  price?: number | string | null;
};

type TrackingWindow = Window & {
  dataLayer?: AnalyticsParams[];
  pintrk?: (...args: unknown[]) => void;
};

function trackingWindow(): TrackingWindow | null {
  if (typeof window === "undefined") return null;
  return window as TrackingWindow;
}

/** Pathname of the current page, or "" during SSR. */
export function getPagePath(): string {
  const w = trackingWindow();
  return w?.location?.pathname || "";
}

/**
 * Traffic source: utm_source when present, otherwise the first segment of the
 * referring host ("www.pinterest.com" -> "pinterest"). Same-site referrers and
 * missing referrers report "internal" / "direct" rather than a bare hostname.
 */
export function getSource(): string {
  const w = trackingWindow();
  if (!w) return "direct";
  try {
    const utm = new URLSearchParams(w.location.search).get("utm_source");
    if (utm) return utm;
    const referrer = w.document?.referrer || "";
    if (!referrer) return "direct";
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    const self = w.location.hostname.replace(/^www\./, "");
    if (!host || host === self) return "internal";
    return host.split(".")[0] || "direct";
  } catch {
    return "direct";
  }
}

/** Simple user-agent device class. No library, no dependency. */
export function getDevice(): DeviceType {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/ipad|tablet|playbook|silk|kindle/i.test(ua)) return "tablet";
  if (/android/i.test(ua) && !/mobile/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) return "mobile";
  return "desktop";
}

/** Params attached to every event (route, source, device). */
export function baseParams(): AnalyticsParams {
  return {
    page_path: getPagePath(),
    source: getSource(),
    device: getDevice(),
  };
}

/**
 * The one and only dataLayer push in the app.
 * Params win over the base enrichment, so a caller can override page_path.
 */
export function pushEvent(name: string, params: AnalyticsParams = {}): void {
  const w = trackingWindow();
  if (!w || !name) return;
  try {
    if (!Array.isArray(w.dataLayer)) w.dataLayer = [];
    w.dataLayer.push({ event: name, ...baseParams(), ...params });
  } catch {
    // Never let tracking break a page or a click.
  }
}

/** Normalize a product row (snake_case or camelCase) into a GA4 item. */
export function toAnalyticsItem(product: unknown, index?: number): AnalyticsItem | null {
  if (!product || typeof product !== "object") return null;
  const p = product as ProductLike;
  const rawId = p.id ?? p.product_id ?? p.productId;
  if (rawId === undefined || rawId === null || rawId === "") return null;

  const item: AnalyticsItem = {
    item_id: String(rawId),
    item_name: String(p.name ?? p.item_name ?? "") || String(rawId),
  };
  if (typeof p.brand === "string" && p.brand) item.item_brand = p.brand;
  const category = p.room ?? p.category;
  if (typeof category === "string" && category) item.item_category = category;
  if (typeof p.style === "string" && p.style) item.item_category2 = p.style;
  const numericPrice = typeof p.price === "string" ? Number(p.price) : p.price;
  if (typeof numericPrice === "number" && Number.isFinite(numericPrice)) {
    item.price = Math.round(numericPrice * 100) / 100;
  }
  if (typeof index === "number") item.index = index;
  return item;
}

/** List context passed from a grid down to the shared card. */
export type ListContext = {
  listId: string;
  listName?: string;
  context?: string;
};

/** view_item_list - one push per rendered grid, never per card. */
export function trackViewItemList({
  listId,
  listName,
  context,
  items,
}: {
  listId: string;
  listName?: string;
  context?: string;
  items: unknown[];
}): void {
  const mapped = (items || [])
    .map((product, index) => toAnalyticsItem(product, index))
    .filter((item): item is AnalyticsItem => item !== null);
  if (!listId || mapped.length === 0) return;

  pushEvent("view_item_list", {
    item_list_id: listId,
    item_list_name: listName || listId,
    context: context || listId,
    items: mapped,
  });
}

/** select_item - emitted from the shared card when a shopper opens a product. */
export function trackSelectItem(product: unknown, list?: ListContext): void {
  const item = toAnalyticsItem(product);
  if (!item) return;

  const listId = list?.listId || "product_grid";
  pushEvent("select_item", {
    item_list_id: listId,
    item_list_name: list?.listName || listId,
    context: list?.context || listId,
    items: [item],
  });
}

/** view_item - emitted once per product page mount. */
export function trackViewItem(product: unknown, context = "product_page"): void {
  const item = toAnalyticsItem(product);
  if (!item) return;

  pushEvent("view_item", {
    item_id: item.item_id,
    item_name: item.item_name,
    context,
    items: [item],
  });
}

export type AffiliateClickInput = {
  productId: string | number;
  name?: string;
  /** Where the click happened, e.g. "product_page", "editors-picks", "blog:<slug>". */
  context?: string;
  /** Grid the card belongs to, when the click came from a card. */
  listId?: string;
  merchant?: string;
  destinationUrl?: string;
  /**
   * Stable id per affiliate click - the amz-click-<id> / amz-click-<slug>-<id>
   * convention that has been in use since the first Pinterest calls. Keep it.
   */
  eventId?: string;
  price?: number | null;
  /**
   * Mirror the click to the Pinterest tag (default true - the behavior every
   * existing affiliate link had). Pass false where Pinterest did not track the
   * surface before, so this PR does not change Pinterest numbers.
   */
  mirrorPinterest?: boolean;
};

/**
 * affiliate_click - the single path for every outbound Amazon click site-wide:
 * product cards (image + CTA), the product page CTA and all blog CTAs.
 * Anchors keep their own href/target/rel - this never intercepts navigation.
 */
export function trackAffiliateClick(input: AffiliateClickInput): void {
  const productId = input.productId === undefined || input.productId === null ? "" : String(input.productId);
  if (!productId) return;

  const eventId = input.eventId || `amz-click-${productId}`;
  pushEvent("affiliate_click", {
    product_id: productId,
    name: input.name || "",
    context: input.context || "product_card",
    list_id: input.listId || "",
    merchant: input.merchant || "amazon",
    destination_url: input.destinationUrl || "",
    event_id: eventId,
  });

  if (input.mirrorPinterest !== false) {
    trackPinterestLead({ eventId, name: input.name, productId, price: input.price });
  }
}

/** Pinterest mirror of an affiliate click (unchanged payload shape). */
function trackPinterestLead({
  eventId,
  name,
  productId,
  price,
}: {
  eventId: string;
  name?: string;
  productId: string;
  price?: number | null;
}): void {
  const w = trackingWindow();
  if (!w || typeof w.pintrk !== "function") return;
  try {
    w.pintrk("track", "lead", {
      event_id: eventId,
      value: price ? Math.round(price * 100) / 100 : undefined,
      currency: "USD",
      line_items: [{ product_name: name, product_id: productId }],
    });
  } catch {
    // Never let tracking break a click.
  }
}

/**
 * Dedupe guard for mount effects: true the first time a key is seen inside the
 * window, false for repeats. Protects grid/list events from double emission
 * (StrictMode double-invoked effects, remounts inside one navigation) while
 * still letting a genuine later view of the same grid report again.
 */
const emittedKeys = new Map<string, number>();

export function claimOnce(key: string, windowMs = 1500): boolean {
  if (typeof window === "undefined" || !key) return false;
  const now = Date.now();
  const last = emittedKeys.get(key);
  if (last !== undefined && now - last < windowMs) return false;
  emittedKeys.set(key, now);
  return true;
}
