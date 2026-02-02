"use client";

import { RouteError } from "@/components/route-error";

export default function AgentProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} pageName="Agent Profile" />;
}
