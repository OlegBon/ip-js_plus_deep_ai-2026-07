import { render, screen, waitFor } from "@testing-library/react";
import UserManagement from "../UserManagement";
jest.mock("@/lib/hooks/use-toast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
describe("UserManagement", () => { it("loads users from the real admin contract", async () => { global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ users: [{ id: "u1", name: "Jane Smith", email: "jane@example.com", role: "USER", status: "ACTIVE", plan: "FREE", lastLoginAt: null, apiKeys: [] }], nextCursor: null }) }); render(<UserManagement />); await waitFor(() => expect(screen.getByText("Jane Smith")).toBeInTheDocument()); }); });
