"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface GapDataPoint {
  lap: number;
  [driverAcronym: string]: number | null;
}

interface DriverInfo {
  name_acronym: string;
  team_colour: string;
}

interface GapChartProps {
  data: GapDataPoint[];
  drivers: DriverInfo[];
}

export default function GapChart({ data, drivers }: GapChartProps) {
  if (data.length === 0) return null;

  // Find all driver acronyms in the data (excluding "lap")
  const allKeys = new Set<string>();
  for (const point of data) {
    for (const key of Object.keys(point)) {
      if (key !== "lap") allKeys.add(key);
    }
  }

  // Map acronym to color
  const colorMap = new Map<string, string>();
  for (const d of drivers) {
    colorMap.set(d.name_acronym, `#${d.team_colour}`);
  }

  // Only show top 10 drivers by final gap
  const lastPoint = data[data.length - 1];
  const driverGaps = [...allKeys]
    .map((key) => ({ key, gap: (lastPoint[key] as number) ?? Infinity }))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 10);

  const activeDrivers = driverGaps.map((d) => d.key);

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-lg font-bold text-f1-dark mb-4">
        Gap to Leader
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="lap"
            tick={{ fontSize: 11 }}
            label={{
              value: "Lap",
              position: "insideBottom",
              offset: -5,
              fontSize: 11,
            }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            label={{
              value: "Gap (s)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fontSize: 11,
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const sorted = [...payload]
                .filter((p) => p.value != null)
                .sort(
                  (a, b) => (a.value as number) - (b.value as number)
                );
              return (
                <div className="bg-white border rounded shadow px-3 py-2 text-xs max-h-48 overflow-auto">
                  <p className="font-bold mb-1">Lap {label}</p>
                  {sorted.map((p) => (
                    <p
                      key={p.dataKey as string}
                      style={{ color: p.color }}
                    >
                      {p.dataKey}: +{(p.value as number).toFixed(1)}s
                    </p>
                  ))}
                </div>
              );
            }}
          />
          {activeDrivers.map((acronym) => (
            <Line
              key={acronym}
              type="monotone"
              dataKey={acronym}
              stroke={colorMap.get(acronym) || "#888"}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-3">
        {activeDrivers.map((acronym) => (
          <div key={acronym} className="flex items-center gap-1 text-xs">
            <div
              className="w-3 h-1.5 rounded"
              style={{
                backgroundColor: colorMap.get(acronym) || "#888",
              }}
            />
            <span>{acronym}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
