"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SkillCount {
  skill: string;
  count: number;
}

interface SkillsBarChartProps {
  data: SkillCount[];
}

export function SkillsBarChart({ data }: SkillsBarChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
        No skill data available
      </div>
    );
  }

  // Truncate long skill names
  const chartData = data.slice(0, 10).map((d) => ({
    ...d,
    label: d.skill.length > 14 ? d.skill.slice(0, 12) + "…" : d.skill,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "hsl(0 0% 55%)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: "hsl(0 0% 55%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={90}
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
        <Bar dataKey="count" fill="#dc3a2a" radius={[0, 4, 4, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
