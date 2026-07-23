import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Types ──

export interface MarketingTask {
  id: number;
  title: string;
  content: string | null;
  channel: string;
  status: string;
  rationale: string | null;
  product_ids: number[];
  priority: number;
  destination_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  productsByRoom: { room: string; count: number }[];
  averageRating: number;
  productCountBySeason: { season: string; count: number }[];
  totalDrafts: number;
  pendingDrafts: number;
  approvedDrafts: number;
}

export interface GenerateRequest {
  channel: "blog" | "pinterest" | "email";
  topic?: string;
  keywords?: string;
}

export interface GeneratedDraft {
  title: string;
  content: string;
  channel: string;
  rationale: string;
  product_ids: number[];
  destination_link: string;
}

// ── Table Setup ──

export const ensureMarketingTable = createServerFn({ method: "GET" }).handler(async () => {
  await sql()`
    CREATE TABLE IF NOT EXISTS marketing_tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      channel TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      rationale TEXT,
      product_ids JSONB DEFAULT '[]',
      priority INTEGER DEFAULT 5,
      destination_link TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Add destination_link column to existing tables (safe if already present)
  await sql()`ALTER TABLE marketing_tasks ADD COLUMN IF NOT EXISTS destination_link TEXT`;
  return { ok: true };
});

// ── Dashboard ──

export const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  await ensureMarketingTable();

  const [
    totalResult,
    roomCounts,
    avgRatingResult,
    draftCounts,
  ] = await Promise.all([
    sql()`SELECT COUNT(*) as cnt FROM products`,
    sql()`SELECT room, COUNT(*) as count FROM products GROUP BY room ORDER BY count DESC`,
    sql()`SELECT AVG(rating) as avg_rating FROM products WHERE rating IS NOT NULL`,
    sql()`SELECT status, COUNT(*) as count FROM marketing_tasks GROUP BY status`,
  ]);

  const totalProducts = Number(totalResult[0]?.cnt ?? 0);
  const averageRating = Number(avgRatingResult[0]?.avg_rating ?? 0);

  const statusMap: Record<string, number> = {};
  for (const row of draftCounts) {
    statusMap[row.status as string] = Number(row.count);
  }

  // Seasonal keyword analysis
  const products = await sql()`SELECT name, room, blog_category, collection FROM products`;
  const seasonalKeywords: Record<string, string[]> = {
    spring: ["spring", "floral", "bloom", "pastel", "garden", "light", "fresh"],
    summer: ["summer", "outdoor", "patio", "sun", "beach", "coastal", "bright", "pool"],
    fall: ["fall", "autumn", "cozy", "warm", "pumpkin", "amber", "golden", "harvest"],
    winter: ["winter", "holiday", "cozy", "wool", "faux fur", "velvet", "candle", "fireplace"],
  };

  const productCountBySeason: { season: string; count: number }[] = [];
  for (const [season, keywords] of Object.entries(seasonalKeywords)) {
    const count = products.filter((p: any) => {
      const text = `${p.name} ${p.blog_category ?? ""} ${p.collection ?? ""}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    }).length;
    productCountBySeason.push({ season, count });
  }

  // Content gap analysis - rooms with products but no recent drafts
  const roomsWithProducts = roomCounts.map((r: any) => r.room as string);
  const roomsWithDrafts = await sql()`
    SELECT DISTINCT jsonb_array_elements_text(product_ids)::int as product_id FROM marketing_tasks WHERE product_ids IS NOT NULL AND jsonb_array_length(product_ids) > 0
  `;
  const draftRoomSet = new Set<string>();
  if (roomsWithDrafts.length > 0) {
    const draftProductIds = roomsWithDrafts.map((r: any) => r.product_id);
    const draftProducts = await sql()`SELECT room FROM products WHERE id = ANY(${draftProductIds})`;
    for (const p of draftProducts) {
      draftRoomSet.add((p as any).room as string);
    }
  }

  const contentGaps = roomsWithProducts.filter((r) => !draftRoomSet.has(r));

  // Priority tasks
  const priorityTasks = [];
  for (const gap of contentGaps.slice(0, 3)) {
    priorityTasks.push({
      type: "content_gap" as const,
      room: gap,
      priority: 1,
      title: `Create content for ${formatRoomName(gap)}`,
      description: `No marketing drafts exist for ${formatRoomName(gap)} products. Consider a blog post or roundup.`,
    });
  }

  // High-rated products worth featuring
  const topProducts = await sql()`SELECT id, name, room, rating, editor_note FROM products WHERE rating >= 4.7 ORDER BY rating DESC LIMIT 5`;
  for (const p of topProducts) {
    const tp = p as any;
    priorityTasks.push({
      type: "high_value" as const,
      productId: tp.id,
      productName: tp.name,
      room: tp.room,
      rating: Number(tp.rating),
      priority: 2,
      title: `Feature "${tp.name}" (${tp.rating}★)`,
      description: `Top-rated product in ${formatRoomName(tp.room)}. Great candidate for a dedicated pin or newsletter mention.`,
    });
  }

  // Seasonal opportunities
  const seasonalOpps = productCountBySeason
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  for (const opp of seasonalOpps) {
    priorityTasks.push({
      type: "seasonal" as const,
      season: opp.season,
      count: opp.count,
      priority: 3,
      title: `${opp.season.charAt(0).toUpperCase() + opp.season.slice(1)} content opportunity`,
      description: `${opp.count} products match ${opp.season} keywords. Create timely seasonal content.`,
    });
  }

  // Sort by priority
  priorityTasks.sort((a, b) => a.priority - b.priority);

  // Recent drafts
  const recentDrafts = await sql()`
    SELECT * FROM marketing_tasks ORDER BY created_at DESC LIMIT 10
  `;
  const formattedDrafts = recentDrafts.map(formatTask);

  return {
    stats: {
      totalProducts,
      productsByRoom: roomCounts.map((r: any) => ({ room: r.room, count: Number(r.count) })),
      averageRating: Math.round(averageRating * 10) / 10,
      productCountBySeason,
      totalDrafts: formattedDrafts.length,
      pendingDrafts: statusMap["draft"] ?? 0,
      approvedDrafts: statusMap["approved"] ?? 0,
    },
    priorityTasks,
    recentDrafts: formattedDrafts,
    contentGaps,
  };
});

