import type { StorefrontList, StorefrontListImage } from "~/lib/storefront-lists";

/**
 * A storefront list card: a pointer to a list on the owner's Amazon
 * storefront, not a product.
 *
 * Deliberately carries nothing a product card carries: no product photo, no
 * stars, no review count, no price, no "Price set by hand" label. The list name
 * is the heading, one editorial line sits under it, and there is exactly one
 * link, "See the list on Amazon". The page's own Amazon disclosure covers it, so
 * the card never prints a second one.
 *
 * A placement may also pass the list's own editorial scene (owner, 2026-11-22).
 * That is not product data: it is the art the list's page or post already opens
 * on, and it is passed in by the placement, so every card that does not ask for
 * one stays text-only exactly as it was.
 */
export function StorefrontListCard({
  list,
  level = 3,
  className = "",
  toPage = true,
  image,
}: {
  list: StorefrontList;
  /** Heading level: 2 where the card leads a page section, 3 under a section h2. */
  level?: 2 | 3;
  className?: string;
  /**
   * When the list has its own page on this site, the card opens that page
   * rather than Amazon (owner, 2026-11-14). Pass false on the page itself, so
   * the card there is the one link out to the storefront list.
   */
  toPage?: boolean;
  /** The list's own scene, when the placement wants the card to carry one. */
  image?: StorefrontListImage;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  const onSite = toPage && Boolean(list.pageHref);
  const href = onSite ? (list.pageHref as string) : list.href;
  const label = onSite ? "See the gift guide" : "See the list on Amazon";

  const text = (
    <div className="min-w-0">
      <Heading className="font-serif text-xl font-semibold leading-snug text-warm-dark sm:text-2xl">
        {list.name}
      </Heading>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-gray sm:text-base">
        {list.line}
      </p>
      <a
        href={href}
        {...(onSite
          ? {}
          : { target: "_blank", rel: "noopener noreferrer sponsored" })}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-burgundy underline-offset-4 transition-colors hover:text-burgundy-deep hover:underline"
      >
        {label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 17 17 7" />
          <path d="M9 7h8v8" />
        </svg>
      </a>
    </div>
  );

  return (
    <div
      id={`storefront-list-${list.key}`}
      className={`rounded-2xl border border-beige/40 bg-cream-dark/60 px-5 py-5 sm:px-8 sm:py-7 ${className}`}
    >
      {image ? (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <div className="overflow-hidden rounded-xl bg-beige/20 sm:w-[38%] sm:shrink-0">
            <picture>
              {image.webp ? (
                <source srcSet={image.webp} type="image/webp" />
              ) : null}
              <img
                src={image.src}
                alt={image.alt}
                width={1200}
                height={900}
                loading="lazy"
                decoding="async"
                className="aspect-[16/10] w-full object-cover sm:aspect-[4/3]"
              />
            </picture>
          </div>
          {text}
        </div>
      ) : (
        text
      )}
    </div>
  );
}
