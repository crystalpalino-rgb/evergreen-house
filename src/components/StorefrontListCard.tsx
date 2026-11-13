import type { StorefrontList } from "~/lib/storefront-lists";

/**
 * A storefront list card: a pointer to a list on the owner's Amazon
 * storefront, not a product.
 *
 * Deliberately carries nothing a product card carries: no image, no stars, no
 * review count, no price, no "Price set by hand" label. The list name is the
 * heading, one editorial line sits under it, and there is exactly one link,
 * "See the list on Amazon". The page's own Amazon disclosure covers it, so the
 * card never prints a second one.
 */
export function StorefrontListCard({
  list,
  level = 3,
  className = "",
}: {
  list: StorefrontList;
  /** Heading level: 2 where the card leads a page section, 3 under a section h2. */
  level?: 2 | 3;
  className?: string;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div
      id={`storefront-list-${list.key}`}
      className={`rounded-2xl border border-beige/40 bg-cream-dark/60 px-5 py-5 sm:px-8 sm:py-7 ${className}`}
    >
      <Heading className="font-serif text-xl font-semibold leading-snug text-warm-dark sm:text-2xl">
        {list.name}
      </Heading>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-gray sm:text-base">
        {list.line}
      </p>
      <a
        href={list.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-burgundy underline-offset-4 transition-colors hover:text-burgundy-deep hover:underline"
      >
        See the list on Amazon
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
}
