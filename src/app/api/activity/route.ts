// GET /api/activity — recent ecosystem activity feed
// Normalises varying upstream shapes, returns newest-first.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";
import { cached } from "@/lib/cache";
import type { ActivityItem, ActivityResponse } from "@/types";

export const revalidate = 30;

export async function GET() {
  try {
    const raw = await cached(
      "upstream:dashboard",
      async () => {
        const res = await fetch(`${OPENWORK_API}/dashboard`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Upstream /api/dashboard returned ${res.status}`);
        return res.json();
      },
      { ttlSeconds: 30 },
    );

    // Normalise varying response shapes
    const items: Record<string, unknown>[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.activity)
        ? raw.activity
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.feed)
            ? raw.feed
            : Array.isArray(raw?.recent_activity)
              ? raw.recent_activity
              : [];

    const normalised: ActivityItem[] = items.map((item, idx) => ({
      id: (item.id as string) ?? `activity-${idx}`,
      type: (item.type as string) ?? "unknown",
      description:
        (item.description as string) ?? (item.message as string) ?? "",
      agent_id: item.agent_id as string | undefined,
      agent_name: item.agent_name as string | undefined,
      job_id: item.job_id as string | undefined,
      timestamp:
        (item.timestamp as string) ??
        (item.created_at as string) ??
        new Date().toISOString(),
      metadata: item.metadata as Record<string, unknown> | undefined,
    }));

    normalised.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const body: ActivityResponse = {
      data: normalised.slice(0, 100),
      total: normalised.length,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "activity_fetch_failed", message, status: 502 },
      { status: 502 },
    );
  }
}
