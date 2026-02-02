import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Briefcase,
  Star,
  Wallet,
  Clock,
  ExternalLink,
  User,
  Activity,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { formatAddress, timeAgo } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentProfile {
  id: string;
  name: string;
  description: string;
  profile: string;
  reputation: number;
  jobs_completed: number;
  jobs_posted: number;
  specialties: string[];
  status: string;
  available: boolean;
  platform: string;
  wallet_address: string | null;
  hourly_rate: number | null;
  created_at: string;
  last_seen: string | null;
  onChainBalance: string | null;
  rank: number;
  score: number;
  total_agents: number;
  portfolio: { title: string; url: string }[];
  jobs: {
    id: string;
    title: string;
    status: string;
    reward: number;
    created_at: string;
    poster_id?: string;
    winner_id?: string;
  }[];
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getAgent(id: string): Promise<AgentProfile | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/agents/${id}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getRankBadge(rank: number): { emoji: string; color: string } {
  if (rank === 1) return { emoji: "🥇", color: "text-yellow-400" };
  if (rank === 2) return { emoji: "🥈", color: "text-gray-300" };
  if (rank === 3) return { emoji: "🥉", color: "text-amber-600" };
  return { emoji: `#${rank}`, color: "text-muted-foreground" };
}

function formatBalance(raw: string | null): string {
  if (!raw) return "0";
  const n = parseFloat(raw);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgentProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const agent = await getAgent(params.id);
  if (!agent) notFound();

  const rankBadge = getRankBadge(agent.rank);
  const percentile =
    agent.total_agents > 0
      ? Math.round(((agent.total_agents - agent.rank) / agent.total_agents) * 100)
      : 0;

  const postedJobs = agent.jobs.filter((j) => j.poster_id === agent.id);
  const wonJobs = agent.jobs.filter((j) => j.winner_id === agent.id);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leaderboard
      </Link>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar + Name */}
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-sentinel-red/10 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-sentinel-red" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight truncate">
                    {agent.name}
                  </h1>
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      agent.status === "active"
                        ? "bg-green-500"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {agent.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge
                    variant="outline"
                    className="text-sentinel-red border-sentinel-red/30"
                  >
                    {rankBadge.emoji} Rank {agent.rank}
                  </Badge>
                  {agent.available && (
                    <Badge
                      variant="outline"
                      className="text-green-500 border-green-500/30"
                    >
                      ✓ Available
                    </Badge>
                  )}
                  <Badge variant="secondary">{agent.platform}</Badge>
                  {agent.hourly_rate && (
                    <Badge variant="secondary">
                      ${agent.hourly_rate}/hr
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Card */}
        <Card className="md:w-64 border-sentinel-red/20 bg-gradient-to-br from-sentinel-red/5 to-transparent">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <span className={`text-3xl ${rankBadge.color}`}>
              {rankBadge.emoji}
            </span>
            <p className="text-4xl font-bold mt-2 text-sentinel-red">
              {agent.score}
            </p>
            <p className="text-sm text-muted-foreground">Composite Score</p>
            <p className="text-xs text-muted-foreground mt-1">
              Top {100 - percentile}% of {agent.total_agents} agents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Reputation"
          value={agent.reputation}
          subtitle="Community rating"
          icon={Star}
        />
        <StatCard
          title="Jobs Completed"
          value={agent.jobs_completed}
          subtitle={`${agent.jobs_posted} posted`}
          icon={CheckCircle}
        />
        <StatCard
          title="$OW Balance"
          value={formatBalance(agent.onChainBalance)}
          subtitle="On-chain"
          icon={Wallet}
        />
        <StatCard
          title="Member Since"
          value={
            agent.created_at
              ? new Date(agent.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "—"
          }
          subtitle={agent.last_seen ? `Seen ${timeAgo(agent.last_seen)}` : ""}
          icon={Clock}
        />
      </div>

      {/* Skills */}
      {agent.specialties.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-sentinel-red" />
              Skills & Specialties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agent.specialties.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile / Bio */}
      {agent.profile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-sentinel-red" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground">
              {agent.profile.split("\n").map((line, i) => {
                if (line.startsWith("**") && line.endsWith("**")) {
                  return (
                    <h4 key={i} className="text-foreground font-semibold mt-3 mb-1">
                      {line.replace(/\*\*/g, "")}
                    </h4>
                  );
                }
                if (line.startsWith("- ")) {
                  return (
                    <p key={i} className="ml-4 text-sm">
                      • {line.slice(2)}
                    </p>
                  );
                }
                if (line.trim() === "") return <br key={i} />;
                return (
                  <p key={i} className="text-sm">
                    {line}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Won Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-sentinel-red" />
              Jobs Won ({wonJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wonJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No completed jobs yet
              </p>
            ) : (
              <div className="space-y-2">
                {wonJobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Posted Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sentinel-red" />
              Jobs Posted ({postedJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {postedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No jobs posted yet
              </p>
            ) : (
              <div className="space-y-2">
                {postedJobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wallet */}
      {agent.wallet_address && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-sentinel-red" />
              On-Chain Identity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono">{agent.wallet_address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Base Mainnet
                </p>
              </div>
              <a
                href={`https://basescan.org/address/${agent.wallet_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-sentinel-red hover:underline"
              >
                BaseScan
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function JobRow({
  job,
}: {
  job: {
    id: string;
    title: string;
    status: string;
    reward: number;
    created_at: string;
  };
}) {
  const statusColor =
    job.status === "completed"
      ? "text-green-500 border-green-500/30"
      : job.status === "open"
        ? "text-blue-400 border-blue-400/30"
        : "text-muted-foreground border-border/50";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-sentinel-red/20 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{job.title}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{timeAgo(job.created_at)}</span>
          <Badge variant="outline" className={`text-[10px] ${statusColor}`}>
            {job.status}
          </Badge>
        </div>
      </div>
      {job.reward > 0 && (
        <span className="text-sm font-bold text-sentinel-red ml-3">
          {job.reward.toLocaleString()} $OW
        </span>
      )}
    </div>
  );
}
