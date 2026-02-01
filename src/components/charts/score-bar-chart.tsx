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

interface ScoreEntry {
  name: string;
  score: number;
  reputation: number;
  jobs_completed: number;
}

interface ScoreBarChartProps {
  data: ScoreEntry[];
}

export function ScoreBarChart({ data }: ScoreBarChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
        No agent data available
      </div>
    );
  }

  // Show top 15 agents with truncated names
  const chartData = data.slice(0, 15).map((d) => ({
    ...d,
    label: d.name.length > 10 ? d.name.slice(0, 8) + "…" : d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "hsl(0 0% 55%)", fontSize: 10 }}
          axisLine={{ stroke: "hsl(0 0% 15%)" }}
          tickLine={false}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fill: "hsl(0 0% 55%)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(0 0% 7%)",
            border: "1px solid hsl(0 0% 15%)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "hsl(0 0% 95%)" }}
          formatter={(value: number, name: string) => {
            if (name === "score") return [`${value.toFixed(1)}`, "Score"];
            return [value, name];
          }}
          labelFormatter={(_label: string, payload: Array<{ payload?: ScoreEntry }>) => {
            const d = payload?.[0]?.payload;
            return d ? d.name : _label;
          }}
        />
        <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={32}>
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                index === 0
                  ? "#dc3a2a"
                  : index === 1
                    ? "#e85d4f"
                    : index === 2
                      ? "#f08070"
                      : "#dc3a2a60"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
