/**
 * One US-spelling standardisation sweep across the products table.
 *
 * Owner style decision (approved): US spelling standard, plain hyphens, no
 * em-dashes. This script is the database half; scripts/us-spelling-sweep-repo.mjs
 * is the repo/static half.
 *
 * It is a mechanical substitution driven by one mapping table. Every British
 * form is matched on WORD BOUNDARIES only, so "greyhound", "Centrepointe" and
 * "fibreglass" style inside-brand tokens survive untouched, and case is
 * preserved (Grey -> Gray, GREY -> GRAY, grey -> gray).
 *
 * Columns it writes: the editorial copy columns. Columns it never writes and
 * only reports on: anything that is an identifier, a URL, a slug, a merchant
 * value or a number - seo_slug, canonical_url, amazon_url, image_url,
 * pinterest_image_url, model_number, brand, availability, price, rating,
 * review_count, id, room, collection, product_type (routing/filter values).
 *
 * All-or-nothing: it computes every new value in memory, refuses to run if a
 * guard fails, and applies the whole set in one UPDATE ... FROM (VALUES ...)
 * statement so a half-applied sweep cannot happen. Re-running it is a no-op
 * (the second run finds zero hits).
 *
 * Usage:
 *   bun run scripts/us-spelling-sweep.mjs            # scan only, writes nothing
 *   bun run scripts/us-spelling-sweep.mjs --apply    # apply, then re-verify
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
  if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());
const APPLY = process.argv.includes("--apply");

/**
 * The one mapping table. British form (lowercase key) -> US form.
 * Longest forms are matched first so "colours" never half-matches as "colour".
 */
