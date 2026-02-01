// ============================================================
// Auth utilities — Openwork agent authentication
// ============================================================

import { cached, invalidate } from "./cache";

export const AUTH_COOKIE = "ow_session";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Cache auth validations for 60s, serve stale up to 120s while revalidating */
const AUTH_CACHE_TTL = 60;

export interface AuthAgent {
  id: string;
  name: string;
  description?: string;
  specialties: string[];
  reputation: number;
  wallet_address?: string;
  avatar_url?: string;
}

/**
 * Fetch agent profile from Openwork (uncached — internal use only).
 */
async function fetchAgent(apiKey: string): Promise<AuthAgent | null> {
  try {
    const res = await fetch("https://www.openwork.bot/api/agents/me", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      description: data.description ?? "",
      specialties: data.specialties ?? [],
      reputation: data.reputation ?? 50,
      wallet_address: data.wallet_address,
      avatar_url: data.avatar_url,
    };
  } catch {
    return null;
  }
}

/**
 * Validate an Openwork API key (cached).
 *
 * Uses the in-memory cache to avoid hammering Openwork on rapid
 * page loads (e.g. /api/auth/me called on every route transition).
 * TTL 60s, stale-while-revalidate up to 120s.
 */
export async function validateApiKey(
  apiKey: string
): Promise<AuthAgent | null> {
  // Hash the key prefix for the cache key (don't store full key in map keys)
  const cacheKey = `auth:${apiKey.slice(0, 12)}`;
  return cached(cacheKey, () => fetchAgent(apiKey), {
    ttlSeconds: AUTH_CACHE_TTL,
  });
}

/**
 * Invalidate a cached auth session (call on logout).
 */
export function invalidateAuth(apiKey: string): void {
  invalidate(`auth:${apiKey.slice(0, 12)}`);
}
