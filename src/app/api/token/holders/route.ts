// GET /api/token/holders — top $OPENWORK holders with balances

import { NextResponse } from "next/server";
import { getTopHolders } from "@/lib/token";

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
      100,
    );

    const data = await getTopHolders(limit);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[/api/token/holders]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch token holders",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
