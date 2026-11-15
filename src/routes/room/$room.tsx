import { createFileRoute, notFound, isNotFound, redirect } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { AnalyticsList } from "~/components/AnalyticsList";
import { PinterestViewContent } from "~/components/PinterestViewContent";
import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import { ContentUnavailable } from "~/components/ContentUnavailable";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { HolidaySets } from "~/components/HolidaySets";
import { StorefrontListCard } from "~/components/StorefrontListCard";
import { hideUnbuyableHolidayProducts } from "~/lib/holiday";
import { getProductsByRoom } from "~/lib/intelligence";
import {
  MERGED_COLLECTION_REDIRECTS,
  ROOM_ROUTE_REDIRECTS,
} from "~/lib/legacy-redirects";
import { getCollectionFAQs } from "~/lib/collection-faqs";
import { isRoomPublic } from "~/lib/room-visibility";
import { generateRoomMetadata } from "~/lib/seo";
import {
  getCollectionPageSchema,
  getFAQSchema,
  SITE_URL,
} from "~/lib/schema";
import { getRelatedRooms, ROOM_LABELS } from "~/lib/related";
import { getProductGraphSchema } from "~/lib/product-jsonld";
import { canonicalProductSlug } from "~/lib/product-slug";
import {
  RESET_LIST,
  SHOW_RESET_LIST,
  SHOW_UNDER19_ON_HOLIDAY_ROOM,
  UNDER19_LIST,
} from "~/lib/storefront-lists";
import type { Product } from "~/lib/types";

const roomLabels: Record<string, string> = {
  "living-room": "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  patio: "Patio",
  storage: "Organization",
  laundry: "Laundry",
  entryway: "Entryway",
  organization: "Organization",
  office: "Home Office",
  "dining-room": "Dining Room",
  pantry: "Pantry",
  holiday: "Holiday",
  summer: "Summer",
  fall: "Fall",
  spring: "Spring",
  nursery: "Nursery",
};

const roomPhotos: Record<string, string> = {
  "living-room": "/images/living-room.jpg",
  bedroom: "/images/bedroom.jpg",
  kitchen: "/images/kitchen.jpg",
  bathroom: "/images/bathroom.jpg",
  patio: "/images/patio.jpg",
  office: "/images/home-office.jpg",
  "dining-room": "/images/dining-room.jpg",
  storage: "/images/organization.jpg",
  entryway: "/images/living-room.jpg",
  laundry: "/images/organization.jpg",
  pantry: "/images/kitchen.jpg",
  /* The seasonal and organizing rooms reuse the collection art they are
     siblings of, so /room/<slug> and /collection/<slug> open on the same photo. */
  fall: "/images/collection-autumn-warmth-hero.jpg",
  holiday: "/images/room-holiday-hero-bright.jpg",
  organization: "/images/organization.jpg",
  spring: "/images/living-room.jpg",
  summer: "/images/patio.jpg",
};

