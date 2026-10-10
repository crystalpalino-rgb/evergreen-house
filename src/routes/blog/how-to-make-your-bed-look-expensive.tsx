import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/schema";
import { trackAffiliateClick } from "~/lib/analytics";

/**
 * Blog post: "13 Small Things That Make Your Bed Look Expensive"
 *
 * Copy is owner-approved (draft: /home/team/shared/blog-drafts/how-to-make-your-bed-look-expensive.md).
 * Product facts (ids, prices, ratings, product-page URLs, amazon_urls, image_urls)
 * come from section 6 of that draft and are hardcoded here on purpose: the page is
 * static editorial content and must not depend on catalog state.
 * Every product is catalogued to the bedroom room; product page URLs were curl
 * verified at HTTP 200 on 2026-10-09.
 */

const BLOG_SLUG = "how-to-make-your-bed-look-expensive";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "13 Things That Make Your Bed Look Expensive";
const BLOG_H1 = "13 Small Things That Make Your Bed Look Expensive";
const BLOG_DESCRIPTION =
  "Thirteen bedroom finds - deep pocket sheets, an oversized duvet, layered pillows and a knit throw - that make a bed look expensive without a new mattress.";
const DATE_PUBLISHED = "2026-10-10";
const DATE_PUBLISHED_LABEL = "October 10, 2026";

const INTRO =
  "A bed does not read expensive because of the mattress. It reads expensive because of four things you can see: fabric that falls past the frame instead of stopping at the corner, pillows that stand up in layers rather than lying flat, one texture you want to touch, and a bedside table with nothing loose on it. That is the whole trick, and none of it requires replacing the bed you already own. Below are the thirteen pieces we would buy for a queen bed in order of how much difference they make, from a nine dollar sheet to the one linen splurge, all of it from our bedroom edit.";

