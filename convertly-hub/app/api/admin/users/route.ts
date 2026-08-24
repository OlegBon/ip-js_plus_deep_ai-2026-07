import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { AdminAccessDeniedError, listAdminUsers, parseAdminUserSearch } from "@/lib/admin/user-management";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actorUserId = await getSessionUserId();
  if (!actorUserId) return unauthorized();

  try {
    const result = await listAdminUsers(actorUserId, parseAdminUserSearch(new URL(request.url).searchParams));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) return unauthorized();
    return NextResponse.json({ error: "Unable to list users." }, { status: 503 });
  }
}

async function getSessionUserId() {
  const session = await getCurrentSession();
  return session?.user?.id;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
