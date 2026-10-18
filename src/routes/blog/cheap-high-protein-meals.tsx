import { createFileRoute } from "@tanstack/react-router";

import {
  Bullets,
  JournalArticle,
  LeadItem,
  P,
  Section,
  journalArticleMeta,
  type JournalArticleConfig,
} from "~/components/JournalArticle";

/**
 * Blog post: "15 Cheap High-Protein Meals That Actually Taste Good"
 *
 * Owner-authored draft (/home/team/shared/02-cheap-high-protein-meals.md),
 * byline Crystal Costa. Copy is hardcoded here on purpose: the page is static
 * editorial content and must not depend on catalog state.
 *
 * This post carries no Amazon links and no owner-kit link, so it has no
 * affiliate disclosure and no CTA card; the two "[AFFILIATE OPPORTUNITY: ...]"
 * notes in the draft are notes-to-self, not content, and are not published.
 */

const CONFIG: JournalArticleConfig = {
  slug: "cheap-high-protein-meals",
  title: "15 Cheap High-Protein Meals That Actually Taste Good",
  h1: "15 Cheap High-Protein Meals That Actually Taste Good",
  description:
    "15 high-protein meals under $2.50 per serving. Real food, real flavor, no sad plain chicken breast.",
  datePublished: "2026-10-18",
  datePublishedLabel: "October 18, 2026",
  hero: {
    jpg: "/images/blog-high-protein-meals.jpg",
    webp: "/images/blog-high-protein-meals.webp",
    alt: "A cast iron skillet of egg fried rice topped with two fried eggs on a warm oak counter with a dish of brown eggs, a bowl of lentils, a linen napkin and a wooden spoon",
  },
  intro: [
    "Eating high-protein on a budget feels impossible until you know which ingredients do the heavy lifting. These 15 meals each pack 25g+ protein per serving for under $2.50.",
  ],
};

const HALL_OF_FAME = [
  <>
    <strong className="font-semibold text-warm-dark">Eggs</strong> (~$0.20
    each, 6g protein)
  </>,
  <>
    <strong className="font-semibold text-warm-dark">Chicken thighs</strong>{" "}
    (~$0.90/lb on sale, 26g per 4oz)
  </>,
  <>
    <strong className="font-semibold text-warm-dark">Canned tuna</strong>{" "}
    (~$1.00, 25g)
  </>,
  <>
    <strong className="font-semibold text-warm-dark">
      Greek yogurt, store brand
    </strong>{" "}
    (~$0.80/cup, 15g)
  </>,
  <>
    <strong className="font-semibold text-warm-dark">Cottage cheese</strong>{" "}
    (~$0.75/cup, 14g)
  </>,
  <>
    <strong className="font-semibold text-warm-dark">Lentils</strong>{" "}
    (~$0.15/serving dry, 18g per cooked cup)
  </>,
  <>
    <strong className="font-semibold text-warm-dark">Black beans</strong>{" "}
    (~$0.20/serving, 15g per cup)
  </>,
  <>
    <strong className="font-semibold text-warm-dark">Peanut butter</strong>{" "}
    (~$0.20/serving, 8g)
  </>,
];

const MEALS: Array<{ lead: string; body: string }> = [
  {
    lead: "1. Egg fried rice",
    body: "6 eggs + day-old rice + frozen peas + soy sauce. ~30g protein. $1.20/serving.",
  },
  {
    lead: "2. Chicken thigh sheet pan",
    body: "Thighs + potatoes + broccoli, one pan. ~35g protein. $2.10/serving.",
  },
  {
    lead: "3. Lentil bolognese",
    body: "Red lentils simmered like meat sauce over pasta. ~22g protein. $1.10/serving.",
  },
  {
    lead: "4. Tuna melt quesadillas",
    body: "Tuna + cheese + hot sauce in tortillas. ~30g protein. $1.80/serving.",
  },
  {
    lead: "5. Cottage cheese pasta sauce",
    body: "Blended cottage cheese + marinara + parmesan. ~25g protein. $1.60/serving.",
  },
  {
    lead: "6. Black bean and corn chili",
    body: "With a fried egg on top. ~24g protein. $1.30/serving.",
  },
  {
    lead: "7. Greek yogurt chicken marinade",
    body: "Yogurt + spices, then bake or grill. ~38g protein. $2.20/serving.",
  },
  {
    lead: "8. Peanut noodles with edamame",
    body: "~20g protein. $1.50/serving.",
  },
  {
    lead: "9. Sausage and white bean skillet",
    body: "~26g protein. $2.00/serving.",
  },
  {
    lead: "10. Shakshuka",
    body: "Eggs poached in spiced tomato sauce + bread. ~22g protein. $1.40/serving.",
  },
  {
    lead: "11. Chicken fried rice",
    body: "Rotisserie chicken + rice + frozen veg. ~32g protein. $2.00/serving.",
  },
  {
    lead: "12. Lentil and sausage soup",
    body: "~24g protein. $1.70/serving.",
  },
  {
    lead: "13. Tuna pasta bake",
    body: "~28g protein. $1.90/serving.",
  },
  {
    lead: "14. Bean and cheese burritos (freezer batch)",
    body: "~20g protein. $1.10/serving.",
  },
  {
    lead: "15. Egg roll in a bowl",
    body: "Ground turkey or pork + cabbage slaw. ~28g protein. $2.30/serving.",
  },
];

export const Route = createFileRoute("/blog/cheap-high-protein-meals")({
  head: () => journalArticleMeta(CONFIG),
  component: BlogPost,
});

function BlogPost() {
  return (
    <JournalArticle config={CONFIG}>
      <Section heading="The budget protein hall of fame (cost per serving)">
        <Bullets items={HALL_OF_FAME} />
      </Section>

      <Section heading="The 15 meals">
        {MEALS.map((meal) => (
          <LeadItem key={meal.lead} lead={meal.lead}>
            {meal.body}
          </LeadItem>
        ))}
      </Section>

      <Section heading="The formula to remember">
        <P>
          <strong className="font-semibold text-warm-dark">
            Cheap protein + bulk carb + frozen veg + bold seasoning = dinner.
          </strong>{" "}
          Once you internalize that, you can improvise endlessly without a
          recipe.
        </P>
      </Section>
    </JournalArticle>
  );
}
