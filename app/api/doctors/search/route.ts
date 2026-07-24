import { NextRequest, NextResponse } from "next/server";
import { searchNpi, type Doctor } from "@/lib/npi";
import {
  zipToLatLng,
  latLngToZip,
  pinFor,
  milesBetween,
  type LatLng,
} from "@/lib/geo";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const zip = sp.get("zip") ?? "";
  const specialty = sp.get("specialty") ?? "";
  const insurance = sp.get("insurance") ?? "";
  const name = sp.get("name") ?? "";
  const state = sp.get("state") ?? "";
  const latParam = sp.get("lat");
  const lngParam = sp.get("lng");
  const area =
    latParam !== null && lngParam !== null
      ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
      : null;

  if (area && (Number.isNaN(area.lat) || Number.isNaN(area.lng))) {
    return NextResponse.json({ error: "invalid_area" }, { status: 400 });
  }
  if (zip && !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "invalid_zip" }, { status: 400 });
  }
  if (!zip && !name && !area) {
    return NextResponse.json({ error: "missing_query" }, { status: 400 });
  }

  let doctors: Doctor[];
  let center: LatLng | null = null;
  try {
    if (name) {
      const parts = name.trim().split(/\s+/);
      const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      const firstName = parts.length > 1 ? parts[0] : "";
      doctors = await searchNpi({
        lastName: `${lastName}*`,
        ...(firstName ? { firstName: `${firstName}*` } : {}),
        ...(state ? { state } : {}),
      });
    } else if (area) {
      const resolvedZip = await latLngToZip(area.lat, area.lng);
      if (!resolvedZip) {
        return NextResponse.json({ error: "area_unresolved" }, { status: 502 });
      }
      center = area;
      doctors = await searchNpi({
        zip: resolvedZip,
        ...(specialty ? { specialty } : {}),
      });
    } else {
      [doctors, center] = await Promise.all([
        searchNpi({ zip, ...(specialty ? { specialty } : {}) }),
        zipToLatLng(zip),
      ]);
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

  doctors.sort((a, b) => {
    if (insurance) {
      const am = a.plans.includes(insurance) ? 0 : 1;
      const bm = b.plans.includes(insurance) ? 0 : 1;
      if (am !== bm) return am - bm;
    }
    return (a.distanceMi ?? 99) - (b.distanceMi ?? 99);
  });

  return NextResponse.json({ center, doctors });
}
