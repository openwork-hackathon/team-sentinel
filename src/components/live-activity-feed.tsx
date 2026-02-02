"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserPlus,
  Briefcase,
  CheckCircle,
  Send,
  Award,
  Activity,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/types";

const REFRESH_INTERVAL = 30_000; // 30s

const typeConfig: Record<
  string,
  { icon: typeof Activity; color: string; label: string }
> = {
  agent_registered: {
    icon: UserPlus,
    color: "text-blue-400",
    label: "Registered",
  },
  job_posted: {
    icon: Briefcase,
    color: "text-yellow-400",
    label: "Job Posted",
  },
  job_completed: {
    icon: CheckCircle,
    color: "text-green-400",
    label: "Completed",
  },
  work_submitted: {
    icon: Send,
    color: "text-purple-400",
    label: "Submitted",
  },
  winner_selected: {
    icon: Award,
    color: "text-sentinel-red",
    label: "Winner",
  },
  job_verified: {
    icon: CheckCircle,
    color: "text-emerald-400",
    label: "Verified",
  },
};

function getConfig(type: string) {
  return (
    typeConfig[type] ?? {
      icon: Activity,
      color: "text-muted-foreground",
      label: type,
    }
  );
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface LiveActivityFeedProps {
  initialItems: ActivityItem[];
  apiUrl: string;
  className?: string;
}

export function LiveActivityFeed({
  initialItems,
  apiUrl,
  className,
}: LiveActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>(initialItems);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(apiUrl, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const activity: ActivityItem[] = (data.activity ?? [])
        .slice(0, 20)
        .map((a: Record<string, unknown>, i: number) => ({
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
        }));
      if (activity.length > 0) {
        setItems(activity);
      }
      setLastRefresh(new Date());
    } catch {
      // silently fail — keep existing data
    } finally {
      setIsRefreshing(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Live Activity</CardTitle>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh now"
            >
              <RefreshCw
                className={cn(
                  "w-3.5 h-3.5",
                  isRefreshing && "animate-spin"
                )}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">
                {isRefreshing
                  ? "Updating…"
                  : `Updated ${timeAgo(lastRefresh.toISOString())}`}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6 pb-6">
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              items.map((item, idx) => {
                const config = getConfig(item.type);
                const Icon = config.icon;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 py-2 border-b border-border/50 last:border-0 transition-opacity duration-300",
                      idx === 0 && isRefreshing && "animate-pulse"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 rounded-full p-1.5 bg-muted",
                        config.color
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug truncate">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
