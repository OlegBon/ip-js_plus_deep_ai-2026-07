import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/users";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isRegistrationBody(body)) {
    return NextResponse.json({ error: "Invalid registration data." }, { status: 400 });
  }

  const result = await registerUser(body);

  if ("error" in result) {
    const status = result.error === "EMAIL_TAKEN" ? 409 : 400;
    return NextResponse.json({ error: registrationErrorMessage(result.error) }, { status });
  }

  return NextResponse.json({ user: result.user }, { status: 201 });
}

function isRegistrationBody(value: unknown): value is { email?: string; password?: string; name?: string } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function registrationErrorMessage(error: "INVALID_INPUT" | "EMAIL_TAKEN") {
  if (error === "EMAIL_TAKEN") {
    return "An account with this email already exists.";
  }

  return "Use a valid email and a password of at least 12 characters.";
}
