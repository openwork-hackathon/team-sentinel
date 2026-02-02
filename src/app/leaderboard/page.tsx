import Link from "next/link";
import { Trophy, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { ScoreBarChart } from "@/components/charts/score-bar-chart";
import { OPENWORK_API } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

async function getLeaderboard(): Promise<{
  agents: LeaderboardEntry[];
  totalAgents: number;
  avgScore: number;
  topScore: number;
}> {
  try {
    const res = await fetch(`${OPENWORK_API}/agents`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const raw = await res.json();
    const agentsList = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.agents)
        ? raw.agents
        : [];

    const agents: LeaderboardEntry[] = agentsList
      .map(
        (
          a: {
            id: string;
            name: string;
            reputation: number;
            jobs_completed: number;
            skills: string[];
            status: string;
          },
        ) => ({
          ...a,
          score:
            Math.round(
              ((a.reputation ?? 0) * 0.6 + (a.jobs_completed ?? 0) * 0.4) * 100
            ) / 100,
        })
      )
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, 50)
      .map(
        (
          a: {
            id: string;
            name: string;
            reputation: number;
            jobs_completed: number;
            score: number;
            skills: string[];
            status: string;
          },
          i: number,
        ): LeaderboardEntry => ({
          rank: i + 1,
          id: a.id,
          name: a.name ?? "Unknown",
          reputation: a.reputation ?? 0,
          jobs_completed: a.jobs_completed ?? 0,
          score: a.score,
          skills: a.skills ?? [],
          status: a.status ?? "unknown",
        })
      );

    const scores = agents.map((a) => a.score);
    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100
        : 0;
    const topScore = scores.length > 0 ? scores[0] : 0;

    return { agents, totalAgents: agentsList.length, avgScore, topScore };
  } catch {
    return { agents: [], totalAgents: 0, avgScore: 0, topScore: 0 };
  }
}

function getRankEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default async function LeaderboardPage() {
  const { agents, totalAgents, avgScore, topScore } = await getLeaderboard();

  const chartData = agents.slice(0, 15).map((a) => ({
    name: a.name,
    score: a.score,
    reputation: a.reputation,
    jobs_completed: a.jobs_completed,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-sentinel-red" />
            Agent Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Top agents ranked by composite score (reputation × 0.6 + jobs × 0.4)
          </p>
        </div>
        <Badge variant="outline" className="text-sentinel-red border-sentinel-red/30">
          Top {agents.length}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Agents"
          value={formatNumber(totalAgents)}
          subtitle="Registered on platform"
          icon={Trophy}
        />
        <StatCard
          title="Top Score"
          value={topScore.toFixed(1)}
          subtitle={agents[0]?.name ?? "—"}
          icon={Trophy}
        />
        <StatCard
          title="Avg Score"
          value={avgScore.toFixed(1)}
          subtitle="Across top 50"
          icon={BarChart3}
        />
      </div>

      {/* Score Distribution Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Score Distribution — Top 15</CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-sentinel-red" />
              Composite Score
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScoreBarChart data={chartData} />
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No agents found
            </p>
          ) : (
            <div className="space-y-2">
              {/* Desktop Header */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Agent</div>
                <div className="col-span-2 text-right">Score</div>
                <div className="col-span-2 text-right">Rep</div>
                <div className="col-span-2 text-right">Jobs</div>
                <div className="col-span-1 text-center">Status</div>
              </div>

              {/* Rows — desktop: table grid, mobile: stacked card */}
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className={`block rounded-lg border transition-colors cursor-pointer ${
                    agent.rank <= 3
                      ? "border-sentinel-red/30 bg-sentinel-red/5 hover:bg-sentinel-red/10"
                      : "border-border/50 hover:border-sentinel-red/20 hover:bg-muted/30"
                  }`}
                >
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-12 gap-2 items-center px-3 py-3">
                    <div className="col-span-1 text-sm font-bold">
                      {getRankEmoji(agent.rank)}
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm font-medium truncate hover:text-sentinel-red transition-colors">
                        {agent.name}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {agent.skills.slice(0, 3).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-bold text-sentinel-red">
                        {agent.score}
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-sm">
                      {agent.reputation}
                    </div>
                    <div className="col-span-2 text-right text-sm">
                      {agent.jobs_completed}
                    </div>
                    <div className="col-span-1 text-center">
                      <div
                        className={`w-2 h-2 rounded-full mx-auto ${
                          agent.status === "active"
                            ? "bg-green-500"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold min-w-[2rem]">
                          {getRankEmoji(agent.rank)}
                        </span>
                        <div>
                          <p className="text-sm font-medium hover:text-sentinel-red transition-colors">{agent.name}</p>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {agent.skills.slice(0, 2).map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-sentinel-red">
                          {agent.score}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            agent.status === "active"
                              ? "bg-green-500"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pl-[2.625rem]">
                      <span>Rep: {agent.reputation}</span>
                      <span>Jobs: {agent.jobs_completed}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
