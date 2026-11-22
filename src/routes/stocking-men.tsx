import { createFileRoute } from "@tanstack/react-router";

import {
  StockingGiftGuide,
  type StockingCardCopy,
  type StockingGuide,
  type StockingManifest,
} from "~/components/StockingGiftGuide";
import { generateStaticMetadata } from "~/lib/seo";
import { MEN_STOCKING_LIST } from "~/lib/storefront-lists";
import listManifest from "~/data/stocking-men/list-manifest.json";
import cardCopy from "~/data/stocking-men/card-copy.json";

/**
 * Gift guide: "Stocking Stuffers for Men He Will Actually Use" (2026-11-22,
 * owner decision 48). One of the three stocking lists that got a page of its
 * own rather than a section on the hub. Every product fact comes from
 * src/data/stocking-men/list-manifest.json, the merchandiser's live read of the
 * list on 2026-11-22; the lines come from card-copy.json, keyed by ASIN.
 *
 * The two pieces with no live buy box (the OLIGHT flashlight and the pistachios)
 * carry appears_on_page: false, so they are on the record and not on the page.
 */

const PAGE_PATH = "/stocking-men";
const HERO_JPG = "/images/stocking-men-hero-v2.jpg";
const HERO_WEBP = "/images/stocking-men-hero-v2.webp";
const HERO_ALT =
  "Flat lay of stocking gifts for men on a wood board: a leather card wallet, hot sauce, beard balm, a Carhartt beanie, braided charging cables, a Gerber multi tool and chocolates, with spruce and a candle behind";

const copy = cardCopy as unknown as StockingCardCopy;

const guide: StockingGuide = {
  pagePath: PAGE_PATH,
  heroJpg: HERO_JPG,
  heroWebp: HERO_WEBP,
  heroAlt: HERO_ALT,
  verifiedDate: "2026-11-22",
  verifiedDateLabel: "November 22, 2026",
  analyticsContext: "guide:stocking-men",
  analyticsPrefix: "stocking-men",
  list: { ...MEN_STOCKING_LIST, line: copy.list_card_line },
  manifest: listManifest as unknown as StockingManifest,
  copy,
};

export const Route = createFileRoute("/stocking-men")({
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
  component: StockingMenPage,
});

function StockingMenPage() {
  return <StockingGiftGuide guide={guide} />;
}
