import { createFileRoute } from "@tanstack/react-router";

import {
  StockingGiftGuide,
  type StockingCardCopy,
  type StockingGuide,
  type StockingManifest,
} from "~/components/StockingGiftGuide";
import { generateStaticMetadata } from "~/lib/seo";
import { MEAL_PREP_KITCHEN_RESET_LIST } from "~/lib/storefront-lists";
import listManifest from "~/data/meal-prep-kitchen-reset/list-manifest.json";
import cardCopy from "~/data/meal-prep-kitchen-reset/card-copy.json";

/**
 * January list page: "Meal Prep Kitchen Reset" (owner decisions 48 and 49, 2026-11-22). One of
 * the four January lists, built on the same storefront-list template as the
 * stocking pages. Every product fact comes from src/data/meal-prep-kitchen-reset/list-manifest.json,
 * the merchandiser's live read of the list on 2026-11-22; the lines come from
 * card-copy.json, keyed by ASIN. Nothing below is typed by hand.
 *
 * The page opens on its own Amazon list card, which carries the list name, one
 * line and one crystalpalino-20 link, and no rating, count or price.
 */

const PAGE_PATH = "/meal-prep-kitchen-reset";
const HERO_JPG = "/images/january-meal-prep-kitchen-reset-hero.jpg";
const HERO_WEBP = "/images/january-meal-prep-kitchen-reset-hero.webp";
const HERO_ALT =
  "Glass storage jars of grains and pasta, a wooden board and a bowl of fruit on a pale stone kitchen counter, with a folded linen towel and morning light from a side window.";

const copy = cardCopy as unknown as StockingCardCopy;

const guide: StockingGuide = {
  pagePath: PAGE_PATH,
  eyebrow: "The January Reset",
  breadcrumbParent: {
    label: "The Reset List",
    href: "/blog/the-reset-list-17-finds",
  },
  heroJpg: HERO_JPG,
  heroWebp: HERO_WEBP,
  heroAlt: HERO_ALT,
  verifiedDate: "2026-11-22",
  verifiedDateLabel: "November 22, 2026",
  analyticsContext: "guide:meal-prep-kitchen-reset",
  analyticsPrefix: "meal-prep-kitchen-reset",
  list: { ...MEAL_PREP_KITCHEN_RESET_LIST, line: copy.list_card_line },
  manifest: listManifest as unknown as StockingManifest,
  copy,
  related: {
    heading: "The rest of the January reset",
    body: "Four lists, one for each part of January. Start with the organized home, or go straight to the part of the month you are on.",
    links: [
      {
        label: "New Year, Organized Home",
        href: "/new-year-organized-home",
        line: "Eight pieces for the January reset: containers, labels and drawers that make the shelves finally make sense.",
      },
      {
        label: "Small-Space Home Fitness",
        href: "/small-space-home-fitness",
        line: "Seven pieces of workout gear that store away, for the room that has to be a living room the rest of the day.",
      },
      {
        label: "Wellness at Home",
        href: "/wellness-at-home",
        line: "Eight quiet pieces for the part of January that is not about doing more.",
      },
      {
        label: "The Reset List: 17 Finds for a Home That Runs Itself",
        href: "/blog/the-reset-list-17-finds",
        line: "The post the four lists came out of: the systems that reset the week, one piece at a time.",
      },
    ],
  },
};

export const Route = createFileRoute("/meal-prep-kitchen-reset")({
  head: () => {
    const seo = generateStaticMetadata(
      copy.seo_title,
      copy.seo_description,
      PAGE_PATH,
      {
        image: HERO_JPG,
        imageWidth: 1600,
        imageHeight: 1100,
      }
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: MealPrepKitchenResetPage,
});

function MealPrepKitchenResetPage() {
  return <StockingGiftGuide guide={guide} />;
}