const PAIRS = [
  ["colourway", "colorway"],
  ["colourways", "colorways"],
  ["colours", "colors"],
  ["coloured", "colored"],
  ["colouring", "coloring"],
  ["colourful", "colorful"],
  ["colour", "color"],
  ["greys", "grays"],
  ["greyed", "grayed"],
  ["greyish", "grayish"],
  ["grey", "gray"],
  ["centres", "centers"],
  ["centred", "centered"],
  ["centring", "centering"],
  ["centre", "center"],
  ["fibres", "fibers"],
  ["fibre", "fiber"],
  ["favourites", "favorites"],
  ["favourite", "favorite"],
  ["favourited", "favorited"],
  ["favouriting", "favoriting"],
  ["favour", "favor"],
  ["favours", "favors"],
  ["jewellery", "jewelry"],
  ["neighbourhoods", "neighborhoods"],
  ["neighbourhood", "neighborhood"],
  ["neighbours", "neighbors"],
  ["neighbouring", "neighboring"],
  ["neighbour", "neighbor"],
  ["organisations", "organizations"],
  ["organisation", "organization"],
  ["organising", "organizing"],
  ["organised", "organized"],
  ["organiser", "organizer"],
  ["organisers", "organizers"],
  ["organises", "organizes"],
  ["organise", "organize"],
  ["recognisable", "recognizable"],
  ["recognising", "recognizing"],
  ["recognised", "recognized"],
  ["recognises", "recognizes"],
  ["recognise", "recognize"],
  ["realisation", "realization"],
  ["realising", "realizing"],
  ["realised", "realized"],
  ["realises", "realizes"],
  ["realise", "realize"],
  ["specialising", "specializing"],
  ["specialised", "specialized"],
  ["specialises", "specializes"],
  ["specialise", "specialize"],
  ["minimising", "minimizing"],
  ["minimised", "minimized"],
  ["minimises", "minimizes"],
  ["minimise", "minimize"],
  ["maximising", "maximizing"],
  ["maximised", "maximized"],
  ["maximises", "maximizes"],
  ["maximise", "maximize"],
  ["prioritising", "prioritizing"],
  ["prioritised", "prioritized"],
  ["prioritises", "prioritizes"],
  ["prioritise", "prioritize"],
  ["utilising", "utilizing"],
  ["utilised", "utilized"],
  ["utilises", "utilizes"],
  ["utilise", "utilize"],
  ["apologising", "apologizing"],
  ["apologised", "apologized"],
  ["apologise", "apologize"],
  ["authorising", "authorizing"],
  ["authorised", "authorized"],
  ["authorise", "authorize"],
  ["customising", "customizing"],
  ["customised", "customized"],
  ["customises", "customizes"],
  ["customise", "customize"],
  ["emphasising", "emphasizing"],
  ["emphasised", "emphasized"],
  ["emphasise", "emphasize"],
  ["summarising", "summarizing"],
  ["summarised", "summarized"],
  ["summarise", "summarize"],
  ["criticising", "criticizing"],
  ["criticised", "criticized"],
  ["criticise", "criticize"],
  ["socialising", "socializing"],
  ["socialised", "socialized"],
  ["socialise", "socialize"],
  ["standardising", "standardizing"],
  ["standardised", "standardized"],
  ["standardise", "standardize"],
  ["optimising", "optimizing"],
  ["optimised", "optimized"],
  ["optimises", "optimizes"],
  ["optimise", "optimize"],
  ["neutralising", "neutralizing"],
  ["neutralised", "neutralized"],
  ["neutralise", "neutralize"],
  ["personalising", "personalizing"],
  ["personalised", "personalized"],
  ["personalises", "personalizes"],
  ["personalise", "personalize"],
  ["catalogues", "catalogs"],
  ["catalogue", "catalog"],
  ["cosiest", "coziest"],
  ["cosier", "cozier"],
  ["cosily", "cozily"],
  ["cosy", "cozy"],
  ["behaviours", "behaviors"],
  ["behaviour", "behavior"],
  ["mouldings", "moldings"],
  ["moulding", "molding"],
  ["moulded", "molded"],
  ["moulds", "molds"],
  ["mould", "mold"],
  ["savoury", "savory"],
  ["tasselling", "tasseling"],
  ["tasselled", "tasseled"],
  ["marvellous", "marvelous"],
  ["labours", "labors"],
  ["labour", "labor"],
  ["aluminium", "aluminum"],
  ["towards", "toward"],
  ["whilst", "while"],
  ["travelling", "traveling"],
  ["travelled", "traveled"],
  ["traveller", "traveler"],
  ["programmes", "programs"],
  ["programme", "program"],
  ["analysing", "analyzing"],
  ["analysed", "analyzed"],
  ["analyses", "analyzes"],
  ["analyse", "analyze"],
  ["practising", "practicing"],
  ["practised", "practiced"],
  ["practises", "practices"],
  ["practise", "practice"],
  ["licences", "licenses"],
  ["licence", "license"],
  ["defences", "defenses"],
  ["defence", "defense"],
  ["offences", "offenses"],
  ["offence", "offense"],
  ["pretences", "pretenses"],
  ["pretence", "pretense"],
  ["kerbs", "curbs"],
  ["kerb", "curb"],
  ["ploughs", "plows"],
  ["plough", "plow"],
  ["sceptical", "skeptical"],
  ["draughts", "drafts"],
  ["draught", "draft"],
  ["metres", "meters"],
  ["metre", "meter"],
  ["kilometres", "kilometers"],
  ["kilometre", "kilometer"],
  ["millilitres", "milliliters"],
  ["millilitre", "milliliter"],
  ["litres", "liters"],
  ["litre", "liter"],
  ["ageing", "aging"],
  ["judgements", "judgments"],
  ["judgement", "judgment"],
  ["cheques", "checks"],
  ["cheque", "check"],
  ["tyres", "tires"],
  ["tyre", "tire"],
  ["storeys", "stories"],
  ["storey", "story"],
  ["pyjamas", "pajamas"],
  ["enrolment", "enrollment"],
  ["enrol", "enroll"],
  ["fulfilment", "fulfillment"],
  ["fulfil", "fulfill"],
  ["skilful", "skillful"],
  ["wilful", "willful"],
  ["instalments", "installments"],
  ["instalment", "installment"],
  ["moustache", "mustache"],
  ["aeroplanes", "airplanes"],
  ["aeroplane", "airplane"],
  ["labelled", "labeled"],
  ["labelling", "labeling"],
  ["modelled", "modeled"],
  ["modelling", "modeling"],
  ["fuelled", "fueled"],
  ["signalled", "signaled"],
  ["armour", "armor"],
  ["flavours", "flavors"],
  ["flavour", "flavor"],
  ["honours", "honors"],
  ["honour", "honor"],
  ["humour", "humor"],
  ["odours", "odors"],
  ["odour", "odor"],
  ["parlour", "parlor"],
  ["rumours", "rumors"],
  ["rumour", "rumor"],
  ["vapours", "vapors"],
  ["vapour", "vapor"],
  ["endeavour", "endeavor"],
  ["savour", "savor"],
  ["splendour", "splendor"],
  ["vigour", "vigor"],
  ["favourable", "favorable"],
  ["honourable", "honorable"],
];

