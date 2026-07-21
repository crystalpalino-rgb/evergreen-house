import { neon } from "@neondatabase/serverless";
const client = neon(process.env.DATABASE_URL!);
const rows = await client`SELECT id, name, room FROM products ORDER BY room, id`;
const byRoom: Record<string, string[]> = {};
rows.forEach((r: any) => {
  if (!byRoom[r.room]) byRoom[r.room] = [];
  byRoom[r.room].push(r.id + " | " + r.name);
});
for (const [room, prods] of Object.entries(byRoom)) {
  console.log("\n=== " + room.toUpperCase() + " (" + prods.length + ") ===");
  prods.forEach((p: string) => console.log("  " + p));
}
