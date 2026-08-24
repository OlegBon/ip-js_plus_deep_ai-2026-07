import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { ApiKeyUserNotFoundError, revokeApiKey } from "@/lib/api/api-keys";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ apiKeyId: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { apiKeyId } = await params;
  try {
    const revoked = await revokeApiKey(session.user.id, apiKeyId);
    if (!revoked) {
      return NextResponse.json({ error: "API key not found." }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiKeyUserNotFoundError) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json({ error: "Unable to revoke API key." }, { status: 503 });
  }
}
