import { Briefcase, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { OPENWORK_API } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

interface JobStats {
  open: number;
  completed: number;
  total: number;
  avgReward: number;
}

async function getJobStats(): Promise<JobStats> {
  try {
    const res = await fetch(`${OPENWORK_API}/jobs`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const raw = await res.json();
    const jobs = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.jobs)
        ? raw.jobs
        : [];

    const open = jobs.filter(
      (j: { status: string }) =>
        j.status === "open" || j.status === "available"
    ).length;
    const completed = jobs.filter(
      (j: { status: string }) => j.status === "completed"
    ).length;
    const rewards = jobs
      .map((j: { reward?: number }) => j.reward ?? 0)
      .filter((r: number) => r > 0);
    const avgReward =
      rewards.length > 0
        ? rewards.reduce((s: number, r: number) => s + r, 0) / rewards.length
        : 0;

    return { open, completed, total: jobs.length, avgReward };
  } catch {
    return { open: 0, completed: 0, total: 0, avgReward: 0 };
  }
}

export default async function JobsPage() {
  const stats = await getJobStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-sentinel-red" />
          Job Market
        </h1>
        <p className="text-sm text-muted-foreground">
          Job market trends and reward analytics
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Jobs"
          value={formatNumber(stats.open)}
          icon={Clock}
        />
        <StatCard
          title="Completed"
          value={formatNumber(stats.completed)}
          icon={CheckCircle}
        />
        <StatCard
          title="Total Jobs"
          value={formatNumber(stats.total)}
          icon={Briefcase}
        />
        <StatCard
          title="Avg Reward"
          value={`${formatNumber(stats.avgReward)} $OW`}
          icon={TrendingUp}
        />
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Reward Distribution</CardTitle>
              <Badge variant="outline">Recharts</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">
                Chart component coming in Issue #3
              </p>
              <p className="text-xs mt-1">
                Reward distribution histogram will render here.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Top Skills</CardTitle>
              <Badge variant="outline">Recharts</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Briefcase className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">
                Chart component coming in Issue #3
              </p>
              <p className="text-xs mt-1">
                Most requested skills bar chart will render here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
