import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/schema";

/**
 * Blog post: "14 Neutral Holiday Decor Finds for a Cozy Christmas"
 *
 * Copy is owner-approved (draft: /home/team/shared/blog-drafts/holiday-decor-finds.md).
 * Product facts (ids, prices, ratings, product-page URLs, amazon_urls, image_urls)
 * come from section 6 of that draft and are hardcoded here on purpose: the page is
 * static editorial content and must not depend on catalog state.
 */

const BLOG_SLUG = "cozy-neutral-holiday-decor-finds";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "Cozy Neutral Holiday Decor Finds for a Calm Home";
const BLOG_H1 = "14 Neutral Holiday Decor Finds for a Cozy Christmas";
const BLOG_DESCRIPTION =
  "Fourteen neutral holiday decor finds - a knit tree skirt, cedar garland, ceramic trees, pearl ornaments - for a warm Christmas without the tinsel.";
const DATE_PUBLISHED = "2026-10-08";
const DATE_PUBLISHED_LABEL = "October 8, 2026";

const INTRO =
  "The holiday rooms we remember are never the busiest ones. They are warm white light on a windowsill, greenery that looks like it was gathered rather than bought, a cream knit skirt under a bare tree, and one soft throw where someone always sits. Colour, when it comes, arrives in small honest amounts: a red plaid mat at the door, a holly border on the plates. Here are fourteen pieces from our holiday edit that do that work, most of them under thirty dollars, none of them tinsel.";

const CLOSING =
  "The most restful Christmas rooms are the ones where the light and the greenery do the talking and everything else stays quiet. Start at the front door, move to the mantel, then finish at the tree. By the time you get there, the house already feels like December.";

const DISCLOSURE =
  "Evergreen House may earn a small commission from Amazon purchases made through our links, at no extra cost to you. Every product above was chosen because we genuinely like it.";

type BlogProduct = {
  id: number;
  /** Display name used in the post (owner-approved override where the DB name is scraped/truncated). */
  name: string;
  price: number;
  rating: number;
  /** Internal product page - keeps readers on-site. */
  productUrl: string;
  /** Affiliate link, tag=crystalcost09-20. */
  amazonUrl: string;
  imageUrl: string;
  note: string;
};

type BlogSection = {
  heading: string;
  products: BlogProduct[];
};

