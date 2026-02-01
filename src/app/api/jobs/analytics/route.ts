// GET /api/jobs/analytics — job market trends and analytics
// Issue #6: Aggregates job data into summary, trends, reward distribution, top categories.
//
// Query params:
//   period — 7d | 30d | 90d | all (default: 30d)
//   status — open | completed | disputed | all (default: all)

import { NextResponse } from "next/server";
import { OPENWORK_API, CACHE_HEADERS } from "@/lib/constants";

interface UpstreamJob {
  id: string;
  title?: string;
  status?: string;
  reward?: number;
  skills_required?: string[];
  created_at?: string;
  completed_at?: string;
}

interface DailyTrend {
  date: string;
  created: number;
  completed: number;
  rewards: string;
}

interface RewardBucket {
  range: string;
  count: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface AnalyticsResponse {
  summary: {
    total_jobs: number;
    open_jobs: number;
    completed_jobs: number;
    disputed_jobs: number;
    total_rewards_distributed: string;
    avg_reward: string;
  };
  trends: {
    daily: DailyTrend[];
  };
  reward_distribution: {
    buckets: RewardBucket[];
  };
  top_categories: CategoryCount[];
  period: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPeriodCutoff(period: string): Date {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 86_400_000);
    case "30d":
      return new Date(now.getTime() - 30 * 86_400_000);
    case "90d":
      return new Date(now.getTime() - 90 * 86_400_000);
    default:
      return new Date(0); // "all" — include everything
  }
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

/**
 * Infer a category from job title or skills.
 * Simple keyword-based classification.
 */
function inferCategory(job: UpstreamJob): string {
  const text = `${job.title ?? ""} ${(job.skills_required ?? []).join(" ")}`.toLowerCase();

  if (/\b(contract|solidity|smart\s*contract|audit|web3)\b/.test(text))
    return "smart-contracts";
  if (/\b(frontend|ui|ux|design|css|react|component)\b/.test(text))
    return "frontend";
  if (/\b(backend|api|server|database|node|express)\b/.test(text))
    return "backend";
  if (/\b(data|analytics|ml|ai|model|training)\b/.test(text))
    return "data-science";
  if (/\b(devops|deploy|ci|cd|docker|infra)\b/.test(text))
    return "devops";
  if (/\b(docs|documentation|writing|blog|content)\b/.test(text))
    return "documentation";
  if (/\b(test|qa|quality)\b/.test(text)) return "testing";
  if (/\b(review|code\s*review)\b/.test(text)) return "code-review";
  return "general";
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const revalidate = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "30d";
    const statusFilter = searchParams.get("status") ?? "all";

    // Fetch all jobs
    const res = await fetch(`${OPENWORK_API}/jobs`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      throw new Error(`Upstream /api/jobs returned ${res.status}`);
    }

    const raw = await res.json();
    let jobs: UpstreamJob[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.jobs)
        ? raw.jobs
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

    // Apply period filter
    const cutoff = getPeriodCutoff(period);
    jobs = jobs.filter((j) => {
      const created = j.created_at ? new Date(j.created_at) : new Date(0);
      return created >= cutoff;
    });

    // Apply status filter
    if (statusFilter !== "all") {
      jobs = jobs.filter((j) => j.status === statusFilter);
    }

    // Summary
    const openJobs = jobs.filter(
      (j) => j.status === "open" || j.status === "available",
    ).length;
    const completedJobs = jobs.filter((j) => j.status === "completed").length;
    const disputedJobs = jobs.filter((j) => j.status === "disputed").length;

    const rewards = jobs.map((j) => j.reward ?? 0).filter((r) => r > 0);
    const totalRewards = rewards.reduce((s, r) => s + r, 0);
    const avgReward = rewards.length > 0 ? totalRewards / rewards.length : 0;

    // Daily trends
    const dailyMap = new Map<
      string,
      { created: number; completed: number; rewards: number }
    >();

    for (const j of jobs) {
      const dateKey = j.created_at ? toDateKey(j.created_at) : "unknown";
      if (dateKey === "unknown") continue;

      const entry = dailyMap.get(dateKey) ?? {
        created: 0,
        completed: 0,
        rewards: 0,
      };
      entry.created += 1;
      if (j.status === "completed") entry.completed += 1;
      entry.rewards += j.reward ?? 0;
      dailyMap.set(dateKey, entry);
    }

    const daily: DailyTrend[] = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        created: v.created,
        completed: v.completed,
        rewards: String(v.rewards),
      }));

    // Reward distribution
    const rewardBuckets: [string, number, number][] = [
      ["0-1000", 0, 1000],
      ["1000-10000", 1000, 10000],
      ["10000+", 10000, Infinity],
    ];

    const buckets: RewardBucket[] = rewardBuckets.map(([range, min, max]) => ({
      range,
      count: rewards.filter((r) => r >= min && r < max).length,
    }));

    // Top categories
    const catCounts: Record<string, number> = {};
    for (const j of jobs) {
      const cat = inferCategory(j);
      catCounts[cat] = (catCounts[cat] ?? 0) + 1;
    }
    const top_categories: CategoryCount[] = Object.entries(catCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const body: AnalyticsResponse = {
      summary: {
        total_jobs: jobs.length,
        open_jobs: openJobs,
        completed_jobs: completedJobs,
        disputed_jobs: disputedJobs,
        total_rewards_distributed: String(totalRewards),
        avg_reward: String(Math.round(avgReward * 100) / 100),
      },
      trends: { daily },
      reward_distribution: { buckets },
      top_categories,
      period,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(body, {
      headers: {
        ...CACHE_HEADERS,
        // Analytics endpoint — cache 5 minutes
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "analytics_fetch_failed", message, status: 502 },
      { status: 502 },
    );
  }
}
