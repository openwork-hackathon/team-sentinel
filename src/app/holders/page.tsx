import { Wallet, Coins, Users, PieChart as PieIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { HolderPieChart } from "@/components/charts/holder-pie-chart";
import { OPENWORK_API } from "@/lib/constants";
import { formatNumber, formatAddress } from "@/lib/utils";

interface Holder {
  address: string;
  balance: number;
  percentage: number;
}

interface HolderData {
  holders: Holder[];
  totalSupply: string;
  holderCount: number;
  pieSlices: { name: string; value: number; color: string }[];
}

const TIER_COLORS = [
  "#dc3a2a", // whale - sentinel red
  "#e85d4f", // dolphin
  "#f08070", // fish
  "#4ade80", // shrimp green
  "#60a5fa", // micro blue
  "#a78bfa", // dust purple
];

async function getHolderData(): Promise<HolderData> {
  try {
    // Fetch dashboard for stats + agents for holder approximation
    const [dashRes, agentsRes] = await Promise.all([
      fetch(`${OPENWORK_API}/dashboard`, { next: { revalidate: 60 } }),
      fetch(`${OPENWORK_API}/agents`, { next: { revalidate: 60 } }),
    ]);

    const dashData = dashRes.ok ? await dashRes.json() : {};
    const agentsRaw = agentsRes.ok ? await agentsRes.json() : [];
    const agents = Array.isArray(agentsRaw) ? agentsRaw : agentsRaw?.agents ?? [];

    const stats = dashData.stats ?? dashData;
    const holderCount = stats?.totalAgents ?? stats?.total_agents ?? agents.length ?? 0;

    // Build holder list from agents that have wallets + earnings
    const holders: Holder[] = agents
      .filter((a: { wallet_address?: string; total_earnings?: number }) =>
        a.wallet_address && (a.total_earnings ?? 0) > 0
      )
      .map((a: { wallet_address: string; name: string; total_earnings?: number }) => ({
        address: a.wallet_address,
        balance: a.total_earnings ?? 0,
        percentage: 0,
        name: a.name,
      }))
      .sort((a: { balance: number }, b: { balance: number }) => b.balance - a.balance)
      .slice(0, 25);

    // Calculate percentages
    const totalHeld = holders.reduce((s: number, h: Holder) => s + h.balance, 0);
    if (totalHeld > 0) {
      for (const h of holders) {
        h.percentage = (h.balance / totalHeld) * 100;
      }
    }

    // Build pie slices by tier
    const tiers = [
      { name: "Top 3", min: 0, max: 3 },
      { name: "4–10", min: 3, max: 10 },
      { name: "11–25", min: 10, max: 25 },
    ];

    const pieSlices = tiers
      .map((tier, i) => {
        const slice = holders.slice(tier.min, tier.max);
        const total = slice.reduce((s, h) => s + h.percentage, 0);
        return { name: tier.name, value: Math.round(total * 10) / 10, color: TIER_COLORS[i] };
      })
      .filter((s) => s.value > 0);

    const accounted = pieSlices.reduce((s, p) => s + p.value, 0);
    if (accounted < 100 && holders.length > 0) {
      pieSlices.push({
        name: "Others",
        value: Math.round((100 - accounted) * 10) / 10,
        color: TIER_COLORS[3],
      });
    }

    const totalSupply = stats?.totalRewardsPaid != null
      ? `${formatNumber(stats.totalRewardsPaid)} $OW`
      : "—";

    return { holders, totalSupply, holderCount, pieSlices };
  } catch {
    return { holders: [], totalSupply: "—", holderCount: 0, pieSlices: [] };
  }
}

export default async function HoldersPage() {
  const { holders, totalSupply, holderCount, pieSlices } = await getHolderData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-sentinel-red" />
            Token Holders
          </h1>
          <p className="text-sm text-muted-foreground">
            $OPENWORK token holder distribution and analytics
          </p>
        </div>
        <Badge variant="outline" className="text-sentinel-red border-sentinel-red/30">
          Base Mainnet
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Rewards Distributed"
          value={totalSupply}
          subtitle="Total paid out"
          icon={Coins}
        />
        <StatCard
          title="Active Holders"
          value={formatNumber(holderCount)}
          subtitle="Agents with wallets"
          icon={Users}
        />
        <StatCard
          title="Tracked Holders"
          value={formatNumber(holders.length)}
          subtitle="With non-zero balance"
          icon={Wallet}
        />
      </div>

      {/* Distribution Chart + Top Holders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pie Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-sentinel-red" />
                Distribution
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <HolderPieChart data={pieSlices} />
          </CardContent>
        </Card>

        {/* Holder Table */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Holders</CardTitle>
          </CardHeader>
          <CardContent>
            {holders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No holder data available yet
              </p>
            ) : (
              <div className="space-y-1.5">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Address</div>
                  <div className="col-span-3 text-right">Balance</div>
                  <div className="col-span-3 text-right">Share</div>
                </div>

                {/* Rows */}
                {holders.map((holder, i) => (
                  <div
                    key={holder.address}
                    className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg border border-border/50 hover:border-sentinel-red/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="col-span-1 text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="col-span-5">
                      <code className="text-xs font-mono">
                        {formatAddress(holder.address)}
                      </code>
                    </div>
                    <div className="col-span-3 text-right text-sm font-medium">
                      {formatNumber(holder.balance)}
                    </div>
                    <div className="col-span-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sentinel-red"
                            style={{ width: `${Math.min(holder.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {holder.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
