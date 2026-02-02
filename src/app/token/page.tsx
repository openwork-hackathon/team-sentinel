export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import {
  ExternalLink,
  Coins,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  BarChart3,
  Layers,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEAM_INFO = {
  name: "Sentinel",
  description:
    "Real-time $OPENWORK ecosystem dashboard — token analytics, agent leaderboards, job market trends, and live activity feed.",
  tokenSymbol: "SENTINEL",
  bondContract: "0xc5a076cad94176c2996B32d8466Be1cE757FAa27",
  reserveToken: "0x299c30DD5974BF4D5bFE42C340CA40462816AB07",
  reserveSymbol: "$OPENWORK",
};

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Bonding Curve",
    description:
      "Backed by $OPENWORK via Mint Club V2 — price grows with demand.",
  },
  {
    icon: Shield,
    title: "On-Chain Transparency",
    description:
      "All trades are on Base mainnet. Fully verifiable on BaseScan.",
  },
  {
    icon: Zap,
    title: "Instant Liquidity",
    description:
      "Buy and sell anytime through the bonding curve — no LPs needed.",
  },
  {
    icon: Coins,
    title: "Team Aligned",
    description:
      "Token value reflects community conviction in the Sentinel project.",
  },
];

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

interface BondStep {
  rangeTo: string;
  price: string;
}

interface TokenData {
  exists: boolean;
  tokenAddress: string | null;
  name: string | null;
  symbol: string | null;
  totalSupplyFormatted: string | null;
  decimals: number | null;
  bond: {
    creator: string;
    mintRoyalty: number;
    burnRoyalty: number;
    createdAt: number;
    reserveToken: string;
    reserveBalance: string;
    steps: BondStep[];
    currentStep: number;
  } | null;
  mintClubUrl: string | null;
  basescanUrl: string | null;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getTokenData(): Promise<TokenData | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/token/sentinel`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n < 0.001 && n > 0) return n.toExponential(2);
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TokenPage() {
  const data = await getTokenData();
  const isLive = data?.exists === true;
  const mintClubUrl = `https://mint.club/token/base/${TEAM_INFO.tokenSymbol}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            ${TEAM_INFO.tokenSymbol}
          </h1>
          <p className="text-sm text-muted-foreground">
            Team token on Mint Club V2 (Base)
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            isLive
              ? "text-green-500 border-green-500/30"
              : "text-yellow-500 border-yellow-500/30"
          }
        >
          {isLive ? "● Live" : "⏳ Pending"}
        </Badge>
      </div>

      {/* Live Stats (only when token exists) */}
      {isLive && data?.bond && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Supply"
            value={formatNumber(parseFloat(data.totalSupplyFormatted ?? "0"))}
            subtitle={`$${data.symbol ?? "SENTINEL"}`}
            icon={Coins}
          />
          <StatCard
            title="Reserve Balance"
            value={`${formatNumber(parseFloat(data.bond.reserveBalance))} $OW`}
            subtitle="Backing pool"
            icon={Wallet}
          />
          <StatCard
            title="Current Price Tier"
            value={`Step ${data.bond.currentStep + 1}/${data.bond.steps.length}`}
            subtitle="Bonding curve position"
            icon={BarChart3}
          />
          <StatCard
            title="Mint Royalty"
            value={`${(data.bond.mintRoyalty / 100).toFixed(1)}%`}
            subtitle={`Burn: ${(data.bond.burnRoyalty / 100).toFixed(1)}%`}
            icon={Layers}
          />
        </div>
      )}

      {/* Bonding Curve Steps (only when token exists) */}
      {isLive && data?.bond && data.bond.steps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Bonding Curve</CardTitle>
              <span className="text-xs text-muted-foreground">
                Updated {new Date(data.updatedAt).toLocaleTimeString()}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.bond.steps.map((step, i) => {
                const isCurrent = i === data.bond!.currentStep;
                const isPast = i < data.bond!.currentStep;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isCurrent
                        ? "border-sentinel-red/40 bg-sentinel-red/5"
                        : isPast
                          ? "border-green-500/20 bg-green-500/5 opacity-60"
                          : "border-border/50 opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCurrent
                            ? "bg-sentinel-red text-white"
                            : isPast
                              ? "bg-green-500/20 text-green-500"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          Up to {formatNumber(parseFloat(step.rangeTo))} tokens
                        </span>
                        {isCurrent && (
                          <span className="ml-2 text-xs text-sentinel-red font-medium">
                            ← Current
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatNumber(parseFloat(step.price))} $OW/token
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending State (token not yet created) */}
      {!isLive && (
        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8 space-y-4">
              <div className="p-4 rounded-full bg-yellow-500/10">
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  Token Creation In Progress
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  The ${TEAM_INFO.tokenSymbol} token is being deployed on Mint
                  Club V2. Once live, this page will show real-time bonding
                  curve data, supply stats, and trading links.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Checking on-chain status every 30 seconds
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token CTA */}
      <Card className="border-sentinel-red/20 bg-gradient-to-br from-sentinel-red/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                Get ${TEAM_INFO.tokenSymbol}
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg">
                Support the Sentinel project by purchasing tokens on the bonding
                curve. Backed by {TEAM_INFO.reserveSymbol} — buy and sell
                anytime with instant liquidity.
              </p>
            </div>
            <a
              href={mintClubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                isLive
                  ? "bg-sentinel-red text-white hover:bg-sentinel-red-light"
                  : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
              }`}
            >
              {isLive ? "Buy on Mint Club" : "Available Soon"}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sentinel-red/10">
                  <f.icon className="w-5 h-5 text-sentinel-red" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {f.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How to Buy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Buy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Step
              number={1}
              title="Get $OPENWORK"
              description={`Buy $OPENWORK on Base via any DEX. Contract: ${TEAM_INFO.reserveToken.slice(0, 10)}...${TEAM_INFO.reserveToken.slice(-4)}`}
            />
            <Step
              number={2}
              title="Visit Mint Club"
              description={`Go to mint.club/token/base/${TEAM_INFO.tokenSymbol} and connect your wallet.`}
            />
            <Step
              number={3}
              title={`Buy $${TEAM_INFO.tokenSymbol}`}
              description="Enter the amount of tokens you want and confirm the transaction. Price follows the bonding curve."
            />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>BankrBot users:</strong> Just say{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sentinel-red">
                &quot;Buy 1000 {TEAM_INFO.tokenSymbol} on Base&quot;
              </code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contracts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contract Addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLive && data?.tokenAddress && (
            <ContractRow
              name={`$${TEAM_INFO.tokenSymbol} Token`}
              address={data.tokenAddress}
            />
          )}
          <ContractRow
            name="Mint Club V2 Bond"
            address={TEAM_INFO.bondContract}
          />
          <ContractRow
            name={`Reserve (${TEAM_INFO.reserveSymbol})`}
            address={TEAM_INFO.reserveToken}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sentinel-red/10 text-sentinel-red text-xs font-bold flex items-center justify-center">
        {number}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ContractRow({ name, address }: { name: string; address: string }) {
  const url = `https://basescan.org/address/${address}`;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{name}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-mono bg-muted px-2 py-1 rounded hover:text-sentinel-red transition-colors"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
// Deploy cache bust: 20260202T175008Z
