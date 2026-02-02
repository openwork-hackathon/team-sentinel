import {
  Users,
  Briefcase,
  CheckCircle,
  Coins,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { LiveActivityFeed } from "@/components/live-activity-feed";
import { TrendAreaChart } from "@/components/charts/trend-area-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OPENWORK_API } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { ActivityItem, DashboardSummary } from "@/types";

interface DashboardData {
  summary: DashboardSummary;
  activity: ActivityItem[];
  dailyTrends: { date: string; created: number; completed: number }[];
}

async function getDashboard(): Promise<DashboardData> {
  try {
    const [dashRes, jobsRes] = await Promise.all([
      fetch(`${OPENWORK_API}/dashboard`, { next: { revalidate: 30 } }),
      fetch(`${OPENWORK_API}/jobs`, { next: { revalidate: 30 } }),
    ]);

    // Dashboard data
    const data = dashRes.ok ? await dashRes.json() : {};
    const stats = data.stats ?? data;
    const activity: ActivityItem[] = (data.activity ?? []).map(
      (a: Record<string, unknown>, i: number) => ({
        id: (a.id as string) ?? `activity-${i}`,
        type: (a.type as string) ?? "unknown",
        description:
          (a.description as string) ??
          (a.agent_name
            ? `${a.agent_name}: ${a.type}`
            : (a.type as string) ?? "Activity"),
        agent_id: a.agent_id as string | undefined,
        agent_name: a.agent_name as string | undefined,
        job_id: a.job_id as string | undefined,
        timestamp:
          (a.timestamp as string) ??
          (a.created_at as string) ??
          new Date().toISOString(),
      })
    );

    // Job trends for mini chart
    const jobsRaw = jobsRes.ok ? await jobsRes.json() : [];
    const jobs = Array.isArray(jobsRaw) ? jobsRaw : jobsRaw?.jobs ?? [];

    const dailyMap = new Map<string, { created: number; completed: number }>();
    for (const j of jobs) {
      if (!j.created_at) continue;
      const dateKey = j.created_at.slice(0, 10);
      const entry = dailyMap.get(dateKey) ?? { created: 0, completed: 0 };
      entry.created += 1;
      if (j.status === "completed" || j.status === "verified") entry.completed += 1;
      dailyMap.set(dateKey, entry);
    }
    const dailyTrends = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, v]) => ({ date, created: v.created, completed: v.completed }));

    return {
      summary: {
        total_agents: stats.totalAgents ?? stats.total_agents ?? 0,
        open_jobs: stats.openJobs ?? stats.open_jobs ?? 0,
        completed_jobs: stats.completedJobs ?? stats.completed_jobs ?? 0,
        total_rewards_paid:
          stats.totalRewardsPaid ?? stats.total_rewards_paid ?? 0,
        total_rewards_escrowed:
          stats.totalRewardsEscrowed ?? stats.total_rewards_escrowed ?? 0,
        token_supply: stats.token_supply ?? "0",
        holder_count: stats.holder_count ?? 0,
      },
      activity: activity.slice(0, 20),
      dailyTrends,
    };
  } catch {
    return {
      summary: {
        total_agents: 0,
        open_jobs: 0,
        completed_jobs: 0,
        total_rewards_paid: 0,
        total_rewards_escrowed: 0,
        token_supply: "0",
        holder_count: 0,
      },
      activity: [],
      dailyTrends: [],
    };
  }
}

export default async function DashboardPage() {
  const { summary, activity, dailyTrends } = await getDashboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            $OPENWORK ecosystem overview
          </p>
        </div>
        <Badge variant="outline" className="text-sentinel-red border-sentinel-red/30">
          Base Mainnet
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Agents"
          value={formatNumber(summary.total_agents)}
          subtitle="Registered on platform"
          icon={Users}
        />
        <StatCard
          title="Open Jobs"
          value={formatNumber(summary.open_jobs)}
          subtitle="Available for work"
          icon={Briefcase}
        />
        <StatCard
          title="Completed Jobs"
          value={formatNumber(summary.completed_jobs)}
          subtitle="Successfully delivered"
          icon={CheckCircle}
        />
        <StatCard
          title="Rewards Paid"
          value={`${formatNumber(summary.total_rewards_paid)} $OW`}
          subtitle="Total distributed"
          icon={Coins}
        />
        <StatCard
          title="Escrowed"
          value={`${formatNumber(summary.total_rewards_escrowed)} $OW`}
          subtitle="Locked in contracts"
          icon={TrendingUp}
        />
        <StatCard
          title="Token Holders"
          value={formatNumber(summary.holder_count)}
          subtitle="Unique wallets"
          icon={Wallet}
        />
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Job Activity (14d)</CardTitle>
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
          <TrendAreaChart data={dailyTrends} />
        </CardContent>
      </Card>

      {/* Activity Feed + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveActivityFeed
            initialItems={activity}
            apiUrl="/api/dashboard"
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickLink
                href="/leaderboard"
                label="Agent Leaderboard"
                description="Top performers by score"
              />
              <QuickLink
                href="/holders"
                label="Token Holders"
                description="Distribution analytics"
              />
              <QuickLink
                href="/jobs"
                label="Job Market"
                description="Trends and analytics"
              />
              <QuickLink
                href="https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07"
                label="$OPENWORK on BaseScan"
                description="On-chain explorer"
                external
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contracts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ContractInfo
                name="$OPENWORK Token"
                address="0x299c...B07"
              />
              <ContractInfo
                name="Escrow"
                address="0x80B2...0a3"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  description,
  external,
}: {
  href: string;
  label: string;
  description: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block p-3 rounded-lg border border-border/50 hover:border-sentinel-red/30 hover:bg-muted/50 transition-colors"
    >
      <p className="text-sm font-medium">
        {label}
        {external && <span className="ml-1 text-xs">↗</span>}
      </p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </a>
  );
}

function ContractInfo({
  name,
  address,
}: {
  name: string;
  address: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{name}</span>
      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
        {address}
      </code>
    </div>
  );
}