// ── Draft Generation ──

export const generateDraft = createServerFn({ method: "POST" })
  .validator((data: GenerateRequest) => data)
  .handler(async ({ data }) => {
    await ensureMarketingTable();

    const products = await sql()`SELECT * FROM products ORDER BY rating DESC NULLS LAST`;
    const allProducts = products.map((p: any) => ({
      ...p,
      rating: p.rating ? Number(p.rating) : null,
      price: p.price ? Number(p.price) : null,
    }));

    let draft: GeneratedDraft;

    switch (data.channel) {
      case "blog":
        draft = generateBlogDraft(allProducts, data.topic, undefined, data.keywords);
        break;
      case "pinterest":
        draft = generatePinterestDraft(allProducts, data.topic, undefined, data.keywords);
        break;
      case "email":
        draft = generateEmailDraft(allProducts, data.topic, undefined, data.keywords);
        break;
      default:
        throw new Error(`Unknown channel: ${data.channel}`);
    }

    // Save to database
    const result = await sql()`
      INSERT INTO marketing_tasks (title, content, channel, status, rationale, product_ids, priority, destination_link)
      VALUES (${draft.title}, ${draft.content}, ${draft.channel}, 'draft', ${draft.rationale}, ${JSON.stringify(draft.product_ids)}, 5, ${draft.destination_link})
      RETURNING *
    `;

    return formatTask(result[0]);
  });

// ── Draft Management ──

