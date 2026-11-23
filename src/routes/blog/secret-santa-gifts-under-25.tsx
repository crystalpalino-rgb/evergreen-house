import { createFileRoute } from "@tanstack/react-router";

import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { EmailSignup } from "~/components/EmailSignup";
import { StorefrontListCard } from "~/components/StorefrontListCard";
import { trackAffiliateClick } from "~/lib/analytics";
import { SITE_NAME, SITE_URL } from "~/lib/schema";
import { generateStaticMetadata } from "~/lib/seo";
import { SECRET_SANTA_LIST } from "~/lib/storefront-lists";
import listManifest from "~/data/secret-santa/list-manifest.json";

/**
 * Blog post: "Secret Santa Gifts They Will Actually Want: Eight Finds Under $25"
 *
 * Companion post to the gift guide at /secret-santa (owner decision 61,
 * 2026-11-22). Copy is the approved draft
 * (/home/team/shared/curation/secret-santa-2026-11-22/copy/post-draft.md), body
 * used verbatim.
 *
 * Every product fact (title, stars, review count, price, URL) is read from
 * src/data/secret-santa/list-manifest.json, the merchandiser's live read of the
 * list on 2026-11-22, so no number is retyped here. The per-piece editorial
 * lines below are the draft's own paragraphs, keyed by ASIN, in the draft's
 * order.
 *
 * The storefront list card is SECRET_SANTA_LIST, opened to the list itself
 * (toPage={false}) so the post carries the crystalpalino-20 link out, and the
 * guide is linked inline.
 */

const BLOG_SLUG = "secret-santa-gifts-under-25";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE =
  "Secret Santa Gifts They Will Actually Want: Eight Finds Under $25";
const BLOG_DESCRIPTION =
  "Eight gifts, all under twenty five dollars, all read on their live listings on November 22, 2026. This is the list I keep for the exchange I signed up for in November and have to solve in December.";
const DATE_PUBLISHED = "2026-11-22";
const DATE_PUBLISHED_LABEL = "November 22, 2026";
const AUTHOR_NAME = "Crystal Costa";

const HERO_JPG = "/images/blog-secret-santa-hero.jpg";
const HERO_WEBP = "/images/blog-secret-santa-hero.webp";
const HERO_ALT =
  "Kraft wrapped gifts tied with red velvet ribbon and twine beside a cream cable knit stocking on a marble counter, with a lit Christmas tree and a candle behind them";

/** Day every rating, review count and price below was read on Amazon. */
const VERIFIED_DATE = "2026-11-22";
const VERIFIED_DATE_LABEL = "November 22, 2026";

const GUIDE_PATH = "/secret-santa";
const LIST_URL = SECRET_SANTA_LIST.href;

const INTRO_PARAGRAPHS = [
  "There is a particular kind of December evening that goes like this. The exchange is in nine days, the cap is twenty five dollars, and I am scrolling a search results page at eleven at night reading reviews for things I would not want myself.",
  "I have done that enough times to know what it produces. A novelty mug nobody keeps. A scented thing in a scent the recipient does not wear. Something that costs exactly the cap and feels like exactly the cap.",
  "So I keep a list instead. It is eight pieces, and it is short on purpose. Every one of them is something a person uses after the wrapping paper is gone, and every one of them sits under twenty five dollars today.",
];

const WHY_EIGHT_PARAGRAPHS = [
  "Most gift lists are long because length is easy. Eight is what survived two questions, and I would rather show you eight honest answers than twenty with twelve of them filler.",
  "The first question is whether the person would use it. The second is whether they would be glad it was this one rather than the cheaper version of the same idea.",
  "Then the checks, the same ones every page on this site runs on. Each piece was read on its live Amazon listing on November 22, 2026, and all eight came back at 4.3 stars or better with a live buy box and a price under the ceiling. Nothing was rounded up to look better. Where the sample behind a rating is small, the card says the smaller number.",
  "I will also say plainly what this list is not. Two of these pieces are not remotely heritage, and one is not even home. A bright red appliance and a black plastic power bank would never appear on a room edit here. A gift list is a different job. The question is not whether it suits a neutral palette, it is whether the person opening it wanted it.",
];

const CAP_CLOCK_PARAGRAPHS = [
  "The cap is the number on your invitation, not the number in the list name. All eight prices sit under twenty five dollars today, and the spread runs from $7.94 to $20.80, so there is room left for wrapping and a card.",
  "The clock matters more than the cap in December. Seven of the eight were in stock when they were verified, and the candle was listed at 1 to 2 days. That is comfortable on the first of December and tight on the twentieth. Order in the first week if you can, and read the delivery estimate on the day you buy rather than the day you browsed.",
  "The one price to watch is the power bank at $19.84. It is a deal price and it can move. Everything else here has been steady, but nothing on Amazon is fixed, which is why every card on the page carries the date it was read: November 22, 2026.",
];

