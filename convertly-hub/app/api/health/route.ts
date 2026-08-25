import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage/s3";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const gotenbergRes = await fetch(`${(process.env.GOTENBERG_URL ?? "http://localhost:3000").replace(/\/$/, "")}/health`, {
      cache: "no-store",
    });
    if (!gotenbergRes.ok) throw new Error("Gotenberg unavailable");
    await getStorageService().ensureBucket();

    return NextResponse.json(
      {
        status: "healthy",
        database: "up",
        storage: "up",
        gotenberg: "up",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "One or more core services are unreachable",
      },
      { status: 500 },
    );
  }
}
