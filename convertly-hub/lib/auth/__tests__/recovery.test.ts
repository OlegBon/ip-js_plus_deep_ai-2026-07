import { prisma } from "@/lib/prisma";
import { createPasswordReset, resetPassword, verifyEmail } from "../recovery";

jest.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() } } }));
jest.mock("bcrypt", () => ({ hash: jest.fn().mockResolvedValue("new-password-hash") }));

const mockedPrisma = jest.mocked(prisma, { shallow: false });

describe("account recovery", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stores only a hash and expiry for a password reset", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "person@example.com" } as never);
    mockedPrisma.user.update.mockResolvedValue({} as never);
    const result = await createPasswordReset(" Person@example.com ");
    expect(result?.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({ where: { id: "user-1" }, data: expect.objectContaining({ passwordResetTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/), passwordResetExpires: expect.any(Date) }) });
  });

  it("changes a password once and removes the reset token", async () => {
    mockedPrisma.user.updateMany.mockResolvedValue({ count: 1 } as never);
    await expect(resetPassword("token", "a-secure-password")).resolves.toBe(true);
    expect(mockedPrisma.user.updateMany).toHaveBeenCalledWith({ where: expect.objectContaining({ passwordResetExpires: { gt: expect.any(Date) } }), data: expect.objectContaining({ password: "new-password-hash", passwordResetTokenHash: null, passwordResetExpires: null }) });
  });

  it("verifies an unexpired email token once and clears it", async () => {
    mockedPrisma.user.updateMany.mockResolvedValue({ count: 1 } as never);
    await expect(verifyEmail("verification-token")).resolves.toBe(true);
    expect(mockedPrisma.user.updateMany).toHaveBeenCalledWith({ where: expect.objectContaining({ emailVerificationExpires: { gt: expect.any(Date) } }), data: expect.objectContaining({ emailVerified: expect.any(Date), emailVerificationTokenHash: null, emailVerificationExpires: null }) });
  });
});
