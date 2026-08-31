/** @jest-environment node */
import { GET, PATCH } from "../route";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
jest.mock("@/lib/auth/session", () => ({ getCurrentSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: jest.fn(), updateMany: jest.fn() } } }));
const session = jest.mocked(getCurrentSession); const db = jest.mocked(prisma, { shallow: false });
describe("account profile", () => { beforeEach(() => { jest.clearAllMocks(); session.mockResolvedValue({ user: { id: "u1" } } as never); });
  it("does not expose profile without a session", async () => { session.mockResolvedValue(null); expect((await GET()).status).toBe(401); });
  it("returns only safe profile fields", async () => { db.user.findUnique.mockResolvedValue({ name: "Ada", email: "ada@example.com", pendingEmail: "new@example.com", emailVerified: null, telegramId: null, telegramVerified: null, status: "ACTIVE" } as never); const response = await GET(); await expect(response.json()).resolves.toEqual({ name: "Ada", email: "ada@example.com", pendingEmail: "new@example.com", emailVerified: false, telegramId: null, telegramVerified: false }); });
  it("validates and updates only the display name", async () => { db.user.updateMany.mockResolvedValue({ count: 1 } as never); db.user.findUnique.mockResolvedValue({ name: "Ada", email: "ada@example.com", emailVerified: null, telegramId: null, telegramVerified: null, status: "ACTIVE" } as never); const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ name: " Ada " }) })); expect(response.status).toBe(200); expect(db.user.updateMany).toHaveBeenCalledWith({ where: { id: "u1", status: "ACTIVE" }, data: { name: "Ada" } }); });
});
