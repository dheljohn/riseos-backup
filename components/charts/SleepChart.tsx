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
} from "recharts";

export default function SleepChart({ logs }: { logs: any[] }) {
  const data = logs
    .slice()
    .reverse()
    .map((log, i) => ({
      day: `Day ${i + 1}`,
      duration: parseFloat((log.gaps.actualDurationMins / 60).toFixed(1)),
      bedGap: log.gaps.bedGap.diffMinutes,
    }));

  return (
    <div className="space-y-6">
      {/* Sleep Duration */}
      <div>
        <p className="text-sm font-medium mb-2">Sleep Duration (hours)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val) => [`${val}h`, "Duration"]} />
            <ReferenceLine
              y={7}
              stroke="#22c55e"
              strokeDasharray="4 4"
              label={{ value: "7h goal", fontSize: 10 }}
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

      {/* Bedtime Gap */}
      <div>
        <p className="text-sm font-medium mb-2">Bedtime Gap (minutes late)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val) => [`${val} min`, "Gap"]} />
            <ReferenceLine y={0} stroke="#888" />
            <Bar dataKey="bedGap" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.bedGap <= 0 ? "#22c55e" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
