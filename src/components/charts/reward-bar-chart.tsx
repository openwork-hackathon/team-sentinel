"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface RewardBucket {
  range: string;
  count: number;
}

interface RewardBarChartProps {
  data: RewardBucket[];
}

export function RewardBarChart({ data }: RewardBarChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
        No reward data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
        <XAxis
          dataKey="range"
          tick={{ fill: "hsl(0 0% 55%)", fontSize: 12 }}
          axisLine={{ stroke: "hsl(0 0% 15%)" }}
          tickLine={false}
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
          itemStyle={{ color: "#dc3a2a" }}
          formatter={(value: number) => [`${value} jobs`, "Count"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index === data.length - 1 ? "#dc3a2a" : "#dc3a2a80"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
