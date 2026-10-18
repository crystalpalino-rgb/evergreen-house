import { createFileRoute } from "@tanstack/react-router";

import {
  AmazonLink,
  DisclosureNote,
  JournalArticle,
  KitLink,
  LeadItem,
  P,
  Section,
  journalArticleMeta,
  type JournalArticleConfig,
} from "~/components/JournalArticle";

/**
 * Blog post: "The 20-Minute ADHD Home Reset That Actually Works"
 *
 * Owner-authored draft (/home/team/shared/03-20-minute-adhd-home-reset.md),
 * byline Crystal Costa. Copy is hardcoded here on purpose: the page is static
 * editorial content and must not depend on catalog state.
 *
 * The two amzn.to short links in the draft are published as clean dp URLs with
 * the site tag (tag=crystalcost09-20), each reporting one affiliate_click
 * through the single push point in ~/lib/analytics, so this post carries the
 * Amazon disclosure once before the first shoppable link. The only other
 * outbound link is the owner's own Etsy kit.
 */

const AMAZON_KITCHEN_TIMER =
  "https://www.amazon.com/dp/B0CPDLRLST?tag=crystalcost09-20";
const AMAZON_CLEANING_SUPPLIES =
  "https://www.amazon.com/dp/B09P1Z6JH5?tag=crystalcost09-20";

const CONFIG: JournalArticleConfig = {
  slug: "20-minute-adhd-home-reset",
  title: "The 20-Minute ADHD Home Reset That Actually Works",
  h1: "The 20-Minute ADHD Home Reset That Actually Works",
  description:
    "The 20-minute ADHD home reset: a cleaning system designed for how ADHD brains actually work, timers, visible progress, and zero shame.",
  datePublished: "2026-10-18",
  datePublishedLabel: "October 18, 2026",
  hero: {
    jpg: "/images/blog-adhd-home-reset.jpg",
    webp: "/images/blog-adhd-home-reset.webp",
    alt: "A round kitchen timer with a plain face beside a woven basket holding a folded linen cloth and a small amber spray bottle on a clean pale counter",
  },
  intro: [
    "Traditional cleaning advice fails ADHD brains because it assumes sustained attention, working memory, and task initiation all work on command. This reset is built for the brain you have.",
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
        includes the 20-minute reset cards, the doom-pile triage system,
        room-by-room checklists, and a weekly maintenance tracker.
      </>
    ),
  },
};

const ROUNDS: Array<{ lead: string; body: string }> = [
  {
    lead: "Round 1, Trash sweep (5 min)",
    body: "Grab a trash bag. Walk every room. Trash only. Don't organize, don't put things away, trash only. ADHD brains do one category at a time.",
  },
  {
    lead: "Round 2, Dish dash (5 min)",
    body: "All dishes to the sink. Just the sink, not washed, not put away. Getting everything to one place is the win. If the dishwasher has clean dishes, that's round 2's job: empty it first, then load.",
  },
  {
    lead: "Round 3, Flat surfaces (5 min)",
    body: 'Pick the three surfaces you see most (kitchen counter, coffee table, nightstand). Clear them. Everything that isn\'t trash goes in one laundry basket, the "deal with later" basket. Later is a real time. Right now is reset time.',
  },
  {
    lead: "Round 4, Floors (5 min)",
    body: "Quick pick-up of anything on floors, then a fast vacuum or sweep of the main traffic area. Done is better than deep.",
  },
];

export const Route = createFileRoute("/blog/20-minute-adhd-home-reset")({
  head: () => journalArticleMeta(CONFIG),
  component: BlogPost,
});

function BlogPost() {
  return (
    <JournalArticle config={CONFIG}>
      <DisclosureNote />

      <Section heading={'Why "just clean for 20 minutes" usually fails'}>
        <P>
          Vague instructions + no visible finish line + boring tasks = your brain
          checks out at minute four. The fix isn't more discipline. It's better
          scaffolding.
        </P>
      </Section>

      <Section heading="The reset: 4 rounds of 5 minutes">
        <P>
          Set a visible timer (phone timer works, but a cheap{" "}
          <AmazonLink
            asin="B0CPDLRLST"
            href={AMAZON_KITCHEN_TIMER}
            name="kitchen timer you can see"
            blogSlug={CONFIG.slug}
          >
            kitchen timer
          </AmazonLink>{" "}
          you can <em>see</em> is better). Four rounds, five minutes each.
          Between rounds: 60 seconds to stretch, drink water, check the timer.
        </P>
        {ROUNDS.map((round) => (
          <LeadItem key={round.lead} lead={round.lead}>
            {round.body}
          </LeadItem>
        ))}
      </Section>

      <Section heading="The rules that make it work">
        <LeadItem lead="One category per round.">
          {'Never "clean the kitchen." Always "trash" or "dishes."'}
        </LeadItem>
        <LeadItem lead="Visible timer.">
          Time blindness is real; an audible + visible timer externalizes it.
        </LeadItem>
        <LeadItem lead="The basket is sacred.">
          {
            'The "deal with later" basket prevents the #1 ADHD cleaning trap: picking something up, wandering to put it away, and finding three new tasks.'
          }
        </LeadItem>
        <LeadItem lead="Stop at 20.">
          Quitting on time teaches your brain that cleaning has an end, which
          makes starting next time easier.
        </LeadItem>
        <LeadItem lead="Keep supplies minimal and visible.">
          One small set of{" "}
          <AmazonLink
            asin="B09P1Z6JH5"
            href={AMAZON_CLEANING_SUPPLIES}
            name="cleaning supplies"
            blogSlug={CONFIG.slug}
          >
            cleaning supplies
          </AmazonLink>{" "}
          under the sink beats a cabinet full of bottles you will never open.
        </LeadItem>
      </Section>

      <Section heading="Make it stick">
        <P>
          Do it at the same trigger daily, right after dinner, or when a
          specific show ends. Same time + same trigger beats motivation every
          time.
        </P>
      </Section>
    </JournalArticle>
  );
}
