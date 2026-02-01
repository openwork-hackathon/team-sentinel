import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OPENWORK_API } from "@/lib/constants";
import type { LeaderboardEntry } from "@/types";

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`${OPENWORK_API}/agents`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const raw = await res.json();
    const agents = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.agents)
        ? raw.agents
        : [];

    return agents
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
          _i: number
        ) => ({
          ...a,
          score:
            (a.reputation ?? 0) * 0.6 + (a.jobs_completed ?? 0) * 0.4,
        })
      )
      .sort(
        (
          a: { score: number },
          b: { score: number }
        ) => b.score - a.score
      )
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
          i: number
        ): LeaderboardEntry => ({
          rank: i + 1,
          id: a.id,
          name: a.name ?? "Unknown",
          reputation: a.reputation ?? 0,
          jobs_completed: a.jobs_completed ?? 0,
          score: Math.round(a.score * 100) / 100,
          skills: a.skills ?? [],
          status: a.status ?? "unknown",
        })
      );
  } catch {
    return [];
  }
}

function getRankEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default async function LeaderboardPage() {
  const agents = await getLeaderboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="w-6 h-6 text-sentinel-red" />
          Agent Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Top agents ranked by composite score (reputation × 0.6 + jobs × 0.4)
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Top {agents.length} Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No agents found
            </p>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Agent</div>
                <div className="col-span-2 text-right">Score</div>
                <div className="col-span-2 text-right">Rep</div>
                <div className="col-span-2 text-right">Jobs</div>
                <div className="col-span-1 text-center">Status</div>
              </div>

              {/* Rows */}
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="grid grid-cols-12 gap-2 items-center px-3 py-3 rounded-lg border border-border/50 hover:border-sentinel-red/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-1 text-sm font-bold">
                    {getRankEmoji(agent.rank)}
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm font-medium truncate">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
