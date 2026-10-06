export type Doctor = {
  npi: string;
  name: string;
  specialty: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  distanceMi: number | null;
  locationApproximate: boolean;
  locationPrecision?: "address" | "zip" | "unknown";
  locationSource?: "nppes" | "census" | "stored" | "zip";
  sourceUpdatedAt?: string;
  addressKind?: "practice" | "mailing";
  practiceLocations?: { address1: string; city: string; state: string; zip: string; phone: string | null }[];
};

const NPI_BASE = "https://npiregistry.cms.hhs.gov/api/";
export const DEFAULT_DOCTOR_SPECIALTIES = [
  "Family Medicine",
  "Internal Medicine",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Psychiatry",
  "Emergency Medicine",
  "Dermatology",
  "Cardiology",
  "Ophthalmology",
  "Orthopaedic Surgery",
];

const DEFAULT_DOCTOR_MATCHES = [
  "family medicine",
  "internal medicine",
  "pediatrics",
  "obstetrics",
  "gynecology",
  "psychiatry",
  "emergency medicine",
  "dermatology",
  "cardiology",
  "cardiovascular disease",
  "ophthalmology",
  "orthopaedic surgery",
  "orthopedic surgery",
];

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
  if (basic.status && basic.status !== "A") return null;

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
    lat: null,
    lng: null,
    distanceMi: null,
    locationApproximate: true,
    locationPrecision: "unknown",
    locationSource: "nppes",
    addressKind: addr.address_purpose === "LOCATION" ? "practice" : "mailing",
    sourceUpdatedAt: typeof basic.last_updated === "string" ? basic.last_updated : undefined,
    practiceLocations: [...addresses.filter(a => a.address_purpose === "LOCATION"), ...(raw.practiceLocations ?? [])].map(a => ({ address1: titleCase(a.address_1 ?? ""), city: titleCase(a.city ?? ""), state: a.state ?? "", zip: String(a.postal_code ?? "").slice(0, 5), phone: a.telephone_number ?? null })),
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

export const NPI_PAGE_SIZE = 50;

function isDefaultDoctorSpecialty(specialty: string): boolean {
  const normalized = specialty.toLowerCase();
  return DEFAULT_DOCTOR_MATCHES.some((match) => normalized.includes(match));
}

function hasPhysicianCredential(name: string): boolean {
  return /,\s*(MD|DO)\b/i.test(name);
}

type DefaultPage = { doctors: Doctor[]; active: string[]; sourceSkip: number; expires: number; pending?: Promise<void> };
const defaultSearchCache = new Map<string, DefaultPage>();

async function searchDefaultDoctors(params: { zip: string; state?: string; skip?: number }): Promise<{ doctors: Doctor[]; hasMore: boolean }> {
  const key = params.zip + ":" + (params.state ?? "");
  let page = defaultSearchCache.get(key);
  if (!page || page.expires < Date.now()) {
    if (defaultSearchCache.size >= 100) defaultSearchCache.delete(defaultSearchCache.keys().next().value!);
    page = { doctors: [], active: [...DEFAULT_DOCTOR_SPECIALTIES], sourceSkip: 0, expires: Date.now() + 300000 };
    defaultSearchCache.set(key, page);
  }
  const skip = params.skip ?? 0;
  while (page.doctors.length < skip + NPI_PAGE_SIZE && page.active.length && page.sourceSkip <= 1000) {
    if (!page.pending) {
      const current = page;
      current.pending = (async () => {
        const batches = await Promise.all(current.active.map(async taxonomy => ({ taxonomy, records: await callNpi({ postal_code: params.zip, taxonomy_description: taxonomy, skip: String(current.sourceSkip), ...(params.state ? { state: params.state } : {}) }) })));
        const byNpi = new Map(current.doctors.map(d => [d.npi, d]));
        for (const { records } of batches) for (const raw of records) {
          const doctor = normalizeNpiResult(raw);
          if (doctor && doctor.zip === params.zip && isDefaultDoctorSpecialty(doctor.specialty) && hasPhysicianCredential(doctor.name)) byNpi.set(doctor.npi, doctor);
        }
        current.doctors = [...byNpi.values()];
        current.active = batches.filter(batch => batch.records.length === NPI_PAGE_SIZE).map(batch => batch.taxonomy);
        current.sourceSkip += NPI_PAGE_SIZE;
      })().finally(() => { current.pending = undefined; });
    }
    await page.pending;
  }
  return { doctors: page.doctors.slice(skip, skip + NPI_PAGE_SIZE), hasMore: page.doctors.length > skip + NPI_PAGE_SIZE || (page.active.length > 0 && page.sourceSkip <= 1000) };
}

export async function searchNpi(params: {
  zip?: string;
  specialty?: string;
  firstName?: string;
  lastName?: string;
  state?: string;
  skip?: number;
}): Promise<{ doctors: Doctor[]; hasMore: boolean }> {
  if (params.zip && !params.specialty && !params.firstName && !params.lastName) {
    return searchDefaultDoctors({
      zip: params.zip,
      state: params.state,
      skip: params.skip,
    });
  }

  const query: Record<string, string> = {};
  if (params.zip) query.postal_code = params.zip;
  if (params.specialty) query.taxonomy_description = params.specialty;
  if (params.firstName) query.first_name = params.firstName;
  if (params.lastName) query.last_name = params.lastName;
  if (params.state) query.state = params.state;
  if (params.skip) query.skip = String(params.skip);

  const results = await callNpi(query);
  const doctors = results
    .map(normalizeNpiResult)
    .filter((d): d is Doctor => d !== null)
    .filter((d) => !params.zip || d.zip === params.zip);
  return { doctors, hasMore: results.length === NPI_PAGE_SIZE };
}

export async function fetchNpiByNumber(npi: string): Promise<Doctor | null> {
  const results = await callNpi({ number: npi });
  return results.length ? normalizeNpiResult(results[0]) : null;
}
