import type { CoverageDisplay } from "./coverage";

// Real data: CMS's public "Doctors and Clinicians" dataset (Care Compare),
// which lists every clinician currently enrolled in Original Medicare and
// whether they accept the Medicare-approved amount as payment in full.
// Confirmed live against the API on 2026-07-25 — dataset id mj5m-pzi6,
// field `npi`, field `ind_assgn` with real values "Y" and "M" (256k+ "M"
// records exist live, confirming it's a genuine, common value, not a rare
// edge case). Any unrecognized value falls back to "no record" rather than
// being treated as a positive match.
const CMS_DATASET_ID = "mj5m-pzi6";
const CMS_QUERY_BASE = `https://data.cms.gov/provider-data/api/1/datastore/query/${CMS_DATASET_ID}/0`;

export type MedicareResult =
  | { status: "assigned" }
  | { status: "maybe" }
  | { status: "no_record" }
  | { status: "unavailable" };

const cache = new Map<string, MedicareResult>();

export async function checkMedicareAssignment(
  npis: string[]
): Promise<Map<string, MedicareResult>> {
  const unique = [...new Set(npis)];
  const results = new Map<string, MedicareResult>();
  const toFetch: string[] = [];
  for (const npi of unique) {
    const cached = cache.get(npi);
    if (cached) results.set(npi, cached);
    else toFetch.push(npi);
  }
  if (toFetch.length === 0) return results;

  try {
    const qs = new URLSearchParams({
      "conditions[0][property]": "npi",
      "conditions[0][operator]": "IN",
      "properties[0]": "npi",
      "properties[1]": "ind_assgn",
      limit: String(toFetch.length * 4),
    });
    toFetch.forEach((npi, i) => qs.append(`conditions[0][value][${i}]`, npi));

    const res = await fetch(`${CMS_QUERY_BASE}?${qs}`, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
      headers: { "User-Agent": "doct-lookup-demo (educational project)" },
    });
    if (!res.ok) throw new Error(`CMS Doctors & Clinicians API responded ${res.status}`);
    const data = await res.json();
    const rows: { npi: string; ind_assgn: string }[] = data.results ?? [];

    const bestValue = new Map<string, string>();
    for (const row of rows) {
      const current = bestValue.get(row.npi);
      if (row.ind_assgn === "Y") bestValue.set(row.npi, "Y");
      else if (row.ind_assgn === "M" && current !== "Y") bestValue.set(row.npi, "M");
      else if (!current) bestValue.set(row.npi, row.ind_assgn ?? "");
    }

    for (const npi of toFetch) {
      const value = bestValue.get(npi);
      const result: MedicareResult =
        value === "Y"
          ? { status: "assigned" }
          : value === "M"
            ? { status: "maybe" }
            : { status: "no_record" };
      cache.set(npi, result);
      results.set(npi, result);
    }
  } catch (err) {
    console.error("Medicare assignment check failed:", err);
    // Don't cache failures — a later retry should get a fresh chance.
    for (const npi of toFetch) results.set(npi, { status: "unavailable" });
  }
  return results;
}

const MEDICARE_ADVANTAGE_NOTE =
  "This result applies to Original Medicare assignment. It does not confirm participation in a Medicare Advantage plan.";
const SOURCE = "CMS Doctors & Clinicians dataset";

export function medicareCoverageDisplay(result: MedicareResult): CoverageDisplay {
  const checkedAt = new Date().toISOString();
  switch (result.status) {
    case "assigned":
      return {
        status: "covered",
        label: "Accepts the Medicare-approved amount as payment in full",
        source: SOURCE,
        checkedAt,
        note: MEDICARE_ADVANTAGE_NOTE,
      };
    case "maybe":
      return {
        status: "unknown",
        label: "May accept Medicare assignment — verify before the visit",
        source: SOURCE,
        checkedAt,
        note: MEDICARE_ADVANTAGE_NOTE,
      };
    case "no_record":
      return {
        status: "unknown",
        label: "Unable to verify Original Medicare assignment",
        source: SOURCE,
        checkedAt,
        note: MEDICARE_ADVANTAGE_NOTE,
      };
    case "unavailable":
      return {
        status: "unavailable",
        label: "Verification temporarily unavailable",
        source: SOURCE,
        checkedAt,
      };
  }
}
