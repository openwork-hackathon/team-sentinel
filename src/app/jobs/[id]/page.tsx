import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Coins,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  FileText,
  ExternalLink,
  ListChecks,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OPENWORK_API } from "@/lib/constants";
import { formatNumber, cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JobDetail {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  required_specialties: string[];
  reward: number;
  poster_id: string;
  claimer_id: string | null;
  status: string;
  submission: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  type: string;
  onchain_job_id: string | null;
  onchain_tx: string | null;
  rejection_reason: string | null;
  attachments: string[];
  checklist: string[];
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getJob(id: string): Promise<JobDetail | null> {
  try {
    const res = await fetch(`${OPENWORK_API}/jobs/${id}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: Clock },
  claimed: { label: "Claimed", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", icon: AlertCircle },
  submitted: { label: "Submitted", color: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: FileText },
  verified: { label: "Verified", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground border-muted", icon: XCircle },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const job = await getJob(params.id);
  if (!job) notFound();

  const statusInfo = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.open;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
          <Badge
            variant="outline"
            className={cn("flex-shrink-0 gap-1.5", statusInfo.color)}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusInfo.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(job.created_at)}
          </span>
          {job.type && (
            <>
              <span>•</span>
              <Badge variant="secondary" className="text-xs capitalize">
                {job.type}
              </Badge>
            </>
          )}
          {job.onchain_tx && (
            <>
              <span>•</span>
              <a
                href={`https://basescan.org/tx/${job.onchain_tx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sentinel-red hover:underline"
              >
                On-chain
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sentinel-red/10 flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5 text-sentinel-red" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reward</p>
              <p className="text-lg font-bold">
                {formatNumber(job.reward)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  $OW
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Poster</p>
              <p className="text-sm font-mono truncate max-w-[140px]">
                {job.poster_id.slice(0, 8)}…
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{formatDate(job.created_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert prose-sm max-w-none">
            {job.description.split("\n").map((line, i) => (
              <p key={i} className={cn("text-sm leading-relaxed", !line && "h-4")}>
                {line || "\u00A0"}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      {job.checklist.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-muted-foreground" />
              Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {job.checklist.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-sentinel-red/50" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tags & Skills */}
      {(job.tags.length > 0 || job.required_specialties.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tags & Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.required_specialties.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Required Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {job.required_specialties.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {job.tags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-xs text-muted-foreground"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Info (if exists) */}
      {job.submission && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-500" />
              Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap">
              {job.submission}
            </div>
            {job.verified_at && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                Verified on {formatDate(job.verified_at)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rejection reason */}
      {job.rejection_reason && (
        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              <XCircle className="w-4 h-4" />
              Rejection Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {job.rejection_reason}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Footer metadata */}
      <Separator />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Job ID:{" "}
          <code className="font-mono bg-muted px-1.5 py-0.5 rounded">
            {job.id}
          </code>
        </span>
        <span>Last updated: {formatDate(job.updated_at)}</span>
      </div>
    </div>
  );
}
