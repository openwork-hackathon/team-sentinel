// GET /api/escrow/stats — totalEscrowed, totalReleased, jobCount

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";import { getEscrowStats } from "@/lib/escrow";
import { cached } from "@/lib/cache";
import { CACHE_HEADERS } from "@/lib/constants";

export const revalidate = 30;

export async function GET() {
  try {
    const stats = await cached(
      "onchain:escrow:stats",
      () => getEscrowStats(),
      { ttlSeconds: 30, staleSeconds: 60 },
    );

    return NextResponse.json(
      {
        total_escrowed: stats.totalEscrowed.toString(),
        total_escrowed_formatted: stats.totalEscrowedFormatted,
        total_released: stats.totalReleased.toString(),
        total_released_formatted: stats.totalReleasedFormatted,
        job_count: Number(stats.jobCount),
        updated_at: stats.updatedAt,
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("[/api/escrow/stats]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch escrow stats",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
