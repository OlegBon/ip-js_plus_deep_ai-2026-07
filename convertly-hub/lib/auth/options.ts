import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateUser } from "@/lib/auth/users";

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function createAuthOptions(isProduction: boolean): NextAuthOptions {
  return {
    providers: [
      CredentialsProvider({
        name: "Email and password",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        authorize: async (credentials) => authenticateUser(credentials),
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
    pages: {
      signIn: "/login",
    },
    callbacks: {
      jwt: ({ token, user }) => {
        if (user) {
          token.id = user.id;
          token.role = user.role;
        }

        return token;
      },
      session: ({ session, token }) => {
        if (session.user && token.id && token.role) {
          session.user.id = token.id;
          session.user.role = token.role;
        }

        return session;
      },
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
