"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProcessedCarData {
  distance: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  drs: number;
  rpm: number;
}

interface CarDataDashboardProps {
  data1: ProcessedCarData[];
  data2: ProcessedCarData[];
  color1: string;
  color2: string;
  label1: string;
  label2: string;
}

function MiniChart({
  data1,
  data2,
  dataKey,
  label,
  color1,
  color2,
  height = 100,
  yDomain,
  unit,
}: {
  data1: ProcessedCarData[];
  data2: ProcessedCarData[];
  dataKey: keyof ProcessedCarData;
  label: string;
  color1: string;
  color2: string;
  height?: number;
  yDomain?: [number, number];
  unit?: string;
}) {
  // Merge data
  const distances = new Set<number>();
  for (const d of data1)
    distances.add(Math.round(d.distance * 10) / 10);
  for (const d of data2)
    distances.add(Math.round(d.distance * 10) / 10);

  const sorted = [...distances].sort((a, b) => a - b);
  const merged = sorted.map((dist) => {
    const v1 = findNearest(data1, dist, dataKey);
    const v2 = findNearest(data2, dist, dataKey);
    return { distance: dist, value1: v1, value2: v2 };
  });

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={merged} syncId="telemetry" margin={{ left: 0, right: 0 }}>
          <XAxis dataKey="distance" hide />
          <YAxis
            width={35}
            tick={{ fontSize: 9 }}
            domain={yDomain}
            tickFormatter={(v) =>
              unit ? `${v}${unit}` : String(Math.round(v))
            }
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div className="bg-white border rounded shadow px-2 py-1 text-xs">
                  {p.value1 != null && (
                    <p style={{ color: color1 }}>
                      {Math.round(p.value1)}
                      {unit || ""}
                    </p>
                  )}
                  {p.value2 != null && (
                    <p style={{ color: color2 }}>
                      {Math.round(p.value2)}
                      {unit || ""}
                    </p>
                  )}
                </div>
              );
            }}
          />
          {data1.length > 0 && (
            <Line
              type="monotone"
              dataKey="value1"
              stroke={color1}
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          )}
          {data2.length > 0 && (
            <Line
              type="monotone"
              dataKey="value2"
              stroke={color2}
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function findNearest(
  data: ProcessedCarData[],
  dist: number,
  key: keyof ProcessedCarData
): number | null {
  if (data.length === 0) return null;
  let closest = data[0];
  let minDiff = Math.abs(data[0].distance - dist);
  for (const d of data) {
    const diff = Math.abs(d.distance - dist);
    if (diff < minDiff) {
      minDiff = diff;
      closest = d;
    }
  }
  if (minDiff > 2) return null; // too far away
  return closest[key] as number;
}

export default function CarDataDashboard({
  data1,
  data2,
  color1,
  color2,
  label1,
  label2,
}: CarDataDashboardProps) {
  if (data1.length === 0 && data2.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-lg font-bold text-f1-dark mb-4">
        Car Data Dashboard
      </h3>
      <div className="space-y-2">
        <MiniChart
          data1={data1}
          data2={data2}
          dataKey="throttle"
          label="Throttle (%)"
          color1={color1}
          color2={color2}
          yDomain={[0, 100]}
          unit="%"
        />
        <MiniChart
          data1={data1}
          data2={data2}
          dataKey="brake"
          label="Brake"
          color1={color1}
          color2={color2}
          yDomain={[0, 100]}
        />
        <MiniChart
          data1={data1}
          data2={data2}
          dataKey="gear"
          label="Gear"
          color1={color1}
          color2={color2}
          yDomain={[0, 8]}
        />
        <MiniChart
          data1={data1}
          data2={data2}
          dataKey="rpm"
          label="RPM"
          color1={color1}
          color2={color2}
        />
        <MiniChart
          data1={data1}
          data2={data2}
          dataKey="drs"
          label="DRS"
          color1={color1}
          color2={color2}
          yDomain={[0, 14]}
        />
      </div>
    </div>
  );
}
