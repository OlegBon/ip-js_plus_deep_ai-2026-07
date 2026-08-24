const API_KEY_WINDOW_MS = 60_000;
export const API_KEY_REQUEST_LIMIT = 30;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const requestWindows = new Map<string, RateLimitEntry>();

export function consumeApiKeyRateLimit(apiKeyId: string, now = Date.now()): RateLimitResult {
  if (requestWindows.size > 1_000) {
    for (const [key, entry] of requestWindows) {
      if (entry.resetAt <= now) requestWindows.delete(key);
    }
  }

  const current = requestWindows.get(apiKeyId);
  if (!current || current.resetAt <= now) {
    requestWindows.set(apiKeyId, { count: 1, resetAt: now + API_KEY_WINDOW_MS });
    return { allowed: true, remaining: API_KEY_REQUEST_LIMIT - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= API_KEY_REQUEST_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, remaining: API_KEY_REQUEST_LIMIT - current.count, retryAfterSeconds: 0 };
}

export function clearApiKeyRateLimits() {
  requestWindows.clear();
}
