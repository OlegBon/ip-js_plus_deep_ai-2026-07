import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { authenticateUser, passwordRequirements, registerUser } from "../users";

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: { hash: jest.fn(), compare: jest.fn() },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockedBcrypt = jest.mocked(bcrypt);
const mockedPrisma = jest.mocked(prisma, { shallow: false });

describe("auth user service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hashes and stores a valid password during registration", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);
    mockedPrisma.user.create.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      name: "Person",
    } as never);

    const result = await registerUser({
      email: " Person@Example.com ",
      password: "a-secure-password",
      name: " Person ",
    });

    expect(mockedBcrypt.hash).toHaveBeenCalledWith("a-secure-password", 12);
    expect(mockedPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "person@example.com",
          password: "hashed-password",
          name: "Person",
        }),
      }),
    );
    expect(result).toEqual({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
    });
  });

  it("rejects a password shorter than the configured minimum", async () => {
    const result = await registerUser({
      email: "person@example.com",
      password: "short",
    });

    expect(result).toEqual({ error: "INVALID_INPUT" });
    expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    expect(passwordRequirements.minLength).toBe(12);
  });

  it("authenticates an active user and records the login time", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      name: "Person",
      password: "stored-hash",
      role: "USER",
      status: "ACTIVE",
    } as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
    mockedPrisma.user.update.mockResolvedValue({} as never);

    const result = await authenticateUser({
      email: "PERSON@example.com",
      password: "a-secure-password",
    });

    expect(mockedBcrypt.compare).toHaveBeenCalledWith("a-secure-password", "stored-hash");
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { lastLoginAt: expect.any(Date) },
    });
    expect(result).toEqual({
      id: "user-1",
      email: "person@example.com",
      name: "Person",
      role: "USER",
    });
  });

  it("returns no user for an invalid password or a suspended account", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "person@example.com",
      name: "Person",
      password: "stored-hash",
      role: "USER",
      status: "SUSPENDED",
    } as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);

    await expect(
      authenticateUser({ email: "person@example.com", password: "a-secure-password" }),
    ).resolves.toBeNull();
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });
});
