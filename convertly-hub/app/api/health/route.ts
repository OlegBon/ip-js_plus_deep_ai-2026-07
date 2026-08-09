import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 1. Создаем пул подключений к БД через стандартный драйвер
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Оборачиваем пул в адаптер Prisma
const adapter = new PrismaPg(pool);

// 3. Передаем адаптер при создании клиента
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    // Проверка БД
    const userCount = await prisma.user.count();

    // Проверка воркера Gotenberg
    const gotenbergRes = await fetch("http://localhost:3000/health", {
      cache: "no-store",
    });
    const gotenbergStatus = gotenbergRes.ok ? "up" : "down";

    return NextResponse.json(
      {
        status: "healthy",
        database: "connected",
        users_in_db: userCount,
        gotenberg_worker: gotenbergStatus,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "One or more core services are unreachable",
      },
      { status: 500 },
    );
  }
}
