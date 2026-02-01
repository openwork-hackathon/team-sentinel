// GET /api/escrow/jobs — recent escrow jobs

import { NextResponse } from "next/server";
import { getRecentJobs, JOB_STATUS_LABELS } from "@/lib/escrow";
import { cached } from "@/lib/cache";
import { CACHE_HEADERS } from "@/lib/constants";

export const revalidate = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = Math.min(
      Math.max(parseInt(searchParams.get("count") ?? "10", 10) || 10, 1),
      50,
    );

    const jobs = await cached(
      `onchain:escrow:jobs:${count}`,
      () => getRecentJobs(count),
      { ttlSeconds: 30, staleSeconds: 60 },
    );

    return NextResponse.json(
      {
        jobs: jobs.map((j) => ({
          id: Number(j.id),
          employer: j.employer,
          worker: j.worker,
          amount: j.amount.toString(),
          amount_formatted: j.amountFormatted,
          status: j.statusLabel,
          status_code: j.status,
          created_at: Number(j.createdAt),
          completed_at: Number(j.completedAt),
        })),
        total: jobs.length,
        status_labels: JOB_STATUS_LABELS,
        updated_at: new Date().toISOString(),
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("[/api/escrow/jobs]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch escrow jobs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
