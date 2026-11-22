import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { EmailSignup } from "~/components/EmailSignup";
import { StorefrontListCard } from "~/components/StorefrontListCard";
import { trackAffiliateClick } from "~/lib/analytics";
import { SITE_URL } from "~/lib/schema";
import type { StorefrontList } from "~/lib/storefront-lists";

/**
 * The stocking gift guide template, one page per storefront list
 * (owner decision 48, 2026-11-22).
 *
 * Same shape as /stocking-stuffers, which is the page this follows: the list
 * card comes first, then one card per product in the merchandiser's manifest
 * order, then one body disclosure for the whole page. Every product fact is
 * read from the manifest (the merchandiser's live read of the Amazon listing),
 * never typed by hand and never rounded. The editorial line on each card comes
 * from the card-copy JSON, keyed by ASIN.
 *
 * The list card is not a product card: the list name, one line, one link out to
 * the owner's own storefront list, and no rating, count or price.
 */

export type ManifestItem = {
  asin: string;
  title: string;
  star_rating: number | null;
  review_count: number | null;
  price: string;
  price_usd: number;
  buy_box: boolean;
  stock_note: string;
  verified: string;
  url: string;
  gate_status: string;
  flags: string[];
  appears_on_page: boolean;
};

export type StockingManifest = {
  list_name: string;
  list_url: string;
  list_url_tag: string;
  list_item_count: number;
  verified: string;
  items: ManifestItem[];
};

export type StockingCardCopy = {
  h1: string;
  intro: string;
  seo_title: string;
  seo_description: string;
  list_card_line: string;
  cards: Record<string, string>;
};

export type StockingGuide = {
  /** The page's own path, for the canonical and the schema. */
  pagePath: string;
  /** Hero art, one filename per page so distinct art can drop in later. */
  heroJpg: string;
  heroWebp: string;
  heroAlt: string;
  /** The date the manifest was read, in ISO and in words. */
  verifiedDate: string;
  verifiedDateLabel: string;
  /** GA4 context and event id prefix for the affiliate clicks on this page. */
  analyticsContext: string;
  analyticsPrefix: string;
  list: StorefrontList;
  manifest: StockingManifest;
  copy: StockingCardCopy;
};

/** House gates: 4.3 stars or better, a live buy box, no padding. */
const MIN_STARS = 4.3;

/** The cards, in the merchandiser's order. */
function cardsFor(manifest: StockingManifest): ManifestItem[] {
  return manifest.items.filter(
    (item) =>
      item.appears_on_page &&
      item.buy_box &&
      (item.star_rating === null || item.star_rating >= MIN_STARS)
  );
}

/** Rating stars - same markup and styling as the Reset List post. */
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium text-warm-dark">{rating}</span>
      <div className="flex" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill={i < Math.round(rating) ? "#C9B99A" : "none"}
            stroke="#C9B99A"
            strokeWidth="1.5"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <span className="sr-only">{rating} out of 5 stars</span>
    </div>
  );
}

function GiftCard({
  item,
  note,
  guide,
}: {
  item: ManifestItem;
  note: string | undefined;
  guide: StockingGuide;
}) {
  return (
    <div
      id={`gift-${item.asin}`}
      className="rounded-2xl border border-beige/20 bg-white p-5 shadow-sm ring-1 ring-beige/10 sm:p-6"
    >
      <h2 className="font-serif text-lg font-semibold leading-snug text-warm-dark">
        {item.title}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {item.star_rating !== null ? (
          <>
            <RatingStars rating={item.star_rating} />
            <span className="text-sm text-warm-gray">
              {item.review_count === null
                ? "Review count not shown on the listing"
                : item.review_count === 1
                  ? "1 rating"
                  : `${item.review_count.toLocaleString("en-US")} ratings`}
            </span>
          </>
        ) : (
          <span className="text-sm italic text-warm-gray">
            No star rating on the listing yet
          </span>
        )}
        <span className="text-sm font-semibold text-terracotta">
          {item.price}
        </span>
      </div>
      <p className="mt-1 text-xs text-taupe">
        {`Verified ${guide.verifiedDateLabel}`}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-warm-gray sm:text-base">
        {note}
      </p>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-sage-dark"
        onClick={() =>
          trackAffiliateClick({
            productId: item.asin,
            name: item.title,
            price: item.price_usd,
            context: guide.analyticsContext,
            destinationUrl: item.url,
            eventId: `amz-click-${guide.analyticsPrefix}-${item.asin}`,
          })
        }
      >
        Shop on Amazon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={13}
          height={13}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </a>
    </div>
  );
}

export function StockingGiftGuide({ guide }: { guide: StockingGuide }) {
  const { copy, manifest } = guide;
  const cards = cardsFor(manifest);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Stocking Stuffers", href: "/stocking-stuffers" },
    { label: copy.h1 },
  ];

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.h1,
    description: copy.seo_description,
    inLanguage: "en-US",
    numberOfItems: cards.length,
    image: `${SITE_URL}${guide.heroJpg}`,
    itemListElement: cards.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: item.url,
    })),
  };

  return (
    <main>
      <Breadcrumbs items={breadcrumbItems} />
      <div className="bg-cream py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <header>
            <p className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-taupe sm:text-sm">
              Gift Guide
            </p>
            <h1 className="mt-5 font-serif text-3xl font-bold leading-tight text-warm-dark sm:text-4xl lg:text-5xl">
              {copy.h1}
            </h1>
            <picture>
              <source srcSet={guide.heroWebp} type="image/webp" />
              <img
                src={guide.heroJpg}
                alt={guide.heroAlt}
                width={2000}
                height={667}
                loading="eager"
                decoding="async"
                className="mt-8 aspect-[3/1] w-full rounded-2xl object-cover"
              />
            </picture>
            <p className="mt-7 text-lg leading-relaxed text-warm-gray">
              {copy.intro}
            </p>
          </header>

          {/* The page's single body disclosure, before the first shoppable link. */}
          <div className="mt-6 border-t border-beige/30 pt-5">
            <AmazonDisclosure variant="inline" checked={guide.verifiedDate} />
          </div>

          {/* The list card comes first: one name, one line, one link out. */}
          <section className="mt-10">
            <StorefrontListCard list={guide.list} level={2} toPage={false} />
          </section>

          <section className="mt-10">
            <div className="grid gap-6 md:grid-cols-2">
              {cards.map((item) => (
                <GiftCard
                  key={item.asin}
                  item={item}
                  note={copy.cards[item.asin]}
                  guide={guide}
                />
              ))}
            </div>
          </section>

          <p className="mt-12 border-t border-beige/30 pt-6 text-xs italic leading-relaxed text-taupe">
            {`Prices and ratings above were read on Amazon on ${guide.verifiedDateLabel} and can change.`}
          </p>

          <p className="mt-6 text-sm leading-relaxed text-warm-gray">
            The other stocking lists, and the Under $19 guide, are all on the{" "}
            <a
              href="/stocking-stuffers"
              className="font-medium text-burgundy underline-offset-4 hover:text-burgundy-deep hover:underline"
            >
              Stocking Stuffers hub
            </a>
            .
          </p>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
          />
        </div>
      </div>
      <EmailSignup />
    </main>
  );
}
