"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LineChart,
  Line,
} from "recharts";

const ENERGY_LABELS: Record<number, string> = {
  1: "😴",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "🔥",
};

export default function SleepChart({ logs }: { logs: any[] }) {
  const data = logs
    .slice()
    .reverse()
    .map((log: any, i: number) => ({
      day: `Day ${i + 1}`,

      duration: Number(log.durationHrs),

      energy: Number(log.energyLevel),

      energyLabel: ENERGY_LABELS[log.energyLevel] ?? "😐",
    }));

  return (
    <div className="space-y-8">
      {/* Sleep Duration */}
      <div>
        <p className="text-sm font-medium mb-2">Sleep Duration (hours)</p>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />

            <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} />

            <Tooltip formatter={(val) => [`${val}h`, "Sleep"]} />

            <ReferenceLine
              y={7}
              stroke="#22c55e"
              strokeDasharray="4 4"
              label={{
                value: "7h goal",
                fontSize: 10,
              }}
            />

            <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.duration >= 7 ? "#22c55e" : "#f97316"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Energy Chart */}
      <div>
        <p className="text-sm font-medium mb-2">Energy Level</p>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />

            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tickFormatter={(v) => ENERGY_LABELS[v]}
            />

            <Tooltip formatter={(val: any) => [ENERGY_LABELS[val], "Energy"]} />

            <Line
              type="monotone"
              dataKey="energy"
              stroke="#3b82f6"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
