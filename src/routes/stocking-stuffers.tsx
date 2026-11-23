import { createFileRoute } from "@tanstack/react-router";

import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { DeepSections } from "~/components/DeepSections";
import { EmailSignup } from "~/components/EmailSignup";
import { StorefrontListCard } from "~/components/StorefrontListCard";
import { trackAffiliateClick } from "~/lib/analytics";
import { SITE_URL } from "~/lib/schema";
import { generateStaticMetadata } from "~/lib/seo";
import {
  MEN_STOCKING_LIST,
  TEEN_BOYS_STOCKING_LIST,
  TEEN_GIRLS_STOCKING_LIST,
  UNDER19_LIST,
  getListImage,
} from "~/lib/storefront-lists";
import listManifest from "~/data/stocking-stuffers/list-manifest.json";
import cardCopy from "~/data/stocking-stuffers/card-copy.json";

/**
 * Gift guide: "Secret Santa and Stocking Stuffers Under $19"
 *
 * Owner decision 34 (2026-11-14): the Under $19 storefront list gets its own
 * dedicated page, gift-guide style, in The Reset List post pattern.
 *
 * Every product fact on this page is read from src/data/stocking-stuffers/
 * list-manifest.json, which is the merchandiser's live read of the twelve
 * Amazon listings on 2026-11-14. Nothing here is typed by hand and nothing is
 * rounded: a listing with no star rating on it says so in words. The editorial
 * line on each card, the intro and the head copy come from
 * src/data/stocking-stuffers/card-copy.json, keyed by ASIN.
 *
 * The list card is not a product card: the list name, one line, one link out to
 * the owner's own storefront list, byte for byte.
 */

const PAGE_PATH = "/stocking-stuffers";
const HERO_JPG = "/images/stocking-stuffers-hero.jpg";
const HERO_WEBP = "/images/stocking-stuffers-hero.webp";
const HERO_ALT =
  "Kraft wrapped gifts tied with red velvet ribbon and twine beside a cream cable knit stocking on a marble counter, with a lit Christmas tree and a candle behind them";

const VERIFIED_DATE = "2026-11-14";
const VERIFIED_DATE_LABEL = "November 14, 2026";

/** House gates: 4.3 stars or better, a live buy box, no padding. */
const MIN_STARS = 4.3;

type ManifestItem = {
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

const manifest = listManifest as unknown as {
  list_name: string;
  verified: string;
  items: ManifestItem[];
};

const copy = cardCopy as unknown as {
  h1: string;
  intro: string;
  seo_title: string;
  seo_description: string;
  list_card_line: string;
  cards: Record<string, string>;
};

/**
 * The cards, in the merchandiser's order. A product with no live buy box or a
 * rating under the house gate does not appear; a product with no rating at all
 * still appears, because the listing is honest about it and the card says so.
 */
const CARDS = manifest.items.filter(
  (item) =>
    item.appears_on_page &&
    item.buy_box &&
    (item.star_rating === null || item.star_rating >= MIN_STARS),
);

/** The list card on this page still links out to Amazon. */
const LIST_CARD = { ...UNDER19_LIST, line: copy.list_card_line };

/** The three lists that have their own pages (owner decision 48, 2026-11-22). */
const MORE_LISTS = [
  MEN_STOCKING_LIST,
  TEEN_BOYS_STOCKING_LIST,
  TEEN_GIRLS_STOCKING_LIST,
];

const breadcrumbItems = [{ label: "Home", href: "/" }, { label: copy.h1 }];

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: copy.h1,
  description: copy.seo_description,
  inLanguage: "en-US",
  numberOfItems: CARDS.length,
  image: `${SITE_URL}${HERO_JPG}`,
  itemListElement: CARDS.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.title,
    url: item.url,
  })),
};

export const Route = createFileRoute("/stocking-stuffers")({
  head: () => {
    const seo = generateStaticMetadata(
      copy.seo_title,
      copy.seo_description,
      PAGE_PATH,
      {
        image: HERO_JPG,
        imageWidth: 2000,
        imageHeight: 667,
      },
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: StockingStuffersPage,
});

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

function GiftCard({ item }: { item: ManifestItem }) {
  const note = copy.cards[item.asin];

  return (
    <div
      id={`gift-${item.asin}`}
      className="mx-auto flex w-full flex-col overflow-hidden rounded-2xl border border-beige/20 bg-white shadow-sm ring-1 ring-beige/10 lg:max-w-[320px]"
    >
      {/* The product photo, same treatment as the edit cards: square frame on
          soft white, the listing image contained inside it, sized for the
          layout and lazily loaded. Not a second outbound link. */}
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
          {`Verified ${VERIFIED_DATE_LABEL}`}
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
              context: "guide:stocking-stuffers",
              destinationUrl: item.url,
              eventId: `amz-click-stocking-stuffers-${item.asin}`,
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

function StockingStuffersPage() {
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
              <source srcSet={HERO_WEBP} type="image/webp" />
              <img
                src={HERO_JPG}
                alt={HERO_ALT}
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
            <AmazonDisclosure variant="inline" checked={VERIFIED_DATE} />
          </div>

          <section className="mt-10">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {CARDS.map((item) => (
                <GiftCard key={item.asin} item={item} />
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              The whole list in one place
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-warm-gray">
              If you would rather see the list the way it sits on Amazon, all
              twelve pieces in one scroll, it is saved to my storefront. Nothing
              on it is over $19.
            </p>
            <div className="mt-8">
              <StorefrontListCard list={LIST_CARD} toPage={false} />
            </div>
          </section>

          {/* The three list pages added 2026-11-22 (owner decision 48). */}
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              More stocking lists
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-warm-gray">
              Three more lists, each on its own page: the man who needs nothing,
              a teen boy, a teen girl. Every piece on them is under twenty five
              dollars.
            </p>
            <div className="mt-8 grid gap-6">
              {MORE_LISTS.map((list) => (
                <StorefrontListCard
                  key={list.key}
                  list={list}
                  image={getListImage(list.key)}
                />
              ))}
            </div>
          </section>

          {/* Long-form editorial sections, keyed by page path in
              src/data/deep-sections.json: below the card grid, in the order
              they were written, in the Reset List post rhythm. The page's one
              disclosure stays in the header and this block carries no links. */}
          <DeepSections
            page={PAGE_PATH}
            className="border-t border-beige/30 pt-8"
          />

          <p className="mt-12 border-t border-beige/30 pt-6 text-xs italic leading-relaxed text-taupe">
            {`Prices and ratings above were read on Amazon on ${VERIFIED_DATE_LABEL} and can change.`}
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
