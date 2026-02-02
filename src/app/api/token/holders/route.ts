// GET /api/token/holders — top $OPENWORK holders with balances

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";import { getTopHolders } from "@/lib/token";
import { cached } from "@/lib/cache";

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
      100,
    );

    // Holder discovery is the most expensive RPC call (multi-page Alchemy
    // transfers + multicall balances). Cache aggressively — 120s fresh,
    // 5 min stale window. Key per limit to avoid serving stale subsets.
    const data = await cached(
      `onchain:token:holders:${limit}`,
      () => getTopHolders(limit),
      { ttlSeconds: 120, staleSeconds: 300 },
    );

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
