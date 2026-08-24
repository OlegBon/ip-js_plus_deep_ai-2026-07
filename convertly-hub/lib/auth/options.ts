import type { NextAuthOptions } from "next-auth";

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function createAuthOptions(isProduction: boolean): NextAuthOptions {
  return {
    providers: [],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
    pages: {
      signIn: "/login",
    },
    cookies: {
      sessionToken: {
        name: isProduction
          ? "__Secure-convertly-hub.session-token"
          : "convertly-hub.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: isProduction,
        },
      },
    },
  };
}

export const authOptions = createAuthOptions(process.env.NODE_ENV === "production");
