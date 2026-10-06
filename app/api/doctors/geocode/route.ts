import { NextRequest, NextResponse } from "next/server";
import { addressToLatLng, milesBetween, type LatLng } from "@/lib/geo";
import { rateLimitResponse } from "@/lib/rateLimit";

type GeocodeInput = {
  npi?: unknown;
  address1?: unknown;
  city?: unknown;
  state?: unknown;
  zip?: unknown;
};

const MAX_GEOCODE_RESULTS = 3;

function clean(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function fullAddress(input: GeocodeInput) {
  const address1 = clean(input.address1);
  const city = clean(input.city, 80);
  const state = clean(input.state, 2);
  const zip = clean(input.zip, 10);
  if (!address1 || !city || !state) return "";
  return [address1, city, state, zip].filter(Boolean).join(", ");
}

export async function POST(req: NextRequest) {
  const limited = await rateLimitResponse(req, "geocode");
  if (limited) return limited;

  let body: { center?: LatLng; doctors?: GeocodeInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  const center =
    Number.isFinite(body.center?.lat) && Number.isFinite(body.center?.lng) && Math.abs(body.center!.lat) <= 90 && Math.abs(body.center!.lng) <= 180
      ? body.center
      : null;
  const doctors = Array.isArray(body.doctors)
    ? body.doctors.filter(d => d && typeof d === "object").slice(0, MAX_GEOCODE_RESULTS)
    : [];

  const results = await Promise.all(
    doctors.map(async (doctor) => {
      const npi = clean(doctor.npi, 20);
      const address = fullAddress(doctor);
      if (!/^\d{10}$/.test(npi) || !address) return null;

      const coords = await addressToLatLng(address);
      if (!coords) return null;

      return {
        npi,
        lat: coords.lat,
        lng: coords.lng,
        distanceMi: center ? milesBetween(center, coords) : null,
        locationPrecision: "address" as const,
        locationSource: "census" as const,
      };
    })
  );

  return NextResponse.json({ results: results.filter(Boolean) });
}
