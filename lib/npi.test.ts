import { describe, it, expect } from "vitest";
import { normalizeNpiResult } from "./npi";
import { plansFor } from "./insurance";
import sample from "./fixtures/npi-sample.json";

describe("normalizeNpiResult", () => {
  it("normalizes a real NPI-1 record", () => {
    const doc = normalizeNpiResult(sample);
    expect(doc).not.toBeNull();
    expect(doc!.npi).toBe("1942579198");
    expect(doc!.name).toBe("David Aarthun, RPh");
    expect(doc!.specialty).toBe("Pharmacist");
    expect(doc!.address1).toBe("1601 N Wells St");
    expect(doc!.city).toBe("Chicago");
    expect(doc!.state).toBe("IL");
    expect(doc!.zip).toBe("60614");
    expect(doc!.phone).toBe("312-649-1136");
    expect(doc!.plans).toEqual(plansFor("1942579198"));
  });

  it("returns null for organization records", () => {
    expect(normalizeNpiResult({ ...sample, enumeration_type: "NPI-2" })).toBeNull();
    expect(
      normalizeNpiResult({ ...sample, basic: { last_name: "ONLY" } })
    ).toBeNull();
  });

  it("falls back to mailing address when no location address exists", () => {
    const doc = normalizeNpiResult({
      ...sample,
      addresses: [sample.addresses[0]],
    });
    expect(doc).not.toBeNull();
    expect(doc!.city).toBe("Chicago");
  });
});
