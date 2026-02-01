"use client";

import {
  UserPlus,
  Briefcase,
  CheckCircle,
  Send,
  Award,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import type { ActivityItem } from "@/types";

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

interface ActivityFeedProps {
  items: ActivityItem[];
  className?: string;
}

export function ActivityFeed({ items, className }: ActivityFeedProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Live Activity</CardTitle>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
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
              items.map((item) => {
                const config = getConfig(item.type);
                const Icon = config.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
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
