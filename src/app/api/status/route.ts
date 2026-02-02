// GET /api/status — Comprehensive platform status
//
// Aggregates health from all subsystems:
// - Upstream Openwork API
// - Alchemy RPC (Base chain)
// - Sentinel token status
// - Deployment metadata
// - API route availability
//
// Designed for monitoring dashboards and agent health checks.

import { NextResponse } from "next/server";
import { OPENWORK_API, ALCHEMY_RPC, CACHE_HEADERS } from "@/lib/constants";

export const revalidate = 0; // never cache status — always fresh
export const dynamic = "force-dynamic";

interface SubsystemStatus {
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  message?: string;
}

interface PlatformStatus {
  status: "healthy" | "degraded" | "down";
  version: string;
  uptime: string;
  timestamp: string;
  subsystems: {
    openwork_api: SubsystemStatus;
    alchemy_rpc: SubsystemStatus;
    sentinel_token: SubsystemStatus & { exists: boolean };
  };
  routes: Record<string, { status: number; latency_ms: number }>;
  deployment: {
    url: string;
    region: string;
    build_id: string | null;
  };
}

async function checkEndpoint(
  url: string,
  timeoutMs = 5000,
): Promise<{ status: number; latency_ms: number; data?: unknown }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    const latency_ms = Date.now() - start;
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // not JSON — that's fine
    }
    return { status: res.status, latency_ms, data };
  } catch {
    return { status: 0, latency_ms: Date.now() - start };
  }
}

export async function GET() {
  const start = Date.now();

  // Check all subsystems in parallel
  const [openworkCheck, alchemyCheck, tokenCheck, routeChecks] =
    await Promise.all([
      // 1. Openwork upstream API
      checkEndpoint(`${OPENWORK_API}/dashboard`),

      // 2. Alchemy RPC
      (async () => {
        const s = Date.now();
        try {
          const res = await fetch(ALCHEMY_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_blockNumber",
              params: [],
            }),
            cache: "no-store",
          });
          const data = await res.json();
          return {
            status: res.status === 200 ? "healthy" : "degraded",
            latency_ms: Date.now() - s,
            message: `block ${parseInt(data?.result ?? "0", 16)}`,
          };
        } catch (e) {
          return {
            status: "down",
            latency_ms: Date.now() - s,
            message: e instanceof Error ? e.message : "RPC unreachable",
          };
        }
      })(),

      // 3. Sentinel token (from our own API)
      checkEndpoint(
        `${
          process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000"
        }/api/token/sentinel`,
      ),

      // 4. Route availability checks (internal)
      Promise.all(
        [
          "/api/health",
          "/api/dashboard",
          "/api/leaderboard",
          "/api/activity",
          "/api/token/stats",
          "/api/token/holders",
          "/api/market",
          "/api/jobs/analytics",
          "/api/agent/docs",
        ].map(async (path) => {
          const base = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000";
          const result = await checkEndpoint(`${base}${path}`, 3000);
          return [path, { status: result.status, latency_ms: result.latency_ms }] as const;
        }),
      ),
    ]);

  // Build route status map
  const routes: Record<string, { status: number; latency_ms: number }> = {};
  for (const [path, result] of routeChecks) {
    routes[path] = result;
  }

  // Determine subsystem statuses
  const openworkStatus: SubsystemStatus = {
    status:
      openworkCheck.status === 200
        ? "healthy"
        : openworkCheck.status > 0
          ? "degraded"
          : "down",
    latency_ms: openworkCheck.latency_ms,
    message:
      openworkCheck.status === 200
        ? `${(openworkCheck.data as Record<string, unknown>)?.total_agents ?? "?"} agents tracked`
        : `HTTP ${openworkCheck.status}`,
  };

  const tokenData = tokenCheck.data as Record<string, unknown> | null;
  const tokenExists = tokenData?.exists === true;

  const sentinelTokenStatus: SubsystemStatus & { exists: boolean } = {
    status: tokenCheck.status === 200 ? "healthy" : "degraded",
    latency_ms: tokenCheck.latency_ms,
    exists: tokenExists,
    message: tokenExists
      ? `$SENTINEL live — supply: ${tokenData?.totalSupplyFormatted ?? "?"}`
      : "Token not yet created on Mint Club V2",
  };

  // Overall status
  const subsystemStatuses = [
    openworkStatus.status,
    (alchemyCheck as SubsystemStatus).status,
    sentinelTokenStatus.status,
  ];
  const overallStatus: "healthy" | "degraded" | "down" =
    subsystemStatuses.includes("down")
      ? "down"
      : subsystemStatuses.includes("degraded")
        ? "degraded"
        : "healthy";

  // Failing routes count
  const failingRoutes = Object.values(routes).filter(
    (r) => r.status !== 200,
  ).length;
  const effectiveStatus =
    failingRoutes > 2
      ? "degraded"
      : overallStatus;

  const response: PlatformStatus = {
    status: effectiveStatus,
    version: "1.2.0",
    uptime: `${Math.floor((Date.now() - start) / 1000)}s check`,
    timestamp: new Date().toISOString(),
    subsystems: {
      openwork_api: openworkStatus,
      alchemy_rpc: alchemyCheck as SubsystemStatus,
      sentinel_token: sentinelTokenStatus,
    },
    routes,
    deployment: {
      url: process.env.VERCEL_URL ?? "localhost",
      region: process.env.VERCEL_REGION ?? "unknown",
      build_id: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
  };

  return NextResponse.json(response, {
    status: effectiveStatus === "down" ? 503 : 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