export const getDrafts = createServerFn({ method: "GET" })
  .validator((filters?: { channel?: string; status?: string }) => filters ?? {})
  .handler(async ({ data }) => {
    await ensureMarketingTable();
    let query = "SELECT * FROM marketing_tasks WHERE 1=1";
    const params: any[] = [];

    if (data.channel) {
      params.push(data.channel);
      query += ` AND channel = $${params.length}`;
    }
    if (data.status) {
      params.push(data.status);
      query += ` AND status = $${params.length}`;
    }

    query += " ORDER BY created_at DESC LIMIT 50";

    const rows = params.length > 0
      ? await sql()`SELECT * FROM marketing_tasks WHERE channel = ${data.channel ?? null} AND (${data.status ? sql`status = ${data.status}` : sql`TRUE`}) ORDER BY created_at DESC LIMIT 50`
      : await sql()`SELECT * FROM marketing_tasks ORDER BY created_at DESC LIMIT 50`;

    // Simpler approach: just query all and filter
    const allRows = await sql()`SELECT * FROM marketing_tasks ORDER BY created_at DESC LIMIT 50`;
    const filtered = allRows.filter((r: any) => {
      if (data.channel && r.channel !== data.channel) return false;
      if (data.status && r.status !== data.status) return false;
      return true;
    });

    return filtered.map(formatTask);
  });

