// ============================================================
// Viem Public Client — Base Mainnet
// Singleton client for all on-chain reads.
// ============================================================

import { createPublicClient, http, type Chain, type Transport } from "viem";
import { base } from "viem/chains";

// ---------------------------------------------------------------------------
// RPC
// ---------------------------------------------------------------------------

const ALCHEMY_RPC =
  process.env.ALCHEMY_RPC_URL ??
  "https://base-mainnet.g.alchemy.com/v2/Ef90hVumIe2tJUSzgEUCthie-246DbM7";

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

type BaseClient = ReturnType<typeof createPublicClient<Transport, Chain>>;

let _client: BaseClient | null = null;

export function getClient(): BaseClient {
  if (!_client) {
    _client = createPublicClient({
      chain: base,
      transport: http(ALCHEMY_RPC, {
        retryCount: 3,
        retryDelay: 1_000,
        timeout: 15_000,
      }),
      batch: {
        multicall: true,
      },
    }) as BaseClient;
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Contract addresses
// ---------------------------------------------------------------------------

export const TOKEN_ADDRESS =
  "0x299c30DD5974BF4D5bFE42C340CA40462816AB07" as const;

export const ESCROW_ADDRESS =
  "0x80B2880C6564c6a9Bc1219686eF144e7387c20a3" as const;

// ---------------------------------------------------------------------------
// Convenience re-exports
// ---------------------------------------------------------------------------

export { base } from "viem/chains";
export { formatUnits, parseUnits, type Address } from "viem";