const roomEditorial: Record<string, { intro: string; whatToLookFor: string[] }> = {
  "living-room": {
    intro: "The living room is where mornings begin and evenings settle - a space that should feel as comfortable as it looks. Our editors look for pieces with presence and purpose: seating that invites you to stay, lighting that warms rather than glares, and textures that reward a second glance. These are the finds that make a room feel collected over time, not decorated in a weekend.",
    whatToLookFor: [
      "Natural materials that grow more beautiful with age - linen, wood, stone, ceramic",
      "Lighting with warmth and dimension rather than a single overhead source",
      "Pieces that earn their footprint with both beauty and function",
      "A mix of heights and textures that keeps the eye moving across the room",
    ],
  },
  bedroom: {
    intro: "A bedroom should feel like a retreat from the rest of the world - quiet, personal, and restorative. The best bedrooms aren't decorated so much as they are layered: soft bedding you sink into, lighting that dims to a glow, and only the pieces that truly serve your rest. Everything here is chosen to help the room exhale.",
    whatToLookFor: [
      "Bedding in natural fibers that breathe and soften with every wash",
      "Bedside surfaces kept intentional - a beautiful catchall, a warm lamp, nothing more",
      "Soft, diffused lighting that signals calm rather than alertness",
      "Storage that conceals clutter so the room can breathe",
    ],
  },
  kitchen: {
    intro: "A kitchen works best when everything in it earns its place - tools you reach for daily, surfaces that welcome gathering, and the quiet beauty of things made well. Our editors gravitate toward pieces that bridge the practical and the beautiful: stoneware that moves from oven to table, glassware that feels substantial in hand, and the small details that make routine feel like ritual.",
    whatToLookFor: [
      "Materials that improve with use - wood, stoneware, cast iron, unlacquered brass",
      "Tools that do one thing exceptionally well rather than ten things poorly",
      "Serveware that transitions gracefully from weekday breakfast to weekend gathering",
      "Pieces beautiful enough to leave on the counter - function and display in one",
    ],
  },
  bathroom: {
    intro: "A bathroom can be more than functional - it can be the quiet reset in your day. The right pieces turn a utilitarian space into somewhere you linger: natural stone trays that hold daily essentials with intention, soft textiles underfoot, and storage that feels considered rather than clinical. Even the smallest bathroom deserves a touch of spa-like calm.",
    whatToLookFor: [
      "Natural stone, ceramic, and glass over plastic whenever possible",
      "Textiles in absorbent, natural fibers - thick cotton, linen, Turkish cotton",
      "Storage that keeps counters clear without feeling sterile",
      "Apothecary-inspired containers that elevate everyday essentials",
    ],
  },
  office: {
    intro: "A workspace at home should help you focus without feeling corporate. The best home offices balance clarity with warmth - surfaces that stay clear, accessories that bring quiet pleasure, and seating that supports long hours without sacrificing beauty. It's a room for deep work, not just a desk in a corner.",
    whatToLookFor: [
      "Desk accessories in materials you want to touch - leather, brass, linen",
      "Organization tools that are beautiful enough to leave out",
      "A chair that combines support with a timeless silhouette",
      "Lighting positioned for task work, not overhead glare",
    ],
  },
  patio: {
    intro: "An outdoor space extends the rhythm of home beyond four walls - a place for slow mornings with coffee and long evenings with conversation. Our editors look for pieces built to weather gracefully: materials that develop character in the elements, seating deep enough to linger in, and the small details that make the outdoors feel as considered as any interior room.",
    whatToLookFor: [
      "Weather-resistant materials that patina rather than degrade - teak, powder-coated metal, all-weather wicker",
      "Seating proportioned for comfort, not just efficiency",
      "Pieces that create distinct zones for dining, lounging, and gathering",
      "Outdoor-worthy textiles that add softness without constant worry",
    ],
  },
  entryway: {
    intro: "An entryway sets the tone before a single word is spoken. It's the first breath of home - a place to pause, shed the outside, and be welcomed. The best entryways are edited and intentional: a place for keys and mail that doesn't feel cluttered, a surface that holds what matters, and a sense of arrival that feels calm rather than chaotic.",
    whatToLookFor: [
      "A defined drop zone that corrals daily essentials without visual noise",
      "A mirror or reflective surface to bounce light and expand the space",
      "Natural materials that feel grounded - wood, stone, woven fibers",
      "Seating if the footprint allows, even a small bench or stool",
    ],
  },
  "dining-room": {
    intro: "A dining room is where the day's stories get told - across a weeknight dinner, a Sunday spread, or a quiet cup of coffee with one other person. The table itself matters, but so does everything around it: the weight of the glassware, the warmth of the lighting, the serveware that feels like part of the occasion. Each piece should feel like it belongs at the table, not just on a shelf.",
    whatToLookFor: [
      "A table that anchors the room with presence and proportion",
      "Lighting hung low and warm - a fixture that defines the space",
      "Serveware and glassware with weight and clarity, not delicacy",
      "Textiles that add softness - linen napkins, a runner, upholstered seating",
    ],
  },
  laundry: {
    intro: "A laundry room might be the most honest room in the house - it works hard and asks for little. But when it's thoughtfully put together, it becomes less of a chore and more of a rhythm. Simple, sturdy pieces that organize without overcomplicating: bins that sort, surfaces that fold, storage that makes the work feel lighter.",
    whatToLookFor: [
      "Sturdy, well-proportioned baskets and bins in natural materials",
      "Clear, accessible storage that makes sorting intuitive",
      "A folding surface at a comfortable height",
      "Small touches that make the space feel considered - a hook, a shelf, good lighting",
    ],
  },
  pantry: {
    intro: "A well-organized pantry is a quiet luxury - the kind that pays dividends every time you reach for an ingredient and find it exactly where it should be. Our editors believe pantry organization isn't about perfection; it's about clarity. The right containers, the right placement, the right system for how you actually live.",
    whatToLookFor: [
      "Clear, stackable containers that let you see what you have at a glance",
      "Natural woven baskets for items that don't need visibility",
      "Labels that are functional but never fussy - chalk, bamboo tags, handwritten",
      "Adjustable shelving or drawer systems that adapt as your needs change",
    ],
  },
};

