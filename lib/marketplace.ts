import { COVERAGE_LABELS, type CoverageDisplay } from "./coverage";

// Real data: CMS's Marketplace API (developer.cms.gov/marketplace-api),
// the same data that powers HealthCare.gov. Requires a free API key —
// see .env.example. Confirmed live shape on 2026-07-24:
//   GET  /counties/by/zip/{zip}         -> county FIPS for a ZIP
//   POST /plans/search                   -> real ACA plans for a place
//   GET  /providers/covered              -> Covered/NotCovered/DataNotProvided
const CMS_BASE = "https://marketplace.api.healthcare.gov/api/v1";
const SOURCE = "HealthCare.gov Marketplace data";

export class MarketplaceConfigError extends Error {
  constructor() {
    super("CMS_MARKETPLACE_API_KEY is not configured");
    this.name = "MarketplaceConfigError";
  }
}

function apiKey(): string {
  const key = process.env.CMS_MARKETPLACE_API_KEY;
  if (!key) throw new MarketplaceConfigError();
  return key;
}

export type MarketplacePlan = {
  id: string;
  name: string;
  issuerName: string;
  type: string;
  metalLevel: string;
};

async function countyForZip(zip: string): Promise<{ fips: string; state: string } | null> {
  const res = await fetch(
    `${CMS_BASE}/counties/by/zip/${zip}?apikey=${apiKey()}`,
    { signal: AbortSignal.timeout(8000), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`CMS counties lookup responded ${res.status}`);
  const data = await res.json();
  const county = data?.counties?.[0];
  if (!county?.fips) return null;
  return { fips: county.fips, state: county.state };
}

export async function searchMarketplacePlans(
  zip: string,
  year: number
): Promise<MarketplacePlan[]> {
  const county = await countyForZip(zip);
  if (!county) return [];

  const res = await fetch(`${CMS_BASE}/plans/search?apikey=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      place: { countyfips: county.fips, state: county.state, zipcode: zip },
      market: "Individual",
      year,
    }),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CMS plan search responded ${res.status}`);
  const data = await res.json();
  const plans: any[] = data?.plans ?? [];
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    issuerName: p.issuer?.name ?? "",
    type: p.type ?? "",
    metalLevel: p.metal_level ?? "",
  }));
}

export type MarketplaceCoverageResult =
  | {
      status: "covered" | "not_covered" | "unknown";
      accepting?: string;
      addresses?: { address1?: string; city?: string; state?: string; zipcode?: string }[];
    }
  | { status: "unavailable"; reason?: "not_configured" };

export async function checkMarketplaceCoverage(
  npis: string[],
  planId: string,
  year: number
): Promise<Map<string, MarketplaceCoverageResult>> {
  const results = new Map<string, MarketplaceCoverageResult>();
  if (npis.length === 0) return results;

  try {
    const qs = new URLSearchParams({ year: String(year), apikey: apiKey() });
    qs.set("providerids", npis.join(","));
    qs.append("planids", planId);

    const res = await fetch(`${CMS_BASE}/providers/covered?${qs}`, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`CMS provider coverage responded ${res.status}`);
    const data = await res.json();
    const rows: any[] = data?.providers ?? data?.provider_coverage ?? data?.["Provider & Drug Coverage"] ?? [];

    for (const row of rows) {
      const npi = String(row.npi ?? "");
      if (!npi || !npis.includes(npi) || row.plan_id !== planId) continue;
      const coverage = row.coverage;
      const status: "covered" | "not_covered" | "unknown" =
        coverage === "Covered"
          ? "covered"
          : coverage === "NotCovered"
            ? "not_covered"
            : "unknown";
      results.set(npi, {
        status,
        accepting: row.accepting,
        addresses: row.addresses,
      });
    }
    for (const npi of npis) {
      if (!results.has(npi)) results.set(npi, { status: "unknown" });
    }
  } catch (err) {
    if (!(err instanceof MarketplaceConfigError)) {
      console.error("Marketplace coverage service unavailable");
    }
    for (const npi of npis) results.set(npi, { status: "unavailable", ...(err instanceof MarketplaceConfigError ? { reason: "not_configured" as const } : {}) });
  }
  return results;
}

const MARKETPLACE_NOTE_BASE = "Based on CMS Marketplace data, which may lag real-time changes.";

export function marketplaceCoverageDisplay(
  result: MarketplaceCoverageResult,
  plan: { name: string; issuerName: string; year: number }
): CoverageDisplay {
  const checkedAt = new Date().toISOString();
  const base = {
    source: SOURCE,
    checkedAt,
    planName: plan.name,
    issuerName: plan.issuerName,
    planYear: plan.year,
  };

  if (result.status === "unavailable") {
    return { ...base, status: "unavailable", label: result.reason === "not_configured" ? COVERAGE_LABELS.notConfigured : COVERAGE_LABELS.unavailable };
  }

  const address = result.addresses?.[0];
  const providerAddress = address
    ? [address.address1, address.city, address.state, address.zipcode]
        .filter(Boolean)
        .join(", ")
    : undefined;

  if (result.status === "covered") {
    return {
      ...base,
      status: "covered",
      label: COVERAGE_LABELS.marketplaceCovered,
      note: MARKETPLACE_NOTE_BASE,
      accepting: result.accepting,
      providerAddress,
    };
  }
  if (result.status === "not_covered") {
    return {
      ...base,
      status: "not_covered",
      label: COVERAGE_LABELS.marketplaceNotCovered,
      note: MARKETPLACE_NOTE_BASE,
      accepting: result.accepting,
      providerAddress,
    };
  }
  return {
    ...base,
    status: "unknown",
    label: COVERAGE_LABELS.marketplaceUnknown,
    accepting: result.accepting,
    providerAddress,
  };
}
