const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const attempts = new Map<string, number[]>();

export function canRequestPasswordReset(email: string, now = Date.now()) {
  const key = email.trim().toLowerCase();
  const recentAttempts = (attempts.get(key) ?? []).filter((attempt) => attempt > now - WINDOW_MS);

  if (recentAttempts.length >= MAX_REQUESTS_PER_WINDOW) {
    attempts.set(key, recentAttempts);
    return false;
  }

  recentAttempts.push(now);
  attempts.set(key, recentAttempts);
  return true;
}

export function clearPasswordResetRateLimit() {
  attempts.clear();
}
