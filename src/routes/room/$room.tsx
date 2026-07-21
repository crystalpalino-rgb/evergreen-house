import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { getProductsByRoom } from "~/lib/intelligence";
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
  office: "Office",
  "dining-room": "Dining Room",
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
    const roomName = roomLabels[loaderData?.room] || loaderData?.room || "Room";
    return {
      meta: [
        { title: `${roomName}, Evergreen House` },
        {
          name: "description",
          content: `Curated ${roomName.toLowerCase()} finds, designer looks without the designer budget. Editor-approved picks for every style.`,
        },
      ],
    };
  },
  component: RoomPage,
});

function RoomPage() {
  const { products, room } = Route.useLoaderData();
  const roomName = roomLabels[room] || room.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const roomPhoto = roomPhotos[room] || null;

  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden">
          {roomPhoto ? (
            <>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${roomPhoto})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="absolute inset-0 bg-white/50" />
            </>
          ) : (
            <div className="absolute inset-0 bg-cream" />
          )}
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Home
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
              {roomName}
            </h1>
            <p className="mt-4 text-lg text-warm-gray">
              {products.length} {products.length === 1 ? "product" : "products"} curated for your {roomName.toLowerCase()}
            </p>
          </div>
        </section>
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-lg text-warm-gray">No products found for this room yet.</p>
                <a href="/" className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark">
                  Browse all products →
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
