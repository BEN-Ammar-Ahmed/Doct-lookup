import { NextRequest, NextResponse } from "next/server";
import { storedSearch, storedCoordinates, storedZip } from "@/lib/providerStore";
import { searchNpi, type Doctor } from "@/lib/npi";
import {
  zipToLatLng,
  latLngToZip,
  type LatLng,
} from "@/lib/geo";
import { computeCoverage, type InsuranceQuery } from "@/lib/insuranceCheck";
import type { CoverageDisplay } from "@/lib/coverage";
import { isValidZip, isValidPlanId, isValidPlanYear } from "@/lib/validation";
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

export async function GET(req: NextRequest) {
  const limited = await rateLimitResponse(req, "search");
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const zip = sp.get("zip") ?? "";
  const specialty = sp.get("specialty") ?? "";
  const name = sp.get("name") ?? "";
  const state = sp.get("state") ?? "";
  const skip = Math.max(0, parseInt(sp.get("skip") ?? "0", 10) || 0);
  const latParam = sp.get("lat");
  const lngParam = sp.get("lng");
  const area =
    latParam !== null && lngParam !== null
      ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
      : null;

  if (name.length > 100 || specialty.length > 100 || (state && !/^[A-Z]{2}$/.test(state)) || skip > 1000) return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  const insuranceQuery = parseInsuranceQuery(sp);
  if ("error" in insuranceQuery) {
    return NextResponse.json({ error: insuranceQuery.error }, { status: 400 });
  }

  if (area && (!Number.isFinite(area.lat) || !Number.isFinite(area.lng) || Math.abs(area.lat) > 90 || Math.abs(area.lng) > 180)) {
    return NextResponse.json({ error: "invalid_area" }, { status: 400 });
  }
  if (zip && !isValidZip(zip)) {
    return NextResponse.json({ error: "invalid_zip" }, { status: 400 });
  }
  if (!zip && !name && !area) {
    return NextResponse.json({ error: "missing_query" }, { status: 400 });
  }

  let doctors: Doctor[];
  let hasMore = false;
  let center: LatLng | null = null;
  try {
    if (name) {
      const parts = name.trim().split(/\s+/);
      const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      const firstName = parts.length > 1 ? parts[0] : "";
      const stored = await storedSearch({ name: name.trim(), state, skip });
      ({ doctors, hasMore } = stored ?? await searchNpi({
        lastName: `${lastName}*`,
        ...(firstName ? { firstName: `${firstName}*` } : {}),
        ...(state ? { state } : {}),
        skip,
      }));
    } else if (area) {
      const resolvedZip = await latLngToZip(area.lat, area.lng);
      if (!resolvedZip) {
        return NextResponse.json({ error: "area_unresolved" }, { status: 502 });
      }
      center = area;
      const stored = await storedSearch({ zip: resolvedZip, specialty, skip });
      ({ doctors, hasMore } = stored ?? await searchNpi({
        zip: resolvedZip,
        ...(specialty ? { specialty } : {}),
        skip,
      }));
    } else {
      const [searchResult, geo] = await Promise.all([
        storedSearch({ zip, specialty, skip }).then(stored => stored ?? searchNpi({ zip, ...(specialty ? { specialty } : {}), skip })),
        storedZip(zip).then(point => point ?? zipToLatLng(zip)),
      ]);
      doctors = searchResult.doctors;
      hasMore = searchResult.hasMore;
      center = geo;
    }
  } catch {
    return NextResponse.json({ error: "npi_unavailable" }, { status: 502 });
  }

  try { doctors = await storedCoordinates(doctors, center); } catch { /* Provider list stays usable if only location storage fails. */ }

  const coverage = await computeCoverage(
    doctors.map((d) => d.npi),
    insuranceQuery
  );

  const withCoverage: (Doctor & { coverage?: CoverageDisplay })[] = doctors.map((d) => ({
    ...d,
    coverage: coverage.get(d.npi),
  }));

  const rank = (c?: CoverageDisplay) =>
    c?.status === "covered" ? 0 : c?.status === "not_covered" ? 2 : 1;
  withCoverage.sort((a, b) => {
    const r = rank(a.coverage) - rank(b.coverage);
    if (r !== 0) return r;
    return (a.distanceMi ?? 99) - (b.distanceMi ?? 99);
  });

  return NextResponse.json({ center, doctors: withCoverage, hasMore, skip, nextSkip: skip + 50 });
}
