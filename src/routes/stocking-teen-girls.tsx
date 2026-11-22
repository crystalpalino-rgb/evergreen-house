import { createFileRoute } from "@tanstack/react-router";

import {
  StockingGiftGuide,
  type StockingCardCopy,
  type StockingGuide,
  type StockingManifest,
} from "~/components/StockingGiftGuide";
import { generateStaticMetadata } from "~/lib/seo";
import { TEEN_GIRLS_STOCKING_LIST } from "~/lib/storefront-lists";
import listManifest from "~/data/stocking-teen-girls/list-manifest.json";
import cardCopy from "~/data/stocking-teen-girls/card-copy.json";

/**
 * Gift guide: "Stocking Stuffers for Teen Girls: Beauty, Jewelry and Hair"
 * (2026-11-22, owner decision 48). One of the three stocking lists that got a
 * page of its own rather than a section on the hub. Every product fact comes
 * from src/data/stocking-teen-girls/list-manifest.json, the merchandiser's live
 * read of the list on 2026-11-22; the lines come from card-copy.json, keyed by
 * ASIN.
 */

const PAGE_PATH = "/stocking-teen-girls";
const HERO_JPG = "/images/stocking-teen-girls-hero.jpg";
const HERO_WEBP = "/images/stocking-teen-girls-hero.webp";
const HERO_ALT =
  "Kraft wrapped gifts tied with red velvet ribbon and twine beside a cream cable knit stocking on a marble counter, with a lit Christmas tree and a candle behind them";

const copy = cardCopy as unknown as StockingCardCopy;

const guide: StockingGuide = {
  pagePath: PAGE_PATH,
  heroJpg: HERO_JPG,
  heroWebp: HERO_WEBP,
  heroAlt: HERO_ALT,
  verifiedDate: "2026-11-22",
  verifiedDateLabel: "November 22, 2026",
  analyticsContext: "guide:stocking-teen-girls",
  analyticsPrefix: "stocking-teen-girls",
  list: { ...TEEN_GIRLS_STOCKING_LIST, line: copy.list_card_line },
  manifest: listManifest as unknown as StockingManifest,
  copy,
};

export const Route = createFileRoute("/stocking-teen-girls")({
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
  component: StockingTeenGirlsPage,
});

function StockingTeenGirlsPage() {
  return <StockingGiftGuide guide={guide} />;
}
