import { createFileRoute } from "@tanstack/react-router";

import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { EmailSignup } from "~/components/EmailSignup";
import { StorefrontListCard } from "~/components/StorefrontListCard";
import { trackAffiliateClick } from "~/lib/analytics";
import { SITE_NAME, SITE_URL } from "~/lib/schema";
import { generateStaticMetadata } from "~/lib/seo";
import { PANTRY_ORGANIZATION_LIST } from "~/lib/storefront-lists";
import listManifest from "~/data/pantry-organization/list-manifest.json";

/**
 * Blog post: "Pantry Organization Ideas: Seven Finds That Make a Shelf Legible"
 *
 * Companion post to the January list page at /pantry-organization, from the approved
 * draft in /home/team/shared/curation/closet-pantry-2026-11-23/copy/pantry-post-draft.md. The
 * body is the draft, verbatim, in the draft's order.
 *
 * Every product fact (title, stars, review count, price, URL) is read from
 * src/data/pantry-organization/list-manifest.json, the merchandiser's live read of the list
 * on 2026-11-23, so no number is retyped here. The per-piece notes below are the
 * draft's own paragraphs, keyed by ASIN, in the draft's order.
 *
 * The storefront list card opens the list itself (toPage={false}) so the post
 * carries the crystalpalino-20 link out, and the guide is linked inline.
 */

const BLOG_SLUG = "pantry-organization-ideas";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE =
  "Pantry Organization Ideas: Seven Finds That Make a Shelf Legible";
const BLOG_DESCRIPTION =
  "Seven pieces from my own pantry list, read on their live listings on November 23, 2026. It is a short list on purpose. Once you can see everything you own, the eighth organizer is just another thing to move.";
const DATE_PUBLISHED = "2026-11-23";
const DATE_PUBLISHED_LABEL = "November 23, 2026";
const AUTHOR_NAME = "Crystal Costa";

const HERO_JPG = "/images/january-pantry-organization-hero.jpg";
const HERO_WEBP = "/images/january-pantry-organization-hero.webp";
const HERO_ALT =
  "Plain glass jars of rice, oats, beans and pasta on pale oak pantry shelves, with a lazy susan of tins, a stack of clear containers and a woven basket of root vegetables below, in warm daylight.";

/** Day every rating, review count and price below was read on Amazon. */
const VERIFIED_DATE = "2026-11-23";
const VERIFIED_DATE_LABEL = "November 23, 2026";

const GUIDE_PATH = "/pantry-organization";
const GUIDE_LABEL = "the pantry edit";
const LIST_URL = PANTRY_ORGANIZATION_LIST.href;

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

const MANIFEST_ITEMS = (listManifest as unknown as { items: ManifestItem[] })
  .items;

/** The pieces, in the page's order, gated as the page gates them. */
const FINDS = MANIFEST_ITEMS.filter(
  (item) =>
    item.appears_on_page &&
    item.buy_box &&
    (item.star_rating === null || item.star_rating >= 4.3),
);

const OPEN_PROSE = [
  "The pantry is the room where I learned that more storage is not the answer. I spent one January buying containers, and by March I had a shelf of matching jars and no idea what was in the four behind them. The pantry was tidier and no easier to use. What I actually wanted was not a bigger system. It was to be able to stand in front of the open door, see what I had, and reach it.",
  "So this list is seven pieces, all from my own Amazon pantry list, and it is seven because seven is what earned a place. Every one of them does one of three things: it makes something visible, it brings something within reach, or it closes a bag that was open. None of them holds more of the same clutter. That is the whole edit.",
];

const WHY_PARAGRAPHS = [
  "A pantry page can always be longer. Longer is usually worse. The moment a shelf is legible, adding an eighth organizer stops being a solution and becomes something else to shift when you want the rice. I would rather hand you seven pieces that each fix a specific blind spot than ten that mostly rearrange it.",
  "Four of the seven are utility first, and I am not going to pretend otherwise. The can rack is chrome wire, the turntables and the containers are clear plastic, the jar rack is black steel. Only the bamboo risers and the white metal door rack and the white and grey spice shelf sit quietly in a warm room. I am not going to tell you a can dispenser is a beautiful object either. What I will tell you is that a pantry where every jar is visible at a glance reads calm in a way a styled shelf never does, because the styled shelf only looks that way until someone cooks. This is the version that still looks right on a Wednesday.",
];

const CHECKS_PARAGRAPHS = [
  "Every piece was read on its live Amazon listing on November 23, 2026: star rating, review count, price and buy box. All seven came back at 4.3 stars or better with a live buy box. The review counts run from 4,717 to 61,072 and the prices run from $8.99 to $33.59. Nothing is rounded, and every card on the page carries the number that was on the listing that day with the date beside it.",
  "The thinnest sample here is the door organizer at 4,717 ratings. The largest is the three tier spice rack at 61,072. Both pass the same bar, but they are not the same kind of certainty, and I would rather the card said so than smoothed it over.",
];

/**
 * The draft's own paragraph on each piece, in the order the post walks them.
 * The title, stars, count and price on the card come from the manifest.
 */
