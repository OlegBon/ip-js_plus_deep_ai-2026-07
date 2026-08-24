import { API_KEY_REQUEST_LIMIT, clearApiKeyRateLimits, consumeApiKeyRateLimit } from "../rate-limit";

describe("API key rate limit", () => {
  beforeEach(() => clearApiKeyRateLimits());

  it("allows 30 requests per API key within one minute and then returns a retry delay", () => {
    const now = 1_000;
    for (let index = 0; index < API_KEY_REQUEST_LIMIT; index += 1) {
      expect(consumeApiKeyRateLimit("key-1", now).allowed).toBe(true);
    }

    expect(consumeApiKeyRateLimit("key-1", now)).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 60,
    });
  });

  it("keeps API-key windows isolated and resets the window after one minute", () => {
    const now = 1_000;
    for (let index = 0; index < API_KEY_REQUEST_LIMIT; index += 1) {
      consumeApiKeyRateLimit("key-1", now);
    }

    expect(consumeApiKeyRateLimit("key-2", now).allowed).toBe(true);
    expect(consumeApiKeyRateLimit("key-1", now + 60_000)).toMatchObject({ allowed: true, remaining: 29 });
  });
});
