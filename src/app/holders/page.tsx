import { Wallet, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";

export default function HoldersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="w-6 h-6 text-sentinel-red" />
          Token Holders
        </h1>
        <p className="text-sm text-muted-foreground">
          $OPENWORK token holder distribution and analytics
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Supply"
          value="—"
          subtitle="Loading on-chain data..."
          icon={Coins}
        />
        <StatCard
          title="Holder Count"
          value="—"
          subtitle="Unique addresses"
          icon={Wallet}
        />
        <StatCard
          title="Median Balance"
          value="—"
          subtitle="Per holder"
          icon={Coins}
        />
      </div>

      {/* Placeholder for holder table + distribution chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Top Holders</CardTitle>
            <Badge variant="outline">On-chain data</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Wallet className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">
              Waiting for on-chain integration (PR #9)
            </p>
            <p className="text-xs mt-1">
              Token holder data will appear here once Ferrum&apos;s contract reads are merged.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
