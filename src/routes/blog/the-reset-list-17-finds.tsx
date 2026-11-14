import { createFileRoute } from "@tanstack/react-router";

import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { EmailSignup } from "~/components/EmailSignup";
import { StorefrontListCard } from "~/components/StorefrontListCard";
import { trackAffiliateClick } from "~/lib/analytics";
import { SITE_NAME, SITE_URL } from "~/lib/schema";
import { generateStaticMetadata } from "~/lib/seo";
import { RESET_LIST } from "~/lib/storefront-lists";

/**
 * Blog post: "The Reset List: 17 Finds for a Home That Runs Itself"
 *
 * Owner-approved copy (draft: /home/team/shared/reset-list/post-draft.md), body
 * used verbatim. Product facts (ASIN, clean card title, stars, review count,
 * price) come from /home/team/shared/reset-list/reset-list-verification.csv,
 * all verified 2026-11-14, and are hardcoded here on purpose: the page is
 * static editorial content and must not depend on catalog state.
 *
 * The storefront list card is RESET_LIST from ~/lib/storefront-lists, rendered
 * twice (after the intro and again at the close). It is not a product card and
 * carries no rating, review count or price.
 */

const BLOG_SLUG = "the-reset-list-17-finds";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "The Reset List: 17 Finds for a Home That Runs Itself";
const BLOG_H1 = BLOG_TITLE;
const BLOG_DESCRIPTION =
  "One list that resets the systems instead of the house: 16 planners, meal prep pieces and small organizers that make a home run itself, plus The Reset List on Amazon.";
const DATE_PUBLISHED = "2026-11-14";
const DATE_PUBLISHED_LABEL = "November 14, 2026";
const AUTHOR_NAME = "Crystal Costa";

const HERO_JPG = "/images/blog-reset-list.jpg";
const HERO_ALT =
  "An open grid-lined planner with a gold pen on a pale oak counter, glass jars of grains and a stoneware crock on a shelf behind it, a folded linen towel and a eucalyptus sprig in soft window light";

/** Day every rating, review count and price below was read on Amazon. */
const VERIFIED_DATE = "2026-11-14";
const VERIFIED_DATE_LABEL = "November 14, 2026";

const INTRO_PARAGRAPHS = [
  "There is a specific Sunday night feeling I have come to recognize. The week has not started yet and it already feels behind. Nobody has a clean uniform, I do not know what is for dinner on Wednesday, and there is a pile of paper on the counter that I have been walking past for a week.",
  "I used to answer that feeling with a whole house reset, and I would get about four rooms in before I ran out of steam. What actually works, for me, is smaller. One list that resets the systems instead of the house: the calendar, the meals, the drawers, the keys. The rooms look after themselves once those four things work.",
  "This is that list, all seventeen finds of it, on my own Amazon storefront. January is when I go through it, but there is no rule that says you have to wait.",
];

type ResetFind = {
  /** ASIN, used as the product id in the affiliate_click event. */
  asin: string;
  /** The CSV's CleanCardTitle, never the raw Amazon listing string. */
  title: string;
  rating: number;
  reviews: number;
  price: number;
  note: string;
};

type ResetSection = {
  heading: string;
  intro?: string;
  finds: ResetFind[];
};