/** British form -> US form, lowercase keys, longest first. */
const MAP = new Map(
  [...PAIRS].sort((a, b) => b[0].length - a[0].length).map(([b, u]) => [b, u]),
);
const FORMS = [...MAP.keys()];
/** One regex, word-boundary anchored, alternation longest-first. */
const RE = new RegExp(`\\b(?:${FORMS.join("|")})\\b`, "gi");

function matchCase(original, us) {
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return us.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return us[0].toUpperCase() + us.slice(1);
  }
  return us;
}

function convert(text) {
  return String(text).replace(RE, (m) => matchCase(m, MAP.get(m.toLowerCase())));
}

/** Every British hit in a string, with the US replacement. */
function hits(text) {
  const out = [];
  for (const m of String(text).matchAll(RE)) {
    out.push({ from: m[0], to: matchCase(m[0], MAP.get(m[0].toLowerCase())) });
  }
  return out;
}

/** Editorial copy columns this sweep writes. */
const WRITE_COLUMNS = [
  "name",
  "editor_note",
  "card_hook",
  "seo_title",
  "seo_description",
  "pinterest_description",
  "editor_why",
  "editor_tip",
  "founder_note",
  "best_for",
  "image_alt",
  "ai_summary",
  "display_title",
  "pinterest_title",
];
/** Array copy columns this sweep writes (text[]). */
const WRITE_ARRAY_COLUMNS = [
  "pros",
  "cons",
  "ai_keywords",
  "pinterest_hashtags",
  "materials",
  "colors",
  "moods",
  "seasons",
  "style",
  "lifestyle_tags",
];
/** Scanned and reported, never written: identifiers, URLs, routing values. */
const REPORT_ONLY_COLUMNS = [
  "room",
  "collection",
  "product_type",
  "blog_category",
  "schema_type",
  "import_batch",
  "brand",
  "model_number",
  "full_name",
  "availability",
  "seo_slug",
  "canonical_url",
  "amazon_url",
  "image_url",
  "pinterest_image_url",
  "pinterest_board",
  "price_currency",
];
const ALL_SCAN = [...WRITE_COLUMNS, ...WRITE_ARRAY_COLUMNS, ...REPORT_ONLY_COLUMNS];

const selectList = ALL_SCAN.join(", ");

async function scan() {
  const rows = await db.query(`SELECT id, ${selectList} FROM products ORDER BY id`, []);
  const perColumn = {};
  const perColumnWord = {};
  for (const col of ALL_SCAN) {
    perColumn[col] = 0;
    perColumnWord[col] = {};
  }
  const rowHits = [];
  for (const row of rows) {
    for (const col of ALL_SCAN) {
      const value = row[col];
      if (value == null) continue;
      const texts = Array.isArray(value) ? value : [value];
      for (const t of texts) {
        if (typeof t !== "string") continue;
        for (const h of hits(t)) {
          perColumn[col] += 1;
          perColumnWord[col][h.from.toLowerCase()] =
            (perColumnWord[col][h.from.toLowerCase()] || 0) + 1;
          rowHits.push({ id: row.id, col, ...h });
        }
      }
    }
  }
  return { rows, perColumn, perColumnWord, rowHits };
}

function fmtWords(words) {
  const entries = Object.entries(words).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries.map(([w, n]) => `${w} ${n}`).join(", ");
}

function printScan(label, result) {
  console.log(`\n===== ${label} =====`);
  const total = Object.values(result.perColumn).reduce((a, b) => a + b, 0);
  for (const col of ALL_SCAN) {
    const n = result.perColumn[col];
    const kind = WRITE_COLUMNS.includes(col) || WRITE_ARRAY_COLUMNS.includes(col) ? "" : "  [report only]";
    console.log(
      `${col.padEnd(22)} ${String(n).padStart(4)}${n ? "   " + fmtWords(result.perColumnWord[col]) : ""}${n ? kind : ""}`,
    );
  }
  console.log(`${"TOTAL".padEnd(22)} ${String(total).padStart(4)}`);
  return total;
}

