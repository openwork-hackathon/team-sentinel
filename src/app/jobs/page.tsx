import Link from "next/link";
import {
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  Coins,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { RewardBarChart } from "@/components/charts/reward-bar-chart";
import { SkillsBarChart } from "@/components/charts/skills-bar-chart";
import { TrendAreaChart } from "@/components/charts/trend-area-chart";
import { OPENWORK_API } from "@/lib/constants";
import { formatNumber, cn } from "@/lib/utils";

interface UpstreamJob {
  id: string;
  title?: string;
  status?: string;
  reward?: number;
  type?: string;
  skills_required?: string[];
  required_specialties?: string[];
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
  recentJobs: UpstreamJob[];
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
      (j) => j.status === "open" || j.status === "available",
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
      for (const s of j.skills_required ?? j.required_specialties ?? []) {
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
      .map(([date, v]) => ({
        date,
        created: v.created,
        completed: v.completed,
      }));

    // Recent jobs — sorted newest first, non-welcome only, top 30
    const recentJobs = jobs
      .filter((j) => !j.title?.startsWith("Welcome "))
      .sort((a, b) =>
        (b.created_at ?? "").localeCompare(a.created_at ?? ""),
      )
      .slice(0, 30);

    return {
      open,
      completed,
      total: jobs.length,
      avgReward,
      medianReward,
      rewardDistribution,
      topSkills,
      dailyTrends,
      recentJobs,
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
      recentJobs: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  claimed: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  submitted: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  verified: "bg-green-500/10 text-green-400 border-green-500/30",
  completed: "bg-green-500/10 text-green-400 border-green-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
};

function timeAgo(iso: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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
        <Badge
          variant="outline"
          className="text-sentinel-red border-sentinel-red/30"
        >
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

      {/* ───── Recent Jobs Listing ───── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Recent Jobs
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Latest 30 (excl. welcome)
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No jobs found
            </p>
          ) : (
            <div className="space-y-2">
              {stats.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-sentinel-red/20 hover:bg-muted/30 transition-all"
                >
                  {/* Status dot */}
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      job.status === "open"
                        ? "bg-blue-400"
                        : job.status === "verified" ||
                            job.status === "completed"
                          ? "bg-green-500"
                          : "bg-muted-foreground/40",
                    )}
                  />

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-sentinel-red transition-colors">
                      {job.title ?? "Untitled Job"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {job.type && (
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {job.type}
                        </span>
                      )}
                      {job.created_at && (
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(job.created_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reward */}
                  {(job.reward ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-sentinel-red flex-shrink-0">
                      <Coins className="w-3 h-3" />
                      {formatNumber(job.reward!)}
                    </span>
                  )}

                  {/* Status badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 capitalize flex-shrink-0",
                      STATUS_BADGE[job.status ?? ""] ?? "",
                    )}
                  >
                    {job.status}
                  </Badge>

                  {/* Arrow */}
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
