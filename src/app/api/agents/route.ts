// GET /api/agents — list agents with caching, filtering, and sorting

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";
import { cached } from "@/lib/cache";

interface UpstreamAgent {
  id: string;
  name?: string;
  status?: string;
  reputation?: number;
  jobs_completed?: number;
  specialties?: string[];
  skills?: string[];
  [key: string]: unknown;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const skill = searchParams.get("skill");
    const sort = searchParams.get("sort") ?? "score";
    const order = searchParams.get("order") ?? "desc";
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "100", 10),
      500,
    );
    const q = searchParams.get("q")?.toLowerCase();

    // Fetch all agents with a 30-second TTL cache
    const allAgents = await cached<UpstreamAgent[]>(
      "upstream:agents:list",
      async () => {
        const res = await fetch(`${OPENWORK_API}/agents`, {
          next: { revalidate: 30 },
        });
        if (!res.ok) throw new Error(`Upstream returned ${res.status}`);
        const raw = await res.json();
        return Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.agents)
            ? raw.agents
            : [];
      },
      { ttlSeconds: 30 },
    );

    // Compute scores for all agents
    const scored = allAgents.map((a) => ({
      ...a,
      score:
        Math.round(
          ((a.reputation ?? 0) * 0.6 + (a.jobs_completed ?? 0) * 0.4) * 100,
        ) / 100,
    }));

    // Filter by status
    let agents = status
      ? scored.filter((a) => a.status === status)
      : scored;

    // Filter by skill
    if (skill) {
      const skillLower = skill.toLowerCase();
      agents = agents.filter((a) =>
        [...(a.specialties ?? []), ...(a.skills ?? [])].some(
          (s) => s.toLowerCase() === skillLower,
        ),
      );
    }

    // Search by name
    if (q) {
      agents = agents.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q),
      );
    }

    // Sort
    agents = [...agents].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      if (sort === "score") {
        aVal = (a as { score: number }).score;
        bVal = (b as { score: number }).score;
      } else if (sort === "reputation") {
        aVal = a.reputation ?? 0;
        bVal = b.reputation ?? 0;
      } else if (sort === "jobs_completed") {
        aVal = a.jobs_completed ?? 0;
        bVal = b.jobs_completed ?? 0;
      } else {
        aVal = String((a as Record<string, unknown>)[sort] ?? "");
        bVal = String((b as Record<string, unknown>)[sort] ?? "");
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return order === "asc" ? aVal - bVal : bVal - aVal;
      }
      return order === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    // Limit
    const filtered = agents.length;
    agents = agents.slice(0, limit);

    return NextResponse.json(
      {
        agents,
        total: allAgents.length,
        filtered,
        active: allAgents.filter((a) => a.status === "active").length,
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("[/api/agents]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch agents",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
