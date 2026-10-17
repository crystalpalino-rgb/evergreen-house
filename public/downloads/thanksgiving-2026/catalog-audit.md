# Evergreen House catalog audit - Thanksgiving 2026 fit

Date: 2026-10-17. Scope: existing Evergreen House catalog only. No repo changes, no DB writes.

## Method, and one honest caveat about the live site

The public product pages were returning HTTP 200 but rendering "Product Not Found" during this audit (the product record is fetched at request time and the database was refusing queries at that moment). The homepage and collection pages were fine. Because of that, the audit was built from two static snapshots that are currently in sync with the catalog:

- `sitemap-products.xml` on the live site: 475 product URLs.
- The site's own product feed export: 475 items with slug, title and price, plus the products CSV with 265 Amazon short links. All 265 short links were resolved to real ASINs for this audit.

So the counts below are of the real catalog, not of a partial load. What I could not do is read live per-product ratings for existing items; those are recorded as "needs re-verification" below rather than assumed.

## What the catalog actually is

The catalog is bedroom, bathroom, kitchen-organization and bedroom-textile heavy. Of 475 products, a keyword sweep for Thanksgiving-relevant terms (table, plate, napkin, runner, candle, serve, platter, wreath, pumpkin, doormat, lantern, planter, vase, goblet, glass, brass) returns roughly 100 matches, and most of those are false positives (pantry jars, valet trays, storage bins, clothing, kitchen gadgets).

**Honest number: about 18 existing products are genuinely relevant to these four collections.** That is the reuse pool. None of the 112 newly sourced candidates duplicates an existing catalog ASIN (checked by ASIN against all 265 resolved catalog ASINs: zero overlap).

## Existing products that fit, by collection

### The Thanksgiving Welcome Edit - strongest existing fit (11 items)
- `sggvecsy-artificial-olive-wreath-for-front-door-20-inch...` - Sggvecsy Artificial Olive Wreath 20 inch, $20.99. Reads as greenery rather than autumn, so it works for Thanksgiving and survives into winter. **Best existing reuse candidate in the whole catalog.**
- `wreathdream-20-inch-fall-wreath...` - WreathDream 20 inch Fall Wreath, oak leaf, acorn, berry, pine cone, $19.99.
- `fall-wreaths-for-front-door-22-inch-olive-fall-wreath...` - 22 inch Olive Fall Wreath, $27.99.
- `tempus-16-artificial-fall-wooden-beads-wreath...` - TEMPUS 16 inch Fall Wooden Beads Wreath, $17.99. Slightly craft-leaning, review it against brand tone.
- `amf0resj-artificial-fall-wreath...golden-eucalyptus...` - AMF0RESJ golden eucalyptus fall wreath, $19.99.
- `amf0resj-artificial-fall-wreath...bright-oak-leaves...` - AMF0RESJ oak leaf and small pumpkin wreath, $19.98.
- `n-deconation-3-pcs-fall-pumpkin-decorations...` - N DECONATION flocked white/brown/black faux pumpkins, 3 pcs, $31.99. Muted palette, fits the no-turkey rule.
- `wds-wondrous-fall-pumpkin-decor...` - WDS Wondrous faux pumpkins, orange/white/green, 3 pcs, $37.99.
- `dn-deconation-fall-pumpkin-decor...` - DN DECONATION fall pumpkin decor, $27.99.
- `6-ft-fall-garland-with-lights-timer...` - 6 ft fall garland with lights and timer, $20.97. Lights are a small risk against the brand tone.
- `faux-fall-flowers-burnt-orange-artificial-floral-stems-for-vase` - burnt orange faux stems, $29.99.

Flagged as **not** brand-fit even though they match the keyword: `12-pcs-blue-white-orange-pumpkins...chinoiserie` ($19.99, craft look), `geelin-3-pcs-fall-decoration-terracotta-pumpkins-outdoor` (outdoor terracotta, coarse), `softalker-fall-throw-pillow-covers...rust-orange-pumpkin` (orange pumpkin motif).

### The Thanksgiving Table Edit - thin existing fit (3 items)
- `nuptio-wooden-taper-candle-holders-set-of-3-brown-candlesticks` - NUPTIO wooden taper holders, set of 3, $25.99.
- `nuptio-gold-hurricane-candle-holders-set-of-2` - NUPTIO gold hurricane holders, set of 2, $29.99.
- `colonial-candle-unscented-taper-candles-cranberry-set-of-6` - cranberry tapers, set of 6, $19.78.

The Solino Home blue and green plaid linen (runner $94.99, napkins $74.99, tablecloth $99.99) is high quality but the plaid reads Christmas, not Thanksgiving. Do not reuse for this collection.

### The Moody Thanksgiving Edit - no existing fit (0 items)
Nothing in the catalog is burgundy, plum, smoked glass, dark ceramic or antique brass. The two 6 ft fall garland / felt pumpkin garland items are warm-neutral, not moody.

### The Thanksgiving Hosting Edit - two adjacent items (2 items)
- `creative-co-op-hammered-metal-serving-bowl-gold-finish` - $26.72. Gold, decorative, plausible.
- `cluster-of-10-round-serving-bowls-gold` - $199.95. Aspirational, but "cluster of 10" is an event-rental look, review.
- `reed-and-barton-silverplate-serving-tray-16-inch` - $109.93, silver not brass, but a genuine heirloom serving piece.
- `marquis-by-waterford-markham-old-fashioned-glasses-set-of-4` - $67.91, crystal, usable as barware on the harvest table.

Christmas-specific and therefore **not** reusable for November: Lenox Holiday plates, Spode Christmas Tree pitcher, wooden Christmas tree charcuterie platter, all ornament and nutcracker items.

## Gaps the four collections have to fill with new products

| Need | In catalog? |
|---|---|
| Everyday stoneware dinnerware, cream or white | No |
| Charger plates | No |
| Flatware | No |
| Wine goblets or stemless glasses | No (only old-fashioned tumblers) |
| Linen napkins in neutral, burgundy or plum | No (only blue and green plaid) |
| Table runner in neutral or wine | One terracotta cheesecloth only |
| Brass candlesticks (taper) | No (wooden tapers and gold hurricanes only) |
| Smoked glass, dark ceramic, plum textiles | No |
| Charcuterie board, platters, cake stand, beverage dispenser | Almost none (one gold bowl, one tray) |
| Serving utensils | No |
| Outdoor lantern, urn planter, entry basket, neutral doormat | No (only Halloween and Christmas mats) |
| Sculptural vases | No |

## Conclusion for the four collections

Reuse is realistic for roughly 9 of 11 Welcome candidates and 3 to 4 table and candlelight pieces. Everything else in these four collections is a genuine gap, which is why the research spreadsheet is 112 new candidates with only the handful of existing items flagged for pairing rather than substitution. Each existing item still needs its own live rating re-verification before it enters a collection, because the product pages could not be read during this audit.
