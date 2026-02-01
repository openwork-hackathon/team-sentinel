// ============================================================
// Viem Public Client — Base Mainnet
// Singleton client for all on-chain reads.
// ============================================================

import { createPublicClient, http, type Chain, type Transport } from "viem";
import { base } from "viem/chains";
import { ALCHEMY_RPC, TOKEN_ADDRESS, ESCROW_ADDRESS } from "./constants";

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
// Re-exports from constants (so existing imports from chain.ts still work)
// ---------------------------------------------------------------------------

export { TOKEN_ADDRESS, ESCROW_ADDRESS } from "./constants";
export { base } from "viem/chains";
export { formatUnits, parseUnits, type Address } from "viem";
