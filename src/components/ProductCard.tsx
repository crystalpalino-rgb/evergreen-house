import type { Product } from "~/lib/types";
import { canonicalProductSlug } from "~/lib/product-slug";
import { trackAffiliateClick, trackSelectItem } from "~/lib/analytics";
import { cardHookLine, cardRoomLabel } from "~/lib/card-copy";
import { useAnalyticsList } from "./AnalyticsList";

export type { Product };

/**
 * The shared product card, used by all 14 renderers (home, rooms, collections,
 * styles, search, lifestyle, editors-picks, apparel, PDP related).
 *
 * Conversion mandate (owner, 2026-10-10): the primary interaction is an
 * outbound Amazon click. The photo and the "View on Amazon" button both link
 * straight to the affiliate URL, so the product page is never a required step.
 * The product page stays reachable through one quiet internal link (the name)
 * for SEO, and never sits between the shopper and Amazon.
 *
 * Card copy is deliberately card-shaped: a room label, the product name in two
 * lines, and one optional one-line styling hook derived from the product's own
 * editor note. No price, no rating, no stock or discount claims, because none
 * of that is verified data the brand can stand behind (owner decision).
 *
 * Renders with no amazon_url (the PDP related grid hands us amazon_url: "") get
 * no Amazon link at all: the photo is not a link, no CTA is rendered, and the
 * name link is the only way off the card. No dead or empty hrefs.
 */

/** Pinterest pin description. No price: it is unverified data. */
function getPinDescription(product: Product): string {
  const p = product as any;
  const productRoom = p.room || "";
  const room = cardRoomLabel(productRoom)?.toLowerCase() || productRoom.replace(/-/g, " ");
  const productName = p.name || "";
  return `${productName}, a beautiful find for your ${room}. Shop the look!`;
}

