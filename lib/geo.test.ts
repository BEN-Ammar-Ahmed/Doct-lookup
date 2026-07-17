import { describe, it, expect } from "vitest";
import { pinFor, milesBetween } from "./geo";

describe("pinFor", () => {
  const center = { lat: 41.9227, lng: -87.6533 };

  it("is deterministic", () => {
    expect(pinFor("1942579198", center)).toEqual(pinFor("1942579198", center));
  });

  it("stays within ~0.01 degrees of center", () => {
    for (const npi of ["1000000001", "1487654321", "1942579198"]) {
      const pin = pinFor(npi, center);
      expect(Math.abs(pin.lat - center.lat)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(pin.lng - center.lng)).toBeLessThanOrEqual(0.01);
    }
  });

  it("spreads different doctors to different pins", () => {
    const a = pinFor("1000000001", center);
    const b = pinFor("1222222222", center);
    expect(a).not.toEqual(b);
  });
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
