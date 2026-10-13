import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/schema";

/**
 * Blog post: "The 90-Minute Life Admin Day: My Monthly Reset for Bills, Inbox, and Paperwork"
 *
 * A first-person essay for the Journal, written by the owner (a full-time working
 * mom of two). The copy is hardcoded here on purpose: the page is static editorial
 * content and must not depend on catalog state. The only outbound link is the
 * owner's own digital product on the Beacons store, so this post carries no Amazon
 * affiliate links and no affiliate disclosure.
 */

const BLOG_SLUG = "90-minute-life-admin-reset";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE =
  "The 90-Minute Life Admin Day: My Monthly Reset for Bills, Inbox, and Paperwork";
const BLOG_H1 = BLOG_TITLE;
const BLOG_DESCRIPTION =
  "Drowning in bills, emails, and paperwork? This 90-minute monthly life admin reset is how one busy working mom of two clears the backlog and stays on top of it all.";
const DATE_PUBLISHED = "2026-10-12";
const DATE_PUBLISHED_LABEL = "October 12, 2026";
const AUTHOR_NAME = "Crystal Costa";

const INTRO_PARAGRAPHS = [
  "There is a special kind of stress that comes from knowing your life admin is a mess but never having a big enough chunk of time to fix it. The unopened mail pile. The 4,000 unread emails. The permission slip that's been on the counter for a week. The dentist appointment you keep meaning to book.",
  "I'm a full-time working mom of two, recently divorced, which means all of the household admin that used to be split (or at least shared) now lives entirely in my brain. And my brain has limited shelf space.",
  "So once a month, I do a Life Admin Day. Ninety minutes. One focused session. And I walk out of it feeling like a functioning adult again. Here's the system.",
];

type BlogSection = {
  heading: string;
  paragraphs?: string[];
  items?: Array<{ lead: string; body: string }>;
};

const SECTIONS: BlogSection[] = [
  {
    heading: "Before the 90 minutes: the brain dump (10 minutes)",
    paragraphs: [
      'Grab paper or open a note and dump everything. Every nagging task, every "I should really..." floating around your head. Bills, calls, appointments, forms, emails to answer, things to cancel, things to renew. Don\'t organize it yet. Just get it out of your head and onto the page. This alone lowers my stress by half.',
    ],
  },
  {
    heading: "The 90-minute sprint",
    items: [
      {
        lead: "Minutes 0 to 20: Money.",
        body: "Pay the bills that are due. Check your accounts. Cancel one subscription you don't use (there's always one). Set up autopay for anything you keep forgetting. Money tasks first because they have the sharpest consequences when they slip.",
      },
      {
        lead: "Minutes 20 to 40: Inbox triage.",
        body: "Not inbox zero, that's a fantasy. Inbox triage. Delete the junk, answer the quick ones, and turn anything that needs real thought into a task on your list. Archive aggressively. Your inbox is not a filing cabinet.",
      },
      {
        lead: "Minutes 40 to 60: Paperwork and forms.",
        body: "The permission slips, the insurance forms, the school registration, the thing from the dentist's office. Fill them out, photograph or scan the important ones, and put the originals where they belong. This is also when I update the family calendar with every date I can find.",
      },
      {
        lead: "Minutes 60 to 75: Calls and appointments.",
        body: "Book the dentist. Call about the weird charge. Schedule the car maintenance. Batching calls into one block means you only have to psych yourself up once.",
      },
      {
        lead: "Minutes 75 to 90: Tidy and plan.",
        body: "File the loose papers, clear the counter where the mail pile lives, and write next month's admin list while it's fresh. Future you will be grateful.",
      },
    ],
  },
  {
    heading: "Why 90 minutes works",
    paragraphs: [
      "It's long enough to make real progress and short enough that you'll actually do it. I do mine on a Sunday afternoon when the kids are doing their own thing. Some months I don't finish everything, and that's fine. The point isn't perfection. The point is that the pile never gets to grow for more than a month.",
    ],
  },
  {
    heading: "The rules I live by",
    items: [
      {
        lead: "One session, once a month.",
        body: "Same weekend every month. When it's on the calendar, it happens.",
      },
      {
        lead: "Phone on do not disturb.",
        body: "Ninety minutes of admin with notifications on becomes three hours of nothing.",
      },
      {
        lead: "Done beats perfect.",
        body: "A bill paid late is better than a bill avoided. An email answered briefly is better than one drafted in your head for two weeks.",
      },
    ],
  },
  {
    heading: "Want the whole thing done for you?",
    paragraphs: [
      "I turned my exact system into a printable planner: the brain dump sheet, the 90-minute sprint breakdown with checkboxes for every category, bill trackers, subscription audit sheets, and appointment logs. Sixteen pages, fillable PDF, designed to walk you through the session step by step.",
    ],
  },
];

const CTA_URL =
  "https://shop.beacons.ai/clevermom/54a7fb0c-d6c9-4c45-9f4d-c828305d9a2a";
const CTA_LABEL =
  "Get Instant Access: Petty's Life Admin Day 90-Minute Life Reset Planner";
const CTA_SUPPORTING =
  "It's $8, which is less than the late fee on one forgotten bill. Ask me how I know.";

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

export const Route = createFileRoute("/blog/90-minute-life-admin-reset")({
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
