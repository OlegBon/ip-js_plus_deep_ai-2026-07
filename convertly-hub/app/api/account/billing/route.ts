import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import {
  BillingUserNotFoundError,
  getBillingOverview,
  InvalidMockCheckoutError,
  requestMockPlanChange,
} from "@/lib/billing/subscriptions";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  try {
    const billing = await getBillingOverview(userId);
    return NextResponse.json(billing, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BillingUserNotFoundError) return unauthorized();
    return NextResponse.json({ error: "Unable to load billing information." }, { status: 503 });
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

  try {
    const subscription = await requestMockPlanChange(userId, body);
    return NextResponse.json(
      {
        subscription,
        message: "Demo request saved. No payment was collected and paid access has not been activated.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BillingUserNotFoundError) return unauthorized();
    if (error instanceof InvalidMockCheckoutError) {
      return NextResponse.json({ error: "Complete the demo checkout fields correctly." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to save the demo request." }, { status: 503 });
  }
}

async function getSessionUserId() {
  const session = await getCurrentSession();
  return session?.user?.id;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
