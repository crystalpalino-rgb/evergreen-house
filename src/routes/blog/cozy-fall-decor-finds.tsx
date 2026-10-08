import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/schema";

/**
 * Blog post: "13 Cozy Fall Decor Finds (No Orange Plastic)"
 *
 * Copy is owner-approved (draft: /home/team/shared/blog-drafts/fall-decor-finds.md).
 * Product facts (ids, prices, ratings, product-page URLs, amazon_urls, image_urls)
 * come from section 6 of that draft and are hardcoded here on purpose: the page is
 * static editorial content and must not depend on catalog state.
 */

const BLOG_SLUG = "cozy-fall-decor-finds";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "Cozy Fall Decor Finds That Feel Like Autumn";
const BLOG_H1 = "13 Cozy Fall Decor Finds (No Orange Plastic)";
const BLOG_DESCRIPTION =
  "Thirteen cozy fall decor finds - knit textures, felt pumpkins, terracotta and warm light - that make a home feel like autumn without one plastic prop.";
const DATE_PUBLISHED = "2026-10-08";
const DATE_PUBLISHED_LABEL = "October 8, 2026";

const INTRO =
  "There is a version of fall decorating that has nothing to do with plastic pumpkins. It is a runner the colour of terracotta on a bare wood table, a felt garland hung over a mantel, dried stems in a stone vase, and a throw heavy enough that a sofa becomes somewhere you stay. Warm light, texture and a little green do more for a room in October than any ornament does. Below are the thirteen pieces we would put out first, all of them from our fall edit, and the ones we would happily leave out until spring.";

