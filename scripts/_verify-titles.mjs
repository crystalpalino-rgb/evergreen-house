import { readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
const raw = readFileSync("/home/team/shared/site/.env.local","utf8");
const line = raw.split("\n").find(l=>l.trim().startsWith("DATABASE_URL="));
const db = neon(line.slice(line.indexOf("=")+1).trim().replace(/^["']|["']$/g,""));
const HIDDEN=["loungewear","thanksgiving"];
const bad=t=>t.includes(" - ")||t.length>60;
const prods=await db.query(`SELECT id,name,display_title,room,is_active FROM products ORDER BY id`);
const edits=await db.query(`SELECT id,slug FROM edits WHERE status='published' ORDER BY id`);
const items=await db.query(`SELECT edit_id,product_id,display_title,name FROM edit_items ORDER BY edit_id,position,id`);
const byId=new Map(prods.map(r=>[Number(r.id),r]));
const rows=[];
for(const p of prods){ if(!p.is_active||HIDDEN.includes(p.room))continue; const t=(p.display_title||"").trim()||(p.name||"").trim(); rows.push({page:`/room/${p.room}`,id:p.id,t,bad:bad(t)}); }
for(const e of edits){ for(const it of items.filter(i=>Number(i.edit_id)===Number(e.id))){ const pr=byId.get(Number(it.product_id)); if(!pr)continue; const t=(it.display_title||"").trim()||(it.name||"").trim()||(pr.name||"").trim(); rows.push({page:`/collections/${e.slug}`,id:it.product_id,t,bad:bad(t)}); } }
const byPage={};
for(const r of rows){ (byPage[r.page]=byPage[r.page]||[]).push(r); }
const out=[];
for(const p of Object.keys(byPage).sort()){ const list=byPage[p]; out.push(`${p}  cards=${list.length}  raw=${list.filter(r=>r.bad).length}`); for(const r of list.filter(x=>x.bad)) out.push(`   STILL RAW ${r.id}: ${r.t}`); }
const totalBad=rows.filter(r=>r.bad).length;
out.push(`TOTAL cards=${rows.length} raw=${totalBad}`);
console.log(out.join("\n"));
writeFileSync("/home/team/shared/curation/clean-titles-2026-11-05-after-proof.txt", out.join("\n")+"\n");
