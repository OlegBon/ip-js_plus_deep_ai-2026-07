import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import {
  ApiKeyUserNotFoundError,
  ApiKeyPlanNotEligibleError,
  createApiKey,
  listApiKeys,
  normalizeApiKeyName,
} from "@/lib/api/api-keys";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  try {
    const apiKeys = await listApiKeys(userId);
    return NextResponse.json({ apiKeys }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiKeyUserNotFoundError) return unauthorized();
    if (error instanceof ApiKeyPlanNotEligibleError) {
      return NextResponse.json({ error: "API keys require a Basic plan or higher." }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to list API keys." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = normalizeApiKeyName(
    body && typeof body === "object" && !Array.isArray(body) ? (body as { name?: unknown }).name : null,
  );
  if (!name) {
    return NextResponse.json({ error: "API key name must contain 1 to 64 characters." }, { status: 400 });
  }

  try {
    const created = await createApiKey(userId, name);
    return NextResponse.json(created, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ApiKeyUserNotFoundError) return unauthorized();
    return NextResponse.json({ error: "Unable to create API key." }, { status: 503 });
  }
}

async function getSessionUserId() {
  const session = await getCurrentSession();
  return session?.user?.id;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
