import type { Doctor } from "./npi";

export type MapDestination = Pick<Doctor, "address1" | "city" | "state" | "zip" | "lat" | "lng">;

export function providerAddress(destination: MapDestination): string {
  const cityLine = [destination.city, [destination.state, destination.zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [destination.address1, cityLine].filter(Boolean).join(", ");
}

function destinationValue(destination: MapDestination): string {
  const address = providerAddress(destination);
  if (address) return address;
  if (destination.lat !== null && destination.lng !== null) return `${destination.lat},${destination.lng}`;
  return "";
}

export function googleDirectionsUrl(destination: MapDestination): string {
  const value = destinationValue(destination);
  return value
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(value)}`
    : "https://www.google.com/maps";
}

export function appleDirectionsUrl(destination: MapDestination): string {
  const value = destinationValue(destination);
  return value
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(value)}&dirflg=d`
    : "https://maps.apple.com/";
}

export function locationPrecisionLabel(doctor: Pick<Doctor, "addressKind" | "lat" | "lng" | "locationPrecision">): string {
  if (doctor.addressKind === "mailing") return "Mailing address only";
  if (doctor.lat === null || doctor.lng === null) return "Practice address on file · map pin unavailable";
  if (doctor.locationPrecision === "zip") return "Approximate ZIP-area pin";
  if (doctor.locationPrecision === "address") return "Address-level map match";
  return "Practice address on file";
}

export function uniquePracticeLocations(doctor: Pick<Doctor, "address1" | "city" | "state" | "zip" | "phone" | "practiceLocations">) {
  const locations = [
    { address1: doctor.address1, city: doctor.city, state: doctor.state, zip: doctor.zip, phone: doctor.phone },
    ...(doctor.practiceLocations ?? []),
  ];
  const seen = new Set<string>();
  return locations.filter((location) => {
    const key = [location.address1, location.city, location.state, location.zip]
      .map(value => (value ?? "").trim().toLowerCase())
      .join("|");
    if (!location.address1 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
