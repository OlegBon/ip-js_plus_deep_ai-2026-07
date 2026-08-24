import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { createTelegramLink } from "@/lib/telegram/linking";

export async function POST() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const link = await createTelegramLink(session.user.id);
    return NextResponse.json(link);
  } catch {
    return NextResponse.json({ error: "Unable to start Telegram linking." }, { status: 503 });
  }
}
