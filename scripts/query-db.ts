import { sql } from "../src/db";
const s = sql();
const samples = await s`SELECT id, name, room, editor_note FROM products ORDER BY id LIMIT 30`;
for (const r of samples) {
  console.log(`[${r.room}] ${r.name} | editor: ${(r.editor_note || '').substring(0, 60)}`);
}
