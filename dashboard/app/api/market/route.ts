import { NextResponse } from "next/server";
import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";
import type { Job, MarketResponse, RewardDistribution } from "@/lib/types";

/**
 * GET /api/market
 *
 * Fetches jobs from openwork.bot, aggregates into market overview:
 * open/completed counts, avg & median reward, reward distribution
 * buckets, and top requested skills.
 */
export async function GET() {
  try {
    const res = await fetch(`${OPENWORK_API}/jobs`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      throw new Error(`Upstream /api/jobs returned ${res.status}`);
    }

    const raw = await res.json();
    const jobs: Job[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.jobs)
        ? raw.jobs
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

    // Counts
    const openJobs = jobs.filter(
      (j) => j.status === "open" || j.status === "available"
    );
    const completedJobs = jobs.filter((j) => j.status === "completed");

    // Rewards
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

    const rewardDistribution: RewardDistribution[] = buckets.map(
      ([range, min, max]) => ({
        range,
        count: rewards.filter((r) => r >= min && r < max).length,
      })
    );

    // Top skills
    const skillCounts: Record<string, number> = {};
    jobs.forEach((j) => {
      (j.skills_required ?? []).forEach((s) => {
        skillCounts[s] = (skillCounts[s] ?? 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const body: MarketResponse = {
      open_jobs: openJobs.length,
      completed_jobs: completedJobs.length,
      total_jobs: jobs.length,
      avg_reward: Math.round(avgReward * 100) / 100,
      median_reward: Math.round(medianReward * 100) / 100,
      reward_distribution: rewardDistribution,
      top_skills: topSkills,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "market_fetch_failed", message, status: 502 },
      { status: 502 }
    );
  }
}
