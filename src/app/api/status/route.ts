// GET /api/status — Comprehensive platform status
//
// Aggregates health from all subsystems:
// - Upstream Openwork API
// - Alchemy RPC (Base chain)
// - Sentinel token status (direct lib call, no circular HTTP)
// - Deployment metadata
//
// Designed for monitoring dashboards and agent health checks.

import { NextResponse } from "next/server";
import { OPENWORK_API, ALCHEMY_RPC } from "@/lib/constants";
import { getSentinelTokenData } from "@/lib/sentinel-token";
import { cacheStats } from "@/lib/cache";

export const revalidate = 0;
export const dynamic = "force-dynamic";

interface SubsystemStatus {
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  message?: string;
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
      // not JSON — fine
    }
    return { status: res.status, latency_ms, data };
  } catch {
    return { status: 0, latency_ms: Date.now() - start };
  }
}

export async function GET() {
  const start = Date.now();

  // Check external subsystems in parallel (no self-referencing HTTP calls)
  const [openworkCheck, alchemyResult, tokenResult] = await Promise.all([
    // 1. Openwork upstream API
    checkEndpoint(`${OPENWORK_API}/dashboard`),

    // 2. Alchemy RPC — direct call
    (async (): Promise<SubsystemStatus> => {
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

    // 3. Sentinel token — direct library call (no HTTP self-reference)
    (async () => {
      const s = Date.now();
      try {
        const data = await getSentinelTokenData();
        return {
          status: "healthy" as const,
          latency_ms: Date.now() - s,
          exists: data.exists,
          message: data.exists
            ? `$SENTINEL live — supply: ${data.totalSupplyFormatted ?? "?"}`
            : "Token not yet created on Mint Club V2",
        };
      } catch (e) {
        return {
          status: "degraded" as const,
          latency_ms: Date.now() - s,
          exists: false,
          message: e instanceof Error ? e.message : "Token check failed",
        };
      }
    })(),
  ]);

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

  // Overall status
  const statuses = [
    openworkStatus.status,
    alchemyResult.status,
    tokenResult.status,
  ];
  const overallStatus: "healthy" | "degraded" | "down" = statuses.includes(
    "down",
  )
    ? "down"
    : statuses.includes("degraded")
      ? "degraded"
      : "healthy";

  const cache = cacheStats();

  const response = {
    status: overallStatus,
    version: "1.3.0",
    timestamp: new Date().toISOString(),
    response_ms: Date.now() - start,
    subsystems: {
      openwork_api: openworkStatus,
      alchemy_rpc: alchemyResult,
      sentinel_token: tokenResult,
    },
    cache: {
      entries: cache.size,
      fresh: cache.fresh,
      stale: cache.stale,
    },
    deployment: {
      url: process.env.VERCEL_URL ?? "localhost",
      region: process.env.VERCEL_REGION ?? "unknown",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    },
  };

  return NextResponse.json(response, {
    status: overallStatus === "down" ? 503 : 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
