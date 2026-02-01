"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailyTrend {
  date: string;
  created: number;
  completed: number;
}

interface TrendAreaChartProps {
  data: DailyTrend[];
}

export function TrendAreaChart({ data }: TrendAreaChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
        No trend data available
      </div>
    );
  }

  // Format date labels (show month/day)
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#dc3a2a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#dc3a2a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "hsl(0 0% 55%)", fontSize: 11 }}
          axisLine={{ stroke: "hsl(0 0% 15%)" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "hsl(0 0% 55%)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(0 0% 7%)",
            border: "1px solid hsl(0 0% 15%)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "hsl(0 0% 95%)" }}
        />
        <Area
          type="monotone"
          dataKey="created"
          stroke="#dc3a2a"
          fillOpacity={1}
          fill="url(#gradCreated)"
          strokeWidth={2}
          name="Created"
        />
        <Area
          type="monotone"
          dataKey="completed"
          stroke="#22c55e"
          fillOpacity={1}
          fill="url(#gradCompleted)"
          strokeWidth={2}
          name="Completed"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
