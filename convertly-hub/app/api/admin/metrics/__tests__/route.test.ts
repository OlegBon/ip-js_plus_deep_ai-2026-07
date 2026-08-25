/** @jest-environment node */
import { GET } from "../route";
import { getCurrentSession } from "@/lib/auth/session";
import { getAdminSystemMetrics } from "@/lib/admin/system-monitoring";
jest.mock("@/lib/auth/session", () => ({ getCurrentSession: jest.fn() }));
jest.mock("@/lib/admin/system-monitoring", () => ({ getAdminSystemMetrics: jest.fn() }));
describe("GET /api/admin/metrics", () => { it("requires a session", async () => { jest.mocked(getCurrentSession).mockResolvedValue(null); expect((await GET()).status).toBe(401); }); it("returns no-store metrics for an admin", async () => { jest.mocked(getCurrentSession).mockResolvedValue({ user: { id: "admin-1" } } as never); jest.mocked(getAdminSystemMetrics).mockResolvedValue({ activeUsers: 1 } as never); const response = await GET(); expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toBe("no-store"); }); });
