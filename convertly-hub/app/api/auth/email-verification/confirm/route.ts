import { NextResponse } from "next/server";
import { verifyEmail } from "@/lib/auth/recovery";

export async function POST(request: Request) {
  let token = "";
  try {
    const body: unknown = await request.json();
    token = typeof body === "object" && body !== null && "token" in body && typeof body.token === "string" ? body.token : "";
  } catch {
    return NextResponse.json({ error: "Invalid verification request." }, { status: 400 });
  }

  const verified = await verifyEmail(token);
  if (!verified) {
    return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
  }

  return NextResponse.json({ message: "Email verified." });
}
