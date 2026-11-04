import { trackAffiliateClick, trackSelectItem } from "~/lib/analytics";
import { cardPrice, cardRating, cardReviewCount } from "~/lib/card-copy";
import { useAnalyticsList } from "./AnalyticsList";
import type { EditProduct } from "~/lib/edits";

/**
 * The product card used on the "Shop the Edit" landing pages
 * (/collections/<edit-slug>) and on the two homepage grids (Shop the Look and
 * The Current Edit), where the product list, not the product page, is the
 * destination.
 *
 * Owner card rules, same as the shared ProductCard (which this deliberately
 * does NOT modify):
 *   - exactly one internal link: the product name, to /product/<manifest slug>
 *   - exactly one Amazon anchor: "View on Amazon", new tab, sponsored
 *   - the three verified facts (star rating, review count, price) shown exactly
 *     as the room card shows them, formatted by the same helpers in
 *     src/lib/card-copy.ts. Honest numbers only: a number renders only when the
 *     row carries it, a 4.2 star product prints 4.2, a row with no rating shows
 *     no stars rather than a zero, a row with no price shows no price. No
 *     placeholder, no estimate, no rounding, no invented figure.
 *     (Owner Room Card Standard extended to edit and homepage cards, 2026-11-04.)
 *   - no discount claim, no urgency copy
 *   - no Amazon Associates sentence on the card itself: the page renders it
 *     once, through src/components/AmazonDisclosure.tsx (owner Room Card
 *     Standard). A 30 product edit used to print 31 identical sentences.
 *   - no em-dashes
 * The photo is not a second outbound link here: the edit page's job is to sell
 * the edit, and one affiliate anchor per product keeps the click path legible.
 *
 * Copy comes from the curation manifest (short display title for the long
 * Amazon listing names, plus the editor hook), so nothing is generated here:
 * the manifest stays authoritative for the title and the line, while the stars,
 * review count and price come from the database row for that id.
 */
export function EditProductCard({
  product,
  eager = false,
}: {
  product: EditProduct;
  eager?: boolean;
}) {
  const list = useAnalyticsList();

  // Verified facts, exactly as stored. Any missing value renders nothing at all.
  const ratingValue = cardRating(product.rating);
  const reviewCount = cardReviewCount(product.reviewCount);
  const priceLabel = cardPrice(product.price);

  function trackAmazonClick() {
    trackAffiliateClick({
      productId: product.id,
      name: product.title,
      // The card's price label, or null when the row carries no price.
      price: priceLabel ? Number(product.price) : null,
      context: list?.context || "shop_the_edit",
      listId: list?.listId,
      merchant: "amazon",
      destinationUrl: product.amazonUrl,
      eventId: `amz-click-${product.id}`,
    });
  }

  /** The card's only on-site click target: opening the product page. */
  function trackProductPageOpen() {
    trackSelectItem({ id: product.id, name: product.title }, list ?? undefined);
  }

  const pinDescription = `${product.title}, an editor pick from the ${list?.listName || "Shop the Edit"} collection.`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-beige/25 bg-white shadow-sm ring-1 ring-beige/10 transition-all duration-300 hover:border-antique-gold/50 hover:shadow-md">
      <div className="pin-image-wrapper aspect-square w-full shrink-0 bg-soft-white">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            width={1000}
            height={1000}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
            data-pin-description={pinDescription}
            data-pin-url={product.hasRealUrl ? product.amazonUrl : undefined}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              aria-hidden="true"
              className="font-serif text-4xl italic text-warm-gray"
            >
              {product.title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        {/* The card's one internal link. */}
        <h3 className="font-serif text-sm leading-snug text-warm-dark sm:text-base">
          <a
            href={`/product/${product.slug}`}
            className="transition-colors hover:text-burgundy-deep"
            onClick={trackProductPageOpen}
          >
            {product.title}
          </a>
        </h3>
        {product.hook && (
          <p className="mt-1.5 text-xs leading-relaxed text-warm-gray">
            {product.hook}
          </p>
        )}
        {/* Verified facts: star rating, review count, price. Identical markup and
            formatting to the room card (src/components/ProductCard.tsx), and each
            value prints only when the row actually carries the number - no
            placeholder, no estimate, no zero for a missing rating. */}
        {(ratingValue || priceLabel) && (
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {ratingValue && (
              <span className="flex items-center gap-1">
                <span aria-hidden="true" className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill={i < Math.round(Number(ratingValue)) ? "#C9B99A" : "none"}
                      stroke="#C9B99A"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </span>
                <span className="text-[11px] font-medium text-warm-dark">{ratingValue}</span>
                {reviewCount && (
                  <span className="text-[11px] text-taupe">({reviewCount})</span>
                )}
              </span>
            )}
            {priceLabel && (
              <span className="ml-auto text-[11px] font-medium text-warm-dark">{priceLabel}</span>
            )}
          </div>
        )}
        <div className="mt-auto pt-3">
          {product.hasRealUrl && (
            <a
              href={product.amazonUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label={`View ${product.title} on Amazon (opens in a new tab)`}
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
