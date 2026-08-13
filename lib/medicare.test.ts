import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkMedicareAssignment, medicareCoverageDisplay } from "./medicare";

describe("checkMedicareAssignment", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("maps ind_assgn Y to assigned", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ npi: "1111111111", ind_assgn: "Y" }] }),
    }) as unknown as typeof fetch;

    const result = await checkMedicareAssignment(["1111111111"]);
    expect(result.get("1111111111")).toEqual({ status: "assigned" });
  });

  it("maps ind_assgn M to maybe, distinct from Y", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ npi: "2222222222", ind_assgn: "M" }] }),
    }) as unknown as typeof fetch;

    const result = await checkMedicareAssignment(["2222222222"]);
    expect(result.get("2222222222")).toEqual({ status: "maybe" });

    const assignedLabel = medicareCoverageDisplay({ status: "assigned" }).label;
    const maybeLabel = medicareCoverageDisplay({ status: "maybe" }).label;
    expect(assignedLabel).not.toBe(maybeLabel);
  });

  it("treats a missing NPI as no_record, not a negative result", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    }) as unknown as typeof fetch;

    const result = await checkMedicareAssignment(["3333333333"]);
    expect(result.get("3333333333")).toEqual({ status: "no_record" });
    const display = medicareCoverageDisplay(result.get("3333333333")!);
    expect(display.label.toLowerCase()).not.toContain("does not accept");
    expect(display.label.toLowerCase()).toContain("unable to verify");
  });

  it("treats a fetch failure as unavailable, not a fabricated answer", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const result = await checkMedicareAssignment(["4444444444"]);
    expect(result.get("4444444444")).toEqual({ status: "unavailable" });
    expect(medicareCoverageDisplay(result.get("4444444444")!).status).toBe("unavailable");
  });
});

describe("medicareCoverageDisplay", () => {
  it("never labels a result as plain 'Accepts Medicare'", () => {
    for (const status of ["assigned", "maybe", "no_record", "unavailable"] as const) {
      const display = medicareCoverageDisplay({ status });
      expect(display.label.toLowerCase()).not.toBe("accepts medicare");
    }
  });

  it("includes the Medicare Advantage disclaimer whenever a definite result is shown", () => {
    const display = medicareCoverageDisplay({ status: "assigned" });
    expect(display.note).toMatch(/Medicare Advantage/);
  });
});