const PLAN_IT: ResetSection = {
  heading: "Plan it",
  intro:
    "Every January I buy a new planner, and every year I forget about it by February. What changed for me was not finding a better planner, it was pairing it with the things that keep it honest: a pen that behaves on thin paper, a sticky note I can move, and one folder that holds every piece of paper I would otherwise stuff in a drawer.",
  finds: [
    {
      asin: "B0GLR8B1SP",
      title: "2027 Weekly and Monthly Planner, Enterprise",
      rating: 4.8,
      reviews: 3546,
      price: 14.99,
      note: "The anchor of the list, and the one that lives on the kitchen counter rather than in my bag. The Enterprise cover is the deeper of the two and holds its own next to a dark counter without looking like office equipment. Monthly pages for the shape of the year, weekly pages for the week I am actually living. I sit down with it on Sunday night with the kids' schedules open beside me, and that ten minutes is the reason the rest of the week works.",
    },
    {
      asin: "B0GLRHK4C7",
      title: "2027 Weekly and Monthly Planner, Blush Pink",
      rating: 4.4,
      reviews: 48,
      price: 12.99,
      note: "The same weekly and monthly layout in a lighter cover. If you want the spreads without the darker planner sitting out on a desk, this is the one: soft blush pink, the same page for the year and the same page for the week. I would hand this to a friend who says she wants to get organized but does not want it to look like homework.",
    },
    {
      asin: "B0D1BR3ZHM",
      title: "Colored Bible Pens",
      rating: 4.6,
      reviews: 850,
      price: 9.49,
      note: "Fine 0.38mm tips that do not bleed through, made for the thin paper of a planner. I use one color per person in the family and a separate one for work, so a glance at the week tells me whose appointment is whose. The set lives in a cup on the desk and the kids know they can use them.",
    },
    {
      asin: "B0DQ4LF48Y",
      title: "Transparent Sticky Notes",
      rating: 4.3,
      reviews: 1240,
      price: 6.99,
      note: "Sticky notes you can see the page through, which means I can flag something without hiding the date underneath it. I use them for the moving parts, an appointment to reschedule, a call to make, and I move the note to the new week instead of rewriting it.",
    },
    {
      asin: "B01B25NN64",
      title: "Expanding File Organizer",
      rating: 4.6,
      reviews: 51774,
      price: 6.29,
      note: "Thirteen pockets, one per thing: school, medical, taxes, the car, the house. This is the piece that made the biggest difference for me, because paper was the part of the house that never had a home. A letter now gets filed in ten seconds instead of joining a pile.",
    },
    {
      asin: "B00ACDNP70",
      title: "5-Year Memory Journal (one line a day)",
      rating: 4.7,
      reviews: 1824,
      price: 34.95,
      note: "One line a day for five years, and you read last year's line before you write today's. It takes under a minute, and it is the only journal I have ever kept past January, which says more about the format than about my discipline.",
    },
  ],
};

const FEED_YOURSELVES: ResetSection = {
  heading: "Feed yourselves",
  intro:
    "Feeding a family is a system too, and mine used to fail at the same time every week: a quarter to six on a Tuesday, everyone hungry, nothing planned. These five are what stopped that.",
  finds: [
    {
      asin: "B0B9S5HZ26",
      title: "Glass Food Storage Containers, 8 Pack",
      rating: 4.5,
      reviews: 16288,
      price: 20.89,
      note: "Glass with lids that seal, in sizes that stack. I cook one big thing on Sunday and portion it into these, so Tuesday's dinner is already made and I am not negotiating with myself in front of the fridge. Glass means I reheat in the same container I stored it in.",
    },
    {
      asin: "B07XCRZ56Z",
      title: "Magnetic Menu Board",
      rating: 4.6,
      reviews: 9017,
      price: 9.99,
      note: "It goes on the fridge where everyone can see it, and that visibility is most of the work. Dinners go up on Sunday. The question I used to answer six times a day answers itself now.",
    },
    {
      asin: "B0BX9QKX8K",
      title: "Acrylic Meal Planner",
      rating: 4.7,
      reviews: 3658,
      price: 9.99,
      note: "A second weekly board, this one for the kitchen wall with markers included, and this is where the shopping list lives. The fridge board is dinners, this one is the week's moving parts. If you only want one board, take the magnetic one and skip this.",
    },
    {
      asin: "B0GWMC6X7W",
      title: "Freezer Labels and Marker",
      rating: 4.9,
      reviews: 67,
      price: 9.99,
      note: "Two rolls and 1,200 labels, removable, sized for a lid or a bag. This is the fix for the unmarked foil packet problem. Everything that goes in the freezer gets a name and a date, so I am not thawing a mystery on a Wednesday. Small thing, disproportionate payoff.",
    },
    {
      asin: "B0B6HXQV6N",
      title: "Stackable Fridge Bins, 10 Pack",
      rating: 4.4,
      reviews: 3179,
      price: 25.62,
      note: "Ten bins with lids that stack, which turns a shelf into drawers. The fridge stops being the place where things go to be forgotten, and the kids can reach their own snacks without dragging a chair over.",
    },
  ],
};

