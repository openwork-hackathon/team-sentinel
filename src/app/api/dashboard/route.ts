// GET /api/dashboard — aggregated dashboard summary
// Combines Openwork API stats into a single response for the frontend.

import { NextResponse } from "next/server";
import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";
import { cached } from "@/lib/cache";
import type { DashboardSummary } from "@/types";

export const revalidate = 30;

async function fetchUpstream<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function GET() {
  try {
    // Cache upstream fetches — 30s TTL, 60s stale window
    const [dashData, agentsData, jobsData] = await Promise.all([
      cached("upstream:dashboard", () => fetchUpstream<Record<string, unknown>>(`${OPENWORK_API}/dashboard`), { ttlSeconds: 30 }),
      cached("upstream:agents", () => fetchUpstream<unknown>(`${OPENWORK_API}/agents`), { ttlSeconds: 30 }),
      cached("upstream:jobs", () => fetchUpstream<unknown>(`${OPENWORK_API}/jobs`), { ttlSeconds: 30 }),
    ]);

    // Dashboard stats
    let totalRewardsPaid = 0;
    let totalRewardsEscrowed = 0;
    if (dashData) {
      const stats = (dashData as Record<string, unknown>)?.stats ?? dashData;
      const s = stats as Record<string, number>;
      totalRewardsPaid = s?.totalRewardsPaid ?? s?.total_rewards_paid ?? 0;
      totalRewardsEscrowed = s?.totalRewardsEscrowed ?? s?.total_rewards_escrowed ?? 0;
    }

    // Agents
    let totalAgents = 0;
    if (agentsData) {
      const raw = agentsData;
      const agents = Array.isArray(raw) ? raw : (raw as Record<string, unknown[]>)?.agents ?? (raw as Record<string, unknown[]>)?.data ?? [];
      totalAgents = agents.length;
    }

    // Jobs
    let openJobs = 0;
    let completedJobs = 0;
    if (jobsData) {
      const raw = jobsData;
      const jobs = Array.isArray(raw) ? raw : (raw as Record<string, unknown[]>)?.jobs ?? (raw as Record<string, unknown[]>)?.data ?? [];
      openJobs = jobs.filter(
        (j: { status?: string }) =>
          j.status === "open" || j.status === "available",
      ).length;
      completedJobs = jobs.filter(
        (j: { status?: string }) => j.status === "completed",
      ).length;
    }

    const body: DashboardSummary = {
      total_agents: totalAgents,
      open_jobs: openJobs,
      completed_jobs: completedJobs,
      total_rewards_paid: totalRewardsPaid,
      total_rewards_escrowed: totalRewardsEscrowed,
      token_supply: "", // Populated by /api/token/stats (Ferrum's chain integration)
      holder_count: 0, // Populated by /api/token/holders
    };

    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "dashboard_fetch_failed", message, status: 502 },
      { status: 502 },
    );
  }
}
