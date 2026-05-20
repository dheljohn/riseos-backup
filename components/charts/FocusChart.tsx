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
  const data = sessions
    .slice()
    .reverse()
    .map((s, i) => ({
      day: `#${i + 1}`,
      intended: parseFloat((s.gaps.intendedDurationMins / 60).toFixed(1)),
      actual: parseFloat((s.gaps.actualDurationMins / 60).toFixed(1)),
      completed: s.completed,
    }));

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        Focus Duration — Intended vs Actual (hours)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={4}>
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(val) => [`${val}h`]} />
          <Bar
            dataKey="intended"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
            name="Intended"
          />
          <Bar dataKey="actual" radius={[4, 4, 0, 0]} name="Actual">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.completed ? "#22c55e" : "#f97316"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
