import { addressToLatLng, milesBetween, type LatLng } from "./geo";
import type { Doctor } from "./npi";

export const MAX_SERVER_PROVIDER_GEOCODES = 24;

export function providerFullAddress(
  doctor: Pick<Doctor, "address1" | "city" | "state" | "zip">
): string {
  const cityStateZip = [doctor.city, [doctor.state, doctor.zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [doctor.address1, cityStateZip]
    .filter(Boolean)
    .join(", ");
}

export async function geocodeProviderLocations<T extends Doctor>(
  doctors: T[],
  center: LatLng | null,
  limit = MAX_SERVER_PROVIDER_GEOCODES
): Promise<T[]> {
  const capped = doctors.slice(0, limit);
  const geocoded = await Promise.all(
    capped.map(async (doctor) => {
      if (doctor.addressKind === "mailing" || !doctor.address1) return doctor;
      const coords = await addressToLatLng(providerFullAddress(doctor));
      if (!coords) return doctor;

      return {
        ...doctor,
        lat: coords.lat,
        lng: coords.lng,
        distanceMi: center ? milesBetween(center, coords) : null,
        locationApproximate: false,
      };
    })
  );

  return doctors.map((doctor, index) => geocoded[index] ?? doctor);
}