const SECTIONS: BlogSection[] = [
  {
    heading: "The front door",
    products: [
      {
        id: 429,
        name: "24 Inch Pine Christmas Wreath",
        price: 29.99,
        rating: 4.6,
        productUrl:
          "/product/24-inch-christmas-wreaths-for-front-door-pine-artificial-christmas-wreath",
        amazonUrl: "https://www.amazon.com/dp/B0FKBT525F?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/91LHjg2UuUL._AC_SL1500_.jpg",
        note: "Twenty-four inches is the size that covers a front door without a second hook of greenery above it, and this one is full enough that a plain ribbon is all it needs. The needles are a deep green with a slight sheen, so they read well in daylight and catch porch light after dark. On a dark door, skip the bow; on a pale one, add it.",
      },
      {
        id: 422,
        name: "Christmas Red and White Plaid Door Mat, 28 x 43",
        price: 19.99,
        rating: 4.7,
        productUrl:
          "/product/christmas-red-and-white-plaid-door-mat-28-x-43-inches-cotton-hand-woven-layered-entry-mat-for-front-porch-entryway-outdo",
        amazonUrl: "https://www.amazon.com/dp/B0BFDH7835?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/91bKYKAMHeL._AC_SL1500_.jpg",
        note: "One hit of classic red, at the door, where it belongs. This mat is cotton and hand woven, 28 by 43 inches, big enough to layer over a plain coir mat and still read as a single arrangement. Buffalo check is old enough to be timeless rather than trendy, and the mat is genuinely washable, which matters for something that sits outside all winter.",
      },
      {
        id: 442,
        name: "Lighted Wooden Merry Christmas Sign with Timer",
        price: 23.99,
        rating: 4.7,
        productUrl: "/product/lighted-wooden-merry-christmas-sign-with-timer",
        amazonUrl: "https://www.amazon.com/dp/B0C7C3VV9J?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/81Y8-h5y15L._AC_SL1500_.jpg",
        note: "A small wooden block in dark timber with white lettering, lit from within, running on a timer so it switches itself on at dusk. It gives an entry or a hallway console a lit focus without a full garland arrangement, and the timber keeps it closer to farmhouse than to tinsel. It sits on a surface rather than hanging, so a shelf or a sideboard is where it works.",
      },
    ],
  },
  {
    heading: "The mantel and the greenery",
    products: [
      {
        id: 436,
        name: "Lifelike Cedar Mantel Garland, 6 Ft",
        price: 59.99,
        rating: 4.8,
        productUrl: "/product/lifelike-cedar-mantel-garland-6ft",
        amazonUrl: "https://www.amazon.com/dp/B0H4V8JLH3?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/81srhDHKYBL._AC_SL1500_.jpg",
        note: "Six feet of lifelike cedar with the fine, soft texture of the real thing, unlit on purpose, so it can be layered with candles and a light string of your own. It drapes along a fireplace mantel, a stair rail or a console, and it holds ribbon without a single pin. It folds back into a box in January, which is more than most greenery can say.",
      },
      {
        id: 438,
        name: "Norfolk Pine Branches for Vase, 16 Pieces",
        price: 29.99,
        rating: 4.6,
        productUrl: "/product/norfolk-pine-branches-for-vase-16-pcs",
        amazonUrl: "https://www.amazon.com/dp/B0D763QFF3?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/81seK3ZwGgL._AC_SL1500_.jpg",
        note: "Sixteen faux pine branches, each 18 inches, is the count that fills a tall vase, an urn or a wide bowl without buying stems one at a time. The needles stand up rather than flop, which is what keeps an arrangement looking arranged. Trim the stems shorter for a small vase. One order covers a console and a dining table.",
      },
      {
        id: 439,
        name: "Velvet Ceramic Christmas Trees, Set of 3",
        price: 29.99,
        rating: 4.8,
        productUrl: "/product/velvet-ceramic-christmas-trees-set-of-3",
        amazonUrl: "https://www.amazon.com/dp/B0DBHJVYFJ?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/81X70YpBi6L._AC_SL1500_.jpg",
        note: "Three ceramic trees in green and sage with a soft velvet finish, stepped in size so they can be grouped on a mantel, a kitchen shelf or a sideboard. The sage tone is what makes them useful: they sit happily with eucalyptus, wood and white ceramics instead of insisting on red and green. Group all three, or split them between two rooms.",
      },
    ],
  },
  {
    heading: "The tree",
    products: [
      {
        id: 421,
        name: "Knit Christmas Tree Skirt, Cream, 48 Inches",
        price: 24.99,
        rating: 4.9,
        productUrl:
          "/product/knit-christmas-tree-skirts-neutral-tree-skirt-cozy-christmas-decorations",
        amazonUrl: "https://www.amazon.com/dp/B07RT4GT8W?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/81QA7CwkG1L._AC_SL1500_.jpg",
        note: "Cream cable knit, 48 inches across, with the weight of a good sweater. A neutral skirt lets the tree and the wrapping carry the colour, and it covers the stand completely rather than half-heartedly. The rib and garter knit gives it enough texture to look deliberate under a bare tree, and it rolls up small in January.",
      },
      {
        id: 81,
        name: "White Pearl Bow Ornaments, Set of 12",
        price: 9.49,
        rating: 4.6,
        productUrl: "/product/viorawhite-12-pcs-white-pearl",
        amazonUrl: "https://www.amazon.com/dp/B0FHK4714F?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/813RyHpMjRL._AC_SL1500_.jpg",
        note: "Twelve pearl bows on loops, for a tree dressed in white and cream. The lustre is soft rather than glittery, so they read elegant against warm white lights instead of flashing, and the loop at the back means they can hang as ornaments or tie onto a wreath. Twelve goes further than it sounds on a slim tree, and it is the cheapest way to change a tree's whole mood.",
      },
    ],
  },
  {
    heading: "Low, warm light",
    products: [
      {
        id: 447,
        name: "Wondise Flameless Window Candles with Timer",
        price: 25.99,
        rating: 4.6,
        productUrl: "/product/wondise-flameless-window-candles-with-timer",
        amazonUrl: "https://www.amazon.com/dp/B07SN3Y7LZ?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/616ncvtlTML._AC_SL1500_.jpg",
        note: "A row of candles on a windowsill is the oldest trick for making a house look warm from the street, and these run on a six hour timer so it happens on its own every evening. Batteries mean no cord down a wall and no socket to find near a window, and the ivory finish suits plain windows and traditional trim alike. Pack them away in January.",
      },
      {
        id: 91,
        name: "Homemory Flameless Tea Lights, 48 Pack",
        price: 19.99,
        rating: 4.8,
        productUrl: "/product/homemory-48-pack-novelty-flickering-flameless",
        amazonUrl: "https://www.amazon.com/dp/B07RYPVPRJ?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/61n-VJa2F8L._AC_SL1500_.jpg",
        note: "Forty-eight LED tea lights, each with a flickering flame and a long run time on its battery. They are what makes a long table or a row of lanterns possible without watching a real flame, and at an inch and a half across they drop into the votives and holders you already own. The white bases sit evenly, so nothing glares against a linen cloth.",
      },
      {
        id: 445,
        name: "Lighted Ceramic Christmas Village, 14 Pieces",
        price: 39.99,
        rating: 4.7,
        productUrl: "/product/lighted-ceramic-christmas-village-14-pieces",
        amazonUrl: "https://www.amazon.com/dp/B0CG33ZG8V?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/71At2Qnj8XL._AC_SL1500_.jpg",
        note: "A lit village in a single order rather than collected house by house for years: five ceramic buildings and nine small trees to arrange along a console, a shelf or a mantel. Everything is white and cream, so it suits a neutral room, and the light comes from inside each building. Keep the row low and put the trees at the ends.",
      },
    ],
  },
  {
    heading: "The sofa",
    products: [
      {
        id: 423,
        name: "EverGrace Chenille Christmas Throw, White Stewart Plaid",
        price: 32.99,
        rating: 4.6,
        productUrl:
          "/product/evergrace-chenille-christmas-throw-blanket-50-x60-white-stewart-plaid",
        amazonUrl: "https://www.amazon.com/dp/B0CDKXVK32?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/817a-OxvFfL._AC_SL1500_.jpg",
        note: "The one to reach for when the tree is already busy and the sofa needs quiet. Chenille has a heavier drape than fleece, so it falls over a chair back instead of sliding off, and the soft reds and greens in the Stewart plaid keep it seasonal without looking like a costume. One throw covers two chairs, or one person and a book.",
      },
    ],
  },
  {
    heading: "The table",
    products: [
      {
        id: 482,
        name: "Lenox Holiday Porcelain Dinner Plates, Set of 6",
        price: 25.5,
        rating: 4.7,
        productUrl: "/product/lenox-holiday-porcelain-dinner-plates-set-of-6",
        amazonUrl: "https://www.amazon.com/dp/B00E8HTRZ0?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/81hknrXiTWL._AC_SL1500_.jpg",
        note: "Six porcelain plates carrying the holly and berry border that has run in family china for decades. Six is the useful number: enough for a table, small enough to store between seasons, and the cream ground lets them sit beside plain white plates without a contest. The red rim does the decorating for you, which is the whole point of festive china.",
      },
    ],
  },
  {
    heading: "The walls",
    products: [
      {
        id: 450,
        name: "Vintage Gold Framed Reindeer Wall Art, 12 x 9.5",
        price: 17.49,
        rating: 4.7,
        productUrl: "/product/vintage-gold-framed-reindeer-wall-art",
        amazonUrl: "https://www.amazon.com/dp/B0FMJYJVH1?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/61mas0X5e7L._AC_SL1500_.jpg",
        note: "A small framed painting of a reindeer with a wink in its expression, in a gold frame that suits warm rooms and old wood. At 12 by 9.5 inches it can lean on a shelf among books, hang in a hallway or sit above a sideboard, and that small scale is why it reads collected rather than themed. It can stay up through January without anybody noticing.",
      },
    ],
  },
];

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: BLOG_TITLE },
];

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: BLOG_H1,
  description: BLOG_DESCRIPTION,
  datePublished: DATE_PUBLISHED,
  dateModified: DATE_PUBLISHED,
  inLanguage: "en-US",
  image: `${SITE_URL}/og-image.jpg`,
  author: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
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

