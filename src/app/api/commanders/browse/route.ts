import { NextResponse } from "next/server";

import { parseCommanderBrowseParams, queryCommandersBrowse } from "@/lib/browse/commanders";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = parseCommanderBrowseParams(searchParams);

  try {
    const result = await queryCommandersBrowse(prisma, params);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browse query failed";

    if (message.includes("Cursor does not match")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    throw error;
  }
}
