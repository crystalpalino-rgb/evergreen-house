import type { Product } from "~/lib/types";
import { ProductCard } from "./ProductCard";
import { AnalyticsList } from "./AnalyticsList";

interface ShopTheLookProps {
  products: Product[];
  collections: { collection: string; count: number }[];
}

interface CuratedCollection {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  imageUrl?: string;
  /** Rendered in place of the hero image when no imageUrl is set (seasonal blocks). */
  gradient?: string;
  /** Explicit CTA target; defaults to /collection/<id without -look>. */
  href?: string;
  ctaLabel?: string;
  room: string;
  curatedProductIds?: number[];
}

// Curated collection definitions
const curatedCollections: CuratedCollection[] = [
  {
    id: "holiday-edit",
    name: "The Holiday Edit",
    subtitle:
      "Warm gatherings, cozy nights, and thoughtful details for the season.",
    description:
      "From candlelit tables to plush throws, this edit is everything we reach for when the house feels festive and calm at once.",
    imageUrl: "/images/seasonal.jpg",
    gradient: "linear-gradient(135deg, #1f3a2c 0%, #2f5540 55%, #e6dcc6 100%)",
    href: "/collection/holiday",
    ctaLabel: "Shop Holiday",
    room: "holiday",
  },
  {
    id: "fall-finds",
    name: "Fall Finds",
    subtitle:
      "Cozy layers, amber tones, and textures that invite you to slow down.",
    description:
      "The best of our fall shop: warm throws, rich ceramics, and quiet pieces made for longer evenings at home.",
    imageUrl: "/images/fall.jpg",
    gradient: "linear-gradient(135deg, #d4b896 0%, #c49a6c 50%, #c2784a 100%)",
    href: "/collection/fall",
    ctaLabel: "Shop Fall",
    room: "fall",
    curatedProductIds: [415, 342, 346, 236],
  },
  {
    id: "living-room-look",
    name: "Sunday Morning Living",
    subtitle: "Warm neutrals, layered textures, and pieces that feel collected over time.",
    description:
      "Slow mornings with coffee and a good book. This collection layers warm neutrals, soft textures, and pieces that feel collected over time rather than bought all at once. Every piece was chosen to make your living room the room you gravitate toward first.",
    imageUrl:
      "/images/living-room.jpg",
    room: "living-room",
  },
  {
    id: "bedroom-look",
    name: "Bedroom Finds Worth the Upgrade",
    subtitle: "A calming escape with soft linens, warm wood tones, and golden accents.",
    description:
      "Your bedroom should feel like an exhale at the end of a long day. From stonewashed linens to warm lighting, every piece here was chosen to create a space that quiets the noise and invites rest.",
    imageUrl:
      "/images/bedroom.jpg",
    room: "all",
    curatedProductIds: [52, 41, 30, 44],
  },
  {
    id: "bathroom-look",
    name: "The Pieces That Make My Bathroom Feel Like a Spa",
    subtitle: "Turn your daily routine into a moment of calm.",
    description:
      "Thoughtful touches that make every shower and skincare ritual feel like a spa visit. From plush towels to sleek dispensers, these are the bathroom upgrades worth making.",
    imageUrl:
      "/images/bathroom.jpg",
    room: "bathroom",
  },
  {
    id: "kitchen-look",
    name: "Everything I'd Buy Again for My Kitchen",
    subtitle: "Beautifully organized countertops with natural materials and timeless pieces.",
    description:
      "The kitchen is the heart of the home, and it deserves to feel as beautiful as it is functional. This collection pairs warm wood, clear glass, and honest materials, pieces that make you want to linger a little longer.",
    imageUrl:
      "/images/kitchen.jpg",
    room: "kitchen",
    curatedProductIds: [28, 35, 39, 92],
  },
  {
    id: "apartment-must-haves",
    name: "Small Space Finds I'd Recommend to a Friend",
    subtitle: "Best-rated finds for small spaces and first homes.",
    description:
      "Clever, compact, and endlessly charming, these are the pieces that make even the smallest apartment feel like a thoughtfully designed home. High ratings, versatile style, and renter-friendly.",
    imageUrl:
      "/images/organization.jpg",
    room: "all",
    curatedProductIds: [167, 53, 54, 64],
  },
];

export function ShopTheLook({ products: dbProducts, collections: _dbCollections }: ShopTheLookProps) {
  const hasDbData = dbProducts && dbProducts.length > 0;

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
          Inspired Spaces
        </h2>
        <p className="mt-3 text-center text-warm-gray">
          Explore beautifully curated rooms and shop every piece that brings the space together.
        </p>

        <div className="mt-10 space-y-10">
          {curatedCollections.map((collection) => {
            let collectionProducts: Product[];

            if (hasDbData) {
              if (collection.curatedProductIds) {
                // Use specific curated product IDs
                collectionProducts = collection.curatedProductIds
                  .map((id) => dbProducts.find((p) => p.id === id))
                  .filter(Boolean) as Product[];
              } else if (collection.room === "all") {
                // "Apartment Must Haves" - best-rated across rooms
                collectionProducts = [...dbProducts]
                  .filter((p) => p.rating && p.rating >= 4.4)
                  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                  .slice(0, 4);
              } else {
                collectionProducts = dbProducts
                  .filter(
                    (p) => p.room === collection.room && p.is_active !== false,
                  )
                  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                  .slice(0, 4);
              }
            } else {
              collectionProducts = [];
            }

            if (collectionProducts.length === 0) return null;

            return (
              <div
                key={collection.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-beige/10"
              >
                <div className="grid lg:grid-cols-5">
                  {/* Hero image, or a gradient panel for the seasonal blocks */}
                  <div className="lg:col-span-2">
                    <div className="pin-image-wrapper h-48 sm:h-64 lg:h-full">
                      {collection.imageUrl ? (
                        <img
                          src={collection.imageUrl}
                          alt={`${collection.name}, ${collection.subtitle}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          data-pin-description={`${collection.name}: ${collection.subtitle}. Save this pin!`}
                        />
                      ) : (
                        <div
                          className="relative h-full w-full"
                          style={{ background: collection.gradient }}
                          data-pin-description={`${collection.name}: ${collection.subtitle}. Save this pin!`}
                        >
                          <div
                            className="absolute inset-0 opacity-[0.06]"
                            style={{
                              backgroundImage:
                                "radial-gradient(circle at 30% 40%, #ffffff 1px, transparent 1px)",
                              backgroundSize: "30px 30px",
                            }}
                            aria-hidden="true"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-6 lg:col-span-3 lg:p-8">
                    <h3 className="font-serif text-2xl font-semibold text-warm-dark">
                      {collection.name}
                    </h3>
                    <p className="mt-2 text-warm-gray">{collection.subtitle}</p>
                    {collection.description && (
                      <p className="mt-4 text-sm leading-relaxed text-warm-gray/80 max-w-prose">
                        {collection.description}
                      </p>
                    )}
                    <AnalyticsList
                      id={`shop-the-look-${collection.id}`}
                      name={collection.name}
                      items={collectionProducts}
                    >
                      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {collectionProducts.map((product) => (
                          <ProductCard key={`coll-${product.id}`} product={product} />
                        ))}
                      </div>
                    </AnalyticsList>
                    <a
                      href={
                        collection.href ??
                        `/collection/${collection.id.replace(/-look$/, "")}`
                      }
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
                    >
                      {collection.ctaLabel ?? "View full collection"}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
