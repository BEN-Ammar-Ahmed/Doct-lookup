import { fnv1a } from "./insurance";

export type LatLng = { lat: number; lng: number };

const zipCache = new Map<string, LatLng | null>();

export async function zipToLatLng(zip: string): Promise<LatLng | null> {
  if (zipCache.has(zip)) return zipCache.get(zip)!;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) {
      zipCache.set(zip, null);
      return null;
    }
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) {
      zipCache.set(zip, null);
      return null;
    }
    const coords = {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
    };
    zipCache.set(zip, coords);
    return coords;
  } catch {
    zipCache.set(zip, null);
    return null;
  }
}

// Pins are approximate: ZIP centroid plus a stable per-doctor offset so
// markers don't stack on one point.
export function pinFor(npi: string, center: LatLng): LatLng {
  const dx = ((fnv1a(npi + "x") % 2000) - 1000) / 1000;
  const dy = ((fnv1a(npi + "y") % 2000) - 1000) / 1000;
  return {
    lat: center.lat + dy * 0.008,
    lng: center.lng + dx * 0.008,
  };
}

export function milesBetween(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(s)) * 10) / 10;
}
