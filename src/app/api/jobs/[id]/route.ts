// GET /api/jobs/:id — fetch a single job from upstream

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const res = await fetch(`${OPENWORK_API}/jobs/${params.id}`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Job not found", message: `Upstream returned ${res.status}` },
        { status: res.status },
      );
    }

    const job = await res.json();
    return NextResponse.json(job, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("[/api/jobs/:id]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch job",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
