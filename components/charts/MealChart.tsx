"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

type MealChartData = {
  type: string;
  avgGapMinutes: number; // positive = late, negative = early
  count: number;
};

type Props = {
  data: Record<string, number>;
};

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function formatGapLabel(minutes: number) {
  if (minutes === 0) return "On time";
  const abs = Math.abs(minutes);
  const label = abs < 60 ? `${abs} min` : `${(abs / 60).toFixed(1)} hr`;
  return minutes > 0 ? `${label} late` : `${label} early`;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { type, avgGapMinutes } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{MEAL_LABELS[type]}</p>
      <p className="text-muted-foreground">
        Avg gap:{" "}
        <span
          className={avgGapMinutes > 0 ? "text-orange-500" : "text-green-500"}
        >
          {formatGapLabel(avgGapMinutes)}
        </span>
      </p>
    </div>
  );
}

export default function MealChart({ data }: Props) {
  if (!data) return null; // add this
  // Sort by fixed meal order, fill missing meal types with 0
  const chartData = MEAL_ORDER.map((type) => ({
    type,
    avgGapMinutes: data[type] ?? 0,
  }));

  const maxAbs = Math.max(
    ...chartData.map((d) => Math.abs(d.avgGapMinutes)),
    30,
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={[-maxAbs, maxAbs]}
          tickFormatter={(v) => `${Math.abs(v)}m`}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="type"
          tickFormatter={(v) => MEAL_LABELS[v]}
          tick={{ fontSize: 12 }}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={2} />
        <Bar dataKey="avgGapMinutes" radius={[0, 4, 4, 0]} maxBarSize={32}>
          {chartData.map((entry) => (
            <Cell
              key={entry.type}
              fill={
                entry.avgGapMinutes > 15
                  ? "hsl(var(--chart-orange, 25 95% 53%))"
                  : entry.avgGapMinutes < -15
                    ? "hsl(var(--chart-blue, 217 91% 60%))"
                    : "hsl(var(--chart-green, 142 71% 45%))"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
