import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  findPlayableCardByEdhrecSlug,
  playableCatalogCardWhere,
} from "@/lib/scryfall/catalog-filters";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  if (query.length < 2) {
    return NextResponse.json({ cards: [], total: 0 });
  }

  const searchName = query.toLowerCase();

  const cards = await prisma.card.findMany({
    where: {
      ...playableCatalogCardWhere,
      OR: [
        { searchName: { startsWith: searchName } },
        { searchName: { contains: searchName } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: [{ name: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      edhrecSlug: true,
      typeLine: true,
      cmc: true,
      colorIdentity: true,
      imageUri: true,
      isCommander: true,
    },
  });

  return NextResponse.json({ cards, total: cards.length });
}
