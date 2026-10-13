import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/schema";

/**
 * Blog post: "Getting Organized During Divorce: The Paperwork System That Kept Me Sane"
 *
 * A first-person essay for the Journal, written by the owner (a full-time working
 * mom of two who went through a divorce). The copy is hardcoded here on purpose:
 * the page is static editorial content and must not depend on catalog state.
 * The only outbound link is the owner's own digital product on the Beacons store,
 * so this post carries no Amazon affiliate links and no affiliate disclosure.
 */

const BLOG_SLUG = "divorce-organization-paperwork-system";
const BLOG_PATH = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE =
  "Getting Organized During Divorce: The Paperwork System That Kept Me Sane";
const BLOG_H1 = BLOG_TITLE;
const BLOG_DESCRIPTION =
  "Divorce comes with a mountain of paperwork, deadlines, and details. Here's the organization system one mom used to keep track of it all, from legal documents to financial records.";
const DATE_PUBLISHED = "2026-10-12";
const DATE_PUBLISHED_LABEL = "October 12, 2026";
const AUTHOR_NAME = "Crystal Costa";

const INTRO_PARAGRAPHS = [
  "I'm going to be honest with you: the emotional part of divorce gets all the attention, but the paperwork almost broke me. Legal documents, financial disclosures, custody schedules, account numbers, deadlines, copies of copies of copies. All of it arriving while you're running on no sleep and trying to keep your kids' lives feeling normal.",
  "I'm a mom of two, I work full time, and I recently went through a divorce. Nobody hands you a manual. So I built my own system for keeping every piece of it organized, and I'm sharing it because I wish someone had shared it with me.",
];

type BlogSection = {
  heading: string;
  paragraphs?: string[];
  items?: Array<{ lead: string; body: string }>;
};

const SECTIONS: BlogSection[] = [
  {
    heading: "The binder (yes, a physical binder)",
    paragraphs: [
      "I know, it sounds old school. But when lawyers, courts, and financial institutions all want documents, having one place where everything lives is non-negotiable. I used a physical binder with tabs, plus digital scans of everything as backup. Here's how I organized it:",
    ],
    items: [
      {
        lead: "Legal documents.",
        body: "Filings, court orders, correspondence from attorneys. In chronological order, newest on top. Every time something new arrived, it went straight in the binder before I did anything else.",
      },
      {
        lead: "Financial records.",
        body: "Bank statements, tax returns, pay stubs, retirement account info, debt balances, property valuations. Divorce requires financial disclosures, and hunting for these under deadline pressure is miserable. Gathering them once, in one place, saves you from doing it five times.",
      },
      {
        lead: "Custody and parenting schedule.",
        body: "The parenting plan, school calendars, medical information for both kids, emergency contacts, and a log of schedule changes. When you're co-parenting, having the agreed schedule in writing ends arguments before they start.",
      },
      {
        lead: "Correspondence log.",
        body: "Every important email, every agreement made verbally (followed up in writing), every deadline. Dates included. If it's not written down, it didn't happen. This protects you.",
      },
      {
        lead: "Personal admin.",
        body: "Your own changing details: new accounts, updated beneficiaries, insurance changes, name change documents if applicable. Divorce touches every corner of your paperwork, and this section catches what falls through the cracks.",
      },
    ],
  },
  {
    heading: "The habits that saved me",
    items: [
      {
        lead: "File immediately.",
        body: "The rule was simple: nothing sits on the counter overnight. New document arrives, it goes in the binder or gets scanned that day. A five-minute habit that prevented a hundred hours of searching.",
      },
      {
        lead: "Scan everything.",
        body: "Phone scanner apps are free and take seconds. Every paper document got scanned the day it arrived. If the binder ever got lost or damaged, I had a full backup.",
      },
      {
        lead: "One calendar for deadlines.",
        body: "Court dates, filing deadlines, response windows, attorney appointments. All on one calendar with reminders set a week out and a day out. Missing a legal deadline is not like missing a dentist appointment.",
      },
      {
        lead: "A weekly 20-minute check-in.",
        body: "Every Sunday, I reviewed what came in that week, what was due the next week, and whether anything needed a follow-up call or email. Twenty minutes kept me ahead of everything.",
      },
    ],
  },
  {
    heading: "You don't have to build this from scratch",
    paragraphs: [
      "I eventually turned my whole system into a printable planner: 36 pages with tabbed sections for legal documents, financial records, custody schedules, correspondence logs, deadline trackers, and checklists for all the admin tasks divorce throws at you. Fillable PDF, so you can type directly into it or print it for a physical binder.",
    ],
  },
];

const CTA_URL =
  "https://shop.beacons.ai/clevermom/3215cea5-12f4-40c3-b02c-d1799217ca9b";
const CTA_LABEL = "Get Instant Access: The Petty Divorce Binder";
const CTA_SUPPORTING =
  "It's $8. Divorce is expensive enough. Staying organized shouldn't be.";

const CLOSING_NOTE =
  "This post shares what worked for me personally. It's not legal advice. For legal questions about your divorce, talk to a licensed attorney in your state.";

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

export const Route = createFileRoute(
  "/blog/divorce-organization-paperwork-system"
)({
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
          <p className="mt-12 border-t border-beige/30 pt-6 text-xs italic leading-relaxed text-taupe">
            {CLOSING_NOTE}
          </p>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
          />
        </div>
      </article>
    </main>
  );
}
