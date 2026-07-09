import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  const where =
    query.length >= 2
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { code: { contains: query.toLowerCase() } },
          ],
        }
      : undefined;

  const sets = await prisma.mtgSet.findMany({
    where,
    orderBy: [{ releasedAt: "desc" }, { name: "asc" }],
    take: limit,
    select: {
      code: true,
      name: true,
      releasedAt: true,
      setType: true,
      cardCount: true,
      iconUri: true,
      digital: true,
      _count: {
        select: { setCards: true },
      },
    },
  });

  return NextResponse.json({
    sets: sets.map((set) => ({
      code: set.code,
      name: set.name,
      releasedAt: set.releasedAt,
      setType: set.setType,
      cardCount: set.cardCount,
      iconUri: set.iconUri,
      digital: set.digital,
      indexedCardCount: set._count.setCards,
    })),
    total: sets.length,
  });
}