const CLOSING =
  "You do not need a new bed to make the one you have look considered. Let the fabric fall past the frame, build the pillows up in three layers, fold one throw across the foot, and give the bedside table a single place for everything to land. Those are four small decisions, and they are the difference between a bed that is made and a bed that looks styled.";

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
    heading: "Start with what the fabric sits on",
    products: [
      {
        id: 25,
        name: "Utopia Bedding Queen Deep Pocket Fitted Sheet, White",
        price: 9.99,
        rating: 4.6,
        productUrl: "/product/utopia-bedding-queen-fitted-sheet-bottom",
        amazonUrl: "https://www.amazon.com/dp/B00XK9CO16?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/71UMsb6UYKL._AC_SL1500_.jpg",
        note: "What makes a bed look expensive on camera is that nothing has slipped. A deep pocket fitted sheet is the unglamorous half of that: cut for a mattress with a topper or a thicker profile, so the corners stay down through the night instead of popping loose by morning. This one is a soft white microfiber made to resist shrinking and fading in the wash. It is sold as the fitted sheet alone, which is honest, because that is the piece that wears out first.",
      },
      {
        id: 196,
        name: "Utopia Bedding Queen Comforter Duvet Insert, White",
        price: 22.46,
        rating: 4.6,
        productUrl: "/product/utopia-bedding-queen-comforter-duvet-insert-3d2v",
        amazonUrl: "https://www.amazon.com/dp/B00S1TC442?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/813dSy5zzWL._AC_SL1500_.jpg",
        note: "A duvet cover is only ever as good as what is inside it. This quilted insert is box stitched, so the fill stays where it belongs instead of sliding into one end, and the corner tabs tie into a cover so nothing bunches at the foot of the bed. At 88 by 88 inches it sits neatly inside a standard queen cover. Used on its own as a white comforter it already reads clean and calm, which is most of the look.",
      },
    ],
  },
  {
    heading: "The cover is the whole look",
    products: [
      {
        id: 493,
        name: "MaiR\u00eave Embroidered Queen Comforter Set, 7 Pieces (Brown)",
        price: 68.99,
        rating: 4.4,
        productUrl:
          "/product/mair-ve-embroidery-queen-comforter-set-7-pieces-brown-bed-in-a-bag",
        amazonUrl: "https://www.amazon.com/dp/B0FFT3H29W?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/81F-H6WjA+L._AC_SL1500_.jpg",
        note: "The fastest route to a bed that looks arranged: one order, one brown tone, and nothing on the bed that nearly matches. This seven piece set brings the comforter, flat and fitted sheets, two shams and two pillowcases, so the whole bed is covered at once. The chain stitch embroidery and the pre washed fabric read relaxed rather than pressed, which is exactly what keeps brown bedding from turning heavy. It suits a primary bedroom or a guest room that has to be ready for anyone.",
      },
      {
        id: 1,
        name: "Bedsure Oversized Queen Duvet Cover, White",
        price: 29.99,
        rating: 4.5,
        productUrl: "/product/bedsure-duvet-cover-oversized-queen",
        amazonUrl: "https://www.amazon.com/dp/B0D3LL9T12?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/8167xAJl5-L._AC_SL1500_.jpg",
        note: "An oversized cut is the detail the listing photos never explain. This white cover measures 98 by 98 inches, so the fabric falls past the mattress on three sides instead of stopping short at the corner, and that extra drop is what makes a standard frame look properly dressed. Double brushed, so it is soft from the first night, with a zipper closure and two matching shams. It is the quiet base that makes styling a bed feel easy rather than fussy.",
      },
      {
        id: 271,
        name: "Simple&Opulence Washed French Flax Linen Duvet Cover Set, 3 Pieces",
        price: 142.99,
        rating: 4.5,
        productUrl:
          "/product/simple-opulence-100-french-flax-linen-duvet-cover-set-with-embroidery-washed-3-pieces-1-duvet-cover-with-2-pillow-shams-",
        amazonUrl: "https://www.amazon.com/dp/B01L8BZIMO?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/71+B-QgK4fL._AC_SL1500_.jpg",
        note: "The one item here we would call a splurge, and the one that ages best. One hundred percent French flax, washed before it ships, so it arrives with the soft rumpled hand that usually takes months of laundering to earn. Button closure and corner ties hold it square on the insert, and the only ornament is the embroidery along the shams. It runs king, which also dresses a queen generously if you like a fuller drape.",
      },
    ],
  },
  {
    heading: "Pillows, in three layers",
    products: [
      {
        id: 27,
        name: "Utopia Bedding Gusseted Bed Pillows, Set of 2",
        price: 30.59,
        rating: 4.5,
        productUrl: "/product/utopia-bedding-bed-pillows-for-sleeping",
        amazonUrl: "https://www.amazon.com/dp/B0B8CZ98Q6?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/6145-k9xSPL._AC_SL1500_.jpg",
        note: "Hotel quality is a shape rather than a thread count. A gusseted edge gives each pillow a firmer perimeter, so two of them stand up inside shams instead of collapsing into the duvet, and the down alternative fill stays soft for stomach sleepers while still substantial for back and side sleepers. They hold their loft after a wash, which is rarer than it should be. This is the honest set of two that sits underneath everything else on the bed.",
      },
      {
        id: 433,
        name: "Foindtower Textured Chenille Pillow Covers, Cream 20 x 20, Set of 2",
        price: 20.99,
        rating: 4.6,
        productUrl: "/product/foindtower-textured-chenille-pillow-covers-cream-20x20",
        amazonUrl: "https://www.amazon.com/dp/B0DFC125QF?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/81kL2O6aTCL._AC_SL1500_.jpg",
        note: "The third layer is what separates a made bed from a styled one. These cream chenille covers have a raised texture that catches light differently through the day, so the bed reads warmer in the evening than it did at noon, and the squares sit in front of the sleeping pillows where a print would otherwise go. Sold as a set of two. Cream gives a little light back to a dark duvet without competing with it.",
      },
      {
        id: 197,
        name: "Foindtower Textured Boucle Covers, Camel 12 x 20, Set of 2",
        price: 15.27,
        rating: 4.6,
        productUrl: "/product/foindtower-pack-of-2-textured-boucle-78oc",
        amazonUrl: "https://www.amazon.com/dp/B0BYMDX598?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/816IeEq0eDL._AC_SL1500_.jpg",
        note: "A boucle cover adds texture without adding a pattern, which is why a camel pair works as well on a neutral bed as it does on a sofa. These 12 by 20 lumbar covers fit the standard long accent cushion, and two of them give you symmetry at either end of the arrangement. The looped pile is the thing you notice in person. It is also the reason the bed stops reading as one flat plane of fabric.",
      },
      {
        id: 43,
        name: "MIULEE 12 x 20 Pillow Inserts, Set of 2",
        price: 22.99,
        rating: 4.5,
        productUrl: "/product/miulee-set-of-2-throw-pillow",
        amazonUrl: "https://www.amazon.com/dp/B0CSFH37PN?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/71clKaivRIL._AC_SL1500_.jpg",
        note: "The unglamorous half of the pillow equation, and the difference between a cover that looks tailored and one that looks tired. A 12 by 20 insert with enough plush fill to hold the rectangle upright, so the corners stay square instead of folding inward, and the fill does not work its way through a woven cover. Two in the pack covers a lumbar pair. Buy it with the covers and you skip the second order.",
      },
    ],
  },
  {
    heading: "The throw at the foot",
    products: [
      {
        id: 270,
        name: "EVERGRACEHOME Chunky Chenille Knit Throw, Olive Green 50 x 60",
        price: 37.99,
        rating: 4.6,
        productUrl:
          "/product/evergracehome-chunky-chenille-knit-throw-blanket-for-couch-soft-luxurious-moss-stitch-chair-blankets-for-bed-cozy-decora",
        amazonUrl: "https://www.amazon.com/dp/B0DRCHR48S?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/81iSCjC9l1L._AC_SL1500_.jpg",
        note: "A throw folded across the foot of the bed is the detail that finishes the room. This one is a chunky moss stitch in chenille, so it has real dimension rather than a printed texture, and the yarn is soft against the skin rather than scratchy, which is not true of every chunky knit. At 50 by 60 inches it covers the end of a bed without dragging on the floor. The olive sits comfortably beside cream, grey and wood.",
      },
    ],
  },
  {
    heading: "The two feet either side of the bed",
    products: [
      {
        id: 44,
        name: "Nathan James Mina Rattan Nightstand, Oak and Black",
        price: 69.99,
        rating: 4.4,
        productUrl: "/product/nathan-james-mina-rattan-wood",
        amazonUrl: "https://www.amazon.com/dp/B084HCTYZ7?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/81ftxS+z5kL._AC_SL1500_.jpg",
        note: "The side of the bed is part of the bed. A woven cane front softens a corner in a way painted wood cannot, and this rattan and oak table hides the bedside clutter, a book, reading glasses, a charger, behind the door. The black frame gives the light oak some structure. It stays small in footprint, which matters in a compact room, and it works beside a sofa later if the bedroom changes.",
      },
      {
        id: 52,
        name: "Dimmable Bedside Lamps with USB Ports, Set of 2",
        price: 49.98,
        rating: 4.6,
        productUrl: "/product/industrial-table-lamp-for-bedroom",
        amazonUrl: "https://www.amazon.com/dp/B0CYSJVJB7?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/61-wRkKYyyL._AC_SL1500_.jpg",
        note: "Lighting does more for a bedroom than any textile on this list. This pair carries USB ports and an outlet in the base, so phones charge where you sleep, and the dimmer drops to a low glow for reading without waking anyone. Gold bases and clear glass shades keep them looking like lighting rather than equipment. Buy the pair, because two mismatched lamps are the fastest way to undo an otherwise styled room.",
      },
      {
        id: 317,
        name: "Vixdonos Leather Valet Tray, Brown",
        price: 19.8,
        rating: 4.8,
        productUrl:
          "/product/vixdonos-leather-valet-tray-rectangular-catchall-tray-counter-organizer-for-key-jewelry-perfume-glasses-and-watches-brow",
        amazonUrl: "https://www.amazon.com/dp/B07TFJV9JJ?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/61hrHhaLHdL._AC_SL1234_.jpg",
        note: "The quiet reason a bedside table stays tidy: everything has somewhere to land. A shallow rectangle of brown leather carries a watch, reading glasses and a phone without looking like a dish, and it keeps all of it visible rather than piled. It holds its shape, so it still looks deliberate after a year of use. This is the least expensive item on the list and the one guests actually pick up.",
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

export const Route = createFileRoute("/blog/how-to-make-your-bed-look-expensive")({
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

function ProductEntry({ product, index }: { product: BlogProduct; index: number }) {
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
            rel="noopener noreferrer sponsored"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-sage-dark"
            onClick={() =>
              trackAffiliateClick({
                productId: product.id,
                name: product.name,
                price: product.price,
                context: `blog:${BLOG_SLUG}`,
                destinationUrl: product.amazonUrl,
                eventId: `amz-click-${BLOG_SLUG}-${product.id}`,
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
              <a href="/room/bedroom" className="text-terracotta hover:underline">
                See the whole bedroom edit
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
