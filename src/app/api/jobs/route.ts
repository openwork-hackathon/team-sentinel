// GET /api/jobs — list all jobs from upstream with caching + optional filters

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";
import { cached } from "@/lib/cache";

interface UpstreamJob {
  id: string;
  title?: string;
  status?: string;
  reward?: number;
  type?: string;
  created_at?: string;
  [key: string]: unknown;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "100", 10),
      500,
    );
    const sort = searchParams.get("sort") ?? "created_at";
    const order = searchParams.get("order") ?? "desc";

    // Fetch all jobs with a 30-second TTL cache
    const allJobs = await cached<UpstreamJob[]>(
      "upstream:jobs:list",
      async () => {
        const res = await fetch(`${OPENWORK_API}/jobs`, {
          next: { revalidate: 30 },
        });
        if (!res.ok)
          throw new Error(`Upstream returned ${res.status}`);
        const raw = await res.json();
        return Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.jobs)
            ? raw.jobs
            : [];
      },
      { ttlSeconds: 30 },
    );

    // Filter by status
    let jobs = status
      ? allJobs.filter((j) => j.status === status)
      : allJobs;

    // Sort
    jobs = [...jobs].sort((a, b) => {
      const aVal = String(a[sort] ?? "");
      const bVal = String(b[sort] ?? "");
      return order === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    // Limit
    jobs = jobs.slice(0, limit);

    return NextResponse.json(
      { jobs, total: allJobs.length, filtered: jobs.length },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("[/api/jobs]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch jobs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
