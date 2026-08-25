import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const conversions = await prisma.conversionLog.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      sourceFileName: true,
      targetFormat: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      storageKey: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ conversions }, { headers: { "Cache-Control": "no-store" } });
}
