import XLSX from "xlsx";
import { sql } from "~/db";

function mapRoom(r: string): string {
  const n = (r || "").trim().toLowerCase();
  if (n === "living room" || n === "living-room" || n === "livingroom") return "living-room";
  if (n === "organization" || n === "storage" || n.includes("storage")) return "storage";
  if (n === "patio" || n === "outdoor" || n === "outdoors") return "patio";
  if (n === "kitchen") return "kitchen";
  if (n === "bathroom") return "bathroom";
  return "living-room";
}

function shortName(fn: string): string {
  if (!fn) return "Product";
  const cl = fn.replace(/[|,\-–—]/g, " ").replace(/\s+/g, " ").trim();
  const w = cl.split(" ");
  if (w.length <= 5) return cl;
  const sw = new Set(["with","for","and","set","of","in","to","the","a","an","no","or","by","from","no.","inch","inches","ft","pack","pcs","piece","pieces","size","large","small","extra","up","2","3","4","5","6","7","8","9","10","12","14","16","18","20","22","24","26","28","30"]);
  let e = 4;
  if (w.length > 4 && !sw.has(w[4].toLowerCase())) e = 5;
  if (w.length > 5 && !sw.has(w[5].toLowerCase()) && w[5].length > 3) e = 6;
  return w.slice(0, e).join(" ");
}

function inferStyles(name: string, room: string): string[] {
  const l = name.toLowerCase();
  const s = new Set<string>();
  const rs: Record<string,string[]> = {"living-room":["modern","cozy"],bedroom:["cozy","minimalist"],kitchen:["modern","farmhouse"],bathroom:["modern","minimalist"],patio:["coastal","modern"],storage:["minimalist","modern"]};
  (rs[room]||["modern"]).forEach(x=>s.add(x));
  if (l.includes("boho")||l.includes("bohemian")) s.add("boho");
  if (l.includes("farmhouse")||l.includes("rustic")) s.add("farmhouse");
  if (l.includes("coastal")) s.add("coastal");
  if (l.includes("mid-century")||l.includes("modern")) s.add("modern");
  if (l.includes("minimalist")||l.includes("minimal")) s.add("minimalist");
  if (l.includes("vintage")||l.includes("retro")) s.add("traditional");
  if (l.includes("glam")||l.includes("gold")||l.includes("velvet")) s.add("glam");
  if (l.includes("linen")||l.includes("natural")||l.includes("woven")) s.add("coastal");
  if (l.includes("wood")||l.includes("rattan")||l.includes("acacia")) s.add("farmhouse");
  return [...s].slice(0,5);
}

function inferCollection(room: string): string {
  if (room==="living-room") return "living-room-look";
  if (room==="bedroom") return "bedroom-look";
  if (room==="kitchen") return "kitchen-look";
  if (room==="bathroom") return "bathroom-look";
  if (room==="patio") return "patio-look";
  if (room==="entryway") return "entryway-look";
  return "home-essentials";
}

export async function runImport(): Promise<{ inserted: number; skipped: number; errors: number; total: number; log: string[] }> {
  const log: string[] = [];

  const wb = XLSX.readFile("/home/team/shared/Amazon Listv3.xlsx");
  const data = XLSX.utils.sheet_to_json<Record<string,any>>(wb.Sheets[wb.SheetNames[0]]);
  log.push(`Found ${data.length} rows in spreadsheet`);

  await sql()`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, full_name TEXT, room TEXT NOT NULL,
    style TEXT[] DEFAULT '{}', amazon_url TEXT NOT NULL UNIQUE, price DECIMAL,
    rating DECIMAL, editor_note TEXT, image_url TEXT, pinterest_title TEXT,
    blog_category TEXT, collection TEXT, is_trending BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  let ins = 0, sk = 0, er = 0;
  for (const row of data) {
    const pn = String(row["Product Name"]||"").trim();
    const au = String(row["Link"]||"").trim();
    if (!pn || !au) { log.push(`SKIP: missing name/url`); sk++; continue; }
    const room = mapRoom(String(row["Room"]||""));
    const name = shortName(pn);
    const styles = inferStyles(pn, room);
    const collection = inferCollection(room);
    const price = row["Price"] != null ? Number(row["Price"]) : null;
    const rating = row["Rating"] != null ? Number(row["Rating"]) : null;
    const en = String(row["Why I like them"]||"").trim();
    const iu = String(row["Image URL"]||"").trim();
    const tr = rating != null && rating >= 4.6;
    try {
      await sql()`INSERT INTO products (name,full_name,room,style,amazon_url,price,rating,editor_note,image_url,collection,is_trending)
        VALUES (${name},${name},${room},${styles},${au},${price},${rating},${en||null},${iu||null},${collection},${tr})
        ON CONFLICT (amazon_url) DO NOTHING`;
      log.push(`OK: ${name} → ${room} | $${price} | ${rating}★`);
      ins++;
    } catch(e: any) { log.push(`ERR: ${name} — ${e.message}`); er++; }
  }
  const cnt = await sql()`SELECT count(*) as c FROM products`;
  log.push(`Done. Inserted=${ins} Skipped=${sk} Errors=${er} Total=${cnt[0].c}`);
  return { inserted: ins, skipped: sk, errors: er, total: cnt[0].c, log };
}
