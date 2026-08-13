import { NextRequest, NextResponse } from "next/server";
import { fetchNpiByNumber, type Doctor } from "@/lib/npi";
import { zipToLatLng, pinFor, addressToLatLng } from "@/lib/geo";
import { computeCoverage, type InsuranceQuery } from "@/lib/insuranceCheck";
import type { CoverageDisplay } from "@/lib/coverage";
import { isValidNpi, isValidPlanId, isValidPlanYear } from "@/lib/validation";
import { isRateLimited, clientKey } from "@/lib/rateLimit";

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
  if (isRateLimited(`detail:${clientKey(req)}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { npi } = await params;
  if (!isValidNpi(npi)) {
    return NextResponse.json({ error: "invalid_npi" }, { status: 400 });
  }

  const insuranceQuery = parseInsuranceQuery(req.nextUrl.searchParams);
  if ("error" in insuranceQuery) {
    return NextResponse.json({ error: insuranceQuery.error }, { status: 400 });
  }

  try {
    const doctor = await fetchNpiByNumber(npi);
    if (!doctor) {
      return NextResponse.json({ doctor: null }, { status: 404 });
    }
    const fullAddress = [doctor.address1, doctor.city, doctor.state, doctor.zip]
      .filter(Boolean)
      .join(", ");
    const exact = fullAddress ? await addressToLatLng(fullAddress) : null;
    if (exact) {
      doctor.lat = exact.lat;
      doctor.lng = exact.lng;
      doctor.locationApproximate = false;
    } else {
      const center = await zipToLatLng(doctor.zip);
      if (center) {
        const pin = pinFor(doctor.npi, center);
        doctor.lat = pin.lat;
        doctor.lng = pin.lng;
      }
    }
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
