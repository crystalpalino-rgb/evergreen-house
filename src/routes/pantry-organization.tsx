import { createFileRoute } from "@tanstack/react-router";

import {
  StockingGiftGuide,
  type StockingCardCopy,
  type StockingGuide,
  type StockingManifest,
} from "~/components/StockingGiftGuide";
import { generateStaticMetadata } from "~/lib/seo";
import { PANTRY_ORGANIZATION_LIST, getListImage } from "~/lib/storefront-lists";
import listManifest from "~/data/pantry-organization/list-manifest.json";
import cardCopy from "~/data/pantry-organization/card-copy.json";

/**
 * January list page: "Pantry Organization Ideas" (owner decision 54,
 * 2026-11-22). Same storefront-list template as the four January lists. Every
 * product fact comes from src/data/pantry-organization/list-manifest.json, the
 * merchandiser's live read of the list on 2026-11-23; the lines come from
 * card-copy.json, keyed by ASIN, which is the page copy's card_hook block
 * lifted as-is. Nothing below is typed by hand.
 *
 * Seven pieces, and seven is the number the page states everywhere: the copy
 * must not be edited upward (build note in the copy folder).
 */

const PAGE_PATH = "/pantry-organization";
const HERO_JPG = "/images/january-pantry-organization-hero-wide.jpg";
const HERO_WEBP = "/images/january-pantry-organization-hero-wide.webp";
const HERO_ALT =
  "Glass jars of spices and preserves on a wooden turntable beside stacked clear containers of grains on pale oak pantry shelves, with a woven basket of potatoes and carrots on the shelf below, in warm daylight.";

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
  verifiedDate: "2026-11-23",
  verifiedDateLabel: "November 23, 2026",
  analyticsContext: "guide:pantry-organization",
  analyticsPrefix: "pantry-organization",
  list: { ...PANTRY_ORGANIZATION_LIST, line: copy.list_card_line },
  listImage: getListImage(PANTRY_ORGANIZATION_LIST.key),
  manifest: listManifest as unknown as StockingManifest,
  copy,
  related: {
    heading: "The rest of the January reset",
    body: "Two working rooms, one list each, and the post the reset lists came out of.",
    links: [
      {
        label: "Closet Organization Ideas",
        href: "/closet-organization",
        line: "Eight closet organizers chosen to keep a closet visible and easy to put back, read and dated the same day.",
      },
      {
        label:
          "Pantry Organization Ideas: Seven Finds That Make a Shelf Legible",
        href: "/blog/pantry-organization-ideas",
        line: "The companion post: why seven, and what to measure before you order.",
      },
      {
        label: "Closet Organization Ideas: Eight Finds That Keep a Closet Tidy",
        href: "/blog/closet-organization-ideas",
        line: "The closet companion post, for the room with no shelf and no floor.",
      },
      {
        label: "The Reset List: 17 Finds for a Home That Runs Itself",
        href: "/blog/the-reset-list-17-finds",
        line: "The post the reset lists came out of: the systems that reset the week, one piece at a time.",
      },
    ],
  },
};

export const Route = createFileRoute("/pantry-organization")({
  head: () => {
    const seo = generateStaticMetadata(
      copy.seo_title,
      copy.seo_description,
      PAGE_PATH,
      {
        image: HERO_JPG,
        imageWidth: 1600,
        imageHeight: 1100,
      },
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: PantryOrganizationPage,
});

function PantryOrganizationPage() {
  return <StockingGiftGuide guide={guide} />;
}
