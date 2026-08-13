export type LatLng = { lat: number; lng: number };

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

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

const reverseZipCache = new Map<string, string | null>();

// The NPI registry only filters by postal_code, so "search this area" (an
// arbitrary map center) needs to resolve back to a ZIP first.
export async function latLngToZip(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (reverseZipCache.has(key)) return reverseZipCache.get(key)!;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
        headers: { "User-Agent": "doct-lookup-demo (educational project)" },
      }
    );
    if (!res.ok) {
      reverseZipCache.set(key, null);
      return null;
    }
    const data = await res.json();
    const postcode: string | undefined = data.address?.postcode;
    const zip = postcode ? postcode.slice(0, 5) : null;
    reverseZipCache.set(key, zip);
    return zip;
  } catch {
    reverseZipCache.set(key, null);
    return null;
  }
}

const addressCache = new Map<string, LatLng | null>();

// Real forward-geocode for a single street address — used only on the
// doctor detail page (one address, one request). Search results still use
// the ZIP-centroid-plus-offset approximation below: geocoding up to 50 real
// addresses per search would exceed Nominatim's free-tier ~1 req/sec limit.
export async function addressToLatLng(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase();
  if (!key) return null;
  if (addressCache.has(key)) return addressCache.get(key)!;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`,
      {
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
        headers: { "User-Agent": "doct-lookup-demo (educational project)" },
      }
    );
    if (!res.ok) {
      addressCache.set(key, null);
      return null;
    }
    const data = await res.json();
    const hit = data?.[0];
    if (!hit) {
      addressCache.set(key, null);
      return null;
    }
    const coords = { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
    addressCache.set(key, coords);
    return coords;
  } catch {
    addressCache.set(key, null);
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