const CONTAIN_THE_CHAOS: ResetSection = {
  heading: "Contain the chaos",
  intro:
    "This part has nothing to do with the calendar and everything to do with the ten minutes before you leave the house.",
  finds: [
    {
      asin: "B08DXHFKB1",
      title: "Label Maker",
      rating: 4.3,
      reviews: 33379,
      price: 16.98,
      note: "A small Bluetooth label maker, and I use it far more than I expected: bins, chargers, the laundry shelf, the box of winter hats. The label is not for me. It is for everyone else in the house, so the answer to where does this go is printed on the container.",
    },
    {
      asin: "B08KXKVT4K",
      title: "Clear Drawer Organizers, 25 Pack",
      rating: 4.7,
      reviews: 49623,
      price: 17.99,
      note: "Twenty five clear trays in a few sizes, enough for the kitchen drawer, the bathroom drawer and the one in the hall. Clear matters. If I can see it, it gets used, and if it does not have a spot it does not belong in the drawer.",
    },
    {
      asin: "B0H2H79FHK",
      title: "Under Sink Organizer, 2 Pack",
      rating: 4.8,
      reviews: 979,
      price: 37.99,
      note: "Two shelves that slide out and turn the cabinet under the sink from somewhere you shove things into somewhere you can reach. Bottles stand up, the back of the cabinet stops being a graveyard, and it is one afternoon of work.",
    },
    {
      asin: "B0DSTQG9ZQ",
      title: "Key Holder Wall Mount",
      rating: 4.3,
      reviews: 1311,
      price: 9.99,
      note: "Keys, mail, the dog's leash, all on the wall by the door. A small wooden rack with hooks and a mail slot, and it ended the every morning search in this house. If you have ever turned the house upside down for car keys at 7:40, this is the simplest fix on the list.",
    },
    {
      asin: "B0DGXD6WVW",
      title: "Sunrise Alarm Clock",
      rating: 4.5,
      reviews: 2359,
      price: 59.99,
      note: "A light that comes up slowly instead of a phone alarm, with white noise. January mornings here are dark, and waking to a room that is already getting light is a different start to the day. It also keeps the phone out of the bedroom, which is half the point.",
    },
  ],
};

const SECTIONS = [PLAN_IT, FEED_YOURSELVES, CONTAIN_THE_CHAOS];

/**
 * Her own book. Linked separately from the finds because it carries no rating
 * claim: no review count was readable on the live listing, so the card shows
 * none. It is not one of the 17 finds on the storefront list.
 */
const DIVORCE_BINDER_ASIN = "B0HP89D5DC";
const DIVORCE_BINDER_URL = `https://www.amazon.com/dp/${DIVORCE_BINDER_ASIN}?tag=crystalcost09-20`;
const DIVORCE_BINDER_LABEL =
  "The Divorce Binder: A Guided Workbook and Planner";

const CLOSING_PARAGRAPH =
  "Save this post for the first week of January, when the house feels like it is running you and the year has already started without you. One list, one weekend, seventeen finds, and the systems do the work after that.";

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: BLOG_TITLE },
];

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  name: BLOG_TITLE,
  headline: BLOG_H1,
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

