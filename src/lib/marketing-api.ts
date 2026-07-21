// Plain handler functions for the marketing API.
// These mirror the createServerFn functions in marketing.ts but are callable
// from the Bun serve.ts middleware (outside TanStack Start context).
// They use the same db and template logic.

import { sql } from "~/db";

// ── Types ──
interface DBProduct {
  id: number;
  name: string;
  full_name: string | null;
  room: string;
  style: string[];
  amazon_url: string;
  price: number | null;
  rating: number | null;
  editor_note: string | null;
  image_url: string | null;
  pinterest_title: string | null;
  blog_category: string | null;
  collection: string | null;
  is_trending: boolean;
  created_at: string;
  updated_at: string;
}

// ── Table Setup ──
export async function ensureTable() {
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
  await sql()`ALTER TABLE marketing_tasks ADD COLUMN IF NOT EXISTS destination_link TEXT`;
}

// ── Dashboard ──
export async function handleDashboard() {
  await ensureTable();

  const [totalResult, roomCounts, avgRatingResult, draftCountsRaw] = await Promise.all([
    sql()`SELECT COUNT(*) as cnt FROM products`,
    sql()`SELECT room, COUNT(*) as count FROM products GROUP BY room ORDER BY count DESC`,
    sql()`SELECT AVG(rating) as avg_rating FROM products WHERE rating IS NOT NULL`,
    sql()`SELECT status, COUNT(*) as count FROM marketing_tasks GROUP BY status`,
  ]);

  const totalProducts = Number(totalResult[0]?.cnt ?? 0);
  const averageRating = Number(avgRatingResult[0]?.avg_rating ?? 0);

  const statusMap: Record<string, number> = {};
  for (const row of draftCountsRaw) {
    statusMap[row.status as string] = Number(row.count);
  }

  // Seasonal keyword analysis
  const products = (await sql()`SELECT name, room, blog_category, collection FROM products`) as any[];
  const seasonalKeywords: Record<string, string[]> = {
    spring: ["spring", "floral", "bloom", "pastel", "garden", "light", "fresh"],
    summer: ["summer", "outdoor", "patio", "sun", "beach", "coastal", "bright"],
    fall: ["fall", "autumn", "cozy", "warm", "pumpkin", "amber", "golden", "harvest"],
    winter: ["winter", "holiday", "cozy", "wool", "faux fur", "velvet", "candle"],
  };

  const productCountBySeason = Object.entries(seasonalKeywords).map(([season, keywords]) => {
    const count = products.filter((p: any) => {
      const text = `${p.name} ${p.blog_category ?? ""} ${p.collection ?? ""}`.toLowerCase();
      return keywords.some((kw: string) => text.includes(kw));
    }).length;
    return { season, count };
  });

  // Content gaps
  const roomsWithProducts = roomCounts.map((r: any) => r.room as string);
  const draftRooms = await sql()`
    SELECT DISTINCT p.room FROM products p
    INNER JOIN marketing_tasks mt ON mt.product_ids ? CAST(p.id AS TEXT)
    WHERE jsonb_array_length(mt.product_ids) > 0
  `;
  const draftRoomSet = new Set(draftRooms.map((r: any) => r.room));
  const contentGaps = roomsWithProducts.filter((r) => !draftRoomSet.has(r));

  // Priority tasks
  const priorityTasks: any[] = [];
  for (const gap of contentGaps.slice(0, 3)) {
    priorityTasks.push({
      type: "content_gap",
      room: gap,
      priority: 1,
      title: `Create content for ${formatRoom(gap)}`,
      description: `No marketing drafts exist for ${formatRoom(gap)} products. Consider a blog post or roundup.`,
    });
  }

  const topProducts = (await sql()`SELECT id, name, room, rating FROM products WHERE rating >= 4.7 ORDER BY rating DESC LIMIT 5`) as any[];
  for (const tp of topProducts) {
    priorityTasks.push({
      type: "high_value",
      productId: tp.id,
      productName: tp.name,
      room: tp.room,
      rating: Number(tp.rating),
      priority: 2,
      title: `Feature "${tp.name}" (${tp.rating}★)`,
      description: `Top-rated product in ${formatRoom(tp.room)}. Great for a pin or newsletter.`,
    });
  }

  const seasonalOpps = productCountBySeason
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  for (const opp of seasonalOpps) {
    priorityTasks.push({
      type: "seasonal",
      season: opp.season,
      count: opp.count,
      priority: 3,
      title: `${opp.season.charAt(0).toUpperCase() + opp.season.slice(1)} content opportunity`,
      description: `${opp.count} products match ${opp.season} keywords.`,
    });
  }

  priorityTasks.sort((a, b) => a.priority - b.priority);

  // Recent drafts
  const recentDrafts = (await sql()`SELECT * FROM marketing_tasks ORDER BY created_at DESC LIMIT 10`) as any[];

  return {
    stats: {
      totalProducts,
      productsByRoom: roomCounts.map((r: any) => ({ room: r.room, count: Number(r.count) })),
      averageRating: Math.round(averageRating * 10) / 10,
      productCountBySeason,
      totalDrafts: recentDrafts.length,
      pendingDrafts: statusMap["draft"] ?? 0,
      approvedDrafts: statusMap["approved"] ?? 0,
    },
    priorityTasks,
    recentDrafts: recentDrafts.map(formatTask),
    contentGaps,
  };
}

