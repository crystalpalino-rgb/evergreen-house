import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { DeepSections } from "~/components/DeepSections";
import { EmailSignup } from "~/components/EmailSignup";
import { PrintableDownload } from "~/components/PrintableDownload";
import { StorefrontListCard } from "~/components/StorefrontListCard";
import { trackAffiliateClick } from "~/lib/analytics";
import { SITE_URL } from "~/lib/schema";
import type {
  StorefrontList,
  StorefrontListImage,
} from "~/lib/storefront-lists";

/**
 * The storefront-list page template, one page per storefront list: the three
 * stocking lists (owner decision 48) and the four January lists (decisions 48
 * and 49). One component for all seven, so the pages cannot drift.
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
 *
 * The eyebrow, the breadcrumb parent and the links block under the cards are
 * the only per-page differences; their defaults keep the stocking pages exactly
 * as they shipped.
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
  /** The listing's own main photo, read from the live Amazon page. */
  image_url?: string | null;
  /** Alt text for that photo: the product, then the list it belongs to. */
  image_alt?: string;
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

/** The page's own crumb, between Home and this page. */
export type GuideCrumb = { label: string; href: string };

/** Where a guide sends readers next, when it is not the stocking hub. */
export type GuideRelated = {
  heading: string;
  body: string;
  links: { label: string; href: string; line: string }[];
};

export type StockingGuide = {
  /** The page's own path, for the canonical and the schema. */
  pagePath: string;
  /** Small caps line above the h1. Defaults to "Gift Guide". */
  eyebrow?: string;
  /** The crumb above this page. Defaults to the Stocking Stuffers hub. */
  breadcrumbParent?: GuideCrumb;
  /**
   * The links block under the cards. Defaults to the line pointing at the
   * Stocking Stuffers hub; a page outside the stocking set passes its own.
   */
  related?: GuideRelated;
  /** Hero art, one filename per page so distinct art can drop in later. */
  heroJpg: string;
  heroWebp: string;
  heroAlt: string;
  /**
   * The hero art's own shape. Defaults to the 3:1 banner every page before the
   * Closet and Pantry pages ships; a page whose art is a different ratio passes
   * its own and the frame holds that ratio instead of cropping to 3:1.
   */
  heroWidth?: number;
  heroHeight?: number;
  /** The date the manifest was read, in ISO and in words. */
  verifiedDate: string;
  verifiedDateLabel: string;
  /** GA4 context and event id prefix for the affiliate clicks on this page. */
  analyticsContext: string;
  analyticsPrefix: string;
  list: StorefrontList;
  /**
   * The list's own art for the list card at the top of the page, when the page
   * has one (owner, 2026-11-22). Left off, the card stays text-only exactly as
   * it shipped.
   */
  listImage?: StorefrontListImage;
  manifest: StockingManifest;
  copy: StockingCardCopy;
  /**
   * The free Christmas Gift List printable (owner, 2026-11-23): below the card
   * grid, in the editorial area. Only the pages that carry it pass this, so
   * every other page renders exactly as it shipped.
   */
  printable?: boolean;
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
      className="mx-auto flex w-full flex-col overflow-hidden rounded-2xl border border-beige/20 bg-white shadow-sm ring-1 ring-beige/10 lg:max-w-[320px]"
    >
      {/* The product photo, same treatment as the edit cards
          (src/components/EditProductCard.tsx): square frame on soft white, the
          listing image contained inside it, sized for the layout and lazily
          loaded. The photo is not a second outbound link: "Shop on Amazon"
          stays the card's only affiliate anchor. */}
      {item.image_url && (
        <div className="aspect-square w-full shrink-0 bg-soft-white">
          <img
            src={item.image_url}
            alt={item.image_alt ?? item.title}
            width={1000}
            height={1000}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-3"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
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
    </div>
  );
}

export function StockingGiftGuide({ guide }: { guide: StockingGuide }) {
  const { copy, manifest } = guide;
  const cards = cardsFor(manifest);

  /** The hero frame: the 3:1 banner unless the page's own art is another shape. */
  const customHero =
    guide.heroWidth !== undefined || guide.heroHeight !== undefined;
  const heroWidth = guide.heroWidth ?? 2000;
  const heroHeight = guide.heroHeight ?? 667;

  const parent: GuideCrumb = guide.breadcrumbParent ?? {
    label: "Stocking Stuffers",
    href: "/stocking-stuffers",
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: parent.label, href: parent.href },
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
              {guide.eyebrow ?? "Gift Guide"}
            </p>
            <h1 className="mt-5 font-serif text-3xl font-bold leading-tight text-warm-dark sm:text-4xl lg:text-5xl">
              {copy.h1}
            </h1>
            <picture>
              <source srcSet={guide.heroWebp} type="image/webp" />
              <img
                src={guide.heroJpg}
                alt={guide.heroAlt}
                width={heroWidth}
                height={heroHeight}
                loading="eager"
                decoding="async"
                className={
                  customHero
                    ? "mt-8 w-full rounded-2xl object-cover"
                    : "mt-8 aspect-[3/1] w-full rounded-2xl object-cover"
                }
                style={
                  customHero
                    ? { aspectRatio: `${heroWidth} / ${heroHeight}` }
                    : undefined
                }
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
            <StorefrontListCard
              list={guide.list}
              level={2}
              toPage={false}
              image={guide.listImage}
            />
          </section>

          <section className="mt-10">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          {guide.printable ? (
            <PrintableDownload className="mt-12" />
          ) : null}

          {/* Long-form editorial sections, keyed by page path in
              src/data/deep-sections.json: below the card grid, in the order
              they were written. A page with no entry renders nothing, so the
              three stocking pages and the January pages are untouched. The
              page's one disclosure stays in the header and this block carries
              no links. */}
          <DeepSections
            page={guide.pagePath}
            className="border-t border-beige/30 pt-8"
          />

          <p className="mt-12 border-t border-beige/30 pt-6 text-xs italic leading-relaxed text-taupe">
            {`Prices and ratings above were read on Amazon on ${guide.verifiedDateLabel} and can change.`}
          </p>

          {guide.related ? (
            <section className="mt-12 border-t border-beige/30 pt-8">
              <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
                {guide.related.heading}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-warm-gray sm:text-base">
                {guide.related.body}
              </p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {guide.related.links.map((link) => (
                  <li
                    key={link.href}
                    className="rounded-2xl border border-beige/20 bg-white p-5 shadow-sm ring-1 ring-beige/10"
                  >
                    <a
                      href={link.href}
                      className="font-serif text-lg font-semibold text-warm-dark underline-offset-4 hover:text-burgundy hover:underline"
                    >
                      {link.label}
                    </a>
                    <p className="mt-1 text-sm leading-relaxed text-warm-gray">
                      {link.line}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
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
          )}

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
