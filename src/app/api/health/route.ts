// GET /api/health — system health check
// Verifies upstream API + on-chain RPC connectivity.
// Returns overall status + per-component health + response times.

import { NextResponse } from "next/server";
import { OPENWORK_API, ALCHEMY_RPC } from "@/lib/constants";
import { cacheStats } from "@/lib/cache";

interface ComponentHealth {
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  message?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "down";
  uptime_seconds: number;
  components: {
    openwork_api: ComponentHealth;
    alchemy_rpc: ComponentHealth;
  };
  cache: ReturnType<typeof cacheStats>;
  deployment: {
    commit: string | null;
    url: string | null;
    region: string | null;
  };
  timestamp: string;
}

// Track process start time for uptime
const startedAt = Date.now();

// Route manifest — helps diagnose stale deployments where routes 404
const ROUTE_MANIFEST = [
  "/api/activity",
  "/api/agent/docs",
  "/api/agent/overview",
  "/api/agent/search",
  "/api/agents",
  "/api/agents/[id]",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/dashboard",
  "/api/escrow/jobs",
  "/api/escrow/stats",
  "/api/health",
  "/api/jobs",
  "/api/jobs/[id]",
  "/api/jobs/analytics",
  "/api/leaderboard",
  "/api/market",
  "/api/status",
  "/api/token/holders",
  "/api/token/sentinel",
  "/api/token/stats",
] as const;

async function checkOpenworkAPI(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const res = await fetch(`${OPENWORK_API}/dashboard`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const latency = Date.now() - start;

    if (res.ok) {
      return { status: "healthy", latency_ms: latency };
    }
    return {
      status: "degraded",
      latency_ms: latency,
      message: `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      status: "down",
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

async function checkAlchemyRPC(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const res = await fetch(ALCHEMY_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
      }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const latency = Date.now() - start;

    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        return {
          status: "healthy",
          latency_ms: latency,
          message: `block ${parseInt(data.result, 16)}`,
        };
      }
      return {
        status: "degraded",
        latency_ms: latency,
        message: "RPC returned no result",
      };
    }
    return {
      status: "degraded",
      latency_ms: latency,
      message: `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      status: "down",
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

// No caching — always fresh
export const dynamic = "force-dynamic";

export async function GET() {
  const [openwork, alchemy] = await Promise.all([
    checkOpenworkAPI(),
    checkAlchemyRPC(),
  ]);

  // Overall status: worst of all components
  const statuses = [openwork.status, alchemy.status];
  let overall: "healthy" | "degraded" | "down" = "healthy";
  if (statuses.includes("down")) overall = "down";
  else if (statuses.includes("degraded")) overall = "degraded";

  const body: HealthResponse = {
    status: overall,
    uptime_seconds: Math.floor((Date.now() - startedAt) / 1000),
    components: {
      openwork_api: openwork,
      alchemy_rpc: alchemy,
    },
    cache: cacheStats(),
    deployment: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      url: process.env.VERCEL_URL ?? null,
      region: process.env.VERCEL_REGION ?? null,
    },
    routes: ROUTE_MANIFEST.length,
    timestamp: new Date().toISOString(),
  };

  const httpStatus = overall === "healthy" ? 200 : overall === "degraded" ? 200 : 503;

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
