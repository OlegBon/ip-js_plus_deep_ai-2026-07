import { createHash } from 'crypto';

const SUPPORT_CODE_PREFIX = 'GUEST';
const SUPPORT_CODE_HEX_LENGTH = 16;

export class GuestSupportCodeNotFoundError extends Error {
  constructor() {
    super('No guest quota matches the supplied support code.');
    this.name = 'GuestSupportCodeNotFoundError';
  }
}

function normalizeGuestSupportCode(value) {
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

export function supportCodeHash(value) {
  return createHash('sha256').update(normalizeGuestSupportCode(value)).digest('hex');
}

export function parseGuestQuotaResetEnvironment(environment) {
  const code = environment.GUEST_SUPPORT_CODE;
  if (typeof code !== 'string')
    throw new Error('GUEST_SUPPORT_CODE must contain a valid guest support code.');
  return normalizeGuestSupportCode(code);
}

export async function resetGuestQuota(prisma, code) {
  const hash = supportCodeHash(code);
  return prisma.$transaction(async (transaction) => {
    const quota = await transaction.guestConversionQuota.findUnique({
      where: { supportCodeHash: hash },
      select: { id: true },
    });
    if (!quota) throw new GuestSupportCodeNotFoundError();

    await transaction.guestConversionQuota.update({
      where: { id: quota.id },
      data: { imageCount: 0, documentCount: 0 },
    });
  });
}