export const Route = createFileRoute("/blog/cozy-neutral-holiday-decor-finds")({
  head: () => {
    const seo = generateStaticMetadata(BLOG_TITLE, BLOG_DESCRIPTION, BLOG_PATH);
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

/** Pinterest tracking on affiliate clicks - mirrors ProductCard's pintrk call. */
function trackAmazonClick(product: BlogProduct) {
  if (typeof window !== "undefined" && "pintrk" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).pintrk("track", "lead", {
      event_id: `amz-click-${BLOG_SLUG}-${product.id}`,
      value: product.price ? Math.round(product.price * 100) / 100 : undefined,
      currency: "USD",
      line_items: [
        {
          product_name: product.name,
          product_id: String(product.id),
        },
      ],
    });
  }
}

/** Rating stars - same markup/styling as ProductCard. */
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium text-warm-dark">{rating}</span>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill={i < Math.round(rating) ? "#C9B99A" : "none"}
            stroke={i < Math.round(rating) ? "#C9B99A" : "#C9B99A"}
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    </div>
  );
}

function ProductEntry({
  product,
  index,
}: {
  product: BlogProduct;
  index: number;
}) {
  const priceLabel = formatPrice(product.price);
  const pinDescription = `${product.name}, a beautiful find for your home at just ${priceLabel}. Shop the look!`;

  return (
    <div
      id={`product-${product.id}`}
      className="rounded-2xl border border-beige/20 bg-white p-5 shadow-sm ring-1 ring-beige/10 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row">
        <a
          href={product.productUrl}
          className="mx-auto block w-full max-w-[210px] shrink-0 sm:mx-0 sm:w-44"
        >
          <img
            src={product.imageUrl}
            alt={`${product.name} - Evergreen House`}
            className="aspect-square w-full rounded-xl object-contain p-2"
            loading="lazy"
            decoding="async"
            data-pin-description={pinDescription}
            data-pin-url={product.amazonUrl}
          />
        </a>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-semibold leading-snug text-warm-dark">
            <span className="mr-1.5 text-taupe">{index}.</span>
            <a
              href={product.productUrl}
              className="transition-colors hover:text-terracotta"
            >
              {product.name}
            </a>
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <RatingStars rating={product.rating} />
            <span className="text-sm font-semibold text-terracotta">
              {priceLabel}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-warm-gray sm:text-base">
            {product.note}
          </p>
          <a
            href={product.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-sage-dark"
            onClick={() => trackAmazonClick(product)}
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
      </div>
    </div>
  );
}

function BlogPost() {
  let counter = 0;

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
            </p>
            <p className="mt-7 text-lg leading-relaxed text-warm-gray">
              {INTRO}
            </p>
          </header>

          {SECTIONS.map((section) => (
            <section key={section.heading} className="mt-12">
              <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
                {section.heading}
              </h2>
              <div className="mt-6 space-y-8">
                {section.products.map((product) => {
                  counter += 1;
                  return (
                    <ProductEntry
                      key={product.id}
                      product={product}
                      index={counter}
                    />
                  );
                })}
              </div>
            </section>
          ))}

          <section className="mt-14">
            <p className="text-lg leading-relaxed text-warm-gray">{CLOSING}</p>
            <p className="mt-6 text-sm font-medium">
              <a
                href="/collections"
                className="text-terracotta hover:underline"
              >
                Browse the full collections
              </a>
              <span aria-hidden="true" className="mx-2 text-beige">
                ·
              </span>
              <a
                href="/room/holiday"
                className="text-terracotta hover:underline"
              >
                See the whole holiday edit
              </a>
            </p>
          </section>

          <p className="mt-12 border-t border-beige/30 pt-6 text-xs italic leading-relaxed text-taupe">
            {DISCLOSURE}
          </p>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
          />
        </div>
      </article>
    </main>
  );
}
