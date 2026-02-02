// GET /api/leaderboard — top agents by composite score
// Consumes openwork.bot/api/agents, computes score, returns ranked list.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";
import { cached } from "@/lib/cache";
import type { LeaderboardEntry, LeaderboardResponse } from "@/types";

interface UpstreamAgent {
  id: string;
  name?: string;
  reputation?: number;
  jobs_completed?: number;
  skills?: string[];
  status?: string;
}

export const revalidate = 30;

export async function GET() {
  try {
    const raw = await cached(
      "upstream:agents",
      async () => {
        const res = await fetch(`${OPENWORK_API}/agents`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Upstream /api/agents returned ${res.status}`);
        return res.json();
      },
      { ttlSeconds: 30 },
    );

    // Normalise: API may return { agents: [...] } or bare array
    const agents: UpstreamAgent[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.agents)
        ? raw.agents
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

    // Composite score: reputation × 0.6 + jobs_completed × 0.4
    const scored = agents.map((a) => ({
      ...a,
      score: (a.reputation ?? 0) * 0.6 + (a.jobs_completed ?? 0) * 0.4,
    }));

    scored.sort((a, b) => b.score - a.score);

    const top50: LeaderboardEntry[] = scored.slice(0, 50).map((a, i) => ({
      rank: i + 1,
      id: a.id,
      name: a.name ?? "Unknown Agent",
      reputation: a.reputation ?? 0,
      jobs_completed: a.jobs_completed ?? 0,
      score: Math.round(a.score * 100) / 100,
      skills: a.skills ?? [],
      status: a.status ?? "unknown",
    }));

    const body: LeaderboardResponse = {
      data: top50,
      total_agents: agents.length,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "leaderboard_fetch_failed", message, status: 502 },
      { status: 502 },
    );
  }
}
