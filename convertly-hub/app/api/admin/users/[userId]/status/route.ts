import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import {
  AdminAccessDeniedError,
  parseAdminUserStatus,
  updateAdminUserStatus,
} from "@/lib/admin/user-management";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const status = parseAdminUserStatus(
    body && typeof body === "object" && !Array.isArray(body) ? (body as { status?: unknown }).status : null,
  );
  if (!status) return NextResponse.json({ error: "Status must be ACTIVE or SUSPENDED." }, { status: 400 });

  const { userId } = await params;
  try {
    const result = await updateAdminUserStatus(session.user.id, userId, status);
    if (result === "SELF_UPDATE_FORBIDDEN") {
      return NextResponse.json({ error: "Administrators cannot change their own status." }, { status: 403 });
    }
    if (result === "NOT_FOUND") return NextResponse.json({ error: "User not found." }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) return unauthorized();
    return NextResponse.json({ error: "Unable to update user status." }, { status: 503 });
  }
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
