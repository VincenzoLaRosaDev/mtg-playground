import { NextResponse } from "next/server";

import { parseColorsFromParam } from "@/lib/browse/color-identity-filter";
import { prisma } from "@/lib/db";
import {
  listPrecons,
  parsePreconOrder,
  parsePreconSort,
} from "@/lib/precons/precons";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await listPrecons(prisma, {
    q: searchParams.get("q"),
    format: searchParams.get("format"),
    type: searchParams.get("type"),
    colors: parseColorsFromParam(searchParams.get("color")),
    sort: parsePreconSort(searchParams.get("sort")),
    order: parsePreconOrder(searchParams.get("order")),
    cursor: searchParams.get("cursor"),
  });
  return NextResponse.json(result);
}
