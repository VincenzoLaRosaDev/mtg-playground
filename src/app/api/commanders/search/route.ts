import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

const commanderSelect = {
  slug: true,
  name: true,
  rank: true,
  salt: true,
  numDecks: true,
  colorIdentity: true,
  card: {
    select: {
      imageUri: true,
      typeLine: true,
    },
  },
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  if (query.length < 2) {
    const commanders = await prisma.edhrecCommanderProfile.findMany({
      where: { rank: { not: null } },
      orderBy: [{ rank: "asc" }],
      take: limit,
      select: commanderSelect,
    });

    return NextResponse.json({ commanders, total: commanders.length });
  }

  const commanders = await prisma.edhrecCommanderProfile.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { slug: { contains: query.toLowerCase().replace(/[^a-z0-9-]+/g, "-") } },
      ],
    },
    orderBy: [{ rank: "asc" }, { name: "asc" }],
    take: limit,
    select: commanderSelect,
  });

  return NextResponse.json({ commanders, total: commanders.length });
}
