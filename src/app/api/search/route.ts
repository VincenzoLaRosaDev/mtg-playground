import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { queryGlobalSearch } from "@/lib/search/global-search";
import { GLOBAL_SEARCH_MIN_QUERY_LENGTH } from "@/lib/search/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Number(searchParams.get("limit"));

  if (query.length < GLOBAL_SEARCH_MIN_QUERY_LENGTH) {
    return NextResponse.json({
      query,
      cards: [],
      commanders: [],
      sets: [],
    });
  }

  const result = await queryGlobalSearch(prisma, {
    query,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return NextResponse.json(result);
}
