import type { Product } from "~/lib/types";

export type { Product };

function getPinDescription(product: Product): string {
  const p = product as any;
  const productRoom = p.room || "";
  const roomMap: Record<string, string> = {
    "living-room": "living room",
    bedroom: "bedroom",
    kitchen: "kitchen",
    bathroom: "bathroom",
    patio: "patio",
    organization: "home organization",
    storage: "home organization",
    laundry: "laundry room",
    entryway: "entryway",
  };
  const room = roomMap[productRoom] || productRoom.replace(/-/g, " ");
  const productPrice = p.price;
  const priceStr = productPrice
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(productPrice)
    : "";
  const productName = p.name || "";

  return `${productName}, a beautiful find for your ${room}${priceStr ? ` at just ${priceStr}` : ""}. Shop the look!`;
}

export function ProductCard({ product }: { product: Product }) {
  // Compatibility: data arrives in snake_case (DB direct) or camelCase (serialized)
  const p = product as any;
  const price = p.price;
  const rating = p.rating;
  const editorNote = p.editor_note || p.editorNote || null;
  const amazonUrl = p.amazon_url || p.amazonUrl || "";
  const imageUrl = p.image_url || p.imageUrl || "";
  const name = p.name;
  const room = p.room || "";

  const formattedPrice = price
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price)
    : null;

  const pinDescription = getPinDescription(product);
  const hasRealUrl = amazonUrl && amazonUrl !== "#" && amazonUrl.startsWith("http");

  function trackAmazonClick() {
    if (typeof window !== "undefined" && "pintrk" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).pintrk("track", "lead", {
        event_id: `amz-click-${product.id}`,
        value: price ? Math.round(price * 100) / 100 : undefined,
        currency: "USD",
        line_items: [
          {
            product_name: name,
            product_id: String(product.id),
          },
        ],
      });
    }
  }

  return (
    <div className="group rounded-2xl border border-beige/20 bg-white shadow-sm ring-1 ring-beige/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      {/* Product image */}
      <div className="pin-image-wrapper aspect-square overflow-hidden rounded-t-2xl">
        {hasRealUrl ? (
          <a href={amazonUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full" onClick={trackAmazonClick}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${name}, ${room.replace(/-/g, " ")}`}
                className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                data-pin-description={pinDescription}
                data-pin-url={amazonUrl}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-beige/20">
                <span className="font-serif text-4xl text-beige/50 italic">{name.charAt(0)}</span>
              </div>
            )}
          </a>
        ) : (
          imageUrl ? (
            <img
              src={imageUrl}
              alt={`${name}, ${room.replace(/-/g, " ")}`}
              className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              data-pin-description={pinDescription}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-beige/20">
              <span className="font-serif text-4xl text-beige/50 italic">{name.charAt(0)}</span>
            </div>
          )
        )}
      </div>
      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Rating */}
        {rating && (
          <div className="mb-1 flex items-center gap-1">
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
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
          </div>
        )}
        {/* Name */}
        <h3 className="text-sm font-medium text-warm-dark line-clamp-2">{name}</h3>
        {/* Editor note */}
        {editorNote && (
          <p className="mt-1.5 text-xs italic leading-relaxed text-taupe line-clamp-2">
            "{editorNote}"
          </p>
        )}
        {/* Price */}
        {formattedPrice && (
          <p className="mt-1.5 text-sm font-semibold text-terracotta">{formattedPrice}</p>
        )}
        {/* CTA */}
        {hasRealUrl && (
          <a
          href={amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sage transition-colors hover:text-sage-dark"
          onClick={trackAmazonClick}
          >
            View on Amazon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
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
        )}
      </div>
    </div>
  );
}
