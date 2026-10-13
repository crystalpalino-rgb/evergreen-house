import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/schema";

/**
 * Blog post: "How I Feed Two Kids on a Tight Grocery Budget (Without Losing My Mind)"
 *
 * A first-person essay for the Journal, written by the owner (a full-time working
 * mom of two). The copy is hardcoded here on purpose: the page is static editorial
 * content and must not depend on catalog state. The only outbound link is the
 * owner's own digital product on the Beacons store, so this post carries no Amazon
 * affiliate links and no affiliate disclosure.
 */

const BLOG_SLUG = "meal-planning-tight-grocery-budget";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE =
  "How I Feed Two Kids on a Tight Grocery Budget (Without Losing My Mind)";
const BLOG_H1 = BLOG_TITLE;
const BLOG_DESCRIPTION =
  "A busy full-time working mom shares the exact meal planning system that keeps her grocery bill under control: one planning session, real food, no coupons required.";
const DATE_PUBLISHED = "2026-10-12";
const DATE_PUBLISHED_LABEL = "October 12, 2026";
const AUTHOR_NAME = "Crystal Costa";

const INTRO_PARAGRAPHS = [
  "I'm a full-time working mom of two, and after my divorce my budget got very real, very fast. One income, two growing kids, and grocery prices doing whatever it is they're doing right now. Something had to change, and it wasn't going to be the kids' appetites.",
  "So I built myself a system. Not a cute Pinterest system. A survival system. One planning session a week, and my grocery bill stopped being a source of Sunday-night dread. Here's exactly how it works.",
];

type BlogSection = {
  heading: string;
  paragraphs?: string[];
  items?: Array<{ lead: string; body: string }>;
};

const SECTIONS: BlogSection[] = [
  {
    heading: "The Sunday session (30 minutes, tops)",
    paragraphs: [
      "I sit down once a week, usually Sunday with coffee, and I plan five dinners. Not seven. Five. Two nights are leftovers or fend-for-yourself nights, and pretending otherwise was costing me money in wasted food.",
      "I check what I already have first. Pantry, fridge, freezer. I snap photos on my phone so I'm not standing in the store guessing whether I have rice at home. Building meals around what I own before I buy anything new is the single biggest money saver I know.",
    ],
  },
  {
    heading: "My rules for cheap meals that kids actually eat",
    items: [
      {
        lead: "Anchor meals.",
        body: "I have a rotation of about eight dinners that cost very little and that both kids will eat without a negotiation summit. Tacos, spaghetti, sheet-pan chicken thighs, bean chili, egg fried rice, quesadillas, soup, and homemade pizza night. If a new recipe can't beat one of these on cost and kid approval, it doesn't make the rotation.",
      },
      {
        lead: "One grocery trip.",
        body: "I do one big shop per week with a list, and that's it. Every extra trip is an extra $30 in things I didn't plan to buy. If I run out of milk on Wednesday, we drink water. We're fine.",
      },
      {
        lead: "Store brand everything.",
        body: 'Milk, eggs, pasta, canned tomatoes, frozen veggies, oats. My kids have never once said "mom, this off-brand peanut butter is ruining my childhood." The savings are real, usually 20 to 30 percent on staples.',
      },
      {
        lead: "The freezer is a savings account.",
        body: "When chicken or ground beef goes on a real sale, I buy two to three weeks' worth and freeze it in meal-sized portions. Meat is the most expensive thing in the cart, so this one habit probably saves me more than everything else combined.",
      },
    ],
  },
  {
    heading: "What this actually saves",
    paragraphs: [
      "I'm not going to give you a fake exact number, because your family and your store are different from mine. But between the meal plan, the pantry-first rule, store brands, and sale-stocking the freezer, my grocery spending dropped by roughly a third. For us, that's real money every single month. Money that used to evaporate into impulse buys and wasted produce.",
    ],
  },
  {
    heading: "The part I wish someone had handed me",
    paragraphs: [
      "Here's the truth: the system is simple, but staying consistent is the hard part. What finally made it stick for me was having it all on paper in one place. The meal plan, the grocery list template, the pantry inventory, the freezer tracker. Not scattered across phone notes and the back of receipts.",
      "So I made the thing I needed: a printable kit with the 4-week rotating meal plan framework, grocery list templates, pantry and freezer inventory sheets, and the budget tracker. It's called Stretch the Cart, it's $8, and it's the exact system I just described, ready to fill in.",
    ],
  },
];

const CTA_URL =
  "https://shop.beacons.ai/clevermom/6a576ae8-4900-4144-b212-9a30ae97e536";
const CTA_LABEL =
  "Get Instant Access: Stretch the Cart Budget Meal Planning Kit";
const CTA_SUPPORTING =
  "You don't need it to start. You can start tonight with a piece of paper and five dinners. But if you want the whole system done for you, it's there.";

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
    "@type": "Person",
    name: AUTHOR_NAME,
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

export const Route = createFileRoute("/blog/meal-planning-tight-grocery-budget")(
  {
    head: () => {
      const seo = generateStaticMetadata(
        BLOG_TITLE,
        BLOG_DESCRIPTION,
        BLOG_PATH
      );
      return { meta: seo.meta, links: seo.links };
    },
    component: BlogPost,
  }
);

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
              <span className="mx-2 text-beige" aria-hidden="true">
                /
              </span>
              <span>By {AUTHOR_NAME}</span>
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
