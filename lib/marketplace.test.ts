import { describe, it, expect, vi, afterEach } from "vitest";
import { checkMarketplaceCoverage, marketplaceCoverageDisplay } from "./marketplace";

const plan = { name: "Test Plan", issuerName: "Test Issuer", year: 2026 };

describe("checkMarketplaceCoverage / marketplaceCoverageDisplay", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.CMS_MARKETPLACE_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.CMS_MARKETPLACE_API_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it('maps "Covered" to a covered, honestly-worded label', async () => {
    process.env.CMS_MARKETPLACE_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ providers: [{ npi: "1111111111", plan_id: "PLAN123", coverage: "Covered" }] }),
    }) as unknown as typeof fetch;

    const results = await checkMarketplaceCoverage(["1111111111"], "PLAN123", 2026);
    const display = marketplaceCoverageDisplay(results.get("1111111111")!, plan);
    expect(display.status).toBe("covered");
    expect(display.label).toBe("Listed as covered by this ACA Marketplace plan");
    expect(display.label.toLowerCase()).not.toContain("guaranteed");
  });

  it('maps "NotCovered" to a not-covered label', async () => {
    process.env.CMS_MARKETPLACE_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ providers: [{ npi: "2222222222", plan_id: "PLAN123", coverage: "NotCovered" }] }),
    }) as unknown as typeof fetch;

    const results = await checkMarketplaceCoverage(["2222222222"], "PLAN123", 2026);
    const display = marketplaceCoverageDisplay(results.get("2222222222")!, plan);
    expect(display.status).toBe("not_covered");
    expect(display.label).toBe("Listed as not covered by this ACA Marketplace plan");
  });

  it('maps "DataNotProvided" to unknown, never to "not covered"', async () => {
    process.env.CMS_MARKETPLACE_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ providers: [{ npi: "3333333333", plan_id: "PLAN123", coverage: "DataNotProvided" }] }),
    }) as unknown as typeof fetch;

    const results = await checkMarketplaceCoverage(["3333333333"], "PLAN123", 2026);
    const display = marketplaceCoverageDisplay(results.get("3333333333")!, plan);
    expect(display.status).toBe("unknown");
    expect(display.label).not.toContain("not covered");
  });

  it("treats a missing response entry as unknown, not a negative result", async () => {
    process.env.CMS_MARKETPLACE_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ providers: [] }),
    }) as unknown as typeof fetch;

    const results = await checkMarketplaceCoverage(["4444444444"], "PLAN123", 2026);
    const display = marketplaceCoverageDisplay(results.get("4444444444")!, plan);
    expect(display.status).toBe("unknown");
  });

  it("treats a CMS failure as unavailable, generating no insurance answer", async () => {
    process.env.CMS_MARKETPLACE_API_KEY = "test-key";
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    const results = await checkMarketplaceCoverage(["5555555555"], "PLAN123", 2026);
    const display = marketplaceCoverageDisplay(results.get("5555555555")!, plan);
    expect(display.status).toBe("unavailable");
    expect(display.label).toBe("Verification temporarily unavailable");
  });
});
