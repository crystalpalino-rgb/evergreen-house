import type { ReactNode } from "react";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";
import { SITE_NAME, SITE_URL } from "~/lib/schema";
import { trackAffiliateClick } from "~/lib/analytics";

/**
 * Shared shell for a hand-authored Journal post written by the owner
 * (Crystal Costa byline).
 *
 * Same rendering as the earlier one-off posts under src/routes/blog/ (see
 * meal-planning-tight-grocery-budget.tsx and how-to-make-your-bed-look-expensive.tsx):
 * Breadcrumbs, "The Journal" kicker, H1, date / byline line, a 3:2 editorial
 * hero image, the body sections, the owner-product CTA card, the Article
 * JSON-LD with a Person author. The copy for every post stays hardcoded in its
 * own route file: these pages are static editorial content and must not depend
 * on catalog state.
 *
 * Two intentional additions over the older posts:
 * - every post carries its own hero art (jpg + webp twin under public/images/)
 *   which is also used as the Article schema image and the og:image;
 * - Amazon links are written as clean tagged dp URLs and report one
 *   affiliate_click through the single push point in ~/lib/analytics.
 */

/** Amazon disclosure, rendered once before the first shoppable link. */
export const AMAZON_DISCLOSURE =
  "Evergreen House may earn a small commission from Amazon purchases made through our links, at no extra cost to you. Every product we link to is one we genuinely like.";

export type JournalHero = {
  /** Web copy under public/images/, e.g. "/images/blog-sunday-reset.jpg". */
  jpg: string;
  /** WebP twin of the same crop. */
  webp: string;
  alt: string;
};

export type JournalCtaAction = {
  url: string;
  label: string;
};

export type JournalArticleConfig = {
  slug: string;
  /** Document title / Article name. */
  title: string;
  /** Visible H1. */
  h1: string;
  description: string;
  datePublished: string;
  datePublishedLabel: string;
  authorName?: string;
  hero: JournalHero;
  intro: string[];
  /** Omit for posts with no shoppable links. */
  cta?: {
    actions: JournalCtaAction[];
    supporting?: ReactNode;
  };
};

export function journalArticleMeta(config: JournalArticleConfig) {
  const seo = generateStaticMetadata(
    config.title,
    config.description,
    `/blog/${config.slug}`,
    { image: config.hero.jpg, imageWidth: 1200, imageHeight: 800 }
  );
  return { meta: seo.meta, links: seo.links };
}

/** Body paragraph in the article voice. */
export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 text-lg leading-relaxed text-warm-gray">{children}</p>
  );
}

/**
 * Amazon disclosure, rendered once before the first shoppable link on posts
 * that carry Amazon links.
 */
export function DisclosureNote() {
  return (
    <p className="mt-8 text-xs italic leading-relaxed text-taupe">
      {AMAZON_DISCLOSURE}
    </p>
  );
}

/** H2 block, matching the section rhythm of the earlier Journal posts. */
export function Section({
  heading,
  children,
}: {
  heading: string;
  children?: ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
        {heading}
      </h2>
      {children}
    </section>
  );
}

/** Bolded lead-in plus its paragraph, for numbered steps and named rounds. */
export function LeadItem({ lead, children }: { lead: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="font-serif text-lg font-semibold text-warm-dark sm:text-xl">
        {lead}
      </h3>
      <p className="mt-2 text-base leading-relaxed text-warm-gray">{children}</p>
    </div>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-5 list-disc space-y-2 pl-6 text-lg leading-relaxed text-warm-gray">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Amazon affiliate link. productId is the ASIN (these posts recommend single
 * products, not catalog rows), context/eventId follow the amz-click-<slug>-<id>
 * convention, and the click goes through the one dataLayer push point.
 */
export function AmazonLink({
  asin,
  href,
  name,
  blogSlug,
  children,
}: {
  asin: string;
  href: string;
  name: string;
  blogSlug: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
      onClick={() =>
        trackAffiliateClick({
          productId: asin,
          name,
          context: `blog:${blogSlug}`,
          destinationUrl: href,
          eventId: `amz-click-${blogSlug}-${asin}`,
        })
      }
    >
      {children}
    </a>
  );
}

/** Owner-product (Etsy) link: her own shop, so no affiliate disclosure. */
export function KitLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
    >
      {children}
    </a>
  );
}

export function JournalArticle({
  config,
  children,
}: {
  config: JournalArticleConfig;
  children: ReactNode;
}) {
  const authorName = config.authorName || "Crystal Costa";
  const blogPath = `/blog/${config.slug}`;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: config.title },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    name: config.title,
    headline: config.h1,
    description: config.description,
    datePublished: config.datePublished,
    dateModified: config.datePublished,
    inLanguage: "en-US",
    image: `${SITE_URL}${config.hero.jpg}`,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${blogPath}`,
    },
  };

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
              {config.h1}
            </h1>
            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-taupe">
              <time dateTime={config.datePublished}>
                {config.datePublishedLabel}
              </time>
              <span className="mx-2 text-beige" aria-hidden="true">
                /
              </span>
              <span>By {authorName}</span>
            </p>
            <picture>
              <source srcSet={config.hero.webp} type="image/webp" />
              <img
                src={config.hero.jpg}
                alt={config.hero.alt}
                width={1200}
                height={800}
                loading="eager"
                decoding="async"
                className="mt-8 aspect-[3/2] w-full rounded-2xl object-cover"
              />
            </picture>
            {config.intro.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mt-7 text-lg leading-relaxed text-warm-gray"
              >
                {paragraph}
              </p>
            ))}
          </header>
          {children}
          {config.cta && (
            <section className="mt-14">
              <div className="rounded-2xl border border-terracotta/25 bg-white p-6 text-center shadow-sm sm:p-8">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {config.cta.actions.map((action) => (
                    <a
                      key={action.url}
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-terracotta px-7 py-3.5 font-sans text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-terracotta-dark"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
                {config.cta.supporting && (
                  <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-warm-gray">
                    {config.cta.supporting}
                  </p>
                )}
              </div>
            </section>
          )}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
          />
        </div>
      </article>
    </main>
  );
}
