import { createHash, createHmac } from 'crypto';

const SUPPORT_CODE_PREFIX = 'GUEST';
const SUPPORT_CODE_HEX_LENGTH = 16;

export function guestSupportCodeForPeriod(visitor: string, periodStart: Date) {
  const secret = process.env.GUEST_SUPPORT_CODE_SECRET;
  if (!secret) return null;

  const digest = createHmac('sha256', secret)
    .update(`${visitor}:${periodStart.toISOString()}`)
    .digest('hex')
    .slice(0, SUPPORT_CODE_HEX_LENGTH)
    .toUpperCase();

  return `${SUPPORT_CODE_PREFIX}-${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}-${digest.slice(12)}`;
}

export function normalizeGuestSupportCode(value: string) {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const expectedLength = SUPPORT_CODE_PREFIX.length + SUPPORT_CODE_HEX_LENGTH;
  if (!normalized.startsWith(SUPPORT_CODE_PREFIX) || normalized.length !== expectedLength)
    throw new Error('GUEST_SUPPORT_CODE must be a valid guest support code.');

  const code = normalized.slice(SUPPORT_CODE_PREFIX.length);
  if (!/^[A-F0-9]+$/.test(code))
    throw new Error('GUEST_SUPPORT_CODE must be a valid guest support code.');

  return `${SUPPORT_CODE_PREFIX}-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12)}`;
}

export function hashGuestSupportCode(code: string) {
  return createHash('sha256').update(normalizeGuestSupportCode(code)).digest('hex');
}
