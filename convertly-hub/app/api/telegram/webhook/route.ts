import { NextResponse } from "next/server";
import { isValidWebhookSecret, verifyTelegramLink } from "@/lib/telegram/linking";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number | string };
    text?: string;
  };
};

export async function POST(request: Request) {
  if (!isValidWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  const token = parseLinkToken(update.message?.text);
  const chatId = update.message?.chat?.id;

  if (!token || (typeof chatId !== "number" && typeof chatId !== "string")) {
    return NextResponse.json({ ok: true });
  }

  await verifyTelegramLink(String(chatId), token);
  return NextResponse.json({ ok: true });
}

function parseLinkToken(text: string | undefined) {
  const match = text?.match(/^\/start(?:@\w+)?\s+link_([A-Za-z0-9_-]{20,})$/);
  return match?.[1];
}
