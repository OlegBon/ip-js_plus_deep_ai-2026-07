import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage/s3";
import { GET } from "../route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init: { headers: Record<string, string>; status: number }) => ({
      status: init.status,
      headers: { get: (name: string) => init.headers[name] ?? null },
      json: async () => body,
    }),
  },
}));
jest.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: jest.fn() } }));
jest.mock("@/lib/storage/s3", () => ({ getStorageService: jest.fn() }));

describe("GET /api/health", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOTENBERG_URL = "http://worker";
    jest.mocked(prisma.$queryRaw).mockResolvedValue([] as never);
    jest.mocked(getStorageService).mockReturnValue({ ensureBucket: jest.fn().mockResolvedValue(undefined) } as never);
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  it("returns every core service and prevents response caching when healthy", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "healthy",
      database: "up",
      storage: "up",
      gotenberg: "up",
    });
  });

  it("reports a degraded service without exposing an internal error", async () => {
    jest.mocked(getStorageService).mockReturnValue({ ensureBucket: jest.fn().mockRejectedValue(new Error("credentials")) } as never);

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "degraded",
      database: "up",
      storage: "down",
      gotenberg: "up",
    });
  });
});