// ── Draft Generation ──
export async function handleGenerate(channel: string, topic?: string) {
  await ensureTable();
  const products = (await sql()`SELECT * FROM products ORDER BY rating DESC NULLS LAST`) as DBProduct[];

  let draft: { title: string; content: string; channel: string; rationale: string; product_ids: number[]; destination_link: string };
  const allProducts = products.map((p: DBProduct) => ({
    ...p,
    rating: p.rating ? Number(p.rating) : null,
    price: p.price ? Number(p.price) : null,
  }));

  switch (channel) {
    case "blog":
      draft = blogTemplate(allProducts, topic);
      break;
    case "pinterest":
      draft = pinterestTemplate(allProducts, topic);
      break;
    case "email":
      draft = emailTemplate(allProducts, topic);
      break;
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }

  const result = (await sql()`
    INSERT INTO marketing_tasks (title, content, channel, status, rationale, product_ids, priority, destination_link)
    VALUES (${draft.title}, ${draft.content}, ${draft.channel}, 'draft', ${draft.rationale}, ${JSON.stringify(draft.product_ids)}, 5, ${draft.destination_link})
    RETURNING *
  `) as any[];

  return formatTask(result[0]);
}

// ── Draft Management ──
export async function handleGetDrafts(channel?: string, status?: string) {
  await ensureTable();
  const rows = (await sql()`SELECT * FROM marketing_tasks ORDER BY created_at DESC LIMIT 50`) as any[];
  const filtered = rows.filter((r: any) => {
    if (channel && r.channel !== channel) return false;
    if (status && r.status !== status) return false;
    return true;
  });
  return filtered.map(formatTask);
}

export async function handleApproveDraft(id: number) {
  await ensureTable();
  const result = (await sql()`
    UPDATE marketing_tasks SET status = 'published', updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `) as any[];
  if (result.length === 0) throw new Error(`Draft ${id} not found`);
  return formatTask(result[0]);
}

export async function handleUpdateDraft(id: number, body: { status?: string; title?: string; content?: string }) {
  await ensureTable();

  // Build the update using tagged template for safe interpolation
  if (body.status) {
    const result = (await sql()`
      UPDATE marketing_tasks SET status = ${body.status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `) as any[];
    if (result.length === 0) throw new Error(`Draft ${id} not found`);
    return formatTask(result[0]);
  }

  if (body.title) {
    const result = (await sql()`
      UPDATE marketing_tasks SET title = ${body.title}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `) as any[];
    if (result.length === 0) throw new Error(`Draft ${id} not found`);
    return formatTask(result[0]);
  }

  if (body.content !== undefined) {
    const result = (await sql()`
      UPDATE marketing_tasks SET content = ${body.content}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `) as any[];
    if (result.length === 0) throw new Error(`Draft ${id} not found`);
    return formatTask(result[0]);
  }

  throw new Error("No fields to update");
}

// ── Agent Runs ──