const FIND_NOTES: Record<string, string> = {
  B0CG987TT5:
    "Six white metal tiers on the inside of a cabinet door, which is square footage you already own and are not using. This is where the overflow goes: the extra oils, the baking things, the row of jars that never fit on a shelf. It is the piece that makes a small pantry feel larger without moving a wall, and it is also the one to measure for, because it is fifty inches tall and eighteen wide and it needs a door that closes over it.",
  B01IIXR2II:
    "Three tiers, thirty six cans, adjustable dividers, and cans that roll forward as you take one out. This is the piece that ends the archaeology at the back of the shelf, where cans go to expire. Chrome wire is the honest material for it and it belongs behind a closed door rather than on an open shelf.",
  B07RGGYLGY:
    "Two bamboo risers that lift the short jars so the second row is visible over the first. This is the warmest thing on the page and the one that looks best on a shelf anyone can see. Small piece, large effect: a shelf you can read at a glance is a shelf you stop rearranging.",
  B0B3WSZ3QP:
    "Four ten inch turntables for the deep corner where things go to be forgotten. The back of a deep shelf is a reach problem rather than a storage problem, and a turntable is the cheapest way to solve it. Four means one for the oils, one for the vinegars, one for the baking shelf and one to spare.",
  B0036OQU56:
    "Fifteen inches wide, three tiers, non skid, and the lowest price on the list from the largest sample on the list. It does the job of the bamboo risers in a plainer material, which makes it the one to buy for the cupboard nobody sees. If your pantry is a working cupboard rather than a display, this is the sensible piece.",
  B09TRKGNGV:
    "Seven clear containers with flip lock lids, for the flour, the oats, the sugar and the rice that are currently living in open bags with a clip on them. This is the piece that changes how a shelf looks more than any other, because a row of closed containers reads as a decision rather than an accident. It is also the highest price here, and the one I would buy last if the budget is tight.",
  B0BC84YTYY:
    "Twenty four matched jars, a rack that mounts to a wall or a door, and labels. This is what finally turns a mismatched collection of half full supermarket jars into one set, and it is the only piece here that makes a pantry look deliberate rather than tidy. It is the darkest thing on the page, which is why I would hang it rather than sit it on a shelf.",
};

const LAST_PARAGRAPHS = [
  "Pick the problem in front of you. If you cannot see what you have, that is the risers or the turntables, and they are the two cheapest ways to change a shelf. If you cannot reach what you have, that is the door rack or the can rack, and both are about turning space you own into space you can use. If things are open, that is the containers. If the spice shelf has become a pile of half full jars, that is the jar set, and it is the one purchase here that fixes the look as well as the function.",
  "Then measure before you order. Shelf depth decides which rack you can buy, and door clearance decides whether the door organizer is a good idea at all. It is the step people skip, and it is the reason a sensible purchase ends up in a bag in the garage.",
];

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

export const Route = createFileRoute("/blog/pantry-organization-ideas")({
  head: () => {
    const seo = generateStaticMetadata(
      BLOG_TITLE,
      BLOG_DESCRIPTION,
      BLOG_PATH,
      {
        image: HERO_JPG,
        imageWidth: 1600,
        imageHeight: 1100,
        ogType: "article",
        publishedTime: DATE_PUBLISHED,
        author: AUTHOR_NAME,
      },
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: PantryOrganizationPost,
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
            strokeWidth={1.5}
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
          strokeWidth={2}
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

/** A paragraph block, the same rhythm the Reset List post uses. */
function Prose({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line) => (
        <p
          key={line.slice(0, 40)}
          className="mt-5 text-lg leading-relaxed text-warm-gray"
        >
          {line}
        </p>
      ))}
    </>
  );
}

function PantryOrganizationPost() {
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
                height={1100}
                loading="eager"
                decoding="async"
                className="mt-8 aspect-[16/11] w-full rounded-2xl object-cover"
              />
            </picture>
            <p className="mt-7 text-lg leading-relaxed text-warm-gray">
              {BLOG_DESCRIPTION}
            </p>
            <Prose lines={OPEN_PROSE} />
          </header>

          {/* The post's single Amazon disclosure, before the first shoppable
              link. The cards and the list card carry no second one. */}
          <div className="mt-6 border-t border-beige/30 pt-5">
            <AmazonDisclosure variant="inline" checked={VERIFIED_DATE} />
          </div>

          <div className="mt-8">
            <StorefrontListCard
              list={PANTRY_ORGANIZATION_LIST}
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
              Pantry Organization Ideas
            </a>
            . If you want the notes on each piece and what I would buy first,
            that is the page:{" "}
            <a
              href={GUIDE_PATH}
              className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
            >
              {GUIDE_LABEL}
            </a>
            .
          </p>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              Why seven
            </h2>
            <Prose lines={WHY_PARAGRAPHS} />
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              The checks behind every number
            </h2>
            <Prose lines={CHECKS_PARAGRAPHS} />
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              The seven, in the order I would buy them
            </h2>
            <div className="mt-6 space-y-8">
              {FINDS.map((find) => (
                <FindCard key={find.asin} find={find} />
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              How to start without buying all seven
            </h2>
            <Prose lines={LAST_PARAGRAPHS} />
            <p className="mt-5 text-lg leading-relaxed text-warm-gray">
              The full list with every rating, count and price is here:{" "}
              <a
                href={GUIDE_PATH}
                className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
              >
                {GUIDE_LABEL}
              </a>
              . The storefront version is here:{" "}
              <a
                href={LIST_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
              >
                Pantry Organization Ideas
              </a>
              . Both carry the same seven pieces, read on the same day, and both
              will be re-read before January.
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
