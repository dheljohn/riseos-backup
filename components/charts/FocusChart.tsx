"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function FocusChart({ sessions }: { sessions: any[] }) {
  const data = [...sessions]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((s, i) => ({
      day: `#${i + 1}`,
      planned: Number((s.durationMins / 60).toFixed(1)),
      completed: s.completed,
      label: s.label,
    }));

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        Focus Sessions — Planned Duration (hours)
      </p>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={6}>
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(val: any) => [`${val} hrs`, "Planned"]}
            labelFormatter={(label) => `Session ${label}`}
          />

          <Bar dataKey="planned" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.completed ? "#22c55e" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