export const Route = createFileRoute("/room/$room")({
  /* Permanent redirects off this route, from the same maps /collection/<slug>
     and serve.ts read, so the dev server and the published server agree instead
     of one redirecting and the other rendering an empty page.
     - A room merged into another (shop audit item 4: Laundry into Bathroom).
     - Holiday, which is the one room whose canonical page is /collection/holiday
       because that is the Christmas hub every entry point uses (item 5). */
  beforeLoad: ({ params }) => {
    const path = `/room/${params.room}`;
    const target = MERGED_COLLECTION_REDIRECTS[path] || ROOM_ROUTE_REDIRECTS[path];
    if (target) throw redirect({ href: target, statusCode: 301 });
  },
  loader: async ({ params }) => {
    // One source of truth decides whether a room page exists: the public room
    // list in src/lib/room-visibility.ts. Checked before any product query, so a
    // hidden room 404s with no cards even though its products are active in the
    // database (loungewear: 30 active clothing rows, owner approval pending).
    if (!isRoomPublic(params.room)) {
      throw notFound();
    }
    try {
      const products = await getProductsByRoom(params.room);
      if (!roomLabels[params.room] && products.length === 0) {
        throw notFound();
      }
      // The holiday room drops the products Amazon cannot currently sell. The
      // list comes from src/data/holiday-hidden-products.json, so the page
      // never hardcodes an id and the products return when stock does.
      const visible = params.room === "holiday" ? hideUnbuyableHolidayProducts(products) : products;
      return { products: visible, room: params.room, unavailable: false };
    } catch (err) {
      if (isNotFound(err)) throw err;
      console.error("Loader error:", err);
      // A database outage is NOT an empty room: flag it so the page says so.
      return { products: [] as Product[], room: params.room, unavailable: true };
    }
  },
    head: ({ loaderData }) => {
      const roomName =
        roomLabels[loaderData?.room] || loaderData?.room || "Room";
      const products = loaderData?.products || [];
      const seo = generateRoomMetadata(roomName, products.length, loaderData?.room);
      const roomPhoto = roomPhotos[loaderData?.room] || null;
      const links = [...seo.links];
      if (roomPhoto) {
        links.push({
          rel: "preload",
          as: "image",
          href: roomPhoto,
          fetchpriority: "high",
        });
      }
      const meta = loaderData?.unavailable
        ? [...seo.meta, { name: "robots", content: "noindex, follow" }]
        : seo.meta;
      return {
        meta,
        links,
      };
    },
  component: RoomPage,
});

