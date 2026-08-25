import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage/s3";

type ServiceStatus = "up" | "down";

async function checkService(check: () => Promise<unknown>): Promise<ServiceStatus> {
  try {
    await check();
    return "up";
  } catch {
    return "down";
  }
}

export async function GET() {
  const [database, storage, gotenberg] = await Promise.all([
    checkService(() => prisma.$queryRaw`SELECT 1`),
    checkService(() => getStorageService().ensureBucket()),
    checkService(async () => {
      const response = await fetch(`${(process.env.GOTENBERG_URL ?? "http://localhost:3000").replace(/\/$/, "")}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error("Gotenberg health check failed");
    }),
  ]);
  const isHealthy = [database, storage, gotenberg].every((service) => service === "up");

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      database,
      storage,
      gotenberg,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