const HOW_TO_USE_PARAGRAPHS = [
  "If you are buying for one person, pick the piece that matches what they already do. The waffle iron for the person who cooks, the power bank for the person who is never home, the throw for the person who is always cold, the hot chocolate for the household with children, the tea for the desk, the candle for the person who hosts, the lip serum for the friend, the Burt's Bees for the person you owe a small thank you.",
  "If you are buying for four exchanges at once, buy the Burt's Bees in threes and one waffle iron, and you have covered the office, the teacher and the neighbor for under thirty dollars.",
];

/**
 * The draft's own paragraph on each piece, in the order the post walks them.
 * The title, stars, count and price on the card come from the manifest.
 */
const FIND_NOTES: Record<string, string> = {
  B010TCP3SC:
    "This is the piece I would hand to a colleague and feel confident about, because nobody has too many ways to make breakfast and everybody has a Sunday. It is four inches across, so it lives in a cupboard without a fight, and it is red, which means the person will remember who gave it to them. At $10.99 it also leaves most of the cap unspent.",
  B0D5CLSMFB:
    "The least romantic thing on the list and probably the most used. Ten thousand milliamp hours is two charges on a normal phone, which covers a commute, a flight or a long day out. At $19.84 it is the second highest price here, and it is a deal price, so it is the one piece to check before you order. If it has moved, buy it first and pick something else for the second gift.",
  B0158EQJSY:
    "The largest sample on the page and one of the three at 4.7, and the safest gift for a household you do not know well. Fifty by sixty inches is a sofa throw rather than a bed blanket, the grey goes with every sofa I have ever seen, and the thing people do with it is leave it on the back of the couch and reach for it in January.",
  B07QWBH37R:
    "Six small cups that melt into warm milk, which makes it a gift for a family rather than one person, and a gift that gets used up. If you are buying for a household with children, this is the one I would choose. It also splits, so one box covers two small gifts if the exchange rules allow it.",
  B0062JSYEW:
    "Forty eight bags across the blends, which is roughly a month of ordinary mornings, and a gift that suits the person who is particular about tea and the person who is not. This is the one I would send to a desk rather than a kitchen. It travels well, it needs no instructions, and it disappears instead of accumulating.",
  B0F3DRQ2P9:
    "Balsam and cedar is the smell of a tree lot, which is the smell most people want in December and do not buy for themselves. This is the 14.5 ounce three wick, not the larger jar on our Heritage Christmas edit, and it was listed as available to ship in 1 to 2 days rather than same day when it was verified. Order it early rather than late. It is also the one gift here that assumes the recipient burns candles, so only send it to someone you are sure about.",
  B0GYZZ5268:
    "The one piece that is not home, and the one I would buy for a friend who would buy it for herself and keeps not doing it. A tinted serum rather than a lipstick, so it works without a mirror, which is the difference between a gift she uses and a gift that sits in a bag. At $20.80 it is the highest price here and still under the cap.",
  B0DSQNRZLL:
    "Six travel size pieces for hands and feet, and the lowest price on the list. This is the one I buy in threes: the teacher, the neighbor who takes in the packages, the person who did something kind in a week I was not paying attention. It is the smallest box here, which matters if the gift has to fit in a stocking as well.",
};

type ManifestItem = {
  asin: string;
  title: string;
  star_rating: number | null;
  review_count: number | null;
  price: string;
  price_usd: number;
  buy_box: boolean;
  appears_on_page: boolean;
  url: string;
};

