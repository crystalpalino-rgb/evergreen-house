import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/schema";

/**
 * Blog post: "15 Cheap Things That Make Your Home Look Expensive"
 *
 * Copy is owner-approved (draft: /home/team/shared/blog-drafts/cheap-things-home-looks-expensive.md).
 * Product facts (ids, prices, ratings, product-page URLs, amazon_urls, image_urls)
 * come from section 6 of that draft and are hardcoded here on purpose: the page is
 * static editorial content and must not depend on catalog state.
 */

const BLOG_SLUG = "cheap-things-that-make-your-home-look-expensive";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "Cheap Things That Make Your Home Look Expensive";
const BLOG_H1 = "15 Cheap Things That Make Your Home Look Expensive";
const BLOG_DESCRIPTION =
  "Fifteen budget home decor finds - mirrors, lamps, trays, candlelight - that make a room look considered, not costly. Editor-picked, all under $85.";
const DATE_PUBLISHED = "2026-10-03";
const DATE_PUBLISHED_LABEL = "October 3, 2026";

const INTRO =
  "There's a particular kind of room that reads expensive without a single expensive thing in it. It's usually the light - a mirror placed where the window light lands, a lamp at the right height, the weight of wood and linen and stone doing work that a bigger budget normally does. Here are fifteen pieces we'd buy again, all under $85, chosen because each one changes how a room feels rather than how much it cost.";

