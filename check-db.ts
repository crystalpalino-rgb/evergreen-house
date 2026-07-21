import { sql } from "./src/db";

// Check storage products
const rows = await sql()`SELECT id, name, room, amazon_url, price FROM products WHERE room = 'storage'`;
console.log("Storage product count:", rows.length);
const arr = rows.map((r: any) => r);
console.log(JSON.stringify(arr, null, 2));

// Check all products with their rooms
const all = await sql()`SELECT room, count(*) as cnt FROM products GROUP BY room ORDER BY cnt DESC`;
console.log("Room distribution:", JSON.stringify(all.map((r: any) => ({ room: r.room, count: r.cnt }))));
