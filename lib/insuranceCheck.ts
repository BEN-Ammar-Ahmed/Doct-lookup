import type { CoverageDisplay } from "./coverage";
import { unsupportedCoverage } from "./coverage";
import { checkMedicareAssignment, medicareCoverageDisplay } from "./medicare";
import {
  checkMarketplaceCoverage,
  marketplaceCoverageDisplay,
  MarketplaceConfigError,
} from "./marketplace";

export type InsuranceQuery =
  | {
      category: "marketplace";
      planId: string;
      planName: string;
      issuerName: string;
      planYear: number;
    }
  | { category: "medicare" }
  | { category: "other"; insurerName?: string }
  | { category: "none" };

// Runs the right real (or honestly-unverified) check for a batch of NPIs
// and returns one CoverageDisplay per doctor. Shared by the search route
// (many doctors) and the detail route (one doctor) so the two screens can
// never show different logic for the same category.
export async function computeCoverage(
  npis: string[],
  query: InsuranceQuery
): Promise<Map<string, CoverageDisplay>> {
  const out = new Map<string, CoverageDisplay>();
  if (npis.length === 0 || query.category === "none") return out;

  if (query.category === "medicare") {
    const results = await checkMedicareAssignment(npis);
    for (const npi of npis) {
      out.set(npi, medicareCoverageDisplay(results.get(npi) ?? { status: "unavailable" }));
    }
    return out;
  }

  if (query.category === "marketplace") {
    try {
      const results = await checkMarketplaceCoverage(npis, query.planId, query.planYear);
      for (const npi of npis) {
        out.set(
          npi,
          marketplaceCoverageDisplay(results.get(npi) ?? { status: "unavailable" }, {
            name: query.planName,
            issuerName: query.issuerName,
            year: query.planYear,
          })
        );
      }
    } catch (err) {
      const label =
        err instanceof MarketplaceConfigError
          ? "Insurance verification isn't configured on this site yet"
          : "Verification temporarily unavailable";
      for (const npi of npis) {
        out.set(npi, {
          status: "unavailable",
          label,
          source: "CMS Marketplace API",
          checkedAt: new Date().toISOString(),
        });
      }
    }
    return out;
  }

  // "other" — no free verified source exists for these carriers.
  for (const npi of npis) out.set(npi, unsupportedCoverage(query.insurerName));
  return out;
}
