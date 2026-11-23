import { createFileRoute } from "@tanstack/react-router";

import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { EmailSignup } from "~/components/EmailSignup";
import { StorefrontListCard } from "~/components/StorefrontListCard";
import { trackAffiliateClick } from "~/lib/analytics";
import { SITE_NAME, SITE_URL } from "~/lib/schema";
import { generateStaticMetadata } from "~/lib/seo";
import { NEW_YEARS_EVE_LIST } from "~/lib/storefront-lists";
import listManifest from "~/data/new-years-eve/list-manifest.json";

/**
 * Blog post: "A Grown-Up Countdown at Home: Nine Black and Gold Pieces for
 * 2027"
 *
 * Companion post to the gift guide at /new-years-eve (owner decision 64,
 * 2026-11-23). Copy is the approved draft
 * (/home/team/shared/curation/new-years-eve-2026-11-23/copy/post-draft.md), body
 * used verbatim.
 *
 * Every product fact (title, stars, review count, price, URL) is read from
 * src/data/new-years-eve/list-manifest.json, the merchandiser's live read of
 * the list on 2026-11-23, so no number is retyped here. The per-piece editorial
 * lines below are the draft's own paragraphs, keyed by ASIN, in the draft's
 * order.
 *
 * The storefront list card is NEW_YEARS_EVE_LIST, opened to the list itself
 * (toPage={false}) so the post carries the crystalpalino-20 link out, and the
 * guide is linked inline.
 */

const BLOG_SLUG = "new-years-eve-at-home";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE =
  "A Grown-Up Countdown at Home: Nine Black and Gold Pieces for 2027";
const BLOG_DESCRIPTION =
  "Nine pieces, all read on their live listings on November 23, 2026, for the one night of the year when black and gold is the right answer.";
const DATE_PUBLISHED = "2026-11-23";
const DATE_PUBLISHED_LABEL = "November 23, 2026";
const AUTHOR_NAME = "Crystal Costa";

const HERO_JPG = "/images/new-years-eve-hero.jpg";
const HERO_WEBP = "/images/new-years-eve-hero.webp";
const HERO_ALT =
  "Black and gold New Year's Eve table with a champagne bucket of bottles on ice, gold foil fringe, black and gold balloons, white hydrangea and canapes";

/** Day every rating, review count and price below was read on Amazon. */
const VERIFIED_DATE = "2026-11-23";
const VERIFIED_DATE_LABEL = "November 23, 2026";

const GUIDE_PATH = "/new-years-eve";
const LIST_URL = NEW_YEARS_EVE_LIST.href;

const INTRO_PARAGRAPHS = [
  "There is a version of New Year's Eve at home that looks wonderful in a photograph and feels like a party shop in the room. Plastic hats, a bag of glitter, a balloon arch that takes forty minutes and looks like a balloon arch. I have done that version. What I want now is quieter: a warm room, one place where the year is written, and a table that looks like someone thought about it.",
  "So this is nine pieces, and the number is the point. The black and gold is a departure from everything else on this site, and it is allowed for this one night only, because one night a year a room can be darker and shinier than the rest of the house and still feel like a home.",
];

const WHY_NINE_PARAGRAPHS = [
  "The list I started from had eleven things on it. Nine survived.",
  "One piece reads the outgoing year on its own listing, in the product bullets rather than on the artwork, and a page about welcoming 2027 cannot carry that. It does not matter that the photograph is clean. If the listing says the old year, the piece is off.",
  "Everything below was read on its live Amazon listing on November 23, 2026: star rating, review count, price, buy box. Nothing is rounded, nothing is estimated, and the review counts on this page run from 276 to 45,499. Where the sample behind a rating is smaller, I say the smaller number.",
];

const THE_YEAR_PARAGRAPHS = [
  "A page about welcoming a year has one job above all the others: the year has to be right, and it has to be visible. So the year is on the balloons and on the backdrop, both confirmed 2027 on the artwork and in the listing, and it is nowhere else. Everything else on the page carries no date at all, which means the light, the tray, the stand, the flutes and the fringe all come back out next December.",
  "The banner is the one that proves the point. No digits, so it works for any year you want to use it.",
];

const SET_OUT_PARAGRAPHS = [
  "Hang the backdrop and the balloons the evening before, not the hour before. Foil digits are forgiving but they are not fast, and anything above head height done in a hurry is how a good night starts badly.",
  "The afternoon is for the table. Run the fairy lights along the back edge and leave them on while you set everything else, so you are judging the room by the light it will actually be seen in. Build the tiered stand as the centerpiece, put the gold tray beside it for the flutes and candles, and hold the confetti until the last five minutes.",
  "Then leave it alone until half past eleven. The one thing worth doing late is bringing the flutes out and turning the overhead light off, so the room drops to the fairy lights. That single switch is the whole difference between a room that is decorated and a room that is waiting for midnight.",
];

