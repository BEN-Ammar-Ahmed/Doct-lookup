import { afterEach, describe, expect, it, vi } from "vitest";
import { checkMarketplaceCoverage } from "./marketplace";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("Marketplace failure classification", () => {
  it.each([400, 404, 500, 503])("classifies HTTP %s as unavailable", async status => {
    vi.stubEnv("CMS_MARKETPLACE_API_KEY", "fixture-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));
    expect((await checkMarketplaceCoverage(["1234567890"], "PLAN123", 2026)).get("1234567890")?.status).toBe("unavailable");
  });
  it("does not fetch without credentials", async () => {
    vi.stubEnv("CMS_MARKETPLACE_API_KEY", "");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await checkMarketplaceCoverage(["1234567890"], "PLAN123", 2026)).get("1234567890")?.status).toBe("unavailable");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("classifies timeout as unavailable, never a negative answer", async () => {
    vi.stubEnv("CMS_MARKETPLACE_API_KEY", "fixture-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timeout", "TimeoutError")));
    expect((await checkMarketplaceCoverage(["1234567890"], "PLAN123", 2026)).get("1234567890")?.status).toBe("unavailable");
  });
});
describe("Marketplace plan identity", () => {
  it.each(["OTHERPLAN", undefined])("does not accept a covered row for missing or mismatched plan %s", async plan_id => {
    vi.stubEnv("CMS_MARKETPLACE_API_KEY", "fixture-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ providers: [{ npi: "1234567890", plan_id, coverage: "Covered" }] }) }));
    expect((await checkMarketplaceCoverage(["1234567890"], "PLAN123", 2026)).get("1234567890")?.status).toBe("unknown");
  });
  it("reads the documented response envelope", async () => {
    vi.stubEnv("CMS_MARKETPLACE_API_KEY", "fixture-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ "Provider & Drug Coverage": [{ npi: "1234567890", plan_id: "PLAN123", coverage: "Covered" }] }) }));
    expect((await checkMarketplaceCoverage(["1234567890"], "PLAN123", 2026)).get("1234567890")?.status).toBe("covered");
  });
});
