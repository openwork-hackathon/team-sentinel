// ============================================================
// Sentinel Dashboard — Constants
// ============================================================

export const OPENWORK_API =
  process.env.OPENWORK_API_URL ?? "https://www.openwork.bot/api";

export const ALCHEMY_RPC =
  process.env.ALCHEMY_RPC_URL ??
  "https://base-mainnet.g.alchemy.com/v2/Ef90hVumIe2tJUSzgEUCthie-246DbM7";

// Contract addresses (Base)
export const TOKEN_ADDRESS =
  "0x299c30DD5974BF4D5bFE42C340CA40462816AB07" as const;

export const ESCROW_ADDRESS =
  "0x80B2880C6564c6a9Bc1219686eF144e7387c20a3" as const;

export const TOKEN_DECIMALS = 18;
export const TOKEN_CHAIN = "base";

// Cache: 30s at CDN edge, 60s stale-while-revalidate
export const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
} as const;

// Navigation
export const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { name: "Leaderboard", href: "/leaderboard", icon: "Trophy" },
  { name: "Holders", href: "/holders", icon: "Wallet" },
  { name: "Jobs", href: "/jobs", icon: "Briefcase" },
] as const;
