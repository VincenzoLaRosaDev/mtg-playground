import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  COLLECTION_PAGE_SIZE,
  listCollectionItems,
} from "@/lib/collection/collection";
import { parseCollectionListQuery } from "@/lib/collection/collection-filters";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = parseCollectionListQuery({
    filter: searchParams.get("filter"),
    sort: searchParams.get("sort"),
    order: searchParams.get("order"),
    q: searchParams.get("q"),
    color: searchParams.get("color"),
    rarity: searchParams.get("rarity"),
    type: searchParams.get("type"),
    cmc_min: searchParams.get("cmc_min"),
    cmc_max: searchParams.get("cmc_max"),
    format: searchParams.get("format"),
    finish: searchParams.get("finish"),
    set: searchParams.get("set"),
  });

  try {
    const result = await listCollectionItems(prisma, userId, {
      ...query,
      cursor: searchParams.get("cursor"),
      limit: COLLECTION_PAGE_SIZE,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Collection query failed";
    if (message.includes("Cursor does not match")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    throw error;
  }
}
