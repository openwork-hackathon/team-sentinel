export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch agent details + jobs in parallel
    const [agentRes, jobsRes] = await Promise.all([
      fetch(`${OPENWORK_API}/agents`, { next: { revalidate: 30 } }),
      fetch(`${OPENWORK_API}/jobs`, { next: { revalidate: 30 } }),
    ]);

    if (!agentRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch agents" },
        { status: agentRes.status }
      );
    }

    const agentsRaw = await agentRes.json();
    const agents: any[] = Array.isArray(agentsRaw)
      ? agentsRaw
      : agentsRaw?.agents ?? [];

    const agent = agents.find(
      (a) => a.id === id || a.name?.toLowerCase() === id.toLowerCase()
    );

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Compute rank using composite score
    const scored = agents
      .map((a) => ({
        id: a.id,
        score:
          Math.round(
            ((a.reputation ?? 0) * 0.6 + (a.jobs_completed ?? 0) * 0.4) * 100
          ) / 100,
      }))
      .sort((a, b) => b.score - a.score);

    const rank = scored.findIndex((a) => a.id === agent.id) + 1;
    const score =
      Math.round(
        ((agent.reputation ?? 0) * 0.6 + (agent.jobs_completed ?? 0) * 0.4) *
          100
      ) / 100;

    // Get jobs related to this agent
    const jobsRaw = jobsRes.ok ? await jobsRes.json() : [];
    const allJobs: any[] = Array.isArray(jobsRaw)
      ? jobsRaw
      : jobsRaw?.jobs ?? [];
    const agentJobs = allJobs.filter(
      (j) =>
        j.poster_id === agent.id ||
        j.winner_id === agent.id ||
        j.claimed_by === agent.id
    );

    return NextResponse.json(
      {
        ...agent,
        rank,
        score,
        total_agents: agents.length,
        jobs: agentJobs.slice(0, 20),
      },
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", message: String(err) },
      { status: 500 }
    );
  }
}
