import { NextRequest, NextResponse } from "next/server";
import { searchNpi, type Doctor } from "@/lib/npi";
import {
  zipToLatLng,
  latLngToZip,
  pinFor,
  milesBetween,
  type LatLng,
} from "@/lib/geo";
import { computeCoverage, type InsuranceQuery } from "@/lib/insuranceCheck";
import type { CoverageDisplay } from "@/lib/coverage";
import { isValidZip, isValidPlanId, isValidPlanYear } from "@/lib/validation";
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

export async function GET(req: NextRequest) {
  if (isRateLimited(`search:${clientKey(req)}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

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

  const insuranceQuery = parseInsuranceQuery(sp);
  if ("error" in insuranceQuery) {
    return NextResponse.json({ error: insuranceQuery.error }, { status: 400 });
  }

  if (area && (Number.isNaN(area.lat) || Number.isNaN(area.lng))) {
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
      ({ doctors, hasMore } = await searchNpi({
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
      ({ doctors, hasMore } = await searchNpi({
        zip: resolvedZip,
        ...(specialty ? { specialty } : {}),
        skip,
      }));
    } else {
      const [searchResult, geo] = await Promise.all([
        searchNpi({ zip, ...(specialty ? { specialty } : {}), skip }),
        zipToLatLng(zip),
      ]);
      doctors = searchResult.doctors;
      hasMore = searchResult.hasMore;
      center = geo;
    }
  } catch {
    return NextResponse.json({ error: "npi_unavailable" }, { status: 502 });
  }

  if (center) {
    const c = center;
    doctors = doctors.map((d) => {
      const pin = pinFor(d.npi, c);
      return { ...d, ...pin, distanceMi: milesBetween(c, pin) };
    });
  }

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

  return NextResponse.json({ center, doctors: withCoverage, hasMore, skip });
}
