import { createFileRoute } from "@tanstack/react-router";

import {
  JournalArticle,
  KitLink,
  P,
  Section,
  journalArticleMeta,
  type JournalArticleConfig,
} from "~/components/JournalArticle";

/**
 * Blog post: "How to Cut Your Grocery Bill by $200 a Month Without Clipping a
 * Single Coupon"
 *
 * Owner-authored draft (/home/team/shared/01-cut-grocery-bill-200.md), byline
 * Crystal Costa. Copy is hardcoded here on purpose: the page is static
 * editorial content and must not depend on catalog state. This post carries no
 * Amazon links, so it has no affiliate disclosure; the only outbound link is
 * the owner's own Etsy kit, which is her own product.
 *
 * The two "[AFFILIATE OPPORTUNITY: ...]" notes in the draft are notes-to-self,
 * not content, so they are not published here.
 */

const CONFIG: JournalArticleConfig = {
  slug: "cut-grocery-bill-200",
  title:
    "How to Cut Your Grocery Bill by $200 a Month Without Clipping a Single Coupon",
  h1: "How to Cut Your Grocery Bill by $200 a Month Without Clipping a Single Coupon",
  description:
    "Cut your grocery bill by $200 a month with these 9 practical strategies, no coupons, no extreme frugality, just smarter shopping.",
  datePublished: "2026-10-18",
  datePublishedLabel: "October 18, 2026",
  hero: {
    jpg: "/images/blog-cut-grocery-bill.jpg",
    webp: "/images/blog-cut-grocery-bill.webp",
    alt: "A canvas tote of crisp apples, a yellow onion and leafy greens on a warm oak counter beside glass jars of pantry staples, folded paper freezer packages and a blank meal planning notepad",
  },
  intro: [
    "Groceries are one of the biggest flexible expenses in any household, which means they're also one of the biggest opportunities. Most families can cut $150-$250 a month without eating worse. Here's how.",
  ],
  cta: {
    actions: [
      {
        url: "https://www.etsy.com/listing/4594961400/stretch-the-cart-budget-meal-planning",
        label: "Get Instant Access: Stretch the Cart Budget Meal Planning Kit",
      },
    ],
    supporting: (
      <>
        Want the whole system as a printable? Our $8{" "}
        <KitLink href="https://www.etsy.com/listing/4594961400/stretch-the-cart-budget-meal-planning">
          Budget Meal Planning Kit
        </KitLink>{" "}
        includes the 4-week rotating meal plan, grocery list templates, pantry
        inventory sheets, and the freezer inventory tracker.
      </>
    ),
  },
};

export const Route = createFileRoute("/blog/cut-grocery-bill-200")({
  head: () => journalArticleMeta(CONFIG),
  component: BlogPost,
});

function BlogPost() {
  return (
    <JournalArticle config={CONFIG}>
      <Section heading="1. Shop with a list built from a meal plan (saves ~$60/month)">
        <P>
          Impulse buys are the #1 budget killer. A 10-minute weekly meal plan
          plus list eliminates the "grab whatever looks good" tax. Plan 5
          dinners, not 7, leave room for leftovers and one flexible night.
        </P>
      </Section>

      <Section heading="2. Do a pantry inventory before you shop (saves ~$30/month)">
        <P>
          Most households rebuy things they already own. Snap a photo of your
          pantry, fridge, and freezer before every trip. Build meals around what
          you already have first.
        </P>
      </Section>

      <Section heading="3. Switch 10 staples to store brand (saves ~$25/month)">
        <P>
          Milk, eggs, canned tomatoes, pasta, rice, frozen vegetables, oats,
          peanut butter, broth, and spices. Blind taste tests consistently show
          most people can't tell the difference, but your receipt can.
        </P>
      </Section>

      <Section heading="4. Buy meat on sale and freeze it (saves ~$40/month)">
        <P>
          Meat is the most expensive thing in the cart. When chicken, ground
          beef, or pork goes on deep sale, buy 2-3 weeks' worth and freeze in
          meal-sized portions. A $40 chest freezer pays for itself in two
          months.
        </P>
      </Section>

      <Section heading={'5. Make one "clean out the fridge" meal per week (saves ~$20/month)'}>
        <P>
          Stir-fry, soup, fried rice, or quesadillas. Whatever's wilting becomes
          dinner. The average family throws away ~$1,500 of food a year, this
          one habit attacks it directly.
        </P>
      </Section>

      <Section heading="6. Stop shopping hungry and stop shopping weekly (saves ~$25/month)">
        <P>
          Hungry shopping adds ~15% to the bill. And switching from weekly to
          biweekly big trips (with one small fresh-produce top-up) cuts impulse
          visits dramatically.
        </P>
      </Section>

      <Section heading="7. Learn 5 cheap anchor meals (saves ~$30/month)">
        <P>
          Every budget cook needs a rotation of meals under $2/serving: bean
          chili, lentil soup, egg fried rice, pasta with sausage, sheet-pan
          chicken thighs. Master five and you'll never stare blankly into the
          fridge again.
        </P>
      </Section>

      <Section heading="8. Compare unit prices, not sticker prices (saves ~$15/month)">
        <P>
          The bigger box isn't always cheaper. Glance at the unit price on the
          shelf tag, it takes two seconds and regularly flips which size wins.
        </P>
      </Section>

      <Section heading="9. Audit your subscriptions and delivery fees (saves ~$20+/month)">
        <P>
          Delivery markups and fees quietly add 15-25% to every order. One month
          of pickup-only shopping usually shocks people into keeping it.
        </P>
      </Section>
    </JournalArticle>
  );
}
