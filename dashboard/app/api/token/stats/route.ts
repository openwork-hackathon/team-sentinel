import { NextResponse } from "next/server";
import {
  ALCHEMY_RPC,
  TOKEN_ADDRESS,
  TOKEN_DECIMALS,
  TOKEN_CHAIN,
  CACHE_HEADERS,
} from "@/lib/constants";
import type { TokenStatsResponse } from "@/lib/types";

// ---- helpers for raw JSON-RPC calls ----

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(ALCHEMY_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${method} failed: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

/** ERC-20 totalSupply() — selector 0x18160ddd */
async function getTotalSupply(): Promise<string> {
  const raw = (await rpcCall("eth_call", [
    { to: TOKEN_ADDRESS, data: "0x18160ddd" },
    "latest",
  ])) as string;

  // raw is hex-encoded uint256
  const wei = BigInt(raw);
  const whole = wei / BigInt(10 ** TOKEN_DECIMALS);
  const frac = wei % BigInt(10 ** TOKEN_DECIMALS);
  const fracStr = frac.toString().padStart(TOKEN_DECIMALS, "0").slice(0, 4);

  return `${whole.toLocaleString("en-US")}.${fracStr}`;
}

/** ERC-20 name() — selector 0x06fdde03 */
async function getTokenName(): Promise<string> {
  try {
    const raw = (await rpcCall("eth_call", [
      { to: TOKEN_ADDRESS, data: "0x06fdde03" },
      "latest",
    ])) as string;
    return decodeString(raw);
  } catch {
    return "OPENWORK";
  }
}

/** ERC-20 symbol() — selector 0x95d89b41 */
async function getTokenSymbol(): Promise<string> {
  try {
    const raw = (await rpcCall("eth_call", [
      { to: TOKEN_ADDRESS, data: "0x95d89b41" },
      "latest",
    ])) as string;
    return decodeString(raw);
  } catch {
    return "OW";
  }
}

/** Decode ABI-encoded string from eth_call result */
function decodeString(hex: string): string {
  // remove 0x prefix
  const data = hex.slice(2);
  // offset is first 32 bytes (64 hex chars), usually 0x20
  // length is next 32 bytes
  const length = parseInt(data.slice(64, 128), 16);
  // string data starts at byte 96
  const strHex = data.slice(128, 128 + length * 2);
  // decode hex to utf-8
  const bytes = new Uint8Array(
    strHex.match(/.{2}/g)?.map((b) => parseInt(b, 16)) ?? []
  );
  return new TextDecoder().decode(bytes);
}

/** Try Alchemy Token API for holder count (may not be available on all plans) */
async function getHolderCount(): Promise<number | null> {
  try {
    // Alchemy getTokenMetadata
    const res = await fetch(ALCHEMY_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "alchemy_getTokenMetadata",
        params: [TOKEN_ADDRESS],
      }),
    });
    const json = await res.json();
    // If the API returns holder info, use it
    if (json.result?.holders) return json.result.holders;
  } catch {
    // fall through
  }

  // Fallback: try Transfer event log count as rough proxy
  try {
    const raw = (await rpcCall("eth_getLogs", [
      {
        address: TOKEN_ADDRESS,
        fromBlock: "0x0",
        toBlock: "latest",
        // Transfer(address,address,uint256) topic
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        ],
      },
    ])) as unknown[];
    // Unique 'to' addresses as rough holder estimate
    const toAddrs = new Set(
      (raw as { topics: string[] }[]).map((log) =>
        "0x" + log.topics[2]?.slice(26)
      )
    );
    return toAddrs.size > 0 ? toAddrs.size : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/token/stats
 *
 * Returns on-chain token data for $OPENWORK on Base:
 * total supply, name, symbol, decimals, and estimated holder count.
 */
export async function GET() {
  try {
    // Run all RPC calls in parallel
    const [totalSupplyFormatted, name, symbol, holderCount] = await Promise.all(
      [getTotalSupply(), getTokenName(), getTokenSymbol(), getHolderCount()]
    );

    // Also get raw total supply for unformatted value
    const rawSupply = (await rpcCall("eth_call", [
      { to: TOKEN_ADDRESS, data: "0x18160ddd" },
      "latest",
    ])) as string;

    const body: TokenStatsResponse = {
      token_address: TOKEN_ADDRESS,
      chain: TOKEN_CHAIN,
      name,
      symbol,
      decimals: TOKEN_DECIMALS,
      total_supply: BigInt(rawSupply).toString(),
      total_supply_formatted: totalSupplyFormatted,
      holder_count: holderCount,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(body, { headers: CACHE_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "token_stats_failed", message, status: 502 },
      { status: 502 }
    );
  }
}
