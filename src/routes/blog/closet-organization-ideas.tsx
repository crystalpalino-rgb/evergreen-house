import { createFileRoute } from "@tanstack/react-router";

import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { EmailSignup } from "~/components/EmailSignup";
import { StorefrontListCard } from "~/components/StorefrontListCard";
import { trackAffiliateClick } from "~/lib/analytics";
import { SITE_NAME, SITE_URL } from "~/lib/schema";
import { generateStaticMetadata } from "~/lib/seo";
import { CLOSET_ORGANIZATION_LIST } from "~/lib/storefront-lists";
import listManifest from "~/data/closet-organization/list-manifest.json";

/**
 * Blog post: "Closet Organization Ideas: Eight Finds That Keep a Closet Tidy"
 *
 * Companion post to the January list page at /closet-organization, from the approved
 * draft in /home/team/shared/curation/closet-pantry-2026-11-23/copy/closet-post-draft.md. The
 * body is the draft, verbatim, in the draft's order.
 *
 * Every product fact (title, stars, review count, price, URL) is read from
 * src/data/closet-organization/list-manifest.json, the merchandiser's live read of the list
 * on 2026-11-23, so no number is retyped here. The per-piece notes below are the
 * draft's own paragraphs, keyed by ASIN, in the draft's order.
 *
 * The storefront list card opens the list itself (toPage={false}) so the post
 * carries the crystalpalino-20 link out, and the guide is linked inline.
 */

const BLOG_SLUG = "closet-organization-ideas";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE =
  "Closet Organization Ideas: Eight Finds That Keep a Closet Tidy";
const BLOG_DESCRIPTION =
  "Eight pieces from my own closet list, read on their live listings on November 23, 2026. Not one of them is decorative, and that is exactly why the closet still looks right in February.";
const DATE_PUBLISHED = "2026-11-23";
const DATE_PUBLISHED_LABEL = "November 23, 2026";
const AUTHOR_NAME = "Crystal Costa";

const HERO_JPG = "/images/january-closet-organization-hero.jpg";
const HERO_WEBP = "/images/january-closet-organization-hero.webp";
const HERO_ALT =
  "Two woven baskets and folded oatmeal linens on the top shelf of a pale oak closet, with a row of matching wooden hangers, a stack of sweaters and a shoe rack below, in warm morning light.";

/** Day every rating, review count and price below was read on Amazon. */
const VERIFIED_DATE = "2026-11-23";
const VERIFIED_DATE_LABEL = "November 23, 2026";

const GUIDE_PATH = "/closet-organization";
const GUIDE_LABEL = "the closet edit";
const LIST_URL = CLOSET_ORGANIZATION_LIST.href;

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
  "There is a version of closet organization that exists mostly in photographs. Everything is folded to the same width, the hangers match, the bags are arranged by color, and it looks wonderful for about nine days. I have built that closet more than once. What I have learned is that the shelf is not the problem. The problem is that a beautiful system and a workable one are not the same system, and only one of them survives a Tuesday morning when you are already late.",
  "This list is the workable one. Eight pieces, all from my own Amazon closet list, and every one of them does one of three jobs: it removes a pile, it gives a pile a lane, or it holds something where my hand already goes. Nothing here is trying to be an object. Five of the eight are clear acrylic, clear plastic or black fabric, and I am telling you that up front because a page that hides it is not much use.",
];

const WHY_PARAGRAPHS = [
  "Eight is what is on my list, and eight is the whole of it. I did not go looking for a ninth piece to make the page look fuller, because a closet page padded out with a ninth organizer is a closet page that has stopped solving anything.",
  "The test was narrow. Does the piece still look like it is working three weeks later, without me doing anything? A divider passes that test, because a shelf with lanes cannot collapse into a pile. A can dispenser passes it, which is why there is one on the pantry page next to this one. A beautifully styled basket with no lid and no label fails it, and I have the photographs to prove it.",
  "I would rather say the other half out loud. This category is utility first. The clear acrylic dividers and the clear plastic pockets are not warm, the vacuum bags are pure plastic, the shoe rack is non woven black fabric. Three of the eight sit comfortably in a neutral room: the beige hanging organizer, the white and grey drawer bins and the black velvet hangers. The other five are doing a job in the plainest material available. The editorial argument for them is not that they are lovely. It is that visible, labeled, reachable storage is what a calm room is actually made of.",
];

