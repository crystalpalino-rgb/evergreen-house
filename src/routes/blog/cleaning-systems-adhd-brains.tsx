import { createFileRoute } from "@tanstack/react-router";

import {
  AmazonLink,
  Bullets,
  DisclosureNote,
  JournalArticle,
  KitLink,
  P,
  Section,
  journalArticleMeta,
  type JournalArticleConfig,
} from "~/components/JournalArticle";

/**
 * Blog post: "10 Cleaning Systems Designed for ADHD Brains"
 *
 * Owner-authored draft (/home/team/shared/04-cleaning-systems-adhd-brains.md),
 * byline Crystal Costa. Copy is hardcoded here on purpose: the page is static
 * editorial content and must not depend on catalog state.
 *
 * The two amzn.to short links in the draft are published as clean dp URLs with
 * the site tag (tag=crystalcost09-20), each reporting one affiliate_click
 * through the single push point in ~/lib/analytics, so this post carries the
 * Amazon disclosure once before the first shoppable link. The only other
 * outbound link is the owner's own Etsy kit.
 */

const AMAZON_ROBOT_VACUUM =
  "https://www.amazon.com/dp/B0HJC65V71?tag=crystalcost09-20";
const AMAZON_STARTER_KIT =
  "https://www.amazon.com/dp/B0CYW4GZLC?tag=crystalcost09-20";

const CONFIG: JournalArticleConfig = {
  slug: "cleaning-systems-adhd-brains",
  title: "10 Cleaning Systems Designed for ADHD Brains",
  h1: "10 Cleaning Systems Designed for ADHD Brains",
  description:
    "10 cleaning systems built for ADHD, body doubling, visible cues, and low-friction routines that work with your brain instead of against it.",
  datePublished: "2026-10-18",
  datePublishedLabel: "October 18, 2026",
  hero: {
    jpg: "/images/blog-cleaning-systems-adhd.jpg",
    webp: "/images/blog-cleaning-systems-adhd.webp",
    alt: "Open woven storage baskets and a clear bin of folded linens on an oak shelf above a bench with a tray holding keys and a wallet",
  },
  intro: [
    'Most cleaning systems were designed by people who\'ve never lost 40 minutes to reorganizing a drawer they opened "for one second." These ten were chosen because they work with ADHD traits, not against them.',
  ],
  cta: {
    actions: [
      {
        url: "https://www.etsy.com/listing/4594943279/adhd-home-reset-kit-adhd-cleaning",
        label: "Get Instant Access: ADHD Home Reset Kit",
      },
    ],
    supporting: (
      <>
        Want the full system printable? Our $8{" "}
        <KitLink href="https://www.etsy.com/listing/4594943279/adhd-home-reset-kit-adhd-cleaning">
          ADHD Home Reset Kit
        </KitLink>{" "}
        turns these systems into cards and checklists you can actually follow:
        the 20-minute reset, the doom-pile triage, room-by-room lists, and a
        weekly maintenance tracker.
      </>
    ),
  },
};

export const Route = createFileRoute("/blog/cleaning-systems-adhd-brains")({
  head: () => journalArticleMeta(CONFIG),
  component: BlogPost,
});

function BlogPost() {
  return (
    <JournalArticle config={CONFIG}>
      <DisclosureNote />

      <Section heading="1. Body doubling">
        <P>
          Clean while on the phone, on a video call, or next to someone else
          cleaning. The other person's presence regulates attention. There are
          entire "clean with me" livestreams for exactly this.
        </P>
      </Section>

      <Section heading="2. The 10-things pickup">
        <P>
          Don't "clean the living room." Pick up 10 things. Count out loud.
          Small, countable, finishable, your brain gets the dopamine hit of
          completion fast.
        </P>
      </Section>

      <Section heading="3. Room rescue, not room perfection">
        <P>
          Set a timer for 15 minutes per room. When it rings, you leave, even
          mid-task. "Rescued" beats "perfect" because perfect never starts.
        </P>
      </Section>

      <Section heading="4. Open storage everywhere">
        <P>
          ADHD brains are "out of sight, out of mind", which means closed
          cabinets become black holes. Baskets, open shelves, and clear bins
          beat pretty hidden storage every time.
        </P>
      </Section>

      <Section heading="5. The landing pad">
        <P>
          One tray or basket by the door for keys, wallet, sunglasses.
          Eliminates the daily 10-minute "where are my keys" spiral. This single
          habit saves hours a month.
        </P>
      </Section>

      <Section heading="6. Laundry: the one-basket system">
        <P>
          Forget sort-fold-put-away as separate events. One basket for dirty,
          wash when full, fold straight from the dryer onto the bed, put away
          immediately. Touch each item as few times as possible.
        </P>
      </Section>

      <Section heading="7. Dishwasher as dish rack">
        <P>
          If you have a dishwasher, stop hand-drying. It <em>is</em> the drying
          rack. Unload directly to cabinets when you need space.
        </P>
      </Section>

      <Section heading="8. The Sunday shutdown (30 min)">
        <P>
          Once a week: reset the main rooms, start one load of laundry, take out
          all trash, glance at the calendar. It's maintenance, not deep
          cleaning, it prevents the avalanche.
        </P>
      </Section>

      <Section heading="9. Pair cleaning with something rewarding">
        <P>
          Only listen to your favorite podcast while folding laundry. Only watch
          that show while doing dishes. Temptation bundling makes boring tasks
          the price of admission to fun ones.
        </P>
      </Section>

      <Section heading="10. Lower the bar on purpose">
        <P>
          Paper plates during hard weeks. A{" "}
          <AmazonLink
            asin="B0HJC65V71"
            href={AMAZON_ROBOT_VACUUM}
            name="robot vacuum"
            blogSlug={CONFIG.slug}
          >
            robot vacuum
          </AmazonLink>
          . Hiring a one-time deep clean twice a year. These aren't failures,
          they're accommodations, and accommodations are smart.
        </P>
        <P>
          If you are starting from zero, a{" "}
          <AmazonLink
            asin="B0CYW4GZLC"
            href={AMAZON_STARTER_KIT}
            name="cleaning supplies starter kit"
            blogSlug={CONFIG.slug}
          >
            cleaning supplies starter kit
          </AmazonLink>{" "}
          with the basics in one box beats buying ten separate products you will
          never open.
        </P>
      </Section>

      <Section heading="What to avoid">
        <Bullets
          items={[
            "All-day cleaning marathons (decision fatigue by hour two)",
            "Systems with more than 3 steps (working memory bottleneck)",
            "Buying organizers before decluttering (containers don't fix clutter)",
          ]}
        />
      </Section>
    </JournalArticle>
  );
}
