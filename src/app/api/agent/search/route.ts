// GET /api/agent/search — Structured search across agents, jobs, and activity
// Query params:
//   type: "agents" | "jobs" | "activity" (required)
//   q: search query (optional, matches name/title/description)
//   status: filter by status (optional)
//   skill: filter by skill/specialty (optional)
//   sort: sort field (optional, defaults vary by type)
//   order: "asc" | "desc" (default: "desc")
//   limit: max results (1-100, default 20)

import { NextRequest, NextResponse } from "next/server";
import { OPENWORK_API } from "@/lib/constants";
import { cached } from "@/lib/cache";

interface SearchResult {
  type: "agents" | "jobs" | "activity";
  query: Record<string, string>;
  total: number;
  results: unknown[];
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

function matchesQuery(
  value: string | undefined | null,
  query: string,
): boolean {
  if (!value || !query) return true;
  return value.toLowerCase().includes(query.toLowerCase());
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const skill = searchParams.get("skill") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const order = searchParams.get("order") ?? "desc";
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    100,
  );

  if (!type || !["agents", "jobs", "activity"].includes(type)) {
    return NextResponse.json(
      {
        error: "invalid_type",
        message:
          'Query param "type" is required: "agents" | "jobs" | "activity"',
        example: "/api/agent/search?type=agents&q=code&skill=typescript",
      },
      { status: 400 },
    );
  }

  const queryInfo: Record<string, string> = { type };
  if (q) queryInfo.q = q;
  if (status) queryInfo.status = status;
  if (skill) queryInfo.skill = skill;

  try {
    if (type === "agents") {
      const agents = await cached(
        "search:agents",
        () =>
          fetchJSON<
            Array<{
              id: string;
              name: string;
              description?: string;
              specialties?: string[];
              reputation?: number;
              jobs_completed?: number;
              status?: string;
            }>
          >(`${OPENWORK_API}/agents`),
        { ttlSeconds: 30 },
      );

      let filtered = Array.isArray(agents) ? [...agents] : [];

      if (q) {
        filtered = filtered.filter(
          (a) =>
            matchesQuery(a.name, q) || matchesQuery(a.description, q),
        );
      }
      if (status) {
        filtered = filtered.filter((a) => a.status === status);
      }
      if (skill) {
        const s = skill.toLowerCase();
        filtered = filtered.filter((a) =>
          a.specialties?.some((sp) => sp.toLowerCase().includes(s)),
        );
      }

      const sortKey = sort || "reputation";
      filtered.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey] ?? 0;
        const bVal = (b as Record<string, unknown>)[sortKey] ?? 0;
        const cmp =
          typeof aVal === "number" && typeof bVal === "number"
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));
        return order === "asc" ? cmp : -cmp;
      });

      const results = filtered.slice(0, limit).map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description ?? "",
        specialties: a.specialties ?? [],
        reputation: a.reputation ?? 0,
        jobs_completed: a.jobs_completed ?? 0,
        status: a.status ?? "unknown",
      }));

      const body: SearchResult = {
        type: "agents",
        query: queryInfo,
        total: results.length,
        results,
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json(body, {
        headers: {
          "Cache-Control":
            "public, s-maxage=15, stale-while-revalidate=30",
        },
      });
    }

    if (type === "jobs") {
      const jobs = await cached(
        "search:jobs",
        () =>
          fetchJSON<
            Array<{
              id: string;
              title: string;
              description?: string;
              reward?: number;
              skills_required?: string[];
              status?: string;
              created_at?: string;
            }>
          >(`${OPENWORK_API}/jobs`),
        { ttlSeconds: 30 },
      );

      let filtered = Array.isArray(jobs) ? [...jobs] : [];

      if (q) {
        filtered = filtered.filter(
          (j) =>
            matchesQuery(j.title, q) || matchesQuery(j.description, q),
        );
      }
      if (status) {
        filtered = filtered.filter((j) => j.status === status);
      }
      if (skill) {
        const s = skill.toLowerCase();
        filtered = filtered.filter((j) =>
          j.skills_required?.some((sk) => sk.toLowerCase().includes(s)),
        );
      }

      const sortKey = sort || "reward";
      filtered.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey] ?? 0;
        const bVal = (b as Record<string, unknown>)[sortKey] ?? 0;
        const cmp =
          typeof aVal === "number" && typeof bVal === "number"
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));
        return order === "asc" ? cmp : -cmp;
      });

      const results = filtered.slice(0, limit).map((j) => ({
        id: j.id,
        title: j.title,
        description: (j.description ?? "").slice(0, 200),
        reward: j.reward ?? 0,
        skills_required: j.skills_required ?? [],
        status: j.status ?? "unknown",
        created_at: j.created_at ?? "",
      }));

      const body: SearchResult = {
        type: "jobs",
        query: queryInfo,
        total: results.length,
        results,
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json(body, {
        headers: {
          "Cache-Control":
            "public, s-maxage=15, stale-while-revalidate=30",
        },
      });
    }

    // type === "activity"
    const activity = await cached(
      "search:activity",
      () =>
        fetchJSON<{
          data?: Array<{
            id?: string;
            type: string;
            agent_name?: string;
            description?: string;
            timestamp: string;
          }>;
        }>(`${OPENWORK_API}/events`),
      { ttlSeconds: 30 },
    );

    let filtered = activity?.data ?? [];
    if (q) {
      filtered = filtered.filter(
        (a) =>
          matchesQuery(a.agent_name, q) ||
          matchesQuery(a.description, q) ||
          matchesQuery(a.type, q),
      );
    }

    const results = filtered.slice(0, limit).map((a) => ({
      id: a.id ?? "",
      type: a.type,
      agent: a.agent_name ?? "unknown",
      description: a.description ?? a.type,
      timestamp: a.timestamp,
    }));

    const body: SearchResult = {
      type: "activity",
      query: queryInfo,
      total: results.length,
      results,
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
      { error: "search_failed", message },
      { status: 502 },
    );
  }
}
