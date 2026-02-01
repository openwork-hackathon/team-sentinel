// GET /api/market — job market overview
// Aggregates open/completed counts, reward stats, skill distribution.

import { NextResponse } from "next/server";
import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";
import { cached } from "@/lib/cache";
import type { MarketResponse, RewardDistribution } from "@/types";

interface UpstreamJob {
  id: string;
  title?: string;
  status?: string;
  reward?: number;
  skills_required?: string[];
  created_at?: string;
  completed_at?: string;
}

export const revalidate = 30;

export async function GET() {
  try {
    const raw = await cached(
      "upstream:jobs",
      async () => {
        const res = await fetch(`${OPENWORK_API}/jobs`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Upstream /api/jobs returned ${res.status}`);
        return res.json();
      },
      { ttlSeconds: 30 },
    );
    const jobs: UpstreamJob[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.jobs)
        ? raw.jobs
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

    const openJobs = jobs.filter(
      (j) => j.status === "open" || j.status === "available",
    );
    const completedJobs = jobs.filter((j) => j.status === "completed");

    // Reward stats
    const rewards = jobs
      .map((j) => j.reward ?? 0)
      .filter((r) => r > 0)
      .sort((a, b) => a - b);

    const avgReward =
      rewards.length > 0
        ? rewards.reduce((s, r) => s + r, 0) / rewards.length
        : 0;

    const medianReward =
      rewards.length > 0
        ? rewards.length % 2 === 0
          ? (rewards[rewards.length / 2 - 1] + rewards[rewards.length / 2]) / 2
          : rewards[Math.floor(rewards.length / 2)]
        : 0;

    // Distribution buckets
    const buckets: [string, number, number][] = [
      ["0-10", 0, 10],
      ["10-50", 10, 50],
      ["50-100", 50, 100],
      ["100-500", 100, 500],
      ["500-1000", 500, 1000],
      ["1000+", 1000, Infinity],
    ];

    const reward_distribution: RewardDistribution[] = buckets.map(
      ([range, min, max]) => ({
        range,
        count: rewards.filter((r) => r >= min && r < max).length,
      }),
    );

    // Top skills
    const skillCounts: Record<string, number> = {};
    for (const j of jobs) {
      for (const s of j.skills_required ?? []) {
        skillCounts[s] = (skillCounts[s] ?? 0) + 1;
      }
    }
    const top_skills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const body: MarketResponse = {
      open_jobs: openJobs.length,
      completed_jobs: completedJobs.length,
      total_jobs: jobs.length,
      avg_reward: Math.round(avgReward * 100) / 100,
      median_reward: Math.round(medianReward * 100) / 100,
      reward_distribution,
      top_skills,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "market_fetch_failed", message, status: 502 },
      { status: 502 },
    );
  }
}