const CLOSING =
  "None of this is about buying more. Pick the room you use most, fix the light and the surface first, and the rest of it starts to take care of itself.";

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
    heading: "Light and reflection (the two-minute fix)",
    products: [
      {
        id: 12,
        name: "30-Inch Round Mirror with Slim Gold Frame",
        price: 62.99,
        rating: 4.8,
        productUrl: "/product/30-inch-round-bathroom-mirror-wall",
        amazonUrl: "https://www.amazon.com/dp/B0C85XTX4D?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/7159Bk2NBJL._AC_SL1500_.jpg",
        note: "Thirty inches is the size where a round mirror stops being decoration and starts changing the light in a room: it catches a window and throws it back across the wall. It works over a bathroom vanity, above an entryway console, or at the end of a hallway that never had a focal point. The frame is slim, gold and unornamented, which is exactly why it reads far more expensive than it is.",
      },
      {
        id: 30,
        name: "71-Inch Arched Gold Floor Mirror",
        price: 69.55,
        rating: 4.6,
        productUrl: "/product/mirror-full-length-71-x",
        amazonUrl: "https://www.amazon.com/dp/B0GR5BK6XR?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/813vqaSMlCL._AC_SL1500_.jpg",
        note: "A tall arched floor mirror is the one accessory that makes a bedroom feel like a hotel suite. At 71 by 26 inches this one stands on its own frame instead of being drilled into a wall, so it moves with you. Gold-finished and large enough to reflect an entire wall, it does the job of a piece of furniture at a fraction of the price.",
      },
      {
        id: 182,
        name: "SUNMORY Floor Lamps for Living Room",
        price: 45.98,
        rating: 4.6,
        productUrl: "/product/sunmory-floor-lamps-for-living-room-hn4g",
        amazonUrl: "https://www.amazon.com/dp/B0DSBVYSZV?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/71Cy12mRz5L._AC_SL1500_.jpg",
        note: "The cheapest way to make a dark corner look intentional is to put a lamp in it, and this arc lamp does it without eating floor space. Two interchangeable shades - rattan for warmth, fabric for something more tailored - a slim wooden stem with a small built-in shelf, and a 12W LED bulb with three colour temperatures in the box. Warm light in the evening, brighter for reading, no rewiring, no ceiling work.",
      },
      {
        id: 52,
        name: "Industrial Table Lamp for Bedroom (Set of 2)",
        price: 49.98,
        rating: 4.6,
        productUrl: "/product/industrial-table-lamp-for-bedroom",
        amazonUrl: "https://www.amazon.com/dp/B0CYSJVJB7?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/61-wRkKYyyL._AC_SL1500_.jpg",
        note: "Two matching bedside lamps with clear glass shades and gold-toned bases are the fastest way to make a bedroom look finished - mismatched lamps are what make a room look improvised. These dim fully, and each base hides a USB port and an outlet so the charging-cable tangle disappears. Under $25 a lamp, and they read like proper lighting.",
      },
    ],
  },
  {
    heading: "One tall green thing",
    products: [
      {
        id: 34,
        name: "Artificial Olive Trees 7 ft Tall",
        price: 84.99,
        rating: 4.6,
        productUrl: "/product/artificial-olive-trees-7-ft-tall",
        amazonUrl: "https://www.amazon.com/dp/B0C14TLV13?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/61kC2GJETiL._AC_SL1500_.jpg",
        note: "Faux plants usually announce themselves; olive foliage is sparse and silvery enough that it doesn't. This seven-footer with variegated leaves and a slim trunk is the closest we've found to the real thing, and it arrives in a white planter. It adds height to a living room corner without blocking the light that makes everything else in the room look good.",
      },
      {
        id: 37,
        name: "SIDUCAL Ceramic Rustic Farmhouse Vase",
        price: 24.69,
        rating: 4.7,
        productUrl: "/product/siducal-ceramic-rustic-farmhouse-vase",
        amazonUrl: "https://www.amazon.com/dp/B0DD3CY6XX?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/71vNoDzZzQL._AC_SL1500_.jpg",
        note: "A matte, reactive glaze in warm stone is what separates a vase that looks handmade from one that looks mass-produced, and this six-inch piece has it. It takes a generous arrangement of dried stems or a single branch just as happily, and it looks settled the moment it lands on a shelf. Buy one for the console, then borrow it for the dinner table.",
      },
    ],
  },
  {
    heading: "Texture you can feel",
    products: [
      {
        id: 270,
        name: "Chunky Chenille Knit Throw, Olive",
        price: 37.99,
        rating: 4.6,
        productUrl:
          "/product/evergracehome-chunky-chenille-knit-throw-blanket-for-couch-soft-luxurious-moss-stitch-chair-blankets-for-bed-cozy-decora",
        amazonUrl: "https://www.amazon.com/dp/B0DRCHR48S?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/81iSCjC9l1L._AC_SL1500_.jpg",
        note: "Nothing makes a sofa look better spent-on than a heavy knit throw folded over one arm. This moss-stitch chenille throw adds the texture plain upholstery doesn't have, and the muted olive works with almost any neutral. Keep it out all year rather than packed away with the seasonal things.",
      },
      {
        id: 24,
        name: "StorageWorks Scalloped Wicker Basket, Woven Baskets (2 Pack)",
        price: 38.99,
        rating: 4.7,
        productUrl: "/product/storageworks-scalloped-wicker-basket-woven-baskets",
        amazonUrl: "https://www.amazon.com/dp/B0CM9F8171?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/71nW-MRvloL._AC_SL1500_.jpg",
        note: "Open shelving full of packaging is what makes a kitchen look busy. Two woven water-hyacinth baskets with cut-out handles hide the clutter and add the warm natural texture that makes a shelf feel styled instead of full. The scalloped edge is the detail that lifts them above plain storage - these are the ones we'd leave in sight.",
      },
      {
        id: 419,
        name: "NUPTIO Wooden Taper Candle Holders, Set of 3 Brown Candlesticks",
        price: 25.99,
        rating: 4.7,
        productUrl: "/product/nuptio-wooden-taper-candle-holders-set-of-3-brown-candlesticks",
        amazonUrl: "https://www.amazon.com/dp/B0FJRQ1V4N?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/613H456ngkL._AC_SL1500_.jpg",
        note: "Candles on their own can look like a birthday; candles in the right holders look like a restaurant. Three warm-walnut taper holders at three heights give a dining table or a mantel a clean mid-century line, and they photograph beautifully. A little over twenty-five dollars of candlelight changes a room more than almost anything else at this price.",
      },
    ],
  },
  {
    heading: "The details that finish a room",
    products: [
      {
        id: 272,
        name: "Brass Hurricane Candle Holders with Glass Domes, Set of 2",
        price: 29.99,
        rating: 4.7,
        productUrl:
          "/product/5-4-metal-candle-holder-with-handmade-glass-dome-in-brass-2-timer-candles-set-of-2-versatile-hurricane-glass-candle-hold",
        amazonUrl: "https://www.amazon.com/dp/B0F52BN9SB?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/81pfK6+djCL._AC_SL1500_.jpg",
        note: "Handmade glass domes on brass bases read as glassware rather than hardware, which is why they look far more expensive than they cost. Each fits a pillar candle up to five inches, and two battery timer candles come in the box so they work the moment they arrive. Turned over, the dome becomes a cloche for a small plant or a stack of pretty objects.",
      },
      {
        id: 46,
        name: "Umbra Sticks Wall Mounted Coat Rack",
        price: 30.0,
        rating: 4.6,
        productUrl: "/product/umbra-sticks-wall-mounted-coat-rack",
        amazonUrl: "https://www.amazon.com/dp/B005M8YWOK?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/61d71NuvLTL._AC_SL1500_.jpg",
        note: "An entryway with nowhere to put a coat becomes a pile on the floor within a day. Umbra's Sticks rail solves it with five pegs that fold flat when they're empty, so the wall stays clean and you rarely need to think about it. Black, sculptural and narrow enough for a hallway - the practical piece that also happens to look designed.",
      },
      {
        id: 64,
        name: "Real Natural Travertine Tray for Bathroom",
        price: 34.99,
        rating: 4.8,
        productUrl: "/product/real-natural-travertine-tray-for-bathroom",
        amazonUrl: "https://www.amazon.com/dp/B0D4F49TZV?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/61LJj74Qz1L._AC_SL1500_.jpg",
        note: "Real travertine, not resin pretending to be stone, is what makes this tray worth the price. It corrals a soap dispenser, a candle and a folded towel on a bathroom counter, and it moves to a kitchen or a desk when you want the same warm beige stone there. Countertops look hotel-level when the small things are grouped on one tray instead of scattered.",
      },
      {
        id: 307,
        name: "Luxury Leather Tray Organizer Valet Tray",
        price: 22.99,
        rating: 4.7,
        productUrl:
          "/product/luxury-leather-tray-organizer-valet-tray-key-tray-for-entryway-table-desktop-storage-catchall-tray-decorative-tray-for-j",
        amazonUrl: "https://www.amazon.com/dp/B0922F9F5Z?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/61HhpR9TwhL._AC_SL1500_.jpg",
        note: "A catchall on the entryway table is the difference between keys thrown down and keys placed. This khaki leather tray with gilded metal corners holds a wallet, watch and phone on a nightstand or a console, and it reads far more considered than a dish. It's the small piece that makes daily clutter look deliberate.",
      },
      {
        id: 28,
        name: "HOMESPHERE Acacia Wood Cake Stand with Lid",
        price: 59.9,
        rating: 4.8,
        productUrl: "/product/homesphere-acacia-wood-cake-stand",
        amazonUrl: "https://www.amazon.com/dp/B0BQNCXSRX?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/91QM5EfD+1L._AC_SL1500_.jpg",
        note: "One acacia board with a clear acrylic dome works as a cake stand, and the base flips over as a charcuterie platter - two serving pieces in one. On a dining table or a kitchen island it makes a spread look styled rather than assembled, and it keeps whatever's under the dome fresh. A wooden board is the fastest way to warm up a table of white plates.",
      },
      {
        id: 302,
        name: "Sage Felt Bulletin Board Tiles",
        price: 31.99,
        rating: 4.8,
        productUrl:
          "/product/large-cork-board-alternative-48-x-36-felt-bulletin-board-tiles-with-30-pushpins-70-adhesive-tabs-fine-stripe-12-pack-cor",
        amazonUrl: "https://www.amazon.com/dp/B0F4RNKLJ2?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/81uxwMiaSGL._AC_SL1500_.jpg",
        note: "A desk wall covered in cork says office; the same wall in soft sage felt looks like a design decision. Twelve tiles go up in about twenty minutes with the included adhesive tabs, and they come down without damage, so renters can have one too. It's the practical piece that also softens a workspace.",
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

export const Route = createFileRoute("/blog/cheap-things-that-make-your-home-look-expensive")({
  head: () => {
    const seo = generateStaticMetadata(BLOG_TITLE, BLOG_DESCRIPTION, BLOG_PATH);
    return { meta: seo.meta, links: seo.links };
  },
  component: BlogPost,
});

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
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
            <a href={product.productUrl} className="transition-colors hover:text-terracotta">
              {product.name}
            </a>
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <RatingStars rating={product.rating} />
            <span className="text-sm font-semibold text-terracotta">{priceLabel}</span>
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
            <p className="mt-7 text-lg leading-relaxed text-warm-gray">{INTRO}</p>
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
                    <ProductEntry key={product.id} product={product} index={counter} />
                  );
                })}
              </div>
            </section>
          ))}

          <section className="mt-14">
            <p className="text-lg leading-relaxed text-warm-gray">{CLOSING}</p>
            <p className="mt-6 text-sm font-medium">
              <a href="/collections" className="text-terracotta hover:underline">
                Browse the full collections
              </a>
              <span aria-hidden="true" className="mx-2 text-beige">
                ·
              </span>
              <a href="/room/living-room" className="text-terracotta hover:underline">
                Start with the living room
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
