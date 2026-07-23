import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { getProductsByRoom } from "~/lib/intelligence";
import { generateRoomMetadata } from "~/lib/seo";
import {
  getCollectionPageSchema,
  SITE_URL,
} from "~/lib/schema";
import { getRelatedRooms, ROOM_LABELS } from "~/lib/related";
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
};

export const Route = createFileRoute("/room/$room")({
  loader: async ({ params }) => {
    try {
      const products = await getProductsByRoom(params.room);
      return { products, room: params.room };
    } catch (err) {
      console.error("Loader error:", err);
      return { products: [] as Product[], room: params.room };
    }
  },
  head: ({ loaderData }) => {
    const roomName =
      roomLabels[loaderData?.room] || loaderData?.room || "Room";
    const products = loaderData?.products || [];
    const seo = generateRoomMetadata(roomName, products.length);
    return {
      meta: seo.meta,
      links: seo.links,
    };
  },
  component: RoomPage,
});

function RoomPage() {
  const { products, room } = Route.useLoaderData();
  const roomName =
    roomLabels[room] ||
    room.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const roomPhoto = roomPhotos[room] || null;
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

  return (
    <>
      <Header />
      <main>
        <Breadcrumbs items={breadcrumbItems} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(collectionSchema),
          }}
        />
        <section className="relative overflow-hidden">
          {roomPhoto ? (
            <>
              <div className="absolute inset-0" style={{ backgroundImage: `url(${roomPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="absolute inset-0 bg-white/50" />
            </>
          ) : (
            <div className="absolute inset-0 bg-cream" />
          )}
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <a href="/" className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Home
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">{roomName}</h1>
            <p className="mt-4 text-lg text-warm-gray">{products.length} {products.length === 1 ? "product" : "products"} curated for your {roomName.toLowerCase()}</p>
          </div>
        </section>
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (<ProductCard key={product.id} product={product} />))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-lg text-warm-gray">No products found for this room yet.</p>
                <a href="/" className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark">Browse all products →</a>
              </div>
            )}
          </div>
        </section>

        {/* Browse More Rooms */}
        {relatedRooms.length > 0 && (
          <section aria-labelledby="more-rooms-heading" className="border-t border-beige/20 bg-cream/30 py-12 sm:py-16">
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
