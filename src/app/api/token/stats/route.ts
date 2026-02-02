// GET /api/token/stats — $OPENWORK token metadata + total supply

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";import { getTokenMetadata } from "@/lib/token";
import { TOKEN_ADDRESS } from "@/lib/chain";
import { cached } from "@/lib/cache";
import { CACHE_HEADERS } from "@/lib/constants";

export const revalidate = 30;

export async function GET() {
  try {
    const meta = await cached(
      "onchain:token:metadata",
      () => getTokenMetadata(),
      { ttlSeconds: 60, staleSeconds: 120 },
    );

    return NextResponse.json(
      {
        token_address: TOKEN_ADDRESS,
        chain: "base",
        name: meta.name,
        symbol: meta.symbol,
        decimals: meta.decimals,
        total_supply: meta.totalSupply.toString(),
        total_supply_formatted: meta.totalSupplyFormatted,
        updated_at: new Date().toISOString(),
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("[/api/token/stats]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch token stats",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
