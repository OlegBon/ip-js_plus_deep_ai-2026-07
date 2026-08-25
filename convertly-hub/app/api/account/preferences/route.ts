import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { BillingUserNotFoundError, InvalidMockCheckoutError, updateStoragePreference } from "@/lib/billing/subscriptions";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as { storeConversions?: unknown }).storeConversions !== "boolean") {
    return NextResponse.json({ error: "storeConversions must be a boolean." }, { status: 400 });
  }

  try {
    const storeConversions = await updateStoragePreference(session.user.id, (body as { storeConversions: boolean }).storeConversions);
    return NextResponse.json({ storeConversions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BillingUserNotFoundError) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error instanceof InvalidMockCheckoutError) {
      return NextResponse.json({ error: "Free storage is retained automatically for 24 hours." }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to update storage preference." }, { status: 503 });
  }
}
