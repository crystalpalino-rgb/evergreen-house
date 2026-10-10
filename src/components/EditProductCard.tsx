import { trackAffiliateClick } from "~/lib/analytics";
import { useAnalyticsList } from "./AnalyticsList";
import type { EditProduct } from "~/lib/edits";

/**
 * The product card used on the "Shop the Edit" landing pages
 * (/collections/<edit-slug>), where the product list, not the product page, is
 * the destination.
 *
 * Owner card rules, same as the shared ProductCard (which this deliberately
 * does NOT modify):
 *   - exactly one internal link: the product name, to /product/<manifest slug>
 *   - exactly one Amazon anchor: "View on Amazon", new tab, sponsored
 *   - no price, no rating, no availability, no discount claim
 *   - no em-dashes
 * The photo is not a second outbound link here: the edit page's job is to sell
 * the edit, and one affiliate anchor per product keeps the click path legible.
 *
 * Copy comes from the curation manifest (short display title for the long
 * Amazon listing names, plus the editor hook), so nothing is generated here.
 */
export function EditProductCard({
  product,
  eager = false,
}: {
  product: EditProduct;
  eager?: boolean;
}) {
  const list = useAnalyticsList();

  function trackAmazonClick() {
    trackAffiliateClick({
      productId: product.id,
      name: product.title,
      // Not rendered: the card carries no price by owner decision.
      price: null,
      context: list?.context || "shop_the_edit",
      listId: list?.listId,
      merchant: "amazon",
      destinationUrl: product.amazonUrl,
      eventId: `amz-click-${product.id}`,
    });
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
          >
            {product.title}
          </a>
        </h3>
        {product.hook && (
          <p className="mt-1.5 text-xs leading-relaxed text-warm-gray">
            {product.hook}
          </p>
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
