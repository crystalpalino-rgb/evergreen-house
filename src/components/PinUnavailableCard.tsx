import { PinNumberChip } from "./EditProductCard";

/**
 * The off-sale card on a Pinterest landing page (/pin/<slug>).
 *
 * A pin can name a product that Amazon is not currently selling through a buy
 * box. Owner decision, 2026-11-04: the number stays. The card shows the numeral
 * the visitor sees on the pin, the pin's own label, the product photo and one
 * plain line saying it is not available at the link we checked, and it carries
 * NO Amazon link and NO price, because there is nothing to click and nothing
 * honest to quote.
 *
 * As of 2026-11-04 no live pin carries an off-sale number: the luxe pin's pearl
 * ornaments and the tablescape pin's Spode pitcher were both replaced with
 * products that have a buy box, so every number on every pin page resolves to a
 * card with a link and a price. This component stays in place because the flag
 * it renders is data, not a special case: scripts/build-pin-pages.mjs still sets
 * `unavailable` for any disc whose product is on the no-buy-box list
 * (src/data/holiday-hidden-products.json), so the moment a pinned product loses
 * its buy box it renders honestly again instead of silently vanishing or
 * showing a dead price.
 *
 * Nothing is dropped and nothing is renumbered: the page always carries the same
 * number of cards as the pin carries discs, in the same order.
 */
export function PinUnavailableCard({
  number,
  label,
  displayTitle,
  imageUrl,
  imageAlt,
}: {
  number: number;
  label: string;
  displayTitle: string;
  imageUrl: string | null;
  imageAlt: string;
}) {
  return (
    <article
      id={`item-${number}`}
      className="group flex h-full scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-dashed border-beige/50 bg-cream-dark/30 shadow-sm"
    >
      <div className="aspect-square w-full shrink-0 bg-soft-white">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            width={1000}
            height={1000}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-3 opacity-75"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span aria-hidden="true" className="font-serif text-4xl italic text-warm-gray">
              {displayTitle.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <PinNumberChip number={number} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-taupe">
          {label}
        </p>
        <h3 className="mt-1 font-serif text-sm leading-snug text-warm-dark sm:text-base">
          {displayTitle}
        </h3>
        <p className="mt-auto pt-2 text-xs leading-relaxed text-warm-gray">
          Not available at the link we checked right now.
        </p>
      </div>
    </article>
  );
}
