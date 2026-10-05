import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW = 60000;
const MAX = 30;
export type RateDecision = "allowed" | "limited" | "unavailable";
export async function rateLimit(key: string): Promise<RateDecision> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const hash = createHash("sha256").update(key).digest("hex");
      // INCR and expiry occur atomically; no orphan counters on partial failure.
      const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return n";
      const response = await fetch(url, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(["EVAL", script, "1", "doct:rate:" + hash, String(WINDOW)]), signal: AbortSignal.timeout(3000), cache: "no-store" });
      if (!response.ok) return "unavailable";
      const payload = await response.json();
      if (!Number.isInteger(payload.result) || payload.result < 1) return "unavailable";
      return payload.result > MAX ? "limited" : "allowed";
    } catch { return "unavailable"; }
  }
  // Bounded per-instance fallback when shared credentials are absent.
  // This protects one process only; prefer shared Redis for distributed deployments.
  const now = Date.now();
  for (const [id, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(id);
  if (buckets.size >= 10000 && !buckets.has(key)) return "limited";
  const bucket = buckets.get(key);
  if (!bucket) { buckets.set(key, { count: 1, resetAt: now + WINDOW }); return "allowed"; }
  bucket.count++;
  return bucket.count > MAX ? "limited" : "allowed";
}
export function clientKey(req: Request): string {
  const header = process.env.VERCEL ? "x-vercel-forwarded-for" : "x-forwarded-for";
  return req.headers.get(header)?.split(",")[0].trim().slice(0, 80) || "unknown";
}
export async function rateLimitResponse(req: Request, scope: string) {
  const decision = await rateLimit(scope + ":" + clientKey(req));
  if (decision === "allowed") return null;
  return NextResponse.json({ error: decision === "limited" ? "rate_limited" : "rate_limit_unavailable" }, { status: decision === "limited" ? 429 : 503, headers: { "Retry-After": "60" } });
}
