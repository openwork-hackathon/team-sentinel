// ============================================================
// In-memory TTL cache — reduces upstream API + RPC calls
// Serves stale data during background revalidation.
// ============================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleAt: number;
  refreshing: boolean;
}

const store = new Map<string, CacheEntry<unknown>>();

interface CacheOptions {
  /** Time-to-live in seconds before entry is considered stale */
  ttlSeconds: number;
  /** Extra seconds to serve stale data while revalidating (default: ttl × 2) */
  staleSeconds?: number;
}

/**
 * Fetch-through cache with stale-while-revalidate semantics.
 *
 * - Fresh (< ttl): return cached value immediately
 * - Stale (ttl < age < ttl+stale): return cached value, trigger background refresh
 * - Expired (> ttl+stale): await fresh fetch
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: CacheOptions,
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  // Fresh hit — return immediately
  if (entry && now < entry.staleAt) {
    return entry.value;
  }

  // Stale hit — return stale, refresh in background
  if (entry && now < entry.expiresAt && !entry.refreshing) {
    entry.refreshing = true;
    // Fire-and-forget background refresh
    fetcher()
      .then((value) => {
        const staleWindow = (opts.staleSeconds ?? opts.ttlSeconds * 2) * 1000;
        store.set(key, {
          value,
          staleAt: Date.now() + opts.ttlSeconds * 1000,
          expiresAt: Date.now() + opts.ttlSeconds * 1000 + staleWindow,
          refreshing: false,
        });
      })
      .catch(() => {
        if (entry) entry.refreshing = false;
      });
    return entry.value;
  }

  // Miss or fully expired — await fresh data
  const value = await fetcher();
  const staleWindow = (opts.staleSeconds ?? opts.ttlSeconds * 2) * 1000;
  store.set(key, {
    value,
    staleAt: now + opts.ttlSeconds * 1000,
    expiresAt: now + opts.ttlSeconds * 1000 + staleWindow,
    refreshing: false,
  });

  return value;
}

/**
 * Invalidate a single cache key.
 */
export function invalidate(key: string): void {
  store.delete(key);
}

/**
 * Clear the entire cache.
 */
export function clearAll(): void {
  store.clear();
}

/**
 * Get cache stats for monitoring.
 */
export function cacheStats(): {
  size: number;
  keys: string[];
  fresh: number;
  stale: number;
  expired: number;
} {
  const now = Date.now();
  let fresh = 0;
  let stale = 0;
  let expired = 0;

  for (const [, entry] of store) {
    if (now < entry.staleAt) fresh++;
    else if (now < entry.expiresAt) stale++;
    else expired++;
  }

  return {
    size: store.size,
    keys: Array.from(store.keys()),
    fresh,
    stale,
    expired,
  };
}
