import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage/s3";
import { getAdminSystemMetrics } from "../system-monitoring";

jest.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: jest.fn(), count: jest.fn() }, conversionLog: { count: jest.fn() } } }));
jest.mock("@/lib/storage/s3", () => ({ getStorageService: jest.fn() }));

describe("admin system monitoring", () => {
  beforeEach(() => { jest.clearAllMocks(); process.env.GOTENBERG_URL = "http://worker"; global.fetch = jest.fn().mockResolvedValue({ ok: true }); });
  it("returns real aggregate values and service status for an active admin", async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({ role: "ADMIN", status: "ACTIVE" } as never);
    jest.mocked(prisma.user.count).mockResolvedValue(4 as never);
    jest.mocked(prisma.conversionLog.count).mockResolvedValueOnce(10 as never).mockResolvedValueOnce(2 as never);
    jest.mocked(getStorageService).mockReturnValue({ ensureBucket: jest.fn().mockResolvedValue(undefined) } as never);
    await expect(getAdminSystemMetrics("admin-1")).resolves.toMatchObject({ activeUsers: 4, totalConversions: 10, failedConversions: 2, errorRate: 20, services: { database: "up", gotenberg: "up", storage: "up" } });
  });
});
