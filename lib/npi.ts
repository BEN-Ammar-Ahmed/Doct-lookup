import { plansFor } from "./insurance";

export type Doctor = {
  npi: string;
  name: string;
  specialty: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  plans: string[];
  lat: number | null;
  lng: number | null;
  distanceMi: number | null;
};

const NPI_BASE = "https://npiregistry.cms.hhs.gov/api/";

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .trim();
}

export function normalizeNpiResult(raw: any): Doctor | null {
  if (!raw || raw.enumeration_type !== "NPI-1") return null;
  const basic = raw.basic;
  if (!basic?.first_name || !basic?.last_name) return null;

  const addresses: any[] = raw.addresses ?? [];
  const addr =
    addresses.find((a) => a.address_purpose === "LOCATION") ?? addresses[0];
  if (!addr) return null;

  const taxonomies: any[] = raw.taxonomies ?? [];
  const taxonomy =
    taxonomies.find((t) => t.primary) ?? taxonomies[0] ?? { desc: "Provider" };

  const credential = (basic.credential ?? "")
    .replace(/\./g, "")
    .replace(/^-+$/, "")
    .trim();
  const baseName = `${titleCase(basic.first_name)} ${titleCase(basic.last_name)}`;

  return {
    npi: String(raw.number),
    name: credential ? `${baseName}, ${credential}` : baseName,
    specialty: taxonomy.desc || "Provider",
    address1: titleCase(addr.address_1 ?? ""),
    city: titleCase(addr.city ?? ""),
    state: addr.state ?? "",
    zip: String(addr.postal_code ?? "").slice(0, 5),
    phone: addr.telephone_number ?? null,
    plans: plansFor(String(raw.number)),
    lat: null,
    lng: null,
    distanceMi: null,
  };
}

async function callNpi(params: Record<string, string>): Promise<any[]> {
  const qs = new URLSearchParams({
    version: "2.1",
    enumeration_type: "NPI-1",
    limit: "50",
    ...params,
  });
  const res = await fetch(`${NPI_BASE}?${qs}`, {
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`NPI registry responded ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

export async function searchNpi(params: {
  zip?: string;
  specialty?: string;
  firstName?: string;
  lastName?: string;
  state?: string;
}): Promise<Doctor[]> {
  const query: Record<string, string> = {};
  if (params.zip) query.postal_code = params.zip;
  if (params.specialty) query.taxonomy_description = params.specialty;
  if (params.firstName) query.first_name = params.firstName;
  if (params.lastName) query.last_name = params.lastName;
  if (params.state) query.state = params.state;

  const results = await callNpi(query);
  return results
    .map(normalizeNpiResult)
    .filter((d): d is Doctor => d !== null);
}

export async function fetchNpiByNumber(npi: string): Promise<Doctor | null> {
  const results = await callNpi({ number: npi });
  return results.length ? normalizeNpiResult(results[0]) : null;
}
