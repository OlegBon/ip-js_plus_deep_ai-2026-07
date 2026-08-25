import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { AdminAccessDeniedError } from "@/lib/admin/user-management";
import { getAdminSystemMetrics } from "@/lib/admin/system-monitoring";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user?.id) return unauthorized();
  try {
    return NextResponse.json(await getAdminSystemMetrics(session.user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) return unauthorized();
    return NextResponse.json({ error: "Unable to load system metrics." }, { status: 503 });
  }
}

function unauthorized() { return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); }
