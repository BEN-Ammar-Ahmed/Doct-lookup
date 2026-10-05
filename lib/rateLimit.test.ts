import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "./rateLimit";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("shared rate limiting", () => {
  it("uses an atomic shared counter and hashes client identifiers", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock");
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 31 }) });
    vi.stubGlobal("fetch", fetch);
    expect(await rateLimit("search:192.0.2.1")).toBe("limited");
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body[0]).toBe("EVAL");
    expect(body[3]).not.toContain("192.0.2.1");
  });
  it("fails closed when the shared store fails", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await rateLimit("search:test")).toBe("unavailable");
  });
  it("bounds production requests when shared credentials are absent", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("UPSTASH_REDIS_REST_URL", ""); vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", ""); vi.stubEnv("ALLOW_LOCAL_RATE_LIMIT", "");
    for (let i = 0; i < 30; i++) expect(await rateLimit("production-fallback")).toBe("allowed");
    expect(await rateLimit("production-fallback")).toBe("limited");
  });
});
