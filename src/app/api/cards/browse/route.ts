import { NextResponse } from "next/server";

import { parseCardBrowseParams, queryCardsBrowse } from "@/lib/browse/cards";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = parseCardBrowseParams(searchParams);

  try {
    const result = await queryCardsBrowse(prisma, params);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browse query failed";

    if (message.includes("Cursor does not match")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    throw error;
  }
}
