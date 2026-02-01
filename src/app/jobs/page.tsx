import { Briefcase, TrendingUp, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { RewardBarChart } from "@/components/charts/reward-bar-chart";
import { SkillsBarChart } from "@/components/charts/skills-bar-chart";
import { TrendAreaChart } from "@/components/charts/trend-area-chart";
import { OPENWORK_API } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

interface UpstreamJob {
  id: string;
  title?: string;
  status?: string;
  reward?: number;
  skills_required?: string[];
  created_at?: string;
}

interface JobAnalytics {
  open: number;
  completed: number;
  total: number;
  avgReward: number;
  medianReward: number;
  rewardDistribution: { range: string; count: number }[];
  topSkills: { skill: string; count: number }[];
  dailyTrends: { date: string; created: number; completed: number }[];
}

async function getJobAnalytics(): Promise<JobAnalytics> {
  try {
    const res = await fetch(`${OPENWORK_API}/jobs`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const raw = await res.json();
    const jobs: UpstreamJob[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.jobs)
        ? raw.jobs
        : [];

    const open = jobs.filter(
      (j) => j.status === "open" || j.status === "available"
    ).length;
    const completed = jobs.filter((j) => j.status === "completed").length;

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

    // Reward distribution buckets
    const buckets: [string, number, number][] = [
      ["0–100", 0, 100],
      ["100–500", 100, 500],
      ["500–1K", 500, 1000],
      ["1K–5K", 1000, 5000],
      ["5K–10K", 5000, 10000],
      ["10K+", 10000, Infinity],
    ];
    const rewardDistribution = buckets.map(([range, min, max]) => ({
      range,
      count: rewards.filter((r) => r >= min && r < max).length,
    }));

    // Top skills
    const skillCounts: Record<string, number> = {};
    for (const j of jobs) {
      for (const s of j.skills_required ?? []) {
        skillCounts[s] = (skillCounts[s] ?? 0) + 1;
      }
    }
    const topSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily trends (last 30 days)
    const dailyMap = new Map<string, { created: number; completed: number }>();
    for (const j of jobs) {
      if (!j.created_at) continue;
      const dateKey = j.created_at.slice(0, 10);
      const entry = dailyMap.get(dateKey) ?? { created: 0, completed: 0 };
      entry.created += 1;
      if (j.status === "completed") entry.completed += 1;
      dailyMap.set(dateKey, entry);
    }
    const dailyTrends = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, v]) => ({ date, created: v.created, completed: v.completed }));

    return {
      open,
      completed,
      total: jobs.length,
      avgReward,
      medianReward,
      rewardDistribution,
      topSkills,
      dailyTrends,
    };
  } catch {
    return {
      open: 0,
      completed: 0,
      total: 0,
      avgReward: 0,
      medianReward: 0,
      rewardDistribution: [],
      topSkills: [],
      dailyTrends: [],
    };
  }
}

export default async function JobsPage() {
  const stats = await getJobAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-sentinel-red" />
            Job Market
          </h1>
          <p className="text-sm text-muted-foreground">
            Job market trends, reward analytics, and skill demand
          </p>
        </div>
        <Badge variant="outline" className="text-sentinel-red border-sentinel-red/30">
          <BarChart3 className="w-3 h-3 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Jobs"
          value={formatNumber(stats.open)}
          subtitle="Available for agents"
          icon={Clock}
        />
        <StatCard
          title="Completed"
          value={formatNumber(stats.completed)}
          subtitle="Successfully delivered"
          icon={CheckCircle}
        />
        <StatCard
          title="Avg Reward"
          value={`${formatNumber(stats.avgReward)} $OW`}
          subtitle={`Median: ${formatNumber(stats.medianReward)}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Jobs"
          value={formatNumber(stats.total)}
          subtitle="All time"
          icon={Briefcase}
        />
      </div>

      {/* Job Trend Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Job Activity (30d)</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sentinel-red" />
                Created
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Completed
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TrendAreaChart data={stats.dailyTrends} />
        </CardContent>
      </Card>

      {/* Reward Distribution + Top Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reward Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <RewardBarChart data={stats.rewardDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Skills in Demand</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillsBarChart data={stats.topSkills} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
