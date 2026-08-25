import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth/recovery";

export async function POST(request: Request) {
  const body = await readBody(request);
  if (!body || body.password !== body.confirmPassword) {
    return NextResponse.json({ error: "Enter matching passwords of 12 to 128 characters." }, { status: 400 });
  }

  const changed = await resetPassword(body.token, body.password);
  if (!changed) {
    return NextResponse.json({ error: "This password reset link is invalid or has expired." }, { status: 400 });
  }

  return NextResponse.json({ message: "Password updated." });
}

async function readBody(request: Request) {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
    const { token, password, confirmPassword } = body as Record<string, unknown>;
    return typeof token === "string" && typeof password === "string" && typeof confirmPassword === "string"
      ? { token, password, confirmPassword }
      : null;
  } catch {
    return null;
  }
}
