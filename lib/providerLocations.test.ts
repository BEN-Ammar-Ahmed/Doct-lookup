import { afterEach, describe, expect, it, vi } from "vitest";
import type { Doctor } from "./npi";
import { geocodeProviderLocations, providerFullAddress } from "./providerLocations";

afterEach(() => {
  vi.restoreAllMocks();
});

function doctor(overrides: Partial<Doctor> = {}): Doctor {
  return {
    npi: "1770664856",
    name: "Gary Bucher, MD",
    specialty: "Family Medicine",
    address1: "2551 N Clark St",
    city: "Chicago",
    state: "IL",
    zip: "60614",
    phone: "312-555-0100",
    lat: null,
    lng: null,
    distanceMi: null,
    locationApproximate: true,
    ...overrides,
  };
}

describe("providerFullAddress", () => {
  it("uses the real practice address fields from the provider record", () => {
    expect(providerFullAddress(doctor())).toBe("2551 N Clark St, Chicago, IL 60614");
  });
});

describe("geocodeProviderLocations", () => {
  it("uses geocoded office coordinates instead of synthetic fallback pins", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          result: {
            addressMatches: [
              {
                coordinates: { x: -87.64221, y: 41.92847 },
              },
            ],
          },
        }),
      }))
    );

    const [result] = await geocodeProviderLocations(
      [doctor()],
      { lat: 41.9227, lng: -87.6533 }
    );

    expect(result.lat).toBe(41.92847);
    expect(result.lng).toBe(-87.64221);
    expect(result.locationApproximate).toBe(false);
    expect(result.distanceMi).toBeGreaterThan(0);
  });

  it("leaves map coordinates empty when no geocoder match exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ result: { addressMatches: [] } }),
      }))
    );

    const [result] = await geocodeProviderLocations(
      [doctor({ npi: "1487031407", address1: "999 No Match Ave" })],
      { lat: 41.9227, lng: -87.6533 }
    );

    expect(result.lat).toBeNull();
    expect(result.lng).toBeNull();
    expect(result.distanceMi).toBeNull();
    expect(result.locationApproximate).toBe(true);
  });
});
