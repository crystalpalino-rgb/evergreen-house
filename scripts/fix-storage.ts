import { sql } from "../src/db";

// 1. Fix toothbrush holder (already done, but run again to confirm)
await sql()`UPDATE products SET room = 'bathroom' WHERE name ILIKE '%toothbrush%'`;
console.log("✅ Toothbrush holder moved to bathroom");

// 2. Check storage products
const rows = await sql()`SELECT id, name, room, amazon_url, price FROM products WHERE room = 'storage'`;
console.log(`\n📦 Storage products (${rows.length}):`);
rows.forEach((r: any) => {
  console.log(`  #${r.id} | ${r.name?.slice(0,60)} | ${r.amazon_url?.slice(0,50)} | $${r.price}`);
});

// 3. Check toothbrush products
const toothbrush = await sql()`SELECT id, name, room, amazon_url FROM products WHERE name ILIKE '%toothbrush%'`;
console.log(`\n🪥 Toothbrush products (${toothbrush.length}):`);
toothbrush.forEach((r: any) => {
  console.log(`  #${r.id} | ${r.name?.slice(0,60)} | room=${r.room}`);
});
