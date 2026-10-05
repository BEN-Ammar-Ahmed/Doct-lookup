import { describe, it, expect } from "vitest";
import { buildSearchParams, type ResultsQuery } from "./searchParams";

describe("buildSearchParams", () => {
  const baseQuery: ResultsQuery = {
    zip: "60614",
    specialty: "Cardiology",
    category: "marketplace",
    planId: "PLAN123",
    planName: "Test Plan",
    issuerName: "Test Issuer",
    planYear: "2026",
  };

  it("carries every active filter into a paginated request", () => {
    const first = buildSearchParams(baseQuery);
    const nextPage = buildSearchParams(baseQuery, { skip: 50 });

    for (const key of ["zip", "specialty", "category", "planId", "planName", "issuerName", "planYear"]) {
      expect(nextPage.get(key)).toBe(first.get(key));
    }
    expect(first.get("skip")).toBeNull();
    expect(nextPage.get("skip")).toBe("50");
  });

  it("omits category params entirely when category is none", () => {
    const q = buildSearchParams({ zip: "60614", category: "none" });
    expect(q.get("category")).toBeNull();
    expect(q.get("planId")).toBeNull();
  });

  it("uses lat/lng instead of zip when an area override is set, on every page", () => {
    const override = { lat: 40.7, lng: -73.9 };
    const first = buildSearchParams(baseQuery, { override });
    const nextPage = buildSearchParams(baseQuery, { skip: 50, override });

    expect(first.get("zip")).toBeNull();
    expect(first.get("lat")).toBe("40.7");
    expect(nextPage.get("lat")).toBe(first.get("lat"));
    expect(nextPage.get("skip")).toBe("50");
  });

  it("preserves lat/lng from a location-based results URL", () => {
    const q = buildSearchParams({
      zip: "60614",
      lat: "41.91",
      lng: "-87.65",
      specialty: "Dermatology",
      category: "none",
    });

    expect(q.get("zip")).toBeNull();
    expect(q.get("lat")).toBe("41.91");
    expect(q.get("lng")).toBe("-87.65");
    expect(q.get("specialty")).toBe("Dermatology");
  });
});
