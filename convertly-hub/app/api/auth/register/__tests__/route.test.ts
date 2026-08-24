/** @jest-environment node */

import { POST } from "../route";
import { registerUser } from "@/lib/auth/users";

jest.mock("@/lib/auth/users", () => ({ registerUser: jest.fn() }));

const mockedRegisterUser = jest.mocked(registerUser);

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an account and never returns its password", async () => {
    mockedRegisterUser.mockResolvedValue({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "person@example.com",
          password: "a-secure-password",
          name: "Person",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      user: { id: "user-1", email: "person@example.com", name: "Person" },
    });
  });

  it("returns a validation error for malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid request body." });
    expect(mockedRegisterUser).not.toHaveBeenCalled();
  });
});
