import { createReadStream, readFileSync, existsSync } from "node:fs";
import { parse } from "csv-parse";
import { Pool } from "pg";
import { nppesCsvProvider } from "../lib/ingestion";

const [mode, input, sourceDate, ...args] = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
if (!["nppes", "medicare", "zcta", "locations"].includes(mode) || !input || !/^\d{4}-\d{2}-\d{2}$/.test(sourceDate ?? "") || Number.isNaN(Date.parse(sourceDate))) {
  console.error("Usage: npm run ingest -- <nppes|medicare|zcta|locations> <official.csv> <source-date YYYY-MM-DD> [--taxonomy taxonomy.csv] [--dry-run] [--replace]");
  process.exit(1);
}
if (!existsSync(input)) { console.error("Input file does not exist."); process.exit(1); }
function csv(file: string) {
  const reader = createReadStream(file);
  const parser = parse({ columns: true, bom: true, trim: true, relax_column_count: false });
  reader.on("error", error => parser.destroy(error));
  return reader.pipe(parser);
}
const taxonomy = new Map<string, string>();
if (!dryRun && !process.env.INGEST_DATABASE_URL) {
  console.error("INGEST_DATABASE_URL is required; use --dry-run to validate files without a database.");
  process.exit(1);
}
const pool = dryRun ? null : new Pool({ connectionString: process.env.INGEST_DATABASE_URL, max: 1 });
let client: Awaited<ReturnType<Pool["connect"]>> | null = null;
let count = 0, skipped = 0, transaction = false;
const batch: unknown[] = [];
async function flush() {
  if (client && batch.length) await client.query("insert into ingest_stage(data) select value from jsonb_array_elements($1::jsonb)", [JSON.stringify(batch)]);
  batch.length = 0;
}
try {
  const taxonomyPath = args[args.indexOf("--taxonomy") + 1];
  if (args.includes("--taxonomy")) {
    if (!taxonomyPath || !existsSync(taxonomyPath)) throw new Error("Taxonomy file unavailable");
    for await (const row of csv(taxonomyPath)) if (row.Code) taxonomy.set(row.Code, row["Display Name"] || row.DisplayName || [row.Classification, row.Specialization].filter(Boolean).join(" — "));
  }
  if (pool) {
    client = await pool.connect();
    await client.query(readFileSync("db/schema.sql", "utf8"));
    await client.query("create temp table ingest_stage(id bigserial, data jsonb not null)");
  }
  for await (const row of csv(input)) {
    let record: unknown;
    if (mode === "nppes") {
      record = nppesCsvProvider(row, taxonomy);
    } else if (mode === "medicare") {
      const npi = row.NPI ?? row.npi;
      if (/^\d{10}$/.test(npi ?? "")) record = { npi, assignment: ["Y", "M"].includes(row.ind_assgn) ? row.ind_assgn : "" };
    } else {
      const latRaw = row.INTPTLAT ?? row.lat, lngRaw = row.INTPTLONG ?? row.lng;
      const lat = Number(latRaw), lng = Number(lngRaw);
      const id = mode === "zcta" ? String(row.GEOID ?? row.zip ?? "") : String(row.address_key ?? "").trim().replace(/\s+/g, " ").toLowerCase();
      if (id && latRaw && lngRaw && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat)<=90 && Math.abs(lng)<=180 && (mode !== "zcta" || /^\d{5}$/.test(id)) && (mode !== "locations" || row.quality === "census-address-match")) record = { id, lat, lng };
    }
    if (!record) { skipped++; continue; }
    batch.push(record); count++;
    if (batch.length >= 500) await flush();
  }
  await flush();
  if (!count) throw new Error("No valid records");
  if (client) {
    // Loading uses a private staging table. Only publication is transactional.
    await client.query("begin"); transaction = true;
    if (mode === "nppes") {
      await client.query("insert into provider_data.providers(npi,name,zip,state,specialty,payload,source_date) select data->>'npi',data->>'name',data->>'zip',data->>'state',data->>'specialty',data,$1::date from (select distinct on(data->>'npi') data from ingest_stage order by data->>'npi',id desc) s on conflict(npi) do update set name=excluded.name,zip=excluded.zip,state=excluded.state,specialty=excluded.specialty,payload=excluded.payload,source_date=excluded.source_date,imported_at=now()", [sourceDate]);
      if (args.includes("--replace")) await client.query("delete from provider_data.providers p where not exists(select 1 from ingest_stage s where s.data->>'npi'=p.npi)");
    } else if (mode === "medicare") {
      await client.query("insert into provider_data.medicare(npi,assignment,source_date) select data->>'npi',case when bool_or(data->>'assignment'='Y') then 'Y' when bool_or(data->>'assignment'='M') then 'M' else '' end,$1::date from ingest_stage group by data->>'npi' on conflict(npi) do update set assignment=excluded.assignment,source_date=excluded.source_date,imported_at=now()", [sourceDate]);
      if (args.includes("--replace")) await client.query("delete from provider_data.medicare p where not exists(select 1 from ingest_stage s where s.data->>'npi'=p.npi)");
    } else {
      const table = mode === "zcta" ? "zcta" : "locations";
      const column = mode === "zcta" ? "zip" : "address_key";
      // Identifiers come only from the validated mode above, never file content.
      await client.query("insert into provider_data." + table + "(" + column + ",lat,lng,source_date) select data->>'id',(data->>'lat')::double precision,(data->>'lng')::double precision,$1::date from (select distinct on(data->>'id') data from ingest_stage order by data->>'id',id desc) s on conflict(" + column + ") do update set lat=excluded.lat,lng=excluded.lng,source_date=excluded.source_date", [sourceDate]);
    }
    await client.query("commit"); transaction = false;
  }
  console.log(JSON.stringify({ mode, sourceDate, validated: count, skipped, dryRun }));
} catch {
  if (client && transaction) await client.query("rollback");
  console.error("Ingestion failed; the source batch was not published. Check file format, source date, and database access.");
  process.exitCode = 1;
} finally { client?.release(); await pool?.end(); }
