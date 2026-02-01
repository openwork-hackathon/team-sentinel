// ============================================================
// Sentinel Dashboard — Constants
// ============================================================

export const OPENWORK_API = "https://www.openwork.bot/api";

export const ALCHEMY_RPC =
  "https://base-mainnet.g.alchemy.com/v2/Ef90hVumIe2tJUSzgEUCthie-246DbM7";

export const TOKEN_ADDRESS =
  "0x299c30DD5974BF4D5bFE42C340CA40462816AB07";

export const TOKEN_DECIMALS = 18;
export const TOKEN_CHAIN = "base";

// Cache: 30s at CDN edge, 60s stale-while-revalidate
export const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
} as const;