const CLOSING =
  "None of this asks you to replace anything you own. Warm the light, warm the table, add one thing you can actually feel with your hands, and the room reads autumn. Every piece here is a small decision rather than a seasonal overhaul, and most of it folds away in December.";

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
    heading: "Light on the mantel",
    products: [
      {
        id: 427,
        name: "6 Ft Fall Garland with Lights and Timer",
        price: 20.97,
        rating: 4.5,
        productUrl:
          "/product/6-ft-fall-garland-with-lights-timer-thanksgiving-fireplace-mantel-decor",
        amazonUrl: "https://www.amazon.com/dp/B0H4L95SHP?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/81Abg-pnlfL._AC_SL1500_.jpg",
        note: "The quickest way to make a room feel like autumn is to lower the light slowly. This is six feet of garland with thirty warm LEDs already woven through and a built-in timer, so it comes on at dusk and switches itself off. Drape it along a mantel, a shelf or a stair rail: the garland does the styling for you. No outlet hunting, no cord across the floor.",
      },
      {
        id: 455,
        name: "Felt Pumpkin Bead Garland",
        price: 12.99,
        rating: 4.6,
        productUrl: "/product/felt-pumpkin-bead-garland-for-fall",
        amazonUrl: "https://www.amazon.com/dp/B0C1FJHYXQ?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/71hLmJHh2eL._AC_SL1500_.jpg",
        note: "Felted pumpkins threaded on a bead garland, soft and matte rather than shiny, and it drapes over a mantel or a bookshelf in about ten seconds. Because it is felt and jute-toned instead of bright orange, it reads handmade, and it sits happily beside whatever books and candles are already on the shelf. It packs flat, so it comes back out every October.",
      },
      {
        id: 457,
        name: "MacKenzie-Childs Resin Acorn Figurines Set",
        price: 49.95,
        rating: 4.5,
        productUrl: "/product/mackenzie-childs-resin-acorn-figurines-set",
        amazonUrl: "https://www.amazon.com/dp/B0D637NJ9X?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/71zGXXLBfEL._AC_SL1500_.jpg",
        note: "The small piece that makes a mantel or a bowl look considered rather than decorated. Two resin acorns in brown and white check, at home in a wooden bowl with a pillar candle or resting on a stack of books. This one costs more than a garland and does far less obvious work, which is precisely why the surface ends up looking collected instead of themed.",
      },
    ],
  },
  {
    heading: "The table",
    products: [
      {
        id: 415,
        name: "Terracotta Cheesecloth Table Runner",
        price: 7.99,
        rating: 4.7,
        productUrl:
          "/product/fall-table-runner-terracotta-cheesecloth-boho-wedding-thanksgiving-decor",
        amazonUrl: "https://www.amazon.com/dp/B09WXZWSN3?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/71xDo3YRpBL._AC_SL1500_.jpg",
        note: "A 35 by 120 inch cheesecloth runner in terracotta, long enough to hang off both ends of a dining table and light enough to see the wood through. It is the cheapest change on this list and the one that shifts a table from summer to fall: warmth under the plates, no centrepiece required. Washable, so it earns its keep again at Thanksgiving.",
      },
      {
        id: 410,
        name: "Terracotta Pumpkins, Set of 2",
        price: 27.99,
        rating: 4.6,
        productUrl:
          "/product/dn-deconation-fall-pumpkin-decor-thanksgiving-decorations-for-home-table",
        amazonUrl: "https://www.amazon.com/dp/B0GXTY6253?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/71FBfnS-D6L._AC_SL1500_.jpg",
        note: "Two pumpkins in a matte terracotta finish, one round and one tall, sized for a table rather than a porch step. Because they are the colour of clay rather than bright orange, they sit easily with wood, linen and white dishes: put them on the runner with a candle and the table is done. Weighted enough to stay where you place them.",
      },
      {
        id: 411,
        name: "Burnt Orange Faux Floral Stems",
        price: 29.99,
        rating: 4.6,
        productUrl:
          "/product/faux-fall-flowers-burnt-orange-artificial-floral-stems-for-vase",
        amazonUrl: "https://www.amazon.com/dp/B0C9HKVCW4?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/71D5lzALVFL._AC_SL1500_.jpg",
        note: "Real stems in late October are expensive and short-lived, which is the honest argument for these: kiku blooms, burgundy accents and brown eucalyptus in one bundle. Drop them into a stone or ceramic vase on a console and they carry the room through Thanksgiving. Arrange them loosely. A tight bouquet reads artificial; a loose one reads gathered.",
      },
    ],
  },
  {
    heading: "The sofa",
    products: [
      {
        id: 456,
        name: "Beige Pumpkin Pillow Covers, Set of 2",
        price: 7.0,
        rating: 4.6,
        productUrl: "/product/beige-pumpkin-pillow-covers-18x18-set-of-2",
        amazonUrl: "https://www.amazon.com/dp/B0FH6PP3KW?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/8191Un1pdXL._AC_SL1500_.jpg",
        note: "Two 18 inch linen and cotton covers in beige with a quiet pumpkin shape worked into the weave. The restraint is the point: subtle enough to leave on the sofa through November, seasonal enough that the room has visibly changed. Because they are covers rather than filled pillows, they fold into a drawer in December.",
      },
      {
        id: 416,
        name: "Rust Orange Pumpkin Pillow Covers, Set of 2",
        price: 13.99,
        rating: 4.6,
        productUrl:
          "/product/softalker-fall-throw-pillow-covers-18x18-set-of-2-rust-orange-pumpkin-decor",
        amazonUrl: "https://www.amazon.com/dp/B0F6C8L1LR?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/81pG+yI6E3L._AC_SL1500_.jpg",
        note: "Rust orange in the same 18 inch size, for anyone who wants one honest hit of autumn colour. Layer these behind the beige covers so the rust only shows at the edges, and the sofa looks styled rather than themed. Double-sided, so they can be turned when one face has had a season of use.",
      },
      {
        id: 236,
        name: "Textured Boucle Pillow Covers, Set of 2 (Camel, 12 x 20)",
        price: 15.27,
        rating: 4.6,
        productUrl: "/product/foindtower-pack-of-2-textured-boucle-fall",
        amazonUrl: "https://www.amazon.com/dp/B0BYMDX598?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/816IeEq0eDL._AC_SL1500_.jpg",
        note: "A camel boucle lumbar is how you make a plain sofa or a leather chair look layered. The looped texture does the work a print would otherwise do, and the neutral tone means it stays out all year; from October it sits in front of a heavier throw. Two in the pack covers both ends of a sofa or one end of two chairs.",
      },
      {
        id: 237,
        name: "MIULEE 12 x 20 Lumbar Pillow Insert",
        price: 9.99,
        rating: 4.5,
        productUrl: "/product/miulee-pillow-insert-12x20-inch-decorative-fall",
        amazonUrl: "https://www.amazon.com/dp/B0BN5VRGS6?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/71bvN7Lb2JL._AC_SL1500_.jpg",
        note: "The unglamorous half of the pillow equation. A 12 by 20 insert with enough fill to hold a rectangular cover upright instead of letting it sag at both ends. One insert per cover is the rule, and a full insert is the difference between a styled sofa and a limp one. Buy it with the covers and you skip the second order.",
      },
    ],
  },
  {
    heading: "The bed",
    products: [
      {
        id: 232,
        name: "Bedsure Oversized Queen Duvet Cover, White",
        price: 29.99,
        rating: 4.5,
        productUrl: "/product/bedsure-duvet-cover-oversized-queen-fall",
        amazonUrl: "https://www.amazon.com/dp/B0D3LL9T12?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/8167xAJl5-L._AC_SL1500_.jpg",
        note: "An oversized cut is the detail that makes a bed look made on purpose: this one drapes past the mattress edge instead of stopping short of it, which is what the photos never explain. Double brushed, so it is soft from the first night, and it comes in a white that takes a heavier throw at the foot without any pattern conflict. Three pieces, two shams included.",
      },
    ],
  },
  {
    heading: "The one thing you drape",
    products: [
      {
        id: 235,
        name: "Hyde Lane Faux Rabbit Fur Throw, 60 x 80",
        price: 54.99,
        rating: 4.2,
        productUrl: "/product/hyde-lane-soft-faux-rabbit-fall",
        amazonUrl: "https://www.amazon.com/dp/B0CDJS8CZG?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/91LwQXjmW0L._AC_SL1500_.jpg",
        note: "Faux rabbit has the closest pile to the real thing, dense and short, and it stays soft after washing. At 60 by 80 inches it covers a lap and still falls over the back of a chair, which is what makes a corner look lived in rather than staged. In Brun rabbit, it warms a pale room without introducing a single new colour. Note the 4.2 rating: this is the pick for pure texture, not the highest-rated item in the room.",
      },
    ],
  },
  {
    heading: "A small green thing",
    products: [
      {
        id: 239,
        name: "Natural Moss Decorative Balls, Set of 6",
        price: 14.99,
        rating: 4.4,
        productUrl: "/product/byher-natural-green-moss-decorative-ball",
        amazonUrl: "https://www.amazon.com/dp/B071NV81GH?tag=crystalcost09-20",
        imageUrl:
          "https://m.media-amazon.com/images/I/71btQoF-6dS._AC_SL1500_.jpg",
        note: "One preserved moss ball in a shallow dish beside a candle settles a whole coffee table, and six of them fill a bowl for less than a bouquet. Natural green against terracotta and wood is the combination that keeps fall decor looking grown up rather than themed. No water, no arrangement, no vase required.",
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

export const Route = createFileRoute("/blog/cozy-fall-decor-finds")({
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
              <a href="/room/fall" className="text-terracotta hover:underline">
                See the whole fall edit
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
