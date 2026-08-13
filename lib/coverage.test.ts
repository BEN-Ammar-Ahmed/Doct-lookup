import { describe, it, expect } from "vitest";
import { unsupportedCoverage, coverageMarkerColor } from "./coverage";

describe("unsupportedCoverage", () => {
  it("never claims a positive or negative result for an unverified insurer", () => {
    const display = unsupportedCoverage("Aetna");
    expect(display.status).toBe("unsupported");
    expect(display.label).toBe(
      "This insurance plan is not currently verified by this website."
    );
    expect(display.label.toLowerCase()).not.toMatch(/covered|accepts|in.network/);
  });
});

describe("coverageMarkerColor", () => {
  it("reserves green for a real covered result only", () => {
    expect(coverageMarkerColor("covered")).toBe("#0E8A5F");
    expect(coverageMarkerColor("not_covered")).not.toBe("#0E8A5F");
    expect(coverageMarkerColor("unknown")).not.toBe("#0E8A5F");
    expect(coverageMarkerColor("unavailable")).not.toBe("#0E8A5F");
    expect(coverageMarkerColor("unsupported")).not.toBe("#0E8A5F");
    expect(coverageMarkerColor(undefined)).not.toBe("#0E8A5F");
  });
});
