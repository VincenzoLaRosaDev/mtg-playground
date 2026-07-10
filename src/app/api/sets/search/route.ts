import { NextResponse } from "next/server";

import {
  parseSetBrowseParams,
  querySetsBrowse,
} from "@/lib/browse/sets";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = parseSetBrowseParams(searchParams);

  try {
    const result = await querySetsBrowse(prisma, params);

    return NextResponse.json({
      items: result.items.map((item) => ({
        ...item,
        releasedAt: item.releasedAt?.toISOString() ?? null,
      })),
      total: result.total,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browse query failed";

    if (message.includes("Cursor does not match")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    throw error;
  }
}
