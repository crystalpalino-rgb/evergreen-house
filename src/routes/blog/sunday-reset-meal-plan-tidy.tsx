import { createFileRoute } from "@tanstack/react-router";

import {
  Bullets,
  JournalArticle,
  KitLink,
  LeadItem,
  P,
  Section,
  journalArticleMeta,
  type JournalArticleConfig,
} from "~/components/JournalArticle";

/**
 * Blog post: "The Sunday Reset: Meal Plan + Tidy House in 2 Hours"
 *
 * Owner-authored draft (/home/team/shared/05-sunday-reset-meal-plan-tidy.md),
 * byline Crystal Costa. Copy is hardcoded here on purpose: the page is static
 * editorial content and must not depend on catalog state.
 *
 * This post carries no Amazon links, so it has no affiliate disclosure; both
 * outbound links are the owner's own Etsy kits. The "(Full system in our
 * 20-minute reset guide.)" line links on-site to the ADHD reset post, which is
 * the only internal cross-link the draft asks for. The two
 * "[AFFILIATE OPPORTUNITY: ...]" notes in the draft are notes-to-self, not
 * content, and are not published.
 */

const KIT_MEAL_PLAN =
  "https://www.etsy.com/listing/4594961400/stretch-the-cart-budget-meal-planning";
const KIT_ADHD_RESET =
  "https://www.etsy.com/listing/4594943279/adhd-home-reset-kit-adhd-cleaning";

const CONFIG: JournalArticleConfig = {
  slug: "sunday-reset-meal-plan-tidy",
  title: "The Sunday Reset: Meal Plan + Tidy House in 2 Hours",
  h1: "The Sunday Reset: Meal Plan + Tidy House in 2 Hours",
  description:
    "The 2-hour Sunday reset: a step-by-step plan to walk into Monday with meals planned and the house under control.",
  datePublished: "2026-10-18",
  datePublishedLabel: "October 18, 2026",
  hero: {
    jpg: "/images/blog-sunday-reset.jpg",
    webp: "/images/blog-sunday-reset.webp",
    alt: "An open blank planner with a brass pen and a mug of coffee on an oak counter with folded dish towels, stacked plates and a bread basket in soft morning light",
  },
  intro: [
    "Sunday resets work because they front-load the week's two biggest stressors, food decisions and household chaos, into one focused block. Two hours, then you're done.",
  ],
  cta: {
    actions: [
      {
        url: KIT_MEAL_PLAN,
        label: "Get Instant Access: Budget Meal Planning Kit",
      },
      {
        url: KIT_ADHD_RESET,
        label: "Get Instant Access: ADHD Home Reset Kit",
      },
    ],
    supporting: (
      <>
        This is the system behind both of our $8 kits: the{" "}
        <KitLink href={KIT_MEAL_PLAN}>Budget Meal Planning Kit</KitLink>{" "}
        (grocery lists, pantry sheets, 4-week rotation) and the{" "}
        <KitLink href={KIT_ADHD_RESET}>ADHD Home Reset Kit</KitLink> (reset
        cards, triage system, maintenance tracker).
      </>
    ),
  },
};

export const Route = createFileRoute("/blog/sunday-reset-meal-plan-tidy")({
  head: () => journalArticleMeta(CONFIG),
  component: BlogPost,
});

function BlogPost() {
  return (
    <JournalArticle config={CONFIG}>
      <Section heading="Hour 1: The kitchen reset + meal plan (60 min)">
        <LeadItem lead="Minutes 0-15: Fridge and pantry scan">
          Toss anything expired. Note what needs using up this week. Snap a
          photo of what you have, this becomes your meal-plan starting point.
        </LeadItem>
        <LeadItem lead="Minutes 15-30: Plan 5 dinners">
          Pick 5 dinners from your anchor-meal rotation (keep a list on the
          fridge). Slot the use-it-up ingredients into 1-2 of them. One night
          stays flexible.
        </LeadItem>
        <LeadItem lead="Minutes 30-45: Write the grocery list">
          List by store section (produce, meat, dairy, pantry). Check the pantry
          photo first, cross off anything you already have.
        </LeadItem>
        <LeadItem lead="Minutes 45-60: One batch-cook task">
          While the plan is fresh, do ONE thing: cook a grain, roast a tray of
          vegetables, or marinate tomorrow's protein. Future-you says thanks.
        </LeadItem>
      </Section>

      <Section heading="Hour 2: The home reset (60 min)">
        <LeadItem lead="Minutes 0-20: The 20-minute ADHD reset">
          Trash sweep, dish dash, flat surfaces, floors, one category at a time,
          visible timer running. (Full system in our{" "}
          <a
            href="/blog/20-minute-adhd-home-reset"
            className="text-terracotta underline decoration-beige/40 underline-offset-2 transition-colors hover:text-terracotta-dark"
          >
            20-minute reset guide
          </a>
          .)
        </LeadItem>
        <LeadItem lead="Minutes 20-35: Laundry in motion">
          Start one load. Fold whatever's dry. The goal is flow, not completion.
        </LeadItem>
        <LeadItem lead="Minutes 35-50: The weekly hotspots">
          Bathroom wipe-down (sink, mirror, toilet, 5 min), take out all trash,
          fresh sheets if it's sheet week.
        </LeadItem>
        <LeadItem lead="Minutes 50-60: Calendar glance + tomorrow prep">
          Check the week's calendar. Lay out tomorrow's clothes, pack bags, set
          coffee. Monday morning you is already winning.
        </LeadItem>
      </Section>

      <Section heading="Make it yours">
        <Bullets
          items={[
            <>
              <strong className="font-semibold text-warm-dark">
                Put on a specific playlist or podcast.
              </strong>{" "}
              Same audio every week becomes a Pavlovian "reset time" cue.
            </>,
            <>
              <strong className="font-semibold text-warm-dark">
                Do it with someone.
              </strong>{" "}
              Partner, roommate, kid old enough to carry a basket, body doubling
              works for resets too.
            </>,
            <>
              <strong className="font-semibold text-warm-dark">
                Track the streak.
              </strong>{" "}
              A simple checkbox on the fridge. Three weeks in, it starts feeling
              weird to skip.
            </>,
          ]}
        />
      </Section>

      <Section heading="When Sunday isn't free">
        <P>
          The reset works any day, the magic is the <em>batching</em>, not the
          day. Pick your lowest-demand 2-hour block and protect it.
        </P>
      </Section>
    </JournalArticle>
  );
}