export const approveDraft = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    await ensureMarketingTable();
    const result = await sql()`
      UPDATE marketing_tasks SET status = 'approved', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) throw new Error(`Draft ${id} not found`);
    return formatTask(result[0]);
  });

export const deleteDraft = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    await ensureMarketingTable();
    await sql()`DELETE FROM marketing_tasks WHERE id = ${id}`;
    return { success: true };
  });

export const updateDraft = createServerFn({ method: "POST" })
  .validator((data: { id: number; title?: string; content?: string }) => data)
  .handler(async ({ data }) => {
    await ensureMarketingTable();
    const db = sql();
    const result = await db.query(
      "UPDATE marketing_tasks SET title = COALESCE($1, title), content = COALESCE($2, content), updated_at = NOW() WHERE id = $3 RETURNING *",
      [data.title ?? null, data.content ?? null, data.id],
    );
    if (result.length === 0) throw new Error(`Draft ${data.id} not found`);
    return formatTask(result[0]);
  });

// ── Agent ──

export interface AgentSummary {
  lastRun: string | null;
  lastRunDrafts: number;
  lastRunChannels: Record<string, number>;
  lastRunRooms: string[];
  draftsThisWeek: number;
  approvalRate: number;
}

export interface AgentRunResult {
  generated: MarketingTask[];
  summary: string;
  channels: Record<string, number>;
  rooms: string[];
}

export const runAgent = createServerFn({ method: "POST" }).handler(async () => {
  await ensureMarketingTable();
  await ensureAgentRunsTable();

  const products = await sql()`SELECT * FROM products ORDER BY rating DESC NULLS LAST`;
  const allProducts = products.map((p: any) => ({
    ...p,
    rating: p.rating ? Number(p.rating) : null,
    price: p.price ? Number(p.price) : null,
  }));

  // Get dashboard data for priority analysis
  const dashData = await getDashboardData();
  const { priorityTasks } = dashData as any;

  const draftsToCreate: { channel: string; topic?: string; room?: string }[] = [];

  // Content gaps → blog posts (up to 2)
  const gapTasks = priorityTasks.filter((t: any) => t.type === "content_gap");
  for (const gap of gapTasks.slice(0, 2)) {
    draftsToCreate.push({ channel: "blog", room: gap.room, topic: formatRoomName(gap.room) });
  }

  // High-value products (4.8★+) → Pinterest pins (up to 2)
  const topRated = allProducts.filter((p: any) => (p.rating ?? 0) >= 4.8);
  const usedRooms = new Set(draftsToCreate.map((d) => d.room).filter(Boolean));
  for (const tp of topRated.slice(0, 2)) {
    if (draftsToCreate.length >= 4) break;
    if (usedRooms.has(tp.room) && draftsToCreate.filter((d: any) => d.channel === "pinterest").length >= 1) continue;
    usedRooms.add(tp.room);
    draftsToCreate.push({ channel: "pinterest", room: tp.room, topic: tp.name });
  }

  // Seasonal → email (1)
  const seasonalTasks = priorityTasks.filter((t: any) => t.type === "seasonal");
  if (seasonalTasks.length > 0 && draftsToCreate.length < 5) {
    draftsToCreate.push({ channel: "email", room: undefined, topic: `${seasonalTasks[0].season} home refresh` });
  }

  // Ensure at least 3
  if (draftsToCreate.length < 3) {
    const remaining = 3 - draftsToCreate.length;
    const allRooms = [...new Set(allProducts.map((p: any) => p.room))] as string[];
    for (let i = 0; i < remaining && i < allRooms.length; i++) {
      const room = allRooms[i];
      if (usedRooms.has(room)) continue;
      usedRooms.add(room);
      const channels = ["blog", "pinterest", "email"] as const;
      draftsToCreate.push({ channel: channels[i % 3], room, topic: formatRoomName(room) });
    }
  }

  const finalDrafts = draftsToCreate.slice(0, 5);

  const generated: MarketingTask[] = [];
  const channelCounts: Record<string, number> = { blog: 0, pinterest: 0, email: 0 };
  const roomsSet = new Set<string>();

  for (const spec of finalDrafts) {
    let draft: GeneratedDraft;

    switch (spec.channel) {
      case "blog":
        draft = generateBlogDraft(allProducts, spec.topic, spec.room);
        break;
      case "pinterest":
        draft = generatePinterestDraft(allProducts, spec.topic, spec.room);
        break;
      case "email":
        draft = generateEmailDraft(allProducts, spec.topic, spec.room);
        break;
      default:
        continue;
    }

    const result = await sql()`
      INSERT INTO marketing_tasks (title, content, channel, status, rationale, product_ids, priority, destination_link)
      VALUES (${draft.title}, ${draft.content}, ${draft.channel}, 'draft', ${draft.rationale}, ${JSON.stringify(draft.product_ids)}, 5, ${draft.destination_link})
      RETURNING *
    `;
    const formatted = formatTask(result[0]);
    generated.push(formatted);
    channelCounts[draft.channel] = (channelCounts[draft.channel] || 0) + 1;
    if (spec.room) roomsSet.add(spec.room);
  }

  // Record agent run
  await sql()`
    INSERT INTO agent_runs (drafts_generated, channels, rooms)
    VALUES (${generated.length}, ${JSON.stringify(channelCounts)}, ${JSON.stringify([...roomsSet])})
  `;

  const channelSummary = Object.entries(channelCounts)
    .filter(([, count]) => count > 0)
    .map(([ch, count]) => `${count} ${ch === "pinterest" ? "pin" : ch}`)
    .join(", ");

  return {
    generated,
    summary: `Generated ${generated.length} drafts: ${channelSummary}`,
    channels: channelCounts,
    rooms: [...roomsSet],
  } as AgentRunResult;
});

export const getAgentSummary = createServerFn({ method: "GET" }).handler(async (): Promise<AgentSummary> => {
  await ensureAgentRunsTable();

  const lastRun = await sql()`SELECT created_at, drafts_generated, channels, rooms FROM agent_runs ORDER BY created_at DESC LIMIT 1`;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekResult = await sql()`
    SELECT COUNT(*) as cnt FROM marketing_tasks
    WHERE created_at >= ${weekStart.toISOString()}
  `;

  const statusCounts = await sql()`SELECT status, COUNT(*) as cnt FROM marketing_tasks GROUP BY status`;
  let approved = 0;
  let draft = 0;
  for (const row of statusCounts) {
    if ((row as any).status === "approved") approved = Number((row as any).cnt);
    if ((row as any).status === "draft") draft = Number((row as any).cnt);
  }
  const total = approved + draft;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return {
    lastRun: lastRun.length > 0 ? String((lastRun[0] as any).created_at) : null,
    lastRunDrafts: lastRun.length > 0 ? Number((lastRun[0] as any).drafts_generated) : 0,
    lastRunChannels: lastRun.length > 0 ? (lastRun[0] as any).channels : {},
    lastRunRooms: lastRun.length > 0 ? (lastRun[0] as any).rooms : [],
    draftsThisWeek: Number((weekResult[0] as any)?.cnt ?? 0),
    approvalRate,
  };
});

async function ensureAgentRunsTable() {
  await sql()`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id SERIAL PRIMARY KEY,
      drafts_generated INTEGER NOT NULL DEFAULT 0,
      channels JSONB DEFAULT '[]',
      rooms JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// ── Helpers ──