function RoomPage() {
  const { products, room, unavailable } = Route.useLoaderData();
  const roomName =
    roomLabels[room] ||
    room.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const roomPhoto = roomPhotos[room] || null;
  const editorial = roomEditorial[room] || null;
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Rooms", href: "/rooms" },
    { label: roomName },
  ];
  const collectionSchema = getCollectionPageSchema(
    { name: roomName, display_name: roomName },
    `${SITE_URL}/room/${room}`
  );
  const relatedRooms = getRelatedRooms(room);
  /* The Reset List card, on the kitchen and office pages. Not seasonal: one
     flag, no switch-off date. A list is not a product, so it sits outside the
     room's AnalyticsList payload and carries no rating, review count or price. */
  const roomStorefrontList =
    (room === "kitchen" || room === "office") && SHOW_RESET_LIST
      ? RESET_LIST
      : null;
  /* Product JSON-LD, built from the cards this page actually renders: a card
     with no price on it is left unmarked (Pinterest brief, item 4). Nothing
     here changes a card, a price or a layout. */
  /* The room FAQ copy the /collection template used to carry. Item 5 makes
     /room/<slug> the one page per room, so the FAQ block and its FAQPage markup
     moved here with the cards. A room with no true answers of its own (nursery)
     renders no block and marks up no FAQPage. */
  const faqItems = getCollectionFAQs(room);
  const faqSchema = faqItems.length > 0 ? getFAQSchema(faqItems) : null;

  const productSchema = getProductGraphSchema(
    products.map((product) => ({
      name: product.name,
      displayTitle: product.display_title,
      cardHook: product.card_hook,
      editorNote: product.editor_note,
      room: product.room,
      imageUrl: product.image_url,
      price: product.price,
      availability: product.availability,
      productUrl: `${SITE_URL}/product/${canonicalProductSlug(product)}`,
    })),
  );

  /* One header body for both hero states: only the band around the title
     changes when a room has no photo. */
  const heroBody = (
    <>
      <a href="/" className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Home
      </a>
      <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">{roomName}</h1>
      {unavailable ? (
        <p className="mt-4 text-lg text-warm-gray">
          Our product library is temporarily unavailable. Please try this page again in a moment.
        </p>
      ) : (
        <p className="mt-4 text-lg text-warm-gray">{products.length} {products.length === 1 ? "product" : "products"} curated for your {roomName.toLowerCase()}</p>
      )}
      {editorial && (
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-warm-gray">
          {editorial.intro}
        </p>
      )}
    </>
  );

  return (
    <>
      {/* Pinterest ViewContent: one event per view of this room. */}
      <PinterestViewContent contentName={room} contentCategory="room" />
      <Header />
      <main>
        <Breadcrumbs items={breadcrumbItems} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(collectionSchema),
          }}
        />
        {faqSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(faqSchema),
            }}
          />
        )}
        {productSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(productSchema),
            }}
          />
        )}
        {/* Hero. With a room photo the picture runs full width behind the
            title, kept centered, with a soft left-hand white scrim so the dark
            type holds on bright and dark art alike. With no photo the header
            is a compact text band, never a tall empty cream panel. */}
        {roomPhoto ? (
          <section className="relative overflow-hidden">
            <img
              src={roomPhoto}
              alt={`${roomName} - Evergreen House`}
              width={1200}
              height={800}
              fetchpriority="high"
              loading="eager"
              decoding="sync"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-white/60 sm:bg-white/35" />
            <div
              className="absolute inset-0"
              style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0.32) 74%, rgba(255,255,255,0) 100%)" }}
            />
            <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">{heroBody}</div>
          </section>
        ) : (
          <section className="border-b border-beige/20 bg-cream/40">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{heroBody}</div>
          </section>
        )}

        {/* What to Look For */}
        {editorial && editorial.whatToLookFor.length > 0 && (
          <section className="border-y border-beige/20 bg-cream-dark/60 py-8 sm:py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
                What to Look For
              </h2>
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {editorial.whatToLookFor.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-warm-gray">
                    <span className="mt-1.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-beige/30 text-xs font-semibold text-taupe">
                      {i + 1}
                    </span>
                    <span className="text-base leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {unavailable ? (
              <ContentUnavailable message="Our product library could not be reached just now, so the products for this room are not loading. Nothing has been lost - please try this page again in a moment." />
            ) : products.length > 0 ? (
              <>
                {room === "holiday" ? (
                  /* Three owner-approved sets plus More Christmas Finds, one
                     AnalyticsList each, and one disclosure for the page. */
                  <HolidaySets
                    products={products}
                    listPrefix={`room-${room}`}
                    giftingList={SHOW_UNDER19_ON_HOLIDAY_ROOM ? UNDER19_LIST : null}
                  />
                ) : (
                  <AnalyticsList id={`room-${room}`} name={`${roomLabels[room] || room} products`} items={products}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {products.map((product) => (<ProductCard key={product.id} product={product} />))}
                    </div>
                  </AnalyticsList>
                )}
                {roomStorefrontList && (
                  <div className="mt-8">
                    <StorefrontListCard list={roomStorefrontList} level={2} />
                  </div>
                )}
                {/* One disclosure for the whole page (Room Card Standard). */}
                <div className="mt-8">
                  <AmazonDisclosure />
                </div>
              </>
            ) : (
              <div className="py-10 text-center">
                <p className="text-lg text-warm-gray">No products found for this room yet.</p>
                <a href="/" className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark">Browse all products →</a>
              </div>
            )}
          </div>
        </section>

        {/* FAQ. Moved here with the cards when /room/<slug> became the one
            canonical page per room (shop audit item 5). Only a room with true
            copy of its own gets a block, and the same items feed the FAQPage
            markup above. */}
        {faqItems.length > 0 && (
          <section aria-labelledby="faq-heading" className="border-t border-beige/20 bg-cream/30 py-8 sm:py-12">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <h2 id="faq-heading" className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-warm-gray">
                Straight answers about {roomName}.
              </p>
              <dl className="mt-8 space-y-6">
                {faqItems.map((faq, i) => (
                  <div key={i} className="rounded-xl border border-beige/20 bg-white p-5 shadow-sm">
                    <dt className="font-serif text-base font-semibold text-warm-dark">
                      {faq.question}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-warm-gray">
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {/* Browse More Rooms */}
        {relatedRooms.length > 0 && (
          <section aria-labelledby="more-rooms-heading" className="border-t border-beige/20 bg-cream/30 py-8 sm:py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2
                id="more-rooms-heading"
                className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl"
              >
                Browse More Rooms
              </h2>
              <p className="mt-2 text-warm-gray">
                If you love {roomName.toLowerCase()} finds, you'll feel right at home in these spaces too.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedRooms.map((related) => (
                  <a
                    key={related.slug}
                    href={`/room/${related.slug}`}
                    className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="absolute inset-0 bg-cream-dark" />
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #3d322c 1px, transparent 1px), radial-gradient(circle at 80% 70%, #3d322c 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
                    <div className="relative flex h-40 flex-col justify-end p-6">
                      <h3 className="font-serif text-lg font-semibold leading-snug text-warm-dark">
                        {related.label}
                      </h3>
                      <p className="mt-1 text-sm text-taupe transition-colors group-hover:text-terracotta">
                        Explore {related.label.toLowerCase()} →
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
