"use client";

import { RouteError } from "@/components/route-error";

export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} pageName="Leaderboard" />;
}