export const Route = createFileRoute("/blog/the-reset-list-17-finds")({
  head: () => {
    const seo = generateStaticMetadata(
      BLOG_TITLE,
      BLOG_DESCRIPTION,
      BLOG_PATH,
      {
        // Journal post: article Open Graph tags plus the byline and publish
        // date the scrapers read off the head, and this post's own hero art
        // (public/images/blog-reset-list.jpg, 1600x900) as the og:image.
        image: HERO_JPG,
        imageWidth: 1600,
        imageHeight: 900,
        ogType: "article",
        publishedTime: DATE_PUBLISHED,
        author: AUTHOR_NAME,
      }
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: BlogPost,
});

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

/** Rating stars - same markup/styling as ProductCard. */
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium text-warm-dark">{rating}</span>
      <div className="flex" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
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

function FindCard({ find }: { find: ResetFind }) {
  const amazonUrl = `https://www.amazon.com/dp/${find.asin}?tag=crystalcost09-20`;
  const priceLabel = formatPrice(find.price);

  return (
    <div
      id={`find-${find.asin}`}
      className="rounded-2xl border border-beige/20 bg-white p-5 shadow-sm ring-1 ring-beige/10 sm:p-6"
    >
      <h3 className="font-serif text-lg font-semibold leading-snug text-warm-dark">
        {find.title}
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <RatingStars rating={find.rating} />
        <span className="text-sm text-warm-gray">
          {find.reviews.toLocaleString("en-US")} ratings
        </span>
        <span className="text-sm font-semibold text-terracotta">
          {priceLabel}
        </span>
      </div>
      <p className="mt-1 text-xs text-taupe">
        {`Verified ${VERIFIED_DATE_LABEL}`}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-warm-gray sm:text-base">
        {find.note}
      </p>
      <a
        href={amazonUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-sage-dark"
        onClick={() =>
          trackAffiliateClick({
            productId: find.asin,
            name: find.title,
            price: find.price,
            context: `blog:${BLOG_SLUG}`,
            destinationUrl: amazonUrl,
            eventId: `amz-click-${BLOG_SLUG}-${find.asin}`,
          })
        }
      >
        Shop on Amazon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
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
              {BLOG_H1}
            </h1>
            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-taupe">
              <time dateTime={DATE_PUBLISHED}>{DATE_PUBLISHED_LABEL}</time>
              <span className="mx-2 text-beige" aria-hidden="true">
                /
              </span>
              <span>By {AUTHOR_NAME}</span>
            </p>
            <img
              src={HERO_JPG}
              alt={HERO_ALT}
              width={1600}
              height={900}
              loading="eager"
              decoding="async"
              className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
            />
            {INTRO_PARAGRAPHS.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mt-7 text-lg leading-relaxed text-warm-gray"
              >
                {paragraph}
              </p>
            ))}
          </header>

          {/* The page's single Amazon disclosure, before the first shoppable
              link. The cards themselves carry no disclosure line. */}
          <div className="mt-6 border-t border-beige/30 pt-5">
            <AmazonDisclosure variant="inline" checked={VERIFIED_DATE} />
          </div>

          <div className="mt-8">
            <StorefrontListCard list={RESET_LIST} level={2} />
          </div>

          {SECTIONS.map((section) => (
            <section key={section.heading} className="mt-12">
              <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
                {section.heading}
              </h2>
              {section.intro && (
                <p className="mt-5 text-lg leading-relaxed text-warm-gray">
                  {section.intro}
                </p>
              )}
              <div className="mt-6 space-y-8">
                {section.finds.map((find) => (
                  <FindCard key={find.asin} find={find} />
                ))}
              </div>
            </section>
          ))}

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              One more thing, and this one is mine
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-warm-gray">
              I would be leaving something out if I did not put this on the
              list. <strong className="font-semibold text-warm-dark">The Divorce Binder</strong>{" "}
              is my own book, and it sits here because the paperwork deserves a
              home too. When I was going through mine, the thing that undid me
              was not the decisions, it was the paper. The forms, the account
              numbers, the dates, all of it in a grocery bag on the floor of my
              car. So I made a guided workbook and planner that puts it in one
              place, with prompts for the money questions and a section for the
              dates that matter. If this is your year for that, I hope it makes
              the paperwork feel smaller than it felt for me.
            </p>
            <p className="mt-4">
              <a
                href={DIVORCE_BINDER_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
                onClick={() =>
                  trackAffiliateClick({
                    productId: DIVORCE_BINDER_ASIN,
                    name: DIVORCE_BINDER_LABEL,
                    context: `blog:${BLOG_SLUG}`,
                    destinationUrl: DIVORCE_BINDER_URL,
                    eventId: `amz-click-${BLOG_SLUG}-${DIVORCE_BINDER_ASIN}`,
                  })
                }
              >
                {DIVORCE_BINDER_LABEL}
              </a>
            </p>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              Save this for January
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-warm-gray">
              {CLOSING_PARAGRAPH}
            </p>
            <div className="mt-8">
              <StorefrontListCard list={RESET_LIST} level={3} />
            </div>
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
