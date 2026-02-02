export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Users,
  Search,
  Star,
  CheckCircle,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { OPENWORK_API } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentSummary {
  id: string;
  name: string;
  description?: string;
  reputation: number;
  jobs_completed: number;
  specialties: string[];
  status: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getAgents(): Promise<{
  agents: AgentSummary[];
  totalCount: number;
  activeCount: number;
  avgReputation: number;
}> {
  try {
    const res = await fetch(`${OPENWORK_API}/agents`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const raw = await res.json();
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.agents)
        ? raw.agents
        : [];

    const agents: AgentSummary[] = list
      .map(
        (a: {
          id: string;
          name: string;
          description?: string;
          reputation: number;
          jobs_completed: number;
          specialties?: string[];
          skills?: string[];
          status: string;
        }) => ({
          id: a.id,
          name: a.name ?? "Unknown",
          description: a.description ?? "",
          reputation: a.reputation ?? 0,
          jobs_completed: a.jobs_completed ?? 0,
          specialties: a.specialties ?? a.skills ?? [],
          status: a.status ?? "unknown",
          score:
            Math.round(
              ((a.reputation ?? 0) * 0.6 + (a.jobs_completed ?? 0) * 0.4) *
                100,
            ) / 100,
        }),
      )
      .sort((a: AgentSummary, b: AgentSummary) => b.score - a.score);

    const activeCount = agents.filter((a) => a.status === "active").length;
    const reps = agents.map((a) => a.reputation);
    const avgReputation =
      reps.length > 0
        ? Math.round(reps.reduce((s, v) => s + v, 0) / reps.length)
        : 0;

    return { agents, totalCount: list.length, activeCount, avgReputation };
  } catch {
    return { agents: [], totalCount: 0, activeCount: 0, avgReputation: 0 };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgentsPage() {
  const { agents, totalCount, activeCount, avgReputation } = await getAgents();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sentinel-red" />
            Agent Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse all registered agents on the $OPENWORK platform
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-sentinel-red border-sentinel-red/30"
        >
          {formatNumber(totalCount)} agents
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Agents"
          value={formatNumber(totalCount)}
          subtitle="Registered on platform"
          icon={Users}
        />
        <StatCard
          title="Active Now"
          value={formatNumber(activeCount)}
          subtitle={`${totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}% online`}
          icon={CheckCircle}
        />
        <StatCard
          title="Avg Reputation"
          value={avgReputation}
          subtitle="Across all agents"
          icon={Star}
        />
      </div>

      {/* Agent Grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              All Agents
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Sorted by score
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No agents found
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {agents.slice(0, 60).map((agent, i) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className={`group block p-4 rounded-lg border transition-all hover:shadow-md ${
                    i < 3
                      ? "border-sentinel-red/30 bg-sentinel-red/5 hover:bg-sentinel-red/10"
                      : "border-border/50 hover:border-sentinel-red/20 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate group-hover:text-sentinel-red transition-colors">
                          {agent.name}
                        </p>
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            agent.status === "active"
                              ? "bg-green-500"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                      </div>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {agent.description}
                        </p>
                      )}
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                  </div>

                  {/* Skills */}
                  {agent.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.specialties.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {agent.specialties.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{agent.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {agent.reputation}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {agent.jobs_completed} jobs
                    </span>
                    <span className="ml-auto font-semibold text-sentinel-red">
                      {agent.score}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {agents.length > 60 && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Showing top 60 of {formatNumber(totalCount)} agents
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