export async function ensureAgentRunsTable() {
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

export async function handleAgentRun() {
  await ensureTable();
  await ensureAgentRunsTable();

  // Load all products for template generation
  const products = (await sql()`SELECT * FROM products ORDER BY rating DESC NULLS LAST`) as any[];
  const allProducts = products.map((p: any) => ({
    ...p,
    rating: p.rating ? Number(p.rating) : null,
    price: p.price ? Number(p.price) : null,
  }));

  // ── Analyze priorities ──
  const dashData = await handleDashboard();
  const { priorityTasks, contentGaps } = dashData;

  const draftsToCreate: { channel: string; topic?: string; room?: string }[] = [];

  // Content gaps → blog posts (up to 2)
  const gapTasks = priorityTasks.filter((t: any) => t.type === "content_gap");
  for (const gap of gapTasks.slice(0, 2)) {
    draftsToCreate.push({ channel: "blog", room: gap.room, topic: formatRoom(gap.room) });
  }

  // High-value products (4.8★+) → Pinterest pins (up to 2)
  const topRated = allProducts.filter((p: any) => (p.rating ?? 0) >= 4.8);
  const usedRooms = new Set(draftsToCreate.map((d) => d.room).filter(Boolean));
  for (const tp of topRated.slice(0, 2)) {
    if (draftsToCreate.length >= 4) break;
    if (usedRooms.has(tp.room) && draftsToCreate.filter(d => d.channel === "pinterest").length >= 1) continue;
    usedRooms.add(tp.room);
    draftsToCreate.push({ channel: "pinterest", room: tp.room, topic: tp.name });
  }

  // Seasonal opportunities → email newsletter (1)
  const seasonalTasks = priorityTasks.filter((t: any) => t.type === "seasonal");
  if (seasonalTasks.length > 0 && draftsToCreate.length < 5) {
    const season = seasonalTasks[0].season;
    draftsToCreate.push({ channel: "email", room: undefined, topic: `${season} home refresh` });
  }

  // Ensure we have at least 3 drafts
  if (draftsToCreate.length < 3) {
    const remaining = 3 - draftsToCreate.length;
    const allRooms = [...new Set(allProducts.map((p: any) => p.room))] as string[];
    for (let i = 0; i < remaining && i < allRooms.length; i++) {
      const room = allRooms[i];
      if (usedRooms.has(room)) continue;
      usedRooms.add(room);
      const channels = ["blog", "pinterest", "email"] as const;
      draftsToCreate.push({ channel: channels[i % 3], room, topic: formatRoom(room) });
    }
  }

  // Trim to max 5
  const finalDrafts = draftsToCreate.slice(0, 5);

  // ── Generate and save drafts ──
  const generated: any[] = [];
  const channelCounts: Record<string, number> = { blog: 0, pinterest: 0, email: 0 };
  const roomsSet = new Set<string>();

  for (const spec of finalDrafts) {
    let draft: { title: string; content: string; channel: string; rationale: string; product_ids: number[]; destination_link: string };

    switch (spec.channel) {
      case "blog":
        draft = blogTemplate(allProducts, spec.topic);
        break;
      case "pinterest":
        draft = pinterestTemplate(allProducts, spec.topic);
        break;
      case "email":
        draft = emailTemplate(allProducts, spec.topic);
        break;
      default:
        continue;
    }

    const result = (await sql()`
      INSERT INTO marketing_tasks (title, content, channel, status, rationale, product_ids, priority, destination_link)
      VALUES (${draft.title}, ${draft.content}, ${draft.channel}, 'draft', ${draft.rationale}, ${JSON.stringify(draft.product_ids)}, 5, ${draft.destination_link})
      RETURNING *
    `) as any[];

    const formatted = formatTask(result[0]);
    generated.push(formatted);
    channelCounts[draft.channel] = (channelCounts[draft.channel] || 0) + 1;
    if (spec.room) roomsSet.add(spec.room);
  }

  // Record the agent run
  await sql()`
    INSERT INTO agent_runs (drafts_generated, channels, rooms)
    VALUES (${generated.length}, ${JSON.stringify(channelCounts)}, ${JSON.stringify([...roomsSet])})
  `;

  // ── Build summary ──
  const channelSummary = Object.entries(channelCounts)
    .filter(([, count]) => count > 0)
    .map(([ch, count]) => `${count} ${ch === "pinterest" ? "pin" : ch}`)
    .join(", ");

  return {
    generated,
    summary: `Generated ${generated.length} drafts: ${channelSummary}`,
    channels: channelCounts,
    rooms: [...roomsSet],
  };
}

export async function handleAgentSummary() {
  await ensureAgentRunsTable();

  // Last agent run
  const lastRun = (await sql()`SELECT created_at, drafts_generated, channels, rooms FROM agent_runs ORDER BY created_at DESC LIMIT 1`) as any[];

  // Drafts generated this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekResult = (await sql()`
    SELECT COUNT(*) as cnt FROM marketing_tasks
    WHERE created_at >= ${weekStart.toISOString()}
  `) as any[];

  // Approval rate
  const statusCounts = (await sql()`SELECT status, COUNT(*) as cnt FROM marketing_tasks GROUP BY status`) as any[];
  let approved = 0;
  let draft = 0;
  for (const row of statusCounts) {
    if (row.status === "approved") approved = Number(row.cnt);
    if (row.status === "draft") draft = Number(row.cnt);
  }
  const total = approved + draft;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return {
    lastRun: lastRun.length > 0 ? String(lastRun[0].created_at) : null,
    lastRunDrafts: lastRun.length > 0 ? Number(lastRun[0].drafts_generated) : 0,
    lastRunChannels: lastRun.length > 0 ? lastRun[0].channels : {},
    lastRunRooms: lastRun.length > 0 ? lastRun[0].rooms : [],
    draftsThisWeek: Number(weekResult[0]?.cnt ?? 0),
    approvalRate,
  };
}

// ── Helpers ──
function formatTask(row: any) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    channel: row.channel,
    status: row.status,
    rationale: row.rationale,
    product_ids: Array.isArray(row.product_ids)
      ? row.product_ids
      : typeof row.product_ids === "string"
        ? JSON.parse(row.product_ids)
        : [],
    priority: row.priority ?? 5,
    destination_link: row.destination_link ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function formatRoom(room: string): string {
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
  };
  return names[room] ?? room.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pickProducts(products: any[], count: number, room?: string): any[] {
  let pool = products;
  if (room) {
    pool = products.filter((p: any) => p.room === room);
    if (pool.length === 0) pool = products;
  }
  const topRated = [...pool].sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
  return topRated.slice(0, count);
}

function guessRoom(topic: string, products: any[]): string | undefined {
  const rooms = ["living-room", "bedroom", "kitchen", "bathroom", "patio", "office", "entryway", "laundry", "storage"];
  const lower = topic.toLowerCase();
  for (const room of rooms) {
    if (lower.includes(room) || lower.includes(formatRoom(room).toLowerCase())) {
      return room;
    }
  }
  return undefined;
}

function pickRandomRoom(products: any[]): string | undefined {
  const rooms = [...new Set(products.map((p: any) => p.room))];
  if (rooms.length === 0) return undefined;
  return rooms[Math.floor(Math.random() * rooms.length)] as string;
}

// ── Templates ──
function blogTemplate(products: any[], topic?: string) {
  const room = topic ? guessRoom(topic, products) : pickRandomRoom(products);
  const picks = pickProducts(products, 5, room);
  const roomName = formatRoom(room ?? "living-room");

  const productLines = picks.map((p: any) => {
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
    rationale: `Seasonal ${roomName.toLowerCase()} content with ${picks.length} top-rated products. Room has strong reader interest.`,
    product_ids: picks.map((p: any) => p.id),
    destination_link: "/blog",
  };
}

function pinterestTemplate(products: any[], topic?: string) {
  const room = topic ? guessRoom(topic, products) : pickRandomRoom(products);
  const picks = pickProducts(products, 3, room);
  const roomName = formatRoom(room ?? "living-room");
  const primary = picks[0];

  const title = topic
    ? `${topic} — The ${roomName} Staple You'll Use Every Day`
    : `${primary.name}, The ${roomName} Piece That Changed Everything`;

  const description = [
    `Found this ${primary.name.toLowerCase()} and it completely transformed my ${roomName.toLowerCase()}. ${primary.editor_note ?? "Worth every penny."}`,
    `Also loving: ${picks.slice(1).map((p: any) => p.name.toLowerCase()).join(" and ")}.`,
    `Tap to shop the full ${roomName.toLowerCase()} edit on Evergreen House.`,
  ].join(" ");

  return {
    title,
    content: description,
    channel: "pinterest",
    rationale: `High-performing ${roomName.toLowerCase()} pin anchored by ${primary.name} (${primary.rating}★).`,
    product_ids: picks.map((p: any) => p.id),
    destination_link: room ? `/room/${room}` : "/editors-picks",
  };
}

function emailTemplate(products: any[], topic?: string) {
  const room = topic ? guessRoom(topic, products) : pickRandomRoom(products);
  const picks = pickProducts(products, 4, room);
  const roomName = formatRoom(room ?? "living-room");

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
    heroPick.price ? `At $${heroPick.price}, it's worth a look.` : ``,
    `[View on Amazon →](${heroPick.amazon_url})`,
    "",
    `**A few more worth your time:**`,
    ...restPicks.map((p: any) =>
      `• **${p.name}** — ${p.editor_note ?? `${p.rating}★ and worth it`} [Shop →](${p.amazon_url})`
    ),
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
    rationale: `Newsletter featuring ${picks.length} top-rated ${roomName.toLowerCase()} products. ${heroPick.name} (${heroPick.rating}★) as hero.`,
    product_ids: picks.map((p: any) => p.id),
    destination_link: "/blog",
  };
}
