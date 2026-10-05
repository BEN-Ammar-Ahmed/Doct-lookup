export type LatLng = { lat: number; lng: number };
type Entry<T> = { value: T; expires: number };
const zipCache = new Map<string, Entry<LatLng>>();
const reverseCache = new Map<string, Entry<string>>();
const addressCache = new Map<string, Entry<LatLng>>();
const DAY = 86400000;
function cached<T>(cache: Map<string, Entry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry || entry.expires < Date.now()) { cache.delete(key); return null; }
  return entry.value;
}
function remember<T>(cache: Map<string, Entry<T>>, key: string, value: T): T {
  if (cache.size >= 5000) cache.delete(cache.keys().next().value!);
  cache.set(key, { value, expires: Date.now() + DAY });
  return value;
}
function validCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
export async function zipToLatLng(zip: string): Promise<LatLng | null> {
  const hit = cached(zipCache, zip); if (hit) return hit;
  try {
    const res = await fetch("https://api.zippopotam.us/us/" + zip, { signal: AbortSignal.timeout(6000), next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const place = (await res.json()).places?.[0];
    const lat = Number(place?.latitude), lng = Number(place?.longitude);
    if (!validCoords(lat, lng)) return null;
    return remember(zipCache, zip, { lat, lng });
  } catch { return null; }
}
export async function latLngToZip(lat: number, lng: number): Promise<string | null> {
  if (!validCoords(lat, lng)) return null;
  const key = lat.toFixed(3) + "," + lng.toFixed(3);
  const hit = cached(reverseCache, key); if (hit) return hit;
  try {
    const res = await fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + lat + "&lon=" + lng + "&zoom=16&addressdetails=1", { signal: AbortSignal.timeout(6000), next: { revalidate: 86400 }, headers: { "User-Agent": "DoctLookup/0.1 (provider search)" } });
    if (!res.ok) return null;
    const zip = String((await res.json()).address?.postcode ?? "").slice(0, 5);
    if (!/^\d{5}$/.test(zip)) return null;
    return remember(reverseCache, key, zip);
  } catch { return null; }
}
export async function addressToLatLng(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase(); if (!key) return null;
  const hit = cached(addressCache, key); if (hit) return hit;
  try {
    const qs = new URLSearchParams({ address, benchmark: "Public_AR_Current", format: "json" });
    const res = await fetch("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?" + qs, { signal: AbortSignal.timeout(7000), next: { revalidate: 2592000 } });
    if (!res.ok) return null;
    const match = (await res.json()).result?.addressMatches?.[0];
    const lat = match?.coordinates?.y, lng = match?.coordinates?.x;
    if (typeof lat !== "number" || typeof lng !== "number" || !validCoords(lat, lng)) return null;
    return remember(addressCache, key, { lat, lng });
  } catch { return null; }
}
export function milesBetween(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(3958.8 * 2 * Math.asin(Math.sqrt(s)) * 10) / 10;
}
