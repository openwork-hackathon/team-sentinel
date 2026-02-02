// GET /api/dashboard — aggregated dashboard summary with activity feed
// Combines Openwork API stats + activity into a single cached response.
// The LiveActivityFeed component polls this endpoint for real-time data.

import { NextResponse } from "next/server";
import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";
import { cached } from "@/lib/cache";
import type { ActivityItem, DashboardSummary } from "@/types";

export const revalidate = 30;

async function fetchUpstream<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

function normaliseActivity(
  raw: Record<string, unknown> | null,
): ActivityItem[] {
  if (!raw) return [];

  // Upstream dashboard may nest activity under various keys
  const items: Record<string, unknown>[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.activity)
      ? (raw.activity as Record<string, unknown>[])
      : Array.isArray(raw?.data)
        ? (raw.data as Record<string, unknown>[])
        : Array.isArray(raw?.feed)
          ? (raw.feed as Record<string, unknown>[])
          : Array.isArray(raw?.recent_activity)
            ? (raw.recent_activity as Record<string, unknown>[])
            : [];

  return items.slice(0, 50).map((item, idx) => ({
    id: (item.id as string) ?? `activity-${idx}`,
    type: (item.type as string) ?? "unknown",
    description:
      (item.description as string) ??
      (item.message as string) ??
      (item.agent_name
        ? `${item.agent_name}: ${item.type}`
        : (item.type as string) ?? "Activity"),
    agent_id: item.agent_id as string | undefined,
    agent_name: item.agent_name as string | undefined,
    job_id: item.job_id as string | undefined,
    timestamp:
      (item.timestamp as string) ??
      (item.created_at as string) ??
      new Date().toISOString(),
    metadata: item.metadata as Record<string, unknown> | undefined,
  }));
}

export async function GET() {
  const start = Date.now();

  try {
    // Cache upstream fetches — 30s TTL, 60s stale window
    const [dashData, agentsData, jobsData] = await Promise.all([
      cached(
        "upstream:dashboard",
        () =>
          fetchUpstream<Record<string, unknown>>(
            `${OPENWORK_API}/dashboard`,
          ),
        { ttlSeconds: 30 },
      ),
      cached(
        "upstream:agents",
        () => fetchUpstream<unknown>(`${OPENWORK_API}/agents`),
        { ttlSeconds: 30 },
      ),
      cached(
        "upstream:jobs",
        () => fetchUpstream<unknown>(`${OPENWORK_API}/jobs`),
        { ttlSeconds: 30 },
      ),
    ]);

    // ---- Stats ----
    let totalRewardsPaid = 0;
    let totalRewardsEscrowed = 0;
    if (dashData) {
      const stats =
        (dashData as Record<string, unknown>)?.stats ?? dashData;
      const s = stats as Record<string, number>;
      totalRewardsPaid = s?.totalRewardsPaid ?? s?.total_rewards_paid ?? 0;
      totalRewardsEscrowed =
        s?.totalRewardsEscrowed ?? s?.total_rewards_escrowed ?? 0;
    }

    // Agents
    let totalAgents = 0;
    if (agentsData) {
      const raw = agentsData;
      const agents = Array.isArray(raw)
        ? raw
        : ((raw as Record<string, unknown[]>)?.agents ??
          (raw as Record<string, unknown[]>)?.data ??
          []);
      totalAgents = agents.length;
    }

    // Jobs
    let openJobs = 0;
    let completedJobs = 0;
    if (jobsData) {
      const raw = jobsData;
      const jobs = Array.isArray(raw)
        ? raw
        : ((raw as Record<string, unknown[]>)?.jobs ??
          (raw as Record<string, unknown[]>)?.data ??
          []);
      openJobs = jobs.filter(
        (j: { status?: string }) =>
          j.status === "open" || j.status === "available",
      ).length;
      completedJobs = jobs.filter(
        (j: { status?: string }) => j.status === "completed",
      ).length;
    }

    // ---- Activity ----
    const activity = normaliseActivity(dashData);
    activity.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const body: DashboardSummary = {
      total_agents: totalAgents,
      open_jobs: openJobs,
      completed_jobs: completedJobs,
      total_rewards_paid: totalRewardsPaid,
      total_rewards_escrowed: totalRewardsEscrowed,
      token_supply: "",
      holder_count: 0,
      activity,
    };

    return NextResponse.json(body, {
      headers: {
        ...CACHE_HEADERS,
        "X-Response-Time": `${Date.now() - start}ms`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "dashboard_fetch_failed", message, status: 502 },
      { status: 502, headers: { "X-Response-Time": `${Date.now() - start}ms` } },
    );
  }
}
