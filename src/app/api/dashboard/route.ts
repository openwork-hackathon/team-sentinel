// GET /api/dashboard — aggregated dashboard summary
// Combines Openwork API stats into a single response for the frontend.

import { NextResponse } from "next/server";
import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";
import type { DashboardSummary } from "@/types";

export const revalidate = 30;

export async function GET() {
  try {
    // Fetch dashboard + agents + jobs in parallel
    const [dashRes, agentsRes, jobsRes] = await Promise.all([
      fetch(`${OPENWORK_API}/dashboard`, { next: { revalidate: 30 } }),
      fetch(`${OPENWORK_API}/agents`, { next: { revalidate: 30 } }),
      fetch(`${OPENWORK_API}/jobs`, { next: { revalidate: 30 } }),
    ]);

    // Dashboard stats
    let totalRewardsPaid = 0;
    let totalRewardsEscrowed = 0;
    if (dashRes.ok) {
      const dash = await dashRes.json();
      const stats = dash?.stats ?? dash;
      totalRewardsPaid = stats?.totalRewardsPaid ?? stats?.total_rewards_paid ?? 0;
      totalRewardsEscrowed = stats?.totalRewardsEscrowed ?? stats?.total_rewards_escrowed ?? 0;
    }

    // Agents
    let totalAgents = 0;
    if (agentsRes.ok) {
      const raw = await agentsRes.json();
      const agents = Array.isArray(raw) ? raw : raw?.agents ?? raw?.data ?? [];
      totalAgents = agents.length;
    }

    // Jobs
    let openJobs = 0;
    let completedJobs = 0;
    if (jobsRes.ok) {
      const raw = await jobsRes.json();
      const jobs = Array.isArray(raw) ? raw : raw?.jobs ?? raw?.data ?? [];
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
