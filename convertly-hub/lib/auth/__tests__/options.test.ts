import { createAuthOptions } from "../options";

describe("NextAuth session options", () => {
  it("uses an HttpOnly session cookie in local development", () => {
    const options = createAuthOptions(false);
    const sessionCookie = options.cookies?.sessionToken;

    expect(options.session).toMatchObject({ strategy: "jwt", maxAge: 8 * 60 * 60 });
    expect(sessionCookie).toEqual({
      name: "convertly-hub.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    });
  });

  it("requires Secure cookies in production", () => {
    const options = createAuthOptions(true);

    expect(options.cookies?.sessionToken).toMatchObject({
      name: "__Secure-convertly-hub.session-token",
      options: { httpOnly: true, secure: true },
    });
  });
});
