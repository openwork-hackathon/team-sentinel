import { ExternalLink, Coins, TrendingUp, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function TokenPage() {
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
          className="text-sentinel-red border-sentinel-red/30"
        >
          Clawathon 2026
        </Badge>
      </div>

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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sentinel-red text-white font-medium text-sm hover:bg-sentinel-red-light transition-colors whitespace-nowrap"
            >
              Buy on Mint Club
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
              title={`Visit Mint Club`}
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
