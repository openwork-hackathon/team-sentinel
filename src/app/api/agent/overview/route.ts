// GET /api/agent/overview — Single-call ecosystem snapshot for AI agents
// Returns everything an agent needs in one flat, concise response.
// Designed for programmatic consumption — no nested UI concerns.

import { NextResponse } from "next/server";
import { OPENWORK_API, ALCHEMY_RPC } from "@/lib/constants";
import { cached, cacheStats } from "@/lib/cache";
import { getEscrowStats } from "@/lib/escrow";

interface AgentOverview {
  sentinel: {
    version: string;
    status: "healthy" | "degraded" | "down";
    cache: ReturnType<typeof cacheStats>;
  };
  ecosystem: {
    total_agents: number;
    active_agents: number;
    open_jobs: number;
    completed_jobs: number;
    total_jobs: number;
    rewards_paid: number;
    rewards_escrowed: number;
  };
  onchain: {
    escrow_balance: string;
    escrow_released: string;
    escrow_job_count: number;
    block_number: number | null;
  };
  top_agents: Array<{
    name: string;
    reputation: number;
    jobs_completed: number;
    specialties: string[];
  }>;
  recent_activity: Array<{
    type: string;
    agent: string;
    description: string;
    timestamp: string;
  }>;
  hot_jobs: Array<{
    id: string;
    title: string;
    reward: number;
    skills: string[];
    status: string;
  }>;
  updated_at: string;
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function getBlockNumber(): Promise<number | null> {
  try {
    const res = await fetch(ALCHEMY_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
      }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result ? parseInt(data.result, 16) : null;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [dashboard, agents, jobs, activity, escrow, blockNum] =
      await Promise.all([
        cached(
          "agent:dashboard",
          () =>
            fetchJSON<Record<string, unknown>>(
              `${OPENWORK_API}/dashboard`,
            ),
          { ttlSeconds: 30 },
        ),
        cached(
          "agent:agents",
          () =>
            fetchJSON<
              Array<{
                name: string;
                reputation: number;
                jobs_completed: number;
                specialties?: string[];
                status?: string;
              }>
            >(`${OPENWORK_API}/agents`),
          { ttlSeconds: 60 },
        ),
        cached(
          "agent:jobs",
          () =>
            fetchJSON<
              Array<{
                id: string;
                title: string;
                reward: number;
                skills_required?: string[];
                status: string;
              }>
            >(`${OPENWORK_API}/jobs`),
          { ttlSeconds: 30 },
        ),
        cached(
          "agent:activity",
          () =>
            fetchJSON<{
              data?: Array<{
                type: string;
                agent_name?: string;
                description?: string;
                timestamp: string;
              }>;
            }>(`${OPENWORK_API}/events`),
          { ttlSeconds: 30 },
        ),
        cached("agent:escrow", () => getEscrowStats(), { ttlSeconds: 120 }),
        cached("agent:block", () => getBlockNumber(), { ttlSeconds: 15 }),
      ]);

    // Parse agents
    const agentsList = Array.isArray(agents) ? agents : [];
    const activeAgents = agentsList.filter(
      (a) => a.status === "active",
    ).length;
    const topAgents = [...agentsList]
      .sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0))
      .slice(0, 10)
      .map((a) => ({
        name: a.name,
        reputation: a.reputation ?? 0,
        jobs_completed: a.jobs_completed ?? 0,
        specialties: a.specialties ?? [],
      }));

    // Parse jobs
    const jobsList = Array.isArray(jobs) ? jobs : [];
    const openJobs = jobsList.filter(
      (j) => j.status === "open" || j.status === "available",
    );
    const completedJobs = jobsList.filter(
      (j) => j.status === "completed",
    );
    const hotJobs = openJobs
      .sort((a, b) => (b.reward ?? 0) - (a.reward ?? 0))
      .slice(0, 5)
      .map((j) => ({
        id: j.id,
        title: j.title,
        reward: j.reward ?? 0,
        skills: j.skills_required ?? [],
        status: j.status,
      }));

    // Parse activity
    const activityData = activity?.data ?? [];
    const recentActivity = activityData.slice(0, 10).map((a) => ({
      type: a.type,
      agent: a.agent_name ?? "unknown",
      description: a.description ?? a.type,
      timestamp: a.timestamp,
    }));

    // Parse dashboard stats
    const stats = (dashboard as Record<string, unknown>)?.stats ??
      dashboard ?? {};
    const s = stats as Record<string, number>;

    // Determine overall health
    let status: "healthy" | "degraded" | "down" = "healthy";
    if (!dashboard && !agents) status = "down";
    else if (!dashboard || !agents) status = "degraded";

    const body: AgentOverview = {
      sentinel: {
        version: "1.0.0",
        status,
        cache: cacheStats(),
      },
      ecosystem: {
        total_agents: agentsList.length,
        active_agents: activeAgents,
        open_jobs: openJobs.length,
        completed_jobs: completedJobs.length,
        total_jobs: jobsList.length,
        rewards_paid: s?.totalRewardsPaid ?? s?.total_rewards_paid ?? 0,
        rewards_escrowed:
          s?.totalRewardsEscrowed ?? s?.total_rewards_escrowed ?? 0,
      },
      onchain: {
        escrow_balance: escrow?.totalEscrowedFormatted ?? "0",
        escrow_released: escrow?.totalReleasedFormatted ?? "0",
        escrow_job_count: Number(escrow?.jobCount ?? 0),
        block_number: blockNum ?? null,
      },
      top_agents: topAgents,
      recent_activity: recentActivity,
      hot_jobs: hotJobs,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "overview_failed", message },
      { status: 502 },
    );
  }
}
