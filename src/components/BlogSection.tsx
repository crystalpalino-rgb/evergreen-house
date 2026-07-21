import type { Product } from "~/lib/types";

function getBlogPosts(dbProducts: Product[]) {
  // Group products by room for blog content
  const bedroomProducts = dbProducts.filter((p) => p.room === "bedroom").slice(0, 3);
  const bathroomProducts = dbProducts.filter((p) => p.room === "bathroom").slice(0, 3);
  const kitchenProducts = dbProducts.filter((p) => p.room === "kitchen").slice(0, 3);

  const bedroomNames = bedroomProducts.map((p) => p.name).join(", ");
  const bathroomNames = bathroomProducts.map((p) => p.name).join(", ");
  const kitchenNames = kitchenProducts.map((p) => p.name).join(", ");

  return [
    {
      category: "Bedroom",
      title: "10 Bedroom Finds I'd Buy Again",
      slug: "/blog/1",
      excerpt: bedroomNames
        ? `From ${bedroomNames.split(",")[0]} to cozy bedding layers, these are the bedroom pieces our editors reach for again and again.`
        : "From stonewashed linens to warm lighting, these are the bedroom pieces our editors reach for again and again.",
      image: "/images/bedroom.jpg",
      imageAlt: "Serene bedroom with layered textures and warm tones",
      pinDescription: "10 bedroom finds our editors would buy again, save this for your next bedroom refresh!",
      datePublished: "2026-07-15",
    },
    {
      category: "Bathroom",
      title: "Amazon Bathroom Upgrades That Feel Luxurious",
      slug: "/blog",
      excerpt: bathroomNames
        ? `Our editors tested dozens of bathroom finds, ${bathroomNames.split(",")[0]} and other gems made the cut for their spa-like quality.`
        : "Our editors tested dozens of bathroom finds, these are the ones that bring a spa-like quality to your daily routine.",
      image: "/images/bathroom.jpg",
      imageAlt: "Spa-inspired bathroom with fluffy towels and sleek accessories",
      pinDescription: "Amazon bathroom upgrades that feel high-end, pin this for your bathroom refresh!",
      datePublished: "2026-07-10",
    },
    {
      category: "Kitchen",
      title: "Kitchen Organization Favorites",
      slug: "/blog",
      excerpt: kitchenNames
        ? `Clever storage, beautiful tools, and counter-worthy pieces, including ${kitchenNames.split(",")[0]}, that make cooking feel like less of a chore.`
        : "Clever storage, beautiful tools, and counter-worthy pieces that make cooking feel like less of a chore.",
      image: "/images/kitchen.jpg",
      imageAlt: "Beautifully organized kitchen with wood accents and glass containers",
      pinDescription: "Kitchen organization favorites that actually work, save this guide for your weekend project!",
      datePublished: "2026-07-05",
    },
  ];
}

export function BlogSection({ products }: { products: Product[] }) {
  const blogPosts = getBlogPosts(products);

  return (
    <section className="bg-cream-dark py-16 sm:py-20" id="journal">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
          The Evergreen Journal
        </h2>
        <p className="mt-3 text-center text-warm-gray">
          Tips, styling guides, and curated finds from our editors
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.title}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-beige/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Image */}
              <a href={post.slug} className="block pin-image-wrapper aspect-[3/2] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  data-pin-description={post.pinDescription}
                />
              </a>
              {/* Content */}
              <div className="p-5 sm:p-6">
                <span className="inline-block rounded-full bg-sage/15 px-3 py-1 text-xs font-medium text-sage-dark">
                  {post.category}
                </span>
                <a href={post.slug} className="block mt-3 group/title">
                  <h3 className="font-serif text-lg font-semibold leading-snug text-warm-dark transition-colors group-hover/title:text-terracotta">
                    {post.title}
                  </h3>
                </a>
                <p className="mt-2 text-sm text-warm-gray line-clamp-2">{post.excerpt}</p>
                <a
                  href={post.slug}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
                >
                  Read More
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
              {/* JSON-LD BlogPosting for Rich Pins */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    headline: post.title,
                    description: post.excerpt,
                    image: post.image,
                    datePublished: post.datePublished,
                    author: { "@type": "Organization", name: "Evergreen House" },
                    publisher: { "@type": "Organization", name: "Evergreen House" },
                  }),
                }}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
