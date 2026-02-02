// GET /api/token/sentinel — $SENTINEL bonding curve data from Mint Club V2
//
// Returns live on-chain data for the team's $SENTINEL token:
// - Token metadata (name, symbol, supply, decimals)
// - Bond parameters (royalties, reserve balance, creator)
// - Bonding curve steps (price tiers)
// - Current step based on supply
//
// If token hasn't been created yet, returns { exists: false }.
// Cached for 30s with 60s stale-while-revalidate.

import { NextResponse } from "next/server";
import { getSentinelTokenData } from "@/lib/sentinel-token";
import { cached } from "@/lib/cache";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await cached(
      "onchain:token:sentinel",
      () => getSentinelTokenData(),
      { ttlSeconds: 30, staleSeconds: 60 },
    );

    const status = data.exists ? 200 : 200; // 200 either way — exists=false is valid
    const cacheControl = data.exists
      ? "public, s-maxage=30, stale-while-revalidate=60"
      : "public, s-maxage=10, stale-while-revalidate=30"; // check more often if pending

    return NextResponse.json(
      {
        ...data,
        _hint: data.exists
          ? undefined
          : "Token not yet created on Mint Club V2. Once $SENTINEL is deployed, this endpoint returns live bonding curve data.",
      },
      { headers: { "Cache-Control": cacheControl } },
    );
  } catch (error) {
    console.error("[/api/token/sentinel]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Sentinel token data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
