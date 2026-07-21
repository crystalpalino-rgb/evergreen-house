import { sql } from "../src/db";

const ROOM_COLLECTIONS = [
  {
    slug: "living-room",
    name: "Living Room",
    description: "Warm neutrals, layered textures, and pieces that feel collected over time. Every piece was chosen to make your living room the room you gravitate toward first.",
    meta_description: "Curated living room finds — warm neutrals, layered textures, and timeless pieces for the heart of your home.",
    image_url: "/images/living-room.jpg",
  },
  {
    slug: "bedroom",
    name: "Bedroom",
    description: "A calming escape with soft linens, warm wood tones, and pieces that invite rest. No clutter, no screens — just a sanctuary.",
    meta_description: "Serene bedroom finds — soft linens, warm wood tones, and calming pieces for your personal retreat.",
    image_url: "/images/bedroom.jpg",
  },
  {
    slug: "kitchen",
    name: "Kitchen",
    description: "Beautifully organized countertops with natural materials and timeless pieces. A kitchen that makes you want to linger a little longer.",
    meta_description: "Collected kitchen finds — natural materials, timeless tools, and pieces that make the heart of your home shine.",
    image_url: "/images/kitchen.jpg",
  },
  {
    slug: "dining-room",
    name: "Dining Room",
    description: "Gather-worthy dining spaces with pieces that feel special but never stuffy. From everyday dinners to holiday hosting.",
    meta_description: "Dining room finds for gathering — beautiful tablescapes and hosting pieces that make every meal feel special.",
    image_url: "/images/dining-room.jpg",
  },
  {
    slug: "bathroom",
    name: "Bathroom",
    description: "Small-space luxury with thoughtful details. Turn your bathroom into a spa-like retreat with pieces that look beautiful and work hard.",
    meta_description: "Luxurious bathroom finds — spa-like pieces that transform your daily routine into a retreat.",
    image_url: "/images/bathroom.jpg",
  },
  {
    slug: "office",
    name: "Home Office",
    description: "A workspace that inspires focus and feels beautiful. Pieces that balance function with warmth so you actually want to sit down and work.",
    meta_description: "Inspiring home office finds — beautiful, functional pieces for a workspace you'll actually want to spend time in.",
    image_url: "/images/home-office.jpg",
  },
  {
    slug: "entryway",
    name: "Entryway",
    description: "First impressions matter. Create an entryway that welcomes you home with style — even if it's just a small corner.",
    meta_description: "Welcoming entryway finds — stylish, practical pieces that make coming home feel special.",
    image_url: "/images/living-room.jpg",
  },
  {
    slug: "laundry",
    name: "Laundry Room",
    description: "Make laundry day feel less like a chore. Beautiful storage, sorting solutions, and pieces that elevate the most practical room in the house.",
    meta_description: "Beautiful laundry room finds — storage and organization that makes laundry day something to look forward to.",
    image_url: "/images/organization.jpg",
  },
  {
    slug: "patio",
    name: "Patio & Outdoor",
    description: "Extend your living space outdoors. Weather-resistant pieces that are as beautiful as what you'd choose for inside.",
    meta_description: "Outdoor living finds — beautiful, weather-resistant pieces for patios, porches, and gardens.",
    image_url: "/images/patio.jpg",
  },
  {
    slug: "outdoor",
    name: "Outdoor Living",
    description: "Create an outdoor oasis with pieces that blur the line between inside and out. Durable, beautiful, and made for slow afternoons.",
    meta_description: "Outdoor living essentials — durable, beautiful pieces for your backyard retreat.",
    image_url: "/images/patio.jpg",
  },
  {
    slug: "nursery",
    name: "Nursery",
    description: "A soft, soothing space for your little one. Pieces chosen for safety, beauty, and those quiet moments that matter most.",
    meta_description: "Soothing nursery finds — safe, beautiful pieces for the smallest room in the house.",
    image_url: "/images/bedroom.jpg",
  },
];

async function seed() {
  console.log("Creating collections table...");
  await sql()`CREATE TABLE IF NOT EXISTS collections (slug TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, type TEXT NOT NULL DEFAULT 'room', product_ids JSONB, seo_title TEXT, meta_description TEXT, image_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`;
  console.log("Collections table ready.");

  const existing = await sql()`SELECT count(*) as cnt FROM collections`;
  console.log(`Existing collections: ${(existing as any)[0].cnt}`);

  if ((existing as any)[0].cnt > 0) {
    console.log("Collections already seeded, upserting...");
    for (const c of ROOM_COLLECTIONS) {
      await sql()`
        INSERT INTO collections (slug, name, description, type, seo_title, meta_description, image_url)
        VALUES (${c.slug}, ${c.name}, ${c.description}, 'room',
          ${`${c.name} — Evergreen House`},
          ${c.meta_description || null},
          ${c.image_url || null})
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          seo_title = EXCLUDED.seo_title,
          meta_description = EXCLUDED.meta_description,
          image_url = EXCLUDED.image_url
      `;
    }
  } else {
    console.log("Seeding 11 room collections...");
    for (const c of ROOM_COLLECTIONS) {
      await sql()`
        INSERT INTO collections (slug, name, description, type, seo_title, meta_description, image_url)
        VALUES (${c.slug}, ${c.name}, ${c.description}, 'room',
          ${`${c.name} — Evergreen House`},
          ${c.meta_description || null},
          ${c.image_url || null})
      `;
    }
  }

  const count = await sql()`SELECT count(*) as cnt FROM collections`;
  console.log(`Done. Total collections: ${(count as any)[0].cnt}`);

  // Also verify product counts per room
  const productCounts = await sql()`SELECT room, count(*) as cnt FROM products GROUP BY room ORDER BY cnt DESC`;
  console.log("Room product counts:", (productCounts as any[]).map((r: any) => `${r.room}: ${r.cnt}`));
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
