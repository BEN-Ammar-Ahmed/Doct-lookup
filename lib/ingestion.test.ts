import { describe, expect, it } from "vitest";
import { nppesCsvProvider, bestAssignment } from "./ingestion";
describe("official file adapters", () => {
  it("skips organizations and deactivated individuals", () => {
    expect(nppesCsvProvider({ "Entity Type Code": "2" }, new Map())).toBeNull();
    expect(nppesCsvProvider({ "Entity Type Code": "1", "NPI Deactivation Date": "2026-01-01" }, new Map())).toBeNull();
  });
  it("uses official taxonomy labels and practice addresses without coverage claims", () => {
    const row = { NPI: "1770664856", "Entity Type Code": "1", "Provider First Name": "FIXTURE", "Provider Last Name (Legal Name)": "PROVIDER", "Provider First Line Business Practice Location Address": "100 TEST STREET", "Provider Business Practice Location Address City Name": "CHICAGO", "Provider Business Practice Location Address State Name": "IL", "Healthcare Provider Taxonomy Code_1": "207Q00000X" };
    const provider = nppesCsvProvider(row, new Map([["207Q00000X", "Family Medicine"]]));
    expect(provider?.specialty).toBe("Family Medicine");
    expect(provider?.address1).toBe("100 Test Street");
    expect(provider?.lat).toBeNull();
    expect(provider).not.toHaveProperty("coverage");
  });
  it("keeps the strongest assignment for duplicate office rows", () => {
    expect(bestAssignment("Y", "M")).toBe("Y");
    expect(bestAssignment("M", "Y")).toBe("Y");
    expect(bestAssignment(undefined, "unexpected")).toBe("");
  });
});

describe("NPPES practice location reference file", () => {
  it("normalizes a secondary practice location row", async () => {
    const { nppesPracticeLocationCsv } = await import("./ingestion");
    const value = nppesPracticeLocationCsv({
      NPI: "1234567890",
      "Provider Secondary Practice Location Address- Address Line 1": "500 N Main St Ste 2",
      "Provider Secondary Practice Location Address - City Name": "Fort Myers",
      "Provider Secondary Practice Location Address - State Name": "FL",
      "Provider Secondary Practice Location Address - Postal Code": "339011234",
      "Provider Secondary Practice Location Address - Telephone Number": "2395550100",
    });
    expect(value).toEqual({
      npi: "1234567890",
      location: { address1: "500 N Main St Ste 2", city: "Fort Myers", state: "FL", zip: "33901", phone: "2395550100" },
    });
  });
});
