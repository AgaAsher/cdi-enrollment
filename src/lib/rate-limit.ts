import { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return ip;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

export function rateLimit(
  req: NextRequest,
  scope: string,
  opts: { limit: number; windowMs: number }
): RateLimitResult {
  const key = `${scope}:${clientKey(req)}`;
  const t = now();

  if (Math.random() < 0.01) {
    for (const [k, v] of buckets) {
      if (v.resetAt < t) buckets.delete(k);
    }
  }

  const b = buckets.get(key);
  if (!b || b.resetAt < t) {
    buckets.set(key, { count: 1, resetAt: t + opts.windowMs });
    return { allowed: true, remaining: opts.limit - 1, retryAfter: 0 };
  }

  if (b.count >= opts.limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - t) / 1000) };
  }

  b.count += 1;
  return { allowed: true, remaining: opts.limit - b.count, retryAfter: 0 };
}
