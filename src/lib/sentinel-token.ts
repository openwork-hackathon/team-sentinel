// ============================================================
// Sentinel Token — Mint Club V2 Bond reads
// Reads $SENTINEL bonding curve data from MCV2_Bond on Base.
// ============================================================

import { formatUnits, type Address } from "viem";
import { getClient } from "./chain";
import { mcv2BondAbi, erc20Abi } from "./abi";
import { MCV2_BOND_ADDRESS, TOKEN_DECIMALS } from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BondStep {
  rangeTo: string; // formatted token amount
  rangeToRaw: string; // raw bigint string
  price: string; // formatted price per token
  priceRaw: string; // raw bigint string
}

export interface SentinelTokenData {
  exists: boolean;
  tokenAddress: string | null;
  name: string | null;
  symbol: string | null;
  totalSupply: string | null;
  totalSupplyFormatted: string | null;
  decimals: number | null;
  bond: {
    creator: string;
    mintRoyalty: number; // basis points
    burnRoyalty: number;
    createdAt: number; // unix timestamp
    reserveToken: string;
    reserveBalance: string; // formatted
    reserveBalanceRaw: string;
    steps: BondStep[];
    currentStep: number;
  } | null;
  mintClubUrl: string | null;
  basescanUrl: string | null;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Token address resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the $SENTINEL token address from the Bond contract.
 * Iterates all tokens on the bond and checks for matching symbol.
 * Results should be cached externally.
 */
export async function findSentinelTokenAddress(): Promise<Address | null> {
  const client = getClient();

  // Check env override first
  const envAddr = process.env.SENTINEL_TOKEN_ADDRESS;
  if (envAddr) {
    // Verify it actually exists on the bond
    try {
      const exists = await client.readContract({
        address: MCV2_BOND_ADDRESS,
        abi: mcv2BondAbi,
        functionName: "exists",
        args: [envAddr as Address],
      });
      if (exists) return envAddr as Address;
    } catch {
      // Fall through to search
    }
  }

  // Search by iterating tokens (typically few hundred max on this bond)
  try {
    const count = await client.readContract({
      address: MCV2_BOND_ADDRESS,
      abi: mcv2BondAbi,
      functionName: "tokenCount",
    });

    const total = Number(count);

    // Search from newest first (our token was just created)
    for (let i = total - 1; i >= Math.max(0, total - 200); i--) {
      try {
        const tokenAddr = await client.readContract({
          address: MCV2_BOND_ADDRESS,
          abi: mcv2BondAbi,
          functionName: "tokens",
          args: [BigInt(i)],
        });

        // Read symbol from the ERC20 token
        const symbol = await client.readContract({
          address: tokenAddr as Address,
          abi: erc20Abi,
          functionName: "symbol",
        });

        if (
          typeof symbol === "string" &&
          symbol.toUpperCase() === "SENTINEL"
        ) {
          return tokenAddr as Address;
        }
      } catch {
        // Skip tokens that fail to read
        continue;
      }
    }
  } catch {
    // tokenCount not available or RPC error
  }

  return null;
}

// ---------------------------------------------------------------------------
// Full token data
// ---------------------------------------------------------------------------

export async function getSentinelTokenData(): Promise<SentinelTokenData> {
  const client = getClient();
  const now = new Date().toISOString();

  // Step 1: Find the token address
  const tokenAddress = await findSentinelTokenAddress();

  if (!tokenAddress) {
    return {
      exists: false,
      tokenAddress: null,
      name: null,
      symbol: null,
      totalSupply: null,
      totalSupplyFormatted: null,
      decimals: null,
      bond: null,
      mintClubUrl: null,
      basescanUrl: null,
      updatedAt: now,
    };
  }

  // Step 2: Read token ERC20 data + bond data in parallel
  const [nameResult, symbolResult, totalSupplyResult, decimalsResult, bondResult, stepsResult] =
    await Promise.allSettled([
      client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "name",
      }),
      client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "totalSupply",
      }),
      client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      client.readContract({
        address: MCV2_BOND_ADDRESS,
        abi: mcv2BondAbi,
        functionName: "tokenBond",
        args: [tokenAddress],
      }),
      client.readContract({
        address: MCV2_BOND_ADDRESS,
        abi: mcv2BondAbi,
        functionName: "getSteps",
        args: [tokenAddress],
      }),
    ]);

  const name = nameResult.status === "fulfilled" ? String(nameResult.value) : null;
  const symbol = symbolResult.status === "fulfilled" ? String(symbolResult.value) : null;
  const decimals =
    decimalsResult.status === "fulfilled" ? Number(decimalsResult.value) : TOKEN_DECIMALS;
  const totalSupply =
    totalSupplyResult.status === "fulfilled" ? (totalSupplyResult.value as bigint) : null;

  // Parse bond data
  let bond: SentinelTokenData["bond"] = null;
  if (bondResult.status === "fulfilled") {
    const [creator, mintRoyalty, burnRoyalty, createdAt, reserveToken, reserveBalance] =
      bondResult.value as [string, number, number, number, string, bigint];

    // Parse steps
    const steps: BondStep[] = [];
    let currentStep = 0;
    if (stepsResult.status === "fulfilled") {
      const rawSteps = stepsResult.value as Array<{ rangeTo: bigint; price: bigint }>;
      const currentSupply = totalSupply ?? 0n;

      for (let i = 0; i < rawSteps.length; i++) {
        const s = rawSteps[i];
        steps.push({
          rangeTo: formatUnits(s.rangeTo, decimals),
          rangeToRaw: s.rangeTo.toString(),
          price: formatUnits(s.price, TOKEN_DECIMALS), // price in reserve token units (18 dec)
          priceRaw: s.price.toString(),
        });
        if (currentSupply <= s.rangeTo) {
          currentStep = i;
        }
      }
    }

    bond = {
      creator,
      mintRoyalty: Number(mintRoyalty),
      burnRoyalty: Number(burnRoyalty),
      createdAt: Number(createdAt),
      reserveToken,
      reserveBalance: formatUnits(reserveBalance, TOKEN_DECIMALS),
      reserveBalanceRaw: reserveBalance.toString(),
      steps,
      currentStep,
    };
  }

  return {
    exists: true,
    tokenAddress,
    name,
    symbol,
    totalSupply: totalSupply?.toString() ?? null,
    totalSupplyFormatted: totalSupply ? formatUnits(totalSupply, decimals) : null,
    decimals,
    bond,
    mintClubUrl: symbol ? `https://mint.club/token/base/${symbol}` : null,
    basescanUrl: `https://basescan.org/address/${tokenAddress}`,
    updatedAt: now,
  };
}
