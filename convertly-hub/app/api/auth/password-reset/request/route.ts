import { NextResponse } from "next/server";
import { createPasswordReset } from "@/lib/auth/recovery";
import { canRequestPasswordReset } from "@/lib/auth/password-reset-rate-limit";
import { sendPasswordResetEmail } from "@/lib/mail/send-auth-email";

const NEUTRAL_RESPONSE = { message: "If an account with that email exists, a password reset link has been sent." };

export async function POST(request: Request) {
  const email = await readEmail(request);

  if (!email) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!canRequestPasswordReset(email)) {
    return NextResponse.json(NEUTRAL_RESPONSE, { status: 202 });
  }

  try {
    const reset = await createPasswordReset(email);
    if (reset) {
      await sendPasswordResetEmail(reset.email, reset.token);
    }
  } catch {
    // Return the same response to avoid exposing account existence or mail transport state.
  }

  return NextResponse.json(NEUTRAL_RESPONSE, { status: 202 });
}

async function readEmail(request: Request) {
  try {
    const body: unknown = await request.json();
    const email = typeof body === "object" && body !== null && "email" in body ? body.email : null;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    return normalizedEmail.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ? normalizedEmail : null;
  } catch {
    return null;
  }
}
