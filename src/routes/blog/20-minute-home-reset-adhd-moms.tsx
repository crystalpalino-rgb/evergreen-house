import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/schema";

/**
 * Blog post: "The 20-Minute Home Reset for Moms Whose Brains Won't Cooperate"
 *
 * A first-person essay for the Journal, written by the owner (a full-time working
 * mom of two). The copy is hardcoded here on purpose: the page is static editorial
 * content and must not depend on catalog state. The only outbound link is the
 * owner's own digital product on the Beacons store, so this post carries no Amazon
 * affiliate links and no affiliate disclosure.
 */

const BLOG_SLUG = "20-minute-home-reset-adhd-moms";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "The 20-Minute Home Reset for Moms Whose Brains Won't Cooperate";
const BLOG_H1 = BLOG_TITLE;
const BLOG_DESCRIPTION =
  "A realistic cleaning system for busy moms and ADHD brains: 20 minutes, four rounds, zero shame. How to reset your home when you're overwhelmed and short on time.";
const DATE_PUBLISHED = "2026-10-12";
const DATE_PUBLISHED_LABEL = "October 12, 2026";

const INTRO_PARAGRAPHS = [
  "Let me paint you a picture. It's 8pm. You worked all day. The kids are finally winding down. You look around and your house looks like it lost a fight. Dishes everywhere, laundry chair overflowing, mystery sticky spot on the counter. And you are so tired that the thought of cleaning makes you want to sit on the floor and cry.",
  "Hi. I'm a full-time working mom of two, and this was my life. Here's what I learned: the problem was never laziness. The problem was that every cleaning system I tried was designed for someone with unlimited time and a brain that does tasks in order. Mine does not.",
  "So I built a reset that works with the brain I actually have. Twenty minutes. Four rounds. Here's the whole thing.",
];

type BlogSection = {
  heading: string;
  paragraphs?: string[];
  items?: Array<{ lead: string; body: string }>;
};

const SECTIONS: BlogSection[] = [
  {
    heading: "Round 1: Trash sweep (5 minutes)",
    paragraphs: [
      "Grab a trash bag and walk every room. Trash only. Don't organize, don't put things away, don't start wiping counters. Just trash. Wrappers, junk mail, the apple core someone left on the stairs. One category, whole house, five minutes.",
      "This works because your brain only has to make one decision: is this trash? That's it.",
    ],
  },
  {
    heading: "Round 2: Dish dash (5 minutes)",
    paragraphs: [
      "Every dish in the house goes to the sink. Not washed. Not put away. Just relocated to the sink. If the dishwasher has clean dishes in it, empty those first, then load the dirty ones.",
      "Getting everything to one place is the win. You'll be amazed how much calmer the kitchen looks with empty counters even if the sink is full.",
    ],
  },
  {
    heading: "Round 3: Flat surfaces (5 minutes)",
    paragraphs: [
      "Pick the three surfaces you see most. For me that's the kitchen counter, the coffee table, and my nightstand. Clear them completely. Everything that isn't trash goes into one laundry basket, the deal-with-later basket.",
      "The basket is sacred. It exists to stop the number one trap: picking something up, walking it to its room, noticing three other things, and suddenly it's 45 minutes later and the kitchen is worse than before. Basket it and move on.",
    ],
  },
  {
    heading: "Round 4: Floors (5 minutes)",
    paragraphs: [
      "Quick pickup of anything on the floors, then a fast vacuum or sweep of the main traffic area. Done is better than deep. You're resetting, not deep cleaning.",
    ],
  },
  {
    heading: "The rules that make it actually work",
    items: [
      {
        lead: "Use a visible timer.",
        body: "Time blindness is real. A timer you can see and hear keeps you honest and gives your brain a finish line. When the timer goes off, you stop, even mid-task. Stopping on time teaches your brain that cleaning ends, which makes starting next time so much easier.",
      },
      {
        lead: "One category per round.",
        body: 'Never "clean the kitchen." Always "trash" or "dishes." Vague tasks paralyze overwhelmed brains. Specific tiny tasks get done.',
      },
      {
        lead: "Same trigger every day.",
        body: "Right after dinner, or when a certain show ends, or when the kids go to bed. Same time plus same trigger beats motivation every single time, because motivation is unreliable and triggers aren't.",
      },
      {
        lead: "Zero shame.",
        body: "This is a reset, not a punishment. Some days you'll do all four rounds. Some days you'll do one round and call it a win. Both count.",
      },
    ],
  },
  {
    heading: "When 20 minutes isn't enough (the doom piles)",
    paragraphs: [
      "We all have them. The chair. The corner. The closet you don't open. For those, I use a triage system: sort into keep, relocate, donate, trash. One pile at a time, timer on, no marathon sessions. Slow progress on doom piles beats ignoring them for another six months.",
    ],
  },
  {
    heading: "I made you the printable version",
    paragraphs: [
      "I turned this whole system into a fillable planner: the 20-minute reset cards, room-by-room checklists, the doom-pile triage sheets, a weekly maintenance tracker, and cleaning supply checklists. Twenty-two pages you can print or fill in on your tablet.",
    ],
  },
];

const CTA_URL =
  "https://shop.beacons.ai/clevermom/ff1d1173-67b6-471b-8997-ccb02555737a";
const CTA_LABEL = "Get Instant Access: ADHD Home Reset Kit";
const CTA_SUPPORTING =
  "It's $8. Your future self, the one who can see her coffee table, says thanks.";

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: BLOG_TITLE },
];

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  name: BLOG_TITLE,
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

export const Route = createFileRoute("/blog/20-minute-home-reset-adhd-moms")({
  head: () => {
    const seo = generateStaticMetadata(BLOG_TITLE, BLOG_DESCRIPTION, BLOG_PATH);
    return { meta: seo.meta, links: seo.links };
  },
  component: BlogPost,
});

function BlogPost() {
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
            {INTRO_PARAGRAPHS.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mt-7 text-lg leading-relaxed text-warm-gray"
              >
                {paragraph}
              </p>
            ))}
          </header>
          {SECTIONS.map((section) => (
            <section key={section.heading} className="mt-12">
              <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
                {section.heading}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mt-5 text-lg leading-relaxed text-warm-gray"
                >
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <div className="mt-6 space-y-6">
                  {section.items.map((item) => (
                    <div key={item.lead}>
                      <h3 className="font-serif text-lg font-semibold text-warm-dark sm:text-xl">
                        {item.lead}
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-warm-gray">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
          <section className="mt-14">
            <div className="rounded-2xl border border-terracotta/25 bg-white p-6 text-center shadow-sm sm:p-8">
              <a
                href={CTA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-terracotta px-7 py-3.5 font-sans text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-terracotta-dark"
              >
                {CTA_LABEL}
              </a>
              <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-warm-gray">
                {CTA_SUPPORTING}
              </p>
            </div>
          </section>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
          />
        </div>
      </article>
    </main>
  );
}
