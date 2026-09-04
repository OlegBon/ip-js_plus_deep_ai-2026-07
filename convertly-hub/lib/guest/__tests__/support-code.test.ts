import {
  guestSupportCodeForPeriod,
  hashGuestSupportCode,
  normalizeGuestSupportCode,
} from '../support-code';

describe('guest support code', () => {
  const originalSecret = process.env.GUEST_SUPPORT_CODE_SECRET;

  beforeEach(() => {
    process.env.GUEST_SUPPORT_CODE_SECRET = 'test-only-guest-support-code-secret';
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.GUEST_SUPPORT_CODE_SECRET;
    else process.env.GUEST_SUPPORT_CODE_SECRET = originalSecret;
  });

  it('creates a stable code for one visitor and billing month', () => {
    const periodStart = new Date('2026-09-01T00:00:00.000Z');

    expect(guestSupportCodeForPeriod('visitor-a', periodStart)).toMatch(
      /^GUEST-[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/,
    );
    expect(guestSupportCodeForPeriod('visitor-a', periodStart)).toBe(
      guestSupportCodeForPeriod('visitor-a', periodStart),
    );
    expect(guestSupportCodeForPeriod('visitor-a', periodStart)).not.toBe(
      guestSupportCodeForPeriod('visitor-a', new Date('2026-10-01T00:00:00.000Z')),
    );
  });

  it('normalizes the code before hashing it for storage lookup', () => {
    const code = guestSupportCodeForPeriod('visitor-a', new Date('2026-09-01T00:00:00.000Z'))!;

    expect(normalizeGuestSupportCode(code.toLowerCase().replaceAll('-', ' '))).toBe(code);
    expect(hashGuestSupportCode(code.toLowerCase().replaceAll('-', ' '))).toBe(
      hashGuestSupportCode(code),
    );
  });

  it('does not expose a code when the secret is not configured', () => {
    delete process.env.GUEST_SUPPORT_CODE_SECRET;

    expect(guestSupportCodeForPeriod('visitor-a', new Date('2026-09-01T00:00:00.000Z'))).toBeNull();
  });
});
