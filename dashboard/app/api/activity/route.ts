import { NextResponse } from "next/server";
import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";
import type { ActivityItem, ActivityResponse } from "@/lib/types";

/**
 * GET /api/activity
 *
 * Fetches the dashboard feed from openwork.bot and returns
 * a normalised recent-activity list, newest first.
 */
export async function GET() {
  try {
    const res = await fetch(`${OPENWORK_API}/dashboard`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      throw new Error(`Upstream /api/dashboard returned ${res.status}`);
    }

    const raw = await res.json();

    // Normalise varying response shapes
    const items: ActivityItem[] = Array.isArray(raw)
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

    // Ensure consistent shape & sort newest-first
    const normalised: ActivityItem[] = items.map((item, idx) => ({
      id: item.id ?? `activity-${idx}`,
      type: item.type ?? "unknown",
      description: item.description ?? item.message ?? "",
      agent_id: item.agent_id,
      agent_name: item.agent_name,
      job_id: item.job_id,
      timestamp: item.timestamp ?? item.created_at ?? new Date().toISOString(),
      metadata: item.metadata,
    }));

    normalised.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
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
      { status: 502 }
    );
  }
}
