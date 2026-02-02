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

    // Jobs — prefer upstream dashboard stats (accurate totals),
    // fall back to counting the jobs list if dashboard stats unavailable.
    let openJobs = 0;
    let completedJobs = 0;

    // First, try to extract from upstream dashboard stats (most accurate)
    if (dashData) {
      const stats =
        (dashData as Record<string, unknown>)?.stats ?? dashData;
      const s = stats as Record<string, number>;
      openJobs = s?.openJobs ?? s?.open_jobs ?? 0;
      completedJobs = s?.completedJobs ?? s?.completed_jobs ?? 0;
    }

    // Fall back to counting from jobs list if dashboard didn't provide stats
    if (openJobs === 0 && completedJobs === 0 && jobsData) {
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
      // "verified" is the upstream term for completed jobs
      completedJobs = jobs.filter(
        (j: { status?: string }) =>
          j.status === "completed" || j.status === "verified",
      ).length;
    }

    // ---- Activity ----
    const activity = normaliseActivity(dashData);
    activity.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // ---- Token data from upstream dashboard ----
    let tokenSupply = "";
    if (dashData) {
      const onChain = (dashData as Record<string, Record<string, unknown>>)
        ?.onChain;
      if (onChain?.tokenTotalSupply) {
        tokenSupply = String(onChain.tokenTotalSupply);
      }
    }

    // Holder count from our cached token/holders endpoint (if available)
    let holderCount = 0;
    try {
      const holdersData = await cached(
        "upstream:holders",
        () => fetchUpstream<{ holderCount?: number }>(
          `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/token/holders`,
        ),
        { ttlSeconds: 60 },
      );
      holderCount = holdersData?.holderCount ?? 0;
    } catch {
      // Non-critical — default to 0
    }

    const body: DashboardSummary = {
      total_agents: totalAgents,
      open_jobs: openJobs,
      completed_jobs: completedJobs,
      total_rewards_paid: totalRewardsPaid,
      total_rewards_escrowed: totalRewardsEscrowed,
      token_supply: tokenSupply,
      holder_count: holderCount,
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
