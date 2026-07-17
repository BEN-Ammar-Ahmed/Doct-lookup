import { describe, it, expect } from "vitest";
import { plansFor } from "./insurance";
import { INSURERS } from "./insurers";

describe("plansFor", () => {
  it("is deterministic", () => {
    expect(plansFor("1487654321")).toEqual(plansFor("1487654321"));
    expect(plansFor("1942579198")).toEqual(plansFor("1942579198"));
  });

  it("returns 3-6 valid insurer ids with no duplicates", () => {
    const ids = INSURERS.map((i) => i.id);
    for (const npi of [
      "1000000001",
      "1234567893",
      "1487654321",
      "1942579198",
      "1999999999",
    ]) {
      const plans = plansFor(npi);
      expect(plans.length).toBeGreaterThanOrEqual(3);
      expect(plans.length).toBeLessThanOrEqual(6);
      expect(new Set(plans).size).toBe(plans.length);
      for (const p of plans) expect(ids).toContain(p);
    }
  });

  it("varies across doctors", () => {
    const a = plansFor("1000000001").join(",");
    const b = plansFor("1222222222").join(",");
    const c = plansFor("1333333333").join(",");
    expect(a === b && b === c).toBe(false);
  });
});
