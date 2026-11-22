import { createFileRoute } from "@tanstack/react-router";

import {
  StockingGiftGuide,
  type StockingCardCopy,
  type StockingGuide,
  type StockingManifest,
} from "~/components/StockingGiftGuide";
import { generateStaticMetadata } from "~/lib/seo";
import { TEEN_BOYS_STOCKING_LIST } from "~/lib/storefront-lists";
import listManifest from "~/data/stocking-teen-boys/list-manifest.json";
import cardCopy from "~/data/stocking-teen-boys/card-copy.json";

/**
 * Gift guide: "Stocking Stuffers for Teen Boys: Tech, Games and Gear" (2026-11-22,
 * owner decision 48). One of the three stocking lists that got a page of its
 * own rather than a section on the hub. Every product fact comes from
 * src/data/stocking-teen-boys/list-manifest.json, the merchandiser's live read
 * of the list on 2026-11-22; the lines come from card-copy.json, keyed by ASIN.
 *
 * The gaming socks read 4.7 stars on 72 ratings, under the house 100 review
 * bar; the card shows the honest number and the line does not lean on it.
 */

const PAGE_PATH = "/stocking-teen-boys";
const HERO_JPG = "/images/stocking-teen-boys-hero-v2.jpg";
const HERO_WEBP = "/images/stocking-teen-boys-hero-v2.webp";
const HERO_ALT =
  "Flat lay of stocking gifts for teen boys: a Wilson football, wireless earbuds, a light strip, patterned socks, a power bank, card games and hand warmers under a lit tree";

const copy = cardCopy as unknown as StockingCardCopy;

const guide: StockingGuide = {
  pagePath: PAGE_PATH,
  heroJpg: HERO_JPG,
  heroWebp: HERO_WEBP,
  heroAlt: HERO_ALT,
  verifiedDate: "2026-11-22",
  verifiedDateLabel: "November 22, 2026",
  analyticsContext: "guide:stocking-teen-boys",
  analyticsPrefix: "stocking-teen-boys",
  list: { ...TEEN_BOYS_STOCKING_LIST, line: copy.list_card_line },
  manifest: listManifest as unknown as StockingManifest,
  copy,
};

export const Route = createFileRoute("/stocking-teen-boys")({
  head: () => {
    const seo = generateStaticMetadata(
      copy.seo_title,
      copy.seo_description,
      PAGE_PATH,
      {
        image: HERO_JPG,
        imageWidth: 2000,
        imageHeight: 667,
      }
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: StockingTeenBoysPage,
});

function StockingTeenBoysPage() {
  return <StockingGiftGuide guide={guide} />;
}
