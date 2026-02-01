// GET /api/escrow/stats — totalEscrowed, totalReleased, jobCount

import { NextResponse } from "next/server";
import { getEscrowStats } from "@/lib/escrow";

export const revalidate = 30;

export async function GET() {
  try {
    const stats = await getEscrowStats();

    return NextResponse.json(
      {
        total_escrowed: stats.totalEscrowed.toString(),
        total_escrowed_formatted: stats.totalEscrowedFormatted,
        total_released: stats.totalReleased.toString(),
        total_released_formatted: stats.totalReleasedFormatted,
        job_count: Number(stats.jobCount),
        updated_at: stats.updatedAt,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
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
