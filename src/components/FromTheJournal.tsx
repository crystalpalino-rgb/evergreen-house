/**
 * Homepage FROM THE JOURNAL strip: the three most recent hand-authored
 * editorial posts, image-led and short. These are static route files under
 * src/routes/blog/, not generated copy, so the titles and dates here are the
 * same ones the Journal index lists (src/routes/blog/index.tsx).
 *
 * Deliberately tight: no long excerpts, no per-card schema blocks. The posts
 * themselves carry the Article schema.
 */
type JournalPost = {
  category: string;
  title: string;
  href: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  date: string;
};

const POSTS: JournalPost[] = [
  {
    category: "Bedroom",
    title: "13 Things That Make Your Bed Look Expensive",
    href: "/blog/how-to-make-your-bed-look-expensive",
    excerpt:
      "Deep pocket sheets, an oversized duvet and layered pillows, without a new mattress.",
    image: "/images/bedroom.jpg",
    imageAlt: "Serene bedroom with layered linens and warm lamplight",
    date: "October 10, 2026",
  },
  {
    category: "Holiday",
    title: "Cozy Neutral Holiday Decor Finds for a Calm Home",
    href: "/blog/cozy-neutral-holiday-decor-finds",
    excerpt:
      "A knit tree skirt, cedar garland and pearl ornaments for a warm Christmas without the tinsel.",
    image: "/images/edit-luxe-christmas-tree-edit-card.webp",
    imageAlt: "Deep green Christmas tree in a woven basket on a cream knit skirt",
    date: "October 8, 2026",
  },
  {
    category: "Living Room",
    title: "Cheap Things That Make Your Home Look Expensive",
    href: "/blog/cheap-things-that-make-your-home-look-expensive",
    excerpt:
      "Mirrors, lamps, trays and candlelight that make a room look considered, not costly.",
    image: "/images/living-room.jpg",
    imageAlt: "Warm neutral living room with a linen sofa and dried grasses",
    date: "October 3, 2026",
  },
];

export function FromTheJournal() {
  return (
    <section className="bg-beige/15 py-8 sm:py-12" id="journal">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 className="font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
            From the Journal
          </h2>
          <a
            href="/blog"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-burgundy transition-colors hover:text-burgundy-deep"
          >
            All stories
          </a>
        </div>
        <div className="mt-6 grid gap-6 sm:mt-8 sm:grid-cols-3">
          {POSTS.map((post) => (
            <article key={post.href} className="group">
              <a
                href={post.href}
                className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-beige/10"
              >
                <img
                  src={post.image}
                  alt={post.imageAlt}
                  width={1200}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </a>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-taupe">
                {post.category}
                <span className="mx-2 text-beige" aria-hidden="true">
                  /
                </span>
                {post.date}
              </p>
              <h3 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-warm-dark transition-colors group-hover:text-burgundy-deep">
                <a href={post.href}>{post.title}</a>
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-warm-gray line-clamp-2">
                {post.excerpt}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
