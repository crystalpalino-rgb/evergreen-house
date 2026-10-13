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
    category: "Paperwork",
    title:
      "Getting Organized During Divorce: The Paperwork System That Kept Me Sane",
    href: "/blog/divorce-organization-paperwork-system",
    excerpt:
      "The binder, the filing habits and the weekly check-in that kept every legal document, deadline and custody detail in one place.",
    image: "/images/home-office.jpg",
    imageAlt:
      "Desk with an open laptop, a clipboard of papers and a pen in warm natural light",
    date: "October 12, 2026",
  },
  {
    category: "Meal Planning",
    title:
      "How I Feed Two Kids on a Tight Grocery Budget (Without Losing My Mind)",
    href: "/blog/meal-planning-tight-grocery-budget",
    excerpt:
      "One planning session a week, real food and no coupons: the system that keeps a grocery bill under control.",
    image: "/images/kitchen.jpg",
    imageAlt:
      "Kitchen counter with white ceramic canisters, wooden utensils and a cutting board",
    date: "October 12, 2026",
  },
  {
    category: "Life Admin",
    title:
      "The 90-Minute Life Admin Day: My Monthly Reset for Bills, Inbox, and Paperwork",
    href: "/blog/90-minute-life-admin-reset",
    excerpt:
      "Ninety minutes, once a month, for the bills, the inbox and the paper pile. The reset that clears the backlog in one sitting.",
    image: "/images/organization.jpg",
    imageAlt:
      "Baskets, trays and bins laid out in tidy rows for an organized home",
    date: "October 12, 2026",
  },
  {
    category: "Home Reset",
    title: "The 20-Minute Home Reset for Moms Whose Brains Won't Cooperate",
    href: "/blog/20-minute-home-reset-adhd-moms",
    excerpt:
      "Twenty minutes, four rounds, zero shame: a realistic reset for the nights the house is a mess and you are running on empty.",
    image: "/images/living-room.jpg",
    imageAlt:
      "Warm living room with a cream sectional sofa, coffee table and softly lit shelves",
    date: "October 12, 2026",
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
