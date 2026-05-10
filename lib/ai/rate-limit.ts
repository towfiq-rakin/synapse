/**
 * MVP in-memory rate limiter for AI chat requests.
 *
 * TODO: Replace with Redis/Upstash for production multi-instance deployments.
 * In-memory state is lost on restart and not shared across serverless instances.
 */

const WINDOW_MS = 10 * 60 * 1_000; // 10 minutes
const MAX_REQUESTS = 20;

/** Timestamps of requests per userId. */
const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Check and consume one rate-limit token for the given userId.
 */
export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let timestamps = requestLog.get(userId);

  if (!timestamps) {
    timestamps = [];
    requestLog.set(userId, timestamps);
  }

  // Prune expired entries
  const pruned = timestamps.filter((t) => t > windowStart);
  requestLog.set(userId, pruned);

  if (pruned.length >= MAX_REQUESTS) {
    const oldest = pruned[0]!;
    const retryAfterMs = oldest + WINDOW_MS - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  pruned.push(now);
  return {
    allowed: true,
    remaining: MAX_REQUESTS - pruned.length,
    retryAfterMs: 0,
  };
}
