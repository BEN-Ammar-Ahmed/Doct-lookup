import { afterEach, describe, expect, it, vi } from "vitest";
import { addressToLatLng, milesBetween } from "./geo";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("milesBetween", () => {
  it("returns 0 for identical points", () => {
    const p = { lat: 41.9, lng: -87.65 };
    expect(milesBetween(p, p)).toBe(0);
  });

  it("computes NYC to LA within tolerance", () => {
    const nyc = { lat: 40.7128, lng: -74.006 };
    const la = { lat: 34.0522, lng: -118.2437 };
    const d = milesBetween(nyc, la);
    expect(d).toBeGreaterThan(2395);
    expect(d).toBeLessThan(2495);
  });
});

describe("addressToLatLng", () => {
  it("uses Census geocoder coordinates for US addresses", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => ({
      ok: true,
      json: async () => ({
        result: {
          addressMatches: [
            {
              coordinates: { x: -87.62451, y: 41.8803 },
            },
          ],
        },
      }),
    } as Response));
    vi.stubGlobal("fetch", fetchMock);

    const coords = await addressToLatLng("122 S Michigan Ave, Chicago, IL 60603 test A");

    expect(coords).toEqual({ lat: 41.8803, lng: -87.62451 });
    expect(String(fetchMock.mock.calls[0][0])).toContain("geocoding.geo.census.gov");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not bulk-geocode against public Nominatim when Census does not match", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { addressMatches: [] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: "41.881", lon: "-87.623" }],
      });
    vi.stubGlobal("fetch", fetchMock);

    const coords = await addressToLatLng("8 S Michigan Ave, Chicago, IL 60603 test B");

    expect(coords).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