export function ProductCard({ product }: { product: Product }) {
  // Compatibility: data arrives in snake_case (DB direct) or camelCase (serialized)
  const p = product as any;
  // Grid this card was rendered in (set by AnalyticsList); null outside a grid.
  const list = useAnalyticsList();
  const price = p.price;
  const amazonUrl = p.amazon_url || p.amazonUrl || "";
  const imageUrl = p.image_url || p.imageUrl || "";
  const name = p.name || "";
  // Canonical URL slug. Built with the SAME helper the product route resolves
  // with (src/lib/product-slug.ts), so a card link can never drift from the URL
  // the route actually serves: a stored seo_slug wins, name-derived otherwise.
  const productSlug = canonicalProductSlug(p);
  // Use existing image_alt from DB if available, otherwise generate a descriptive alt
  const imageAlt = p.image_alt || `${name} - Evergreen House`;

  const roomLabel = cardRoomLabel(p.room || "");
  // One line only, straight from the product's own editor note. Null is common
  // and expected; the card then renders no hook line.
  const hook = cardHookLine(p.editor_note || p.editorNote || null, name);

  const pinDescription = getPinDescription(product);
  // The only guard that decides whether this card has an outbound Amazon path.
  const hasRealUrl = Boolean(amazonUrl) && amazonUrl !== "#" && amazonUrl.startsWith("http");

  // Build srcset for Amazon images (they support size parameters)
  function getImageSrcSet(url: string): { srcSet?: string; sizes?: string } {
    if (!url) return {};
    // Amazon media images support size parameters
    if (url.includes("media-amazon.com") || url.includes("images-amazon.com") || url.includes("ssl-images-amazon.com")) {
      // Most Amazon product images end with ._AC_SL1500_.jpg or similar
      // Build srcset with multiple widths
      const base = url.replace(/\._[A-Z]+[_0-9]+_\./, ".");
      const sizes = [320, 480, 640, 800, 1080];
      const srcSet = sizes
        .map((w) => {
          // Construct Amazon-style resized URL
          const ext = url.lastIndexOf(".") > -1 ? url.slice(url.lastIndexOf(".")) : ".jpg";
          const nameWithoutExt = base.slice(0, base.lastIndexOf("."));
          return `${nameWithoutExt}._AC_UL${w}_${ext} ${w}w`;
        })
        .join(", ");
      return { srcSet, sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" };
    }
    return {};
  }

  const { srcSet, sizes } = getImageSrcSet(imageUrl);

  /**
   * Both Amazon anchors on the card (photo + CTA) report through the single
   * shared affiliate_click path, which also mirrors the Pinterest lead.
   * Navigation is untouched: no preventDefault, no href rewrite, target/rel
   * stay as they are. One click fires exactly one event.
   */
  function trackAmazonClick() {
    trackAffiliateClick({
      productId: product.id,
      name,
      // Not shown on the card; used only as the Pinterest lead value.
      price: price ?? null,
      context: list?.context || "product_card",
      listId: list?.listId,
      merchant: "amazon",
      destinationUrl: amazonUrl,
      eventId: `amz-click-${product.id}`,
    });
  }

  /** The card's only on-site click target: opening the product page. */
  function trackProductPageOpen() {
    trackSelectItem(product, list ?? undefined);
  }

  /** The photo plate. Identical markup in both the linked and unlinked case. */
  const photo = imageUrl ? (
    <img
      src={imageUrl}
      srcSet={srcSet}
      sizes={sizes}
      alt={imageAlt}
      className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
      loading="lazy"
      decoding="async"
      data-pin-description={pinDescription}
      data-pin-url={hasRealUrl ? amazonUrl : undefined}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-soft-white">
      {/* Placeholder plate for a row with no image. Decorative only. */}
      <span aria-hidden="true" className="font-serif text-4xl text-warm-gray italic">
        {name.charAt(0)}
      </span>
    </div>
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-beige/25 bg-white shadow-sm ring-1 ring-beige/10 transition-all duration-300 hover:-translate-y-1 hover:border-antique-gold/50 hover:shadow-md">
      {/* Photo plate - consistent 1:1 frame on every renderer, image contained.
          Primary outbound target when the row has a real Amazon URL. */}
      <div className="pin-image-wrapper aspect-square w-full shrink-0 bg-soft-white">
        {hasRealUrl ? (
          <a
            href={amazonUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`View ${name} on Amazon (opens in a new tab)`}
            className="block h-full w-full"
            onClick={trackAmazonClick}
          >
            {photo}
          </a>
        ) : (
          photo
        )}
      </div>
      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        {roomLabel && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-burgundy">
            {roomLabel}
          </p>
        )}
        {/* Name - the card's one internal link, kept visually secondary to the CTA. */}
        <h3 className={`font-serif text-sm leading-snug text-warm-dark line-clamp-2 ${roomLabel ? "mt-1.5" : ""}`}>
          <a
            href={`/product/${productSlug}`}
            className="transition-colors hover:text-burgundy-deep"
            onClick={trackProductPageOpen}
          >
            {name}
          </a>
        </h3>
        {/* One-line styling hook, straight from the editor note. */}
        {hook && (
          <p className="mt-1 text-xs leading-relaxed text-warm-gray line-clamp-1">{hook}</p>
        )}
        {/* CTA - full width, bottom aligned, thumb reachable. Rendered only when
            the row carries a real Amazon URL, so a related card on the PDP never
            shows an empty or dead outbound button. */}
        <div className="mt-auto pt-3">
          {hasRealUrl && (
            <a
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label={`View ${name} on Amazon (opens in a new tab)`}
              className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-midnight px-2.5 py-2.5 text-center text-[11px] font-semibold uppercase leading-tight tracking-[0.06em] text-soft-white transition-colors duration-200 hover:bg-midnight-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midnight focus-visible:ring-offset-2 focus-visible:ring-offset-soft-white"
              onClick={trackAmazonClick}
            >
              View on Amazon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
