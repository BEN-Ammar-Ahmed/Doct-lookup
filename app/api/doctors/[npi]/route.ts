import { NextRequest, NextResponse } from "next/server";
import { storedProvider, storedCoordinates } from "@/lib/providerStore";
import { fetchNpiByNumber, type Doctor } from "@/lib/npi";
import { geocodeProviderLocations } from "@/lib/providerLocations";
import { computeCoverage, type InsuranceQuery } from "@/lib/insuranceCheck";
import type { CoverageDisplay } from "@/lib/coverage";
import { isValidNpi, isValidPlanId, isValidPlanYear } from "@/lib/validation";
import { rateLimitResponse } from "@/lib/rateLimit";

function parseInsuranceQuery(sp: URLSearchParams): InsuranceQuery | { error: string } {
  const category = sp.get("category") ?? "none";
  if (category === "medicare") return { category: "medicare" };
  if (category === "marketplace") {
    const planId = sp.get("planId") ?? "";
    const planYear = parseInt(sp.get("planYear") ?? "", 10);
    if (!isValidPlanId(planId)) return { error: "invalid_plan" };
    if (!isValidPlanYear(planYear)) return { error: "invalid_year" };
    return {
      category: "marketplace",
      planId,
      planName: sp.get("planName") ?? "Selected plan",
      issuerName: sp.get("issuerName") ?? "",
      planYear,
    };
  }
  if (category === "other") {
    return { category: "other", insurerName: sp.get("insurerName") || undefined };
  }
  return { category: "none" };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ npi: string }> }
) {
  const limited = await rateLimitResponse(req, "detail");
  if (limited) return limited;

  const { npi } = await params;
  if (!isValidNpi(npi)) {
    return NextResponse.json({ error: "invalid_npi" }, { status: 400 });
  }

  const insuranceQuery = parseInsuranceQuery(req.nextUrl.searchParams);
  if ("error" in insuranceQuery) {
    return NextResponse.json({ error: insuranceQuery.error }, { status: 400 });
  }

  try {
    const stored = await storedProvider(npi);
    let doctor = stored === undefined ? await fetchNpiByNumber(npi) : stored;
    if (!doctor) {
      return NextResponse.json({ doctor: null }, { status: 404 });
    }
    [doctor] = process.env.DATABASE_URL ? await storedCoordinates([doctor], null) : await geocodeProviderLocations([doctor], null, 1);
    const coverage = await computeCoverage([doctor.npi], insuranceQuery);
    const result: Doctor & { coverage?: CoverageDisplay } = {
      ...doctor,
      coverage: coverage.get(doctor.npi),
    };
    return NextResponse.json({ doctor: result });
  } catch {
    return NextResponse.json({ error: "npi_unavailable" }, { status: 502 });
  }
}
