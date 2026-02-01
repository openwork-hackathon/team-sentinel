// ============================================================
// $OPENWORK Token Reads
// balanceOf · totalSupply · metadata · top holders
// ============================================================

import { formatUnits, type Address } from "viem";
import { getClient, TOKEN_ADDRESS } from "./chain";
import { erc20Abi } from "./abi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  totalSupplyFormatted: string;
}

export interface TokenHolder {
  address: string;
  balance: string;
  balanceFormatted: string;
  percentage: number;
}

export interface TokenHoldersResponse {
  holders: TokenHolder[];
  totalSupply: string;
  totalSupplyFormatted: string;
  holderCount: number;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Alchemy base URL (for JSON-RPC calls)
// ---------------------------------------------------------------------------

const ALCHEMY_URL =
  process.env.ALCHEMY_RPC_URL ??
  "https://base-mainnet.g.alchemy.com/v2/Ef90hVumIe2tJUSzgEUCthie-246DbM7";

// ---------------------------------------------------------------------------
// Token metadata
// ---------------------------------------------------------------------------

export async function getTokenMetadata(): Promise<TokenMetadata> {
  const client = getClient();

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    client.readContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "name",
    }),
    client.readContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "symbol",
    }),
    client.readContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    client.readContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "totalSupply",
    }),
  ]);

  return {
    name: name as string,
    symbol: symbol as string,
    decimals: decimals as number,
    totalSupply: totalSupply as bigint,
    totalSupplyFormatted: formatUnits(totalSupply as bigint, decimals as number),
  };
}

// ---------------------------------------------------------------------------
// Single address balance
// ---------------------------------------------------------------------------

export async function getBalanceOf(
  account: Address,
): Promise<{ balance: bigint; balanceFormatted: string }> {
  const client = getClient();

  const [balance, decimals] = await Promise.all([
    client.readContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account],
    }),
    client.readContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "decimals",
    }),
  ]);

  return {
    balance: balance as bigint,
    balanceFormatted: formatUnits(balance as bigint, decimals as number),
  };
}

// ---------------------------------------------------------------------------
// Top holders via Alchemy asset transfers
// ---------------------------------------------------------------------------

interface AlchemyTransferResult {
  result: {
    transfers: Array<{
      from: string | null;
      to: string | null;
      rawContract: { value: string; address: string };
    }>;
    pageKey?: string;
  };
}

/**
 * Discover holders by scanning Transfer events via Alchemy,
 * then batch-query balances with multicall.
 * Returns the top N holders sorted by balance descending.
 */
export async function getTopHolders(
  limit: number = 20,
): Promise<TokenHoldersResponse> {
  const uniqueAddrs = new Set<string>();

  // Page through asset transfers to discover addresses
  let pageKey: string | undefined;
  const MAX_PAGES = 5;

  for (let page = 0; page < MAX_PAGES; page++) {
    const body = {
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          contractAddresses: [TOKEN_ADDRESS],
          category: ["erc20"],
          withMetadata: false,
          excludeZeroValue: true,
          maxCount: "0x3e8",
          order: "desc",
          ...(pageKey ? { pageKey } : {}),
        },
      ],
    };

    const res = await fetch(ALCHEMY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Alchemy error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as AlchemyTransferResult;
    const transfers = data.result?.transfers ?? [];

    for (const tx of transfers) {
      if (tx.to) uniqueAddrs.add(tx.to.toLowerCase());
      if (tx.from) uniqueAddrs.add(tx.from.toLowerCase());
    }

    pageKey = data.result?.pageKey;
    if (!pageKey) break;
  }

  // Remove zero address
  uniqueAddrs.delete("0x0000000000000000000000000000000000000000");

  const addresses = Array.from(uniqueAddrs);
  const metadata = await getTokenMetadata();

  if (addresses.length === 0) {
    return {
      holders: [],
      totalSupply: metadata.totalSupply.toString(),
      totalSupplyFormatted: metadata.totalSupplyFormatted,
      holderCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  // Batch-read balances via multicall (chunks of 100)
  const client = getClient();
  const CHUNK = 100;
  const balances: bigint[] = [];

  for (let i = 0; i < addresses.length; i += CHUNK) {
    const chunk = addresses.slice(i, i + CHUNK).map((addr) => ({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [addr as Address],
    }));

    const results = await client.multicall({ contracts: chunk });

    for (const r of results) {
      balances.push(r.status === "success" ? (r.result as bigint) : 0n);
    }
  }

  // Build, filter, sort
  const { totalSupply, decimals } = metadata;

  const holders: TokenHolder[] = [];
  for (let i = 0; i < addresses.length; i++) {
    const bal = balances[i];
    if (bal === 0n) continue;

    holders.push({
      address: addresses[i],
      balance: bal.toString(),
      balanceFormatted: formatUnits(bal, decimals),
      percentage:
        totalSupply > 0n
          ? Number((bal * 10000n) / totalSupply) / 100
          : 0,
    });
  }

  holders.sort((a, b) => {
    const diff = BigInt(b.balance) - BigInt(a.balance);
    return diff > 0n ? 1 : diff < 0n ? -1 : 0;
  });

  return {
    holders: holders.slice(0, limit),
    totalSupply: totalSupply.toString(),
    totalSupplyFormatted: metadata.totalSupplyFormatted,
    holderCount: holders.length,
    updatedAt: new Date().toISOString(),
  };
}