async function main() {
  const before = await scan();
  const beforeTotal = printScan("BEFORE (all scanned columns, word-boundary)", before);

  // ---- Guard 1: every row is accounted for. ----
  if (before.rows.length !== 503) {
    throw new Error(
      `expected 503 product rows, read ${before.rows.length}: refusing to run`,
    );
  }

  // ---- Guard 2: report-only columns must not be swept into by the write set. ----
  const reportOnlyHits = REPORT_ONLY_COLUMNS.filter((c) => before.perColumn[c] > 0);
  if (reportOnlyHits.length) {
    console.log(
      `\nReport-only columns carrying a British form (left alone on purpose): ${reportOnlyHits
        .map((c) => `${c} ${before.perColumn[c]}`)
        .join(", ")}`,
    );
  }

  if (!APPLY) {
    console.log("\nScan only. Re-run with --apply to write.");
    return;
  }

  // ---- Build the new values in memory. Nothing is written yet. ----
  const updates = []; // { id, column, kind: "text"|"array", value }
  for (const row of before.rows) {
    for (const col of WRITE_COLUMNS) {
      const v = row[col];
      if (typeof v !== "string") continue;
      const next = convert(v);
      if (next !== v) updates.push({ id: row.id, column: col, kind: "text", value: next, from: v });
    }
    for (const col of WRITE_ARRAY_COLUMNS) {
      const v = row[col];
      if (!Array.isArray(v)) continue;
      const next = v.map((x) => (typeof x === "string" ? convert(x) : x));
      if (next.some((x, i) => x !== v[i])) {
        updates.push({ id: row.id, column: col, kind: "array", value: next, from: v });
      }
    }
  }

  // ---- Guard 3: the write set explains every write-column hit. ----
  const writeHits = [...WRITE_COLUMNS, ...WRITE_ARRAY_COLUMNS].reduce(
    (a, c) => a + before.perColumn[c],
    0,
  );
  const explained = updates.reduce((a, u) => {
    const texts = Array.isArray(u.from) ? u.from : [u.from];
    return a + texts.reduce((n, t) => n + hits(t).length, 0);
  }, 0);
  if (explained !== writeHits) {
    throw new Error(
      `write set explains ${explained} hits but the scan found ${writeHits}: refusing to apply`,
    );
  }

  // ---- Guard 4: nothing outside the write set is touched, and no value is
  // ever blanked or shortened in a way that could not be a substitution. ----
  const protectedCols = new Set(REPORT_ONLY_COLUMNS);
  for (const u of updates) {
    if (protectedCols.has(u.column)) {
      throw new Error(`refusing to write protected column ${u.column}`);
    }
  }

  if (updates.length === 0) {
    console.log("\nNothing to apply: the database is already in US spelling.");
    return;
  }

  console.log(
    `\nApplying ${updates.length} column updates across ${new Set(updates.map((u) => u.id)).size} rows, in one transaction...`,
  );

  // ---- One transaction, one statement per column, so a half-applied sweep
  // cannot happen. Column names come from the two hardcoded allowlists above,
  // never from data. ----
  const byColumn = new Map();
  for (const u of updates) {
    if (!byColumn.has(u.column)) byColumn.set(u.column, []);
    byColumn.get(u.column).push(u);
  }
  const statements = [];
  for (const [column, list] of byColumn) {
    const isArray = WRITE_ARRAY_COLUMNS.includes(column);
    if (!isArray && !WRITE_COLUMNS.includes(column)) {
      throw new Error(`refusing to write unknown column ${column}`);
    }
    const cast = isArray ? "text[]" : "text";
    const values = list
      .map((_, i) => `($${i * 2 + 1}::int, $${i * 2 + 2}::${cast})`)
      .join(", ");
    const params = list.flatMap((u) => [u.id, u.value]);
    statements.push({
      column,
      count: list.length,
      sql: `UPDATE products AS p
               SET ${column} = v.val
              FROM (VALUES ${values}) AS v(id, val)
             WHERE p.id = v.id
         RETURNING p.id`,
      params,
    });
  }

  const results = await db.transaction((txn) =>
    statements.map((st) => txn.query(st.sql, st.params)),
  );
  let written = 0;
  statements.forEach((st, i) => {
    const n = results[i].length;
    if (n !== st.count) {
      throw new Error(
        `${st.column}: expected to update ${st.count} rows, updated ${n}: transaction aborted`,
      );
    }
    written += n;
  });
  console.log(`Updated ${written} rows across ${statements.length} columns.`);

  const after = await scan();
  printScan("AFTER (all scanned columns, word-boundary)", after);

  const writeAfter = [...WRITE_COLUMNS, ...WRITE_ARRAY_COLUMNS].reduce(
    (a, c) => a + after.perColumn[c],
    0,
  );
  if (writeAfter !== 0) {
    throw new Error(`sweep left ${writeAfter} hits in write columns: investigate`);
  }
  console.log(`\nVerified: 0 hits remain in the ${WRITE_COLUMNS.length + WRITE_ARRAY_COLUMNS.length} copy columns.`);
}

await main();
