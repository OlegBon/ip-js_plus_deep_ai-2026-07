import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { createEmailVerification } from "@/lib/auth/recovery";
import { sendEmailVerification } from "@/lib/mail/send-auth-email";

export async function POST() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const verification = await createEmailVerification(session.user.id);
    await sendEmailVerification(verification.email, verification.token);
  } catch {
    return NextResponse.json({ error: "Unable to send the verification email. Please try again later." }, { status: 503 });
  }

  return NextResponse.json({ message: "Verification email sent." }, { status: 202 });
}