/** The eight finds, in the merchandiser's order, gated as the page gates them. */
const FINDS = (listManifest as unknown as { items: ManifestItem[] }).items.filter(
  (item) =>
    item.appears_on_page &&
    item.buy_box &&
    (item.star_rating === null || item.star_rating >= 4.3)
);

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: BLOG_TITLE },
];

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  name: BLOG_TITLE,
  headline: BLOG_TITLE,
  description: BLOG_DESCRIPTION,
  datePublished: DATE_PUBLISHED,
  dateModified: DATE_PUBLISHED,
  inLanguage: "en-US",
  image: `${SITE_URL}${HERO_JPG}`,
  author: {
    "@type": "Person",
    name: AUTHOR_NAME,
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${SITE_URL}${BLOG_PATH}`,
  },
};

export const Route = createFileRoute("/blog/secret-santa-gifts-under-25")({
  head: () => {
    const seo = generateStaticMetadata(BLOG_TITLE, BLOG_DESCRIPTION, BLOG_PATH, {
      image: HERO_JPG,
      imageWidth: 1600,
      imageHeight: 900,
      ogType: "article",
      publishedTime: DATE_PUBLISHED,
      author: AUTHOR_NAME,
    });
    return { meta: seo.meta, links: seo.links };
  },
  component: BlogPost,
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

function FindCard({ find }: { find: ManifestItem }) {
  return (
    <div
      id={`find-${find.asin}`}
      className="rounded-2xl border border-beige/20 bg-white p-5 shadow-sm ring-1 ring-beige/10 sm:p-6"
    >
      <h3 className="font-serif text-lg font-semibold leading-snug text-warm-dark">
        {find.title}
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {find.star_rating !== null && (
          <>
            <RatingStars rating={find.star_rating} />
            <span className="text-sm text-warm-gray">
              {find.review_count === null
                ? "Review count not shown on the listing"
                : `${find.review_count.toLocaleString("en-US")} ratings`}
            </span>
          </>
        )}
        <span className="text-sm font-semibold text-terracotta">
          {find.price}
        </span>
      </div>
      <p className="mt-1 text-xs text-taupe">
        {`Verified ${VERIFIED_DATE_LABEL}`}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-warm-gray sm:text-base">
        {FIND_NOTES[find.asin]}
      </p>
      <a
        href={find.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-sage-dark"
        onClick={() =>
          trackAffiliateClick({
            productId: find.asin,
            name: find.title,
            price: find.price_usd,
            context: `blog:${BLOG_SLUG}`,
            destinationUrl: find.url,
            eventId: `amz-click-${BLOG_SLUG}-${find.asin}`,
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

function BlogPost() {
  return (
    <main>
      <Breadcrumbs items={breadcrumbItems} />
      <article className="bg-cream py-8 sm:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header>
            <p className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-taupe sm:text-sm">
              The Journal
            </p>
            <h1 className="mt-5 font-serif text-3xl font-bold leading-tight text-warm-dark sm:text-4xl lg:text-5xl">
              {BLOG_TITLE}
            </h1>
            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-taupe">
              <time dateTime={DATE_PUBLISHED}>{DATE_PUBLISHED_LABEL}</time>
              <span className="mx-2 text-beige" aria-hidden="true">
                /
              </span>
              <span>By {AUTHOR_NAME}</span>
            </p>
            <picture>
              <source srcSet={HERO_WEBP} type="image/webp" />
              <img
                src={HERO_JPG}
                alt={HERO_ALT}
                width={1600}
                height={900}
                loading="eager"
                decoding="async"
                className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
              />
            </picture>
            <p className="mt-7 text-lg leading-relaxed text-warm-gray">
              {BLOG_DESCRIPTION}
            </p>
            {INTRO_PARAGRAPHS.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mt-5 text-lg leading-relaxed text-warm-gray"
              >
                {paragraph}
              </p>
            ))}
          </header>

          {/* The post's single Amazon disclosure, before the first shoppable
              link. The cards and the list card carry no second one. */}
          <div className="mt-6 border-t border-beige/30 pt-5">
            <AmazonDisclosure variant="inline" checked={VERIFIED_DATE} />
          </div>

          <div className="mt-8">
            <StorefrontListCard
              list={SECRET_SANTA_LIST}
              level={2}
              toPage={false}
            />
          </div>

          <p className="mt-8 text-lg leading-relaxed text-warm-gray">
            If you want the whole thing in one place, it lives on my storefront:{" "}
            <a
              href={LIST_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
            >
              Secret Santa Gifts They Will Actually Want, All Under $25
            </a>
            . If you want the version with the notes on each piece, that is the
            page:{" "}
            <a
              href={GUIDE_PATH}
              className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
            >
              the Secret Santa edit
            </a>
            .
          </p>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              Why eight, and not twenty
            </h2>
            {WHY_EIGHT_PARAGRAPHS.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mt-5 text-lg leading-relaxed text-warm-gray"
              >
                {paragraph}
              </p>
            ))}
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              The eight, in the order I would buy them
            </h2>
            <div className="mt-6 space-y-8">
              {FINDS.map((find) => (
                <FindCard key={find.asin} find={find} />
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              The cap, the clock and the one price to watch
            </h2>
            {CAP_CLOCK_PARAGRAPHS.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mt-5 text-lg leading-relaxed text-warm-gray"
              >
                {paragraph}
              </p>
            ))}
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              How to use this list
            </h2>
            {HOW_TO_USE_PARAGRAPHS.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mt-5 text-lg leading-relaxed text-warm-gray"
              >
                {paragraph}
              </p>
            ))}
            <p className="mt-5 text-lg leading-relaxed text-warm-gray">
              The full list with every rating, count and price is here:{" "}
              <a
                href={GUIDE_PATH}
                className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
              >
                the Secret Santa edit
              </a>
              . The storefront version is here:{" "}
              <a
                href={LIST_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
              >
                Secret Santa Gifts They Will Actually Want, All Under $25
              </a>
              . Both carry the same eight pieces, read on the same day.
            </p>
          </section>

          <p className="mt-12 border-t border-beige/30 pt-6 text-xs italic leading-relaxed text-taupe">
            {`Prices and ratings above were read on Amazon on ${VERIFIED_DATE_LABEL} and can change.`}
          </p>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
          />
        </div>
      </article>
      <EmailSignup />
    </main>
  );
}
