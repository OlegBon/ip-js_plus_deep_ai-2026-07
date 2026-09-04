import guestQuotaResetCore from '../guest-quota-reset-core.cjs';

const {
  GuestSupportCodeNotFoundError,
  parseGuestQuotaResetEnvironment,
  resetGuestQuota,
  supportCodeHash,
} = guestQuotaResetCore;

describe('one-off guest quota reset', () => {
  const code = 'GUEST-1234-ABCD-5678-EF90';

  it('accepts a formatted support code and normalizes support input', () => {
    expect(parseGuestQuotaResetEnvironment({ GUEST_SUPPORT_CODE: code.toLowerCase() })).toBe(code);
    expect(supportCodeHash(code.toLowerCase())).toBe(supportCodeHash(code));
  });

  it('rejects missing or malformed operator input before opening a transaction', () => {
    expect(() => parseGuestQuotaResetEnvironment({})).toThrow('GUEST_SUPPORT_CODE');
    expect(() => parseGuestQuotaResetEnvironment({ GUEST_SUPPORT_CODE: 'GUEST-1234' })).toThrow(
      'GUEST_SUPPORT_CODE',
    );
  });

  it('resets both counters for exactly the matching quota in one transaction', async () => {
    const transaction = {
      guestConversionQuota: {
        findUnique: jest.fn().mockResolvedValue({ id: 'quota-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(transaction)) };

    await expect(resetGuestQuota(prisma, code)).resolves.toBeUndefined();
    expect(transaction.guestConversionQuota.findUnique).toHaveBeenCalledWith({
      where: { supportCodeHash: supportCodeHash(code) },
      select: { id: true },
    });
    expect(transaction.guestConversionQuota.update).toHaveBeenCalledWith({
      where: { id: 'quota-1' },
      data: { imageCount: 0, documentCount: 0 },
    });
  });

  it('does not update a quota that is not matched by the supplied support code', async () => {
    const transaction = {
      guestConversionQuota: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(transaction)) };

    await expect(resetGuestQuota(prisma, code)).rejects.toBeInstanceOf(
      GuestSupportCodeNotFoundError,
    );
    expect(transaction.guestConversionQuota.update).not.toHaveBeenCalled();
  });
});
