/**
 * Homepage FROM THE JOURNAL strip: the four most recent hand-authored
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
    category: "Sunday Reset",
    title: "The Sunday Reset: Meal Plan + Tidy House in 2 Hours",
    href: "/blog/sunday-reset-meal-plan-tidy",
    excerpt:
      "Two hours, one block: five dinners planned, the kitchen reset and the house back in order before Monday.",
    image: "/images/blog-sunday-reset.jpg",
    imageAlt:
      "An open blank planner with a brass pen and a mug of coffee on an oak counter with folded dish towels, stacked plates and a bread basket in soft morning light",
    date: "October 18, 2026",
  },
  {
    category: "Meal Planning",
    title:
      "How to Cut Your Grocery Bill by $200 a Month Without Clipping a Single Coupon",
    href: "/blog/cut-grocery-bill-200",
    excerpt:
      "Nine strategies, no coupons: the list-first system that quietly moves $200 a month back into your budget.",
    image: "/images/blog-cut-grocery-bill.jpg",
    imageAlt:
      "A canvas tote of crisp apples, a yellow onion and leafy greens on a warm oak counter beside glass jars of pantry staples, folded paper freezer packages and a blank meal planning notepad",
    date: "October 18, 2026",
  },
  {
    category: "Home Reset",
    title: "The 20-Minute ADHD Home Reset That Actually Works",
    href: "/blog/20-minute-adhd-home-reset",
    excerpt:
      "Four rounds, five minutes each, one visible timer: the reset built for the brain you actually have.",
    image: "/images/blog-adhd-home-reset.jpg",
    imageAlt:
      "A round kitchen timer with a plain face beside a woven basket holding a folded linen cloth and a small amber spray bottle on a clean pale counter",
    date: "October 18, 2026",
  },
  {
    category: "Home Reset",
    title: "10 Cleaning Systems Designed for ADHD Brains",
    href: "/blog/cleaning-systems-adhd-brains",
    excerpt:
      "Body doubling, landing pads and a ten-thing pickup: ten systems that work with the way you clean.",
    image: "/images/blog-cleaning-systems-adhd.jpg",
    imageAlt:
      "Open woven storage baskets and a clear bin of folded linens on an oak shelf above a bench with a tray holding keys and a wallet",
    date: "October 18, 2026",
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
        <div className="mt-6 grid gap-6 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
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
