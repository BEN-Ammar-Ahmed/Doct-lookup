import { Pool } from "pg";
import type { Doctor } from "./npi";
import { milesBetween, type LatLng } from "./geo";
import { providerFullAddress } from "./providerLocations";

let pool: Pool | null = null;
export function providerPool() {
  if (!process.env.DATABASE_URL) return null;
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 3000, statement_timeout: 5000 });
  return pool;
}
export function addressKey(address: string): string {
  return address.trim().replace(/\s+/g, " ").toLowerCase();
}
export async function storedSearch(query: { zip?: string; name?: string; state?: string; specialty?: string; skip: number }): Promise<{ doctors: Doctor[]; hasMore: boolean } | null> {
  const db = providerPool(); if (!db) return null;
  const values: unknown[] = [];
  const clauses: string[] = [];
  function add(sql: string, value: string) { values.push(value); clauses.push(sql.replace("?", "$" + values.length)); }
  if (query.zip) add("zip = ?", query.zip);
  if (query.name) {
    const terms = query.name.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    if (!terms.length) return { doctors: [], hasMore: false };
    add("to_tsvector('simple', name) @@ to_tsquery('simple', ?)", terms.map(term => term + ":*").join(" & "));
  }
  if (query.state) add("state = ?", query.state);
  if (query.specialty) add("specialty = ?", query.specialty);
  if (!clauses.length) return { doctors: [], hasMore: false };
  values.push(query.skip);
  const result = await db.query<{ payload: Doctor }>("select payload from provider_data.providers where " + clauses.join(" and ") + " order by npi limit 51 offset $" + values.length, values);
  return { doctors: result.rows.slice(0, 50).map(row => row.payload), hasMore: result.rows.length > 50 };
}
export async function storedProvider(npi: string): Promise<Doctor | null | undefined> {
  const db = providerPool(); if (!db) return undefined;
  const { rows } = await db.query<{ payload: Doctor }>("select payload from provider_data.providers where npi = $1", [npi]);
  return rows[0]?.payload ?? null;
}
export async function storedCoordinates<T extends Doctor>(doctors: T[], center: LatLng | null): Promise<T[]> {
  const db = providerPool(); if (!db || !doctors.length) return doctors;
  const keys = doctors.map(d => addressKey(providerFullAddress(d)));
  const { rows } = await db.query<{ address_key: string; lat: number; lng: number }>("select address_key, lat, lng from provider_data.locations where address_key = any($1::text[])", [keys]);
  const byAddress = new Map(rows.map(row => [row.address_key, row]));
  return doctors.map((d, i) => {
    const point = byAddress.get(keys[i]);
    return point ? { ...d, lat: point.lat, lng: point.lng, locationApproximate: false, distanceMi: center ? milesBetween(center, point) : null } : d;
  });
}
export async function storedZip(zip: string): Promise<LatLng | null> {
  const db = providerPool(); if (!db) return null;
  const { rows } = await db.query<LatLng>("select lat, lng from provider_data.zcta where zip = $1", [zip]);
  return rows[0] ?? null;
}
export async function storedMedicare(npis: string[]) {
  const db = providerPool(); if (!db) return null;
  const { rows } = await db.query<{ npi:string; assignment:string; source_date:Date }>("select npi, assignment, source_date from provider_data.medicare where npi = any($1::text[])", [npis]);
  return new Map(rows.map(row => [row.npi, { status: row.assignment === "Y" ? "assigned" as const : row.assignment === "M" ? "maybe" as const : "no_record" as const, sourceUpdatedAt: row.source_date.toISOString().slice(0,10) }]));
}
