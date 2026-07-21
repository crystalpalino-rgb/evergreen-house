import { sql } from "../src/db";
const db = sql();

// Verify products columns
const cols = await db`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position`;
const arr = [...cols];
console.log('=== Products columns (' + arr.length + ' total) ===');
arr.forEach((r: any) => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));

// Verify all tables
const tables = await db`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
console.log('\n=== All tables ===');
[...tables].forEach((r: any) => console.log('  ' + r.table_name));

// Verify indexes
const idx = await db`SELECT indexname FROM pg_indexes WHERE tablename = 'products' AND indexname LIKE 'idx_products_%' ORDER BY indexname`;
console.log('\n=== New indexes on products ===');
[...idx].forEach((r: any) => console.log('  ' + r.indexname));