function formatTask(row: any): MarketingTask {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    channel: row.channel,
    status: row.status,
    rationale: row.rationale,
    product_ids: Array.isArray(row.product_ids) ? row.product_ids : JSON.parse(row.product_ids || "[]"),
    priority: row.priority ?? 5,
    destination_link: row.destination_link ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function formatRoomName(room: string): string {
  const names: Record<string, string> = {
    "living-room": "Living Room",
    bedroom: "Bedroom",
    kitchen: "Kitchen",
    bathroom: "Bathroom",
    patio: "Patio & Outdoor",
    office: "Home Office",
    entryway: "Entryway",
    laundry: "Laundry Room",
    storage: "Storage & Organization",
    "dining-room": "Dining Room",
    organization: "Organization",
    spring: "Spring",
    summer: "Summer",
    fall: "Fall",
    holiday: "Holiday",
  };
  return names[room] ?? room.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Template Generators ──

function pickProducts(products: any[], count: number, room?: string): any[] {
  let pool = products;
  if (room) {
    pool = products.filter((p) => p.room === room);
    if (pool.length === 0) pool = products;
  }
  const topRated = [...pool].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return topRated.slice(0, count);
}

function generateBlogDraft(products: any[], topic?: string, roomHint?: string, keywords?: string): GeneratedDraft {
  const room = roomHint || (topic ? guessRoom(topic, products) : pickRandomRoom(products));
  const picks = pickProducts(products, 5, room);
  const roomName = formatRoomName(room ?? "living-room");

  const productLines = picks.map((p) => {
    const note = p.editor_note ? ` Here's why I love it: ${p.editor_note}` : "";
    const price = p.price ? `$${p.price}` : "a great price";
    return `**${p.name}** (${p.rating}★, ${price})${note}`;
  });

  const title = topic
    ? `${topic}: A ${roomName} Refresh with Pieces That Actually Work`
    : `The ${roomName} Refresh: ${picks.length} Pieces That Make This Space Feel Complete`;

  const content = [
    `There's something about a ${roomName.toLowerCase()} that just works that makes you want to spend more time there. It's not about having the most expensive pieces or following every trend. It's about finding those few things that feel right.`,
    "",
    `I've been updating my own ${roomName.toLowerCase()} slowly over the past few months, and these are the pieces that made the biggest difference. Not the flashiest, not the trendiest. Just the ones I reach for every day.`,
    "",
    ...productLines,
    "",
    `The thing about ${roomName.toLowerCase()}s is that they should feel lived in. Not like a catalog. Not like you're afraid to touch anything. The best spaces have a little bit of warmth, a little bit of texture, and a lot of things that just make sense together.`,
    "",
    `If you grab even one of these, you'll notice the difference. Promise.`,
  ].join("\n");

  return {
    title,
    content,
    channel: "blog",
    rationale: `Seasonal ${roomName.toLowerCase()} content with ${picks.length} top-rated products. Room has strong reader interest and high affiliate potential.`,
    product_ids: picks.map((p) => p.id),
    destination_link: "/blog",
  };
}

function generatePinterestDraft(products: any[], topic?: string, roomHint?: string, keywords?: string): GeneratedDraft {
  const room = roomHint || (topic ? guessRoom(topic, products) : pickRandomRoom(products));
  const picks = pickProducts(products, 3, room);
  const roomName = formatRoomName(room ?? "living-room");
  const primary = picks[0];

  // Parse keywords: split on newlines, pick up to 2 relevant ones
  const keywordList = keywords
    ? keywords.split("\n").map((k) => k.trim()).filter(Boolean).slice(0, 2)
    : [];
  const keywordSuffix = keywordList.length > 0
    ? ` — ${keywordList.join(", ")}`
    : "";

  const title = topic
    ? `${topic} — The ${roomName} Staple You'll Use Every Day${keywordSuffix}`
    : `${primary.name}, The ${roomName} Piece That Changed Everything${keywordSuffix}`;

  const keywordIntro = keywordList.length > 0
    ? `If you're into ${keywordList.join(" and ")}, this ${roomName.toLowerCase()} find is for you. `
    : "";

  const description = [
    `${keywordIntro}Found this ${primary.name.toLowerCase()} and it completely transformed my ${roomName.toLowerCase()}. ${primary.editor_note ?? "Worth every penny."}`,
    `Also loving: ${picks.slice(1).map((p) => p.name.toLowerCase()).join(" and ")}.`,
    `Tap to shop the full ${roomName.toLowerCase()} edit on Evergreen House.`,
  ].join(" ");

  return {
    title,
    content: description,
    channel: "pinterest",
    rationale: `High-performing ${roomName.toLowerCase()} pin anchored by ${primary.name} (${primary.rating}★). ${keywordList.length > 0 ? `Targeted keywords: ${keywordList.join(", ")}. ` : ""}Product-driven pin format performs well on Pinterest for home decor.`,
    product_ids: picks.map((p) => p.id),
    destination_link: room ? `/room/${room}` : "/editors-picks",
  };
}

function generateEmailDraft(products: any[], topic?: string, roomHint?: string, keywords?: string): GeneratedDraft {
  const room = roomHint || (topic ? guessRoom(topic, products) : pickRandomRoom(products));
  const picks = pickProducts(products, 4, room);
  const roomName = formatRoomName(room ?? "living-room");

  const subject = topic
    ? `This week: ${topic} finds our editors are loving`
    : `This week's finds: ${picks.length} ${roomName.toLowerCase()} pieces our editors are loving`;

  const heroPick = picks[0];
  const restPicks = picks.slice(1);

  const body = [
    `Hi friend,`,
    "",
    `I've been on a bit of a ${roomName.toLowerCase()} kick lately, and I found a few things I think you'll love. No pressure. No urgency. Just good stuff.`,
    "",
    `**The one I can't stop thinking about:** ${heroPick.name}`,
    heroPick.editor_note ? `"${heroPick.editor_note}"` : "",
    heroPick.price ? `At $${heroPick.price}, it's worth a look.` : "",
    `[View on Amazon →](${heroPick.amazon_url})`,
    "",
    `**A few more worth your time:**`,
    ...restPicks.map((p) => [
      `• **${p.name}** — ${p.editor_note ?? `${p.rating}★ and worth it`} [Shop →](${p.amazon_url})`,
    ]).flat(),
    "",
    `That's it for this week. Thanks for letting me pop into your inbox.`,
    "",
    `xo,`,
    `Evergreen House`,
  ].join("\n");

  return {
    title: subject,
    content: body,
    channel: "email",
    rationale: `Newsletter featuring ${picks.length} top-rated ${roomName.toLowerCase()} products. ${heroPick.name} (${heroPick.rating}★) is the hero pick with strong conversion potential.`,
    product_ids: picks.map((p) => p.id),
    destination_link: "/blog",
  };
}

function guessRoom(topic: string, products: any[]): string | undefined {
  const rooms = ["living-room", "bedroom", "kitchen", "bathroom", "patio", "office", "entryway", "laundry", "storage", "dining-room", "organization", "spring", "summer", "fall", "holiday"];
  const lower = topic.toLowerCase();
  for (const room of rooms) {
    if (lower.includes(room) || lower.includes(formatRoomName(room).toLowerCase())) {
      return room;
    }
  }
  return undefined;
}

function pickRandomRoom(products: any[]): string | undefined {
  const rooms = [...new Set(products.map((p) => p.room))];
  if (rooms.length === 0) return undefined;
  return rooms[Math.floor(Math.random() * rooms.length)] as string;
}
