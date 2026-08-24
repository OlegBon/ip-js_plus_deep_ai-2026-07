import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { AdminAccessDeniedError, revokeAdminApiKey } from "@/lib/admin/user-management";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ apiKeyId: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return unauthorized();

  const { apiKeyId } = await params;
  try {
    const revoked = await revokeAdminApiKey(session.user.id, apiKeyId);
    if (!revoked) return NextResponse.json({ error: "API key not found." }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) return unauthorized();
    return NextResponse.json({ error: "Unable to revoke API key." }, { status: 503 });
  }
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
