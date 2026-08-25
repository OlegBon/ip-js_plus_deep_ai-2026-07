const attempts = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

export function allowGuestRequest(ip: string, now = Date.now()) {
  const recent = (attempts.get(ip) ?? []).filter((value) => value > now - WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) { attempts.set(ip, recent); return false; }
  recent.push(now); attempts.set(ip, recent); return true;
}

export function clearGuestRateLimit() { attempts.clear(); }