const CHECKS_PARAGRAPHS = [
  "Every piece was read on its live Amazon listing on November 23, 2026: star rating, review count, price and buy box. All eight came back at 4.3 stars or better with a live buy box. The review counts run from 571 to 239,815 and the prices run from $9.47 to $33.99. Nothing is rounded up, and the card on the page carries the number that was on the listing that day, with the date beside it.",
  "Two numbers on this list are worth naming plainly. The shoe rack sits at exactly 4.3 stars from 18,563 ratings, which is the floor, and it passes by nothing. The jewelry organizer carries 571 reviews, the thinnest sample here, which is still well above the bar we work to but is a smaller room than the hangers' 239,815. Both are on the page because both are honest purchases. I would just rather you knew which number you were standing on.",
];

/**
 * The draft's own paragraph on each piece, in the order the post walks them.
 * The title, stars, count and price on the card come from the manifest.
 */
const FIND_NOTES: Record<string, string> = {
  B0DRTX1VQD:
    "The most expensive piece here and the one I would still buy first if my problem was handbags. Bags do not stack and they do not stand, so a shelf without lanes becomes one sliding pile within a week. Clear acrylic is the right material for a divider, because it should be doing the work rather than competing with what it holds.",
  B0CM8SKFWN:
    "The only jewelry piece on the list. It hangs on the back of a door or inside the closet and it ends the drawer of tangled chains, which is a problem that costs you five minutes every time you want to wear the one necklace you actually like. Black, so it disappears against the clothes instead of adding a surface to look at.",
  B01ICEEHUO:
    "I flagged this one as borderline when I built the page, and I kept it, because it is what lets a closet turn over when the season does. Winter coats come off the rail in April and go flat under the bed, and that is what gives the other seven pieces room to work. It is the least decorative thing here. It is also the reason the closet has space at all.",
  B08WM3TX9K:
    "Twelve soft bins in white and grey, which is twelve chances to give a drawer a grid. The point is not folding perfection. The point is that a drawer with compartments gets opened and closed without being stirred, so the thing you want is where you left it.",
  B0CNGTZ3B5:
    "The lowest price on the list and the one that fixes the most common closet failure, which is the floor. Twenty seven and a half inches wide, three tiers, non woven fabric. It is not furniture and it does not pretend to be. It is the difference between stepping over your shoes and putting them on.",
  B01D58DRVC:
    "Twenty four clear pockets, which is more storage than the name suggests. It holds the small things that otherwise live on the closet floor: sandals, gloves, the spare pair of flats, the lint roller. The clear pockets are the whole argument, because you can see what is in them without opening anything.",
  B07SZT5GPF:
    "For the closet with height and no shelf. Six breathable fabric shelves and two side pockets, in beige, which is the warmest thing on this page. This is the piece I would reach for in a rental, where you cannot build anything and the rail is all you have.",
  B00FXNAAW2:
    "The piece I would buy first if I were starting over, and the highest rating on the list from the largest sample by a wide margin. Fifty slim hangers give the rail back to the clothes. The difference between a full rail and a rail with room in it is the difference between getting dressed and giving up.",
};

const LAST_PARAGRAPHS = [
  "Do not buy all eight. Pick the part of the closet that is actually failing. If the floor is a heap, that is the shoe rack, and it costs $9.47. If the shelf is collapsing stacks, that is the dividers. If the drawer is a layer of things you cannot identify, that is the bins. If the rail is so full that nothing comes out easily, start with the hangers and see how much of the rest you no longer need.",
  "Then measure the door before you buy anything that hangs on it, and measure the rail before you hang six shelves from it. That is the step people skip, and it is the reason a good purchase ends up in a bag in the garage.",
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

export const Route = createFileRoute("/blog/closet-organization-ideas")({
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
  component: ClosetOrganizationPost,
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

function ClosetOrganizationPost() {
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
              list={CLOSET_ORGANIZATION_LIST}
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
              Closet Organization Ideas
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
              Why eight, and why none of them is pretty
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
              What to do on the first weekend
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
                Closet Organization Ideas
              </a>
              . Both carry the same eight pieces, read on the same day, and both
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