/**
 * The draft's own paragraph on each piece, in the order the post walks them.
 * The title, stars, count and price on the card come from the manifest.
 */
const FIND_NOTES: Record<string, string> = {
  B0GK17R7Y1:
    "The year, in four gold foil digits, big enough to carry a wall. This is the piece I would hang first and highest, because it is the one thing in the room that says which year is arriving. Read twice, on the artwork and in the listing, and both say 2027.",
  B01BXZ1O0K:
    "A printed backdrop with the year, a clock face and fireworks on black, and the second place the year is stated. Hang it where people will stand, because the photograph is the thing everyone takes at midnight and this is the piece that makes it look like an occasion. Six dollars and change, and the highest rated thing on the page.",
  B01NA6IZ5Q:
    "The piece with no digits on it at all, which is exactly why it is here. It says the words and nothing else, so it does not date and it can come back out next December. It is small in the hand and it will not carry a room, so hang it low, over the table or across a doorway, where people are close to it.",
  B00JR5N0JM:
    "The cheapest thing on the page and the one that does the most work. Thirty three feet on a plug, warm white rather than cool, which is the whole difference between a room that glows and a room that looks like an office. The listing sells it as Christmas string lights. Ignore the framing and look at the color.",
  B0FQ5F85W7:
    "Two hundred paper dots in three metals, and the five second finish for a table. This is the last thing to go out, five minutes before people arrive, because paper dots do not survive a practice run.",
  B0CVSC4M9T:
    "A hundred flutes with a gold rim, so the midnight toast does not depend on finding the glassware. They are plastic, and I will say so: right for a crowd, less grown up than glass. If your table is eight people and you own glass, use your glass and keep these for the toast when everyone is standing.",
  B09WQVY1HG:
    "White porcelain on a brass frame, three tiers, and the only piece here that holds food. This is what makes the table look arranged rather than decorated, and it is the one thing on the page I would still be using in ten years. It is also the highest price here, and it is the piece worth the money.",
  B09FHPF82P:
    "A plain brushed gold tray that gathers the candles, the flutes and the confetti into one place, which is the difference between a table with things on it and a table that looks composed. One thing to know: the listing showed only 3 left in stock when it was verified, so if you want it, order it early.",
  B07R9NJWLM:
    "The largest sample on the page and the least editorial piece on it, and I am keeping it anyway. Gold foil fringe behind the table, or behind the photograph, turns a corner of a room into a set for about six dollars. It reads closer to a party shop than anything else here, and it earns its place on the picture.",
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

/** The nine finds, in the merchandiser's order, gated as the page gates them. */
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

export const Route = createFileRoute("/blog/new-years-eve-at-home")({
  head: () => {
    const seo = generateStaticMetadata(BLOG_TITLE, BLOG_DESCRIPTION, BLOG_PATH, {
      image: HERO_JPG,
      imageWidth: 2000,
      imageHeight: 667,
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
                width={2000}
                height={667}
                loading="eager"
                decoding="async"
                className="mt-8 aspect-[3/1] w-full rounded-2xl object-cover"
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
              list={NEW_YEARS_EVE_LIST}
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
              New Year&apos;s Eve at Home, Black and Gold Party Finds for a
              Grown-Up Countdown
            </a>
            . If you want the version with the notes on each piece, that is the
            page:{" "}
            <a
              href={GUIDE_PATH}
              className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
            >
              the New Year&apos;s Eve edit
            </a>
            .
          </p>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              Why nine, and what came off
            </h2>
            {WHY_NINE_PARAGRAPHS.map((paragraph) => (
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
              The nine, in the order I would set them out
            </h2>
            <div className="mt-6 space-y-8">
              {FINDS.map((find) => (
                <FindCard key={find.asin} find={find} />
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              The year, and why it is written in two places
            </h2>
            {THE_YEAR_PARAGRAPHS.map((paragraph) => (
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
              What to set out, and when
            </h2>
            {SET_OUT_PARAGRAPHS.map((paragraph) => (
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
                the New Year&apos;s Eve edit
              </a>
              . The storefront version is here:{" "}
              <a
                href={LIST_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
              >
                New Year&apos;s Eve at Home, Black and Gold Party Finds for a
                Grown-Up Countdown
              </a>
              . Both carry the same nine pieces, read on the same day.
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
