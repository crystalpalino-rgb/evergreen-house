/**
 * Room FAQ copy, shared by the two templates that can carry it.
 *
 * Until 2026-11-15 this map lived inside src/routes/collection/$collection.tsx.
 * Shop audit item 5 makes /room/<slug> the one canonical route per room and
 * redirects /collection/<slug> to it, so the surviving page has to keep the FAQ
 * block and its FAQPage markup the collection template used to carry. The copy
 * moved here unchanged; both routes read it from this one file.
 *
 * A room appears here only when the answers are true of that room. There is no
 * default set and no fallback: a room without copy of its own renders no FAQ
 * block and marks up no FAQPage, so a sofa tip can never land on a room it does
 * not describe (audit item 3).
 */

/* Room-specific FAQ copy.
   A collection appears here only when the answers are true of that room. There
   is no default set and no fallback: a collection without copy of its own
   renders no FAQ block at all, so a sofa tip can never land on the laundry
   page again (audit item 3). */
export type FAQ = { question: string; answer: string };

export const COLLECTION_FAQS: Record<string, FAQ[]> = {
  bedroom: [
    {
      question: "How do I make a bedroom feel calm?",
      answer:
        "Keep the palette to two or three tones, layer linen and wool where you touch the room most, and use two low lamps instead of one overhead light. Storage that closes hides the daily clutter so the room reads quiet.",
    },
    {
      question: "Which bedroom pieces are worth spending more on?",
      answer:
        "Bedding and the mattress layer first, then the nightstand and the lamps you look at from the bed. A bench or a mirror can wait; the pieces you touch every night cannot.",
    },
  ],
  bathroom: [
    {
      question: "How do I make a small bathroom feel considered?",
      answer:
        "Repeat one material. A stone or ceramic tray on the counter, closed storage under the sink and one warm metal finish do more than extra shelves, and a good towel weight makes the room feel finished.",
    },
    {
      question: "What belongs on the bathroom counter?",
      answer:
        "Only what you use daily: soap, a tray for the small things, and one object you like looking at. Everything else lives in a drawer or a basket.",
    },
  ],
  "dining-room": [
    {
      question: "How do I set a table that feels special without fuss?",
      answer:
        "Start with a runner or a cloth, then add one low centerpiece, candles and glassware you enjoy holding. Keep the center low, because height in the middle of the table is what stops conversation.",
    },
    {
      question: "How many place settings should I own?",
      answer:
        "Eight is the honest number for most homes: enough for a holiday table, not so many that the extras sit unused. Add serving pieces before you add settings.",
    },
  ],
  entryway: [
    {
      question: "What does an entryway actually need?",
      answer:
        "Somewhere to sit or lean while you take off shoes, a surface for keys and mail, a hook for the bag you carry daily, and a mat that can take wet boots. Everything else is decoration.",
    },
    {
      question: "How do I keep an entryway from becoming a pile?",
      answer:
        "Give every item a home within arm's reach of the door, and keep one basket for whatever has no home yet. A basket can be emptied; a pile spreads.",
    },
  ],
  kitchen: [
    {
      question: "How do I keep kitchen counters clear?",
      answer:
        "Store by use. The things you reach for daily stay out, everything else goes in a drawer or a labeled jar, and a single tray holds oil, salt and utensils without hiding them.",
    },
    {
      question: "Which kitchen pieces earn their counter space?",
      answer:
        "Stoneware that moves from oven to table, glass storage that shows what is inside, and tools you use weekly. Anything you reach for twice a year belongs in a cupboard.",
    },
  ],
  laundry: [
    {
      question: "How do I make a laundry room work harder?",
      answer:
        "Sort at the source with labeled bins, keep a folding surface at waist height, and put detergent and stain spray where you can reach them with one hand.",
    },
    {
      question: "What should stay out of the laundry room?",
      answer:
        "Anything that cannot take heat or damp: wool, silk and the good towels. Keep a small drying rack for those and the room stays a workroom.",
    },
  ],
  "living-room": [
    {
      question: "How do I layer a living room without clutter?",
      answer:
        "Build from the rug up: rug, seating, one table within reach of each seat, then lighting and texture. Add throws and pillows last and keep them to two textures.",
    },
    {
      question: "How do I choose the right rug size?",
      answer:
        "The rug should sit under the front legs of every seat in the grouping. A rug that floats in the middle of the room makes the whole space read smaller.",
    },
  ],
  office: [
    {
      question: "How do I make a home office feel less corporate?",
      answer:
        "Warm the light, keep something living or made by hand within sight, and leave only what you use that day on the desk. An adjustable lamp does more for the room than an overhead fixture.",
    },
    {
      question: "What does a home office actually need?",
      answer:
        "A surface at the right height, a chair that supports your back, light you can aim, and storage that closes. Everything else is optional.",
    },
  ],
  patio: [
    {
      question: "How do I make an outdoor space feel like a room?",
      answer:
        "Anchor it with a rug or a defined seating zone, then add light at two heights and something that grows. Outdoor fabric and weather-resistant wood age better than anything that has to be carried inside.",
    },
    {
      question: "What should I look for in outdoor pieces?",
      answer:
        "Materials that improve with weather: teak, powder-coated metal and solution-dyed fabric. Check the seat depth before you check the color.",
    },
  ],
  holiday: [
    {
      question: "Where do I start with Christmas decor?",
      answer:
        "Start with the tree and the light, then the mantel, then the table. Three places done properly read warmer than a whole house covered in small things.",
    },
    {
      question: "How do I keep holiday decor from looking like a store display?",
      answer:
        "Choose one palette and one material story, then repeat it. Real greenery, brass and wool hold up year after year and never look dated.",
    },
  ],
};

/* Outdoor Living was folded into Patio and Outdoor (owner decision 37), so the
   two slugs share one honest set of answers. */
COLLECTION_FAQS.outdoor = COLLECTION_FAQS.patio;

export function getCollectionFAQs(slug: string): FAQ[] {
  return COLLECTION_FAQS[slug] ?? [];
}
