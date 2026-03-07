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

interface ProcessedCarData {
  distance: number;
  speed: number;
}

interface SpeedTraceProps {
  data1: ProcessedCarData[];
  data2: ProcessedCarData[];
  color1: string;
  color2: string;
  label1: string;
  label2: string;
  syncId?: string;
  onHoverDistance?: (distance: number | null) => void;
}

export default function SpeedTrace({
  data1,
  data2,
  color1,
  color2,
  label1,
  label2,
  syncId = "telemetry",
  onHoverDistance,
}: SpeedTraceProps) {
  // Merge both datasets by distance for overlay
  const merged = mergeByDistance(data1, data2);

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-lg font-bold text-f1-dark mb-4">Speed Trace</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={merged}
          syncId={syncId}
          onMouseMove={(e) => {
            if (e?.activePayload?.[0] && onHoverDistance) {
              onHoverDistance(e.activePayload[0].payload.distance);
            }
          }}
          onMouseLeave={() => onHoverDistance?.(null)}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="distance"
            tickFormatter={(v) => `${Math.round(v)}%`}
            tick={{ fontSize: 11 }}
            label={{
              value: "Track Distance (%)",
              position: "insideBottom",
              offset: -5,
              fontSize: 11,
            }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            label={{
              value: "Speed (km/h)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fontSize: 11,
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div className="bg-white border rounded shadow px-3 py-2 text-xs">
                  <p className="text-gray-500 mb-1">
                    Distance: {p.distance.toFixed(1)}%
                  </p>
                  {p.speed1 != null && (
                    <p style={{ color: color1 }}>
                      {label1}: {Math.round(p.speed1)} km/h
                    </p>
                  )}
                  {p.speed2 != null && (
                    <p style={{ color: color2 }}>
                      {label2}: {Math.round(p.speed2)} km/h
                    </p>
                  )}
                </div>
              );
            }}
          />
          {data1.length > 0 && (
            <Line
              type="monotone"
              dataKey="speed1"
              stroke={color1}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              name={label1}
              connectNulls
            />
          )}
          {data2.length > 0 && (
            <Line
              type="monotone"
              dataKey="speed2"
              stroke={color2}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              name={label2}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-center">
        {data1.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <div
              className="w-4 h-0.5"
              style={{ backgroundColor: color1 }}
            />
            <span>{label1}</span>
          </div>
        )}
        {data2.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <div
              className="w-4 h-0.5"
              style={{ backgroundColor: color2 }}
            />
            <span>{label2}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function mergeByDistance(
  data1: ProcessedCarData[],
  data2: ProcessedCarData[]
): { distance: number; speed1: number | null; speed2: number | null }[] {
  if (data1.length === 0 && data2.length === 0) return [];

  // Create unified distance points
  const distances = new Set<number>();
  for (const d of data1) distances.add(Math.round(d.distance * 10) / 10);
  for (const d of data2) distances.add(Math.round(d.distance * 10) / 10);

  const sortedDistances = [...distances].sort((a, b) => a - b);

  // Interpolate speeds at each distance
  const result = sortedDistances.map((dist) => ({
    distance: dist,
    speed1: interpolateSpeed(data1, dist),
    speed2: interpolateSpeed(data2, dist),
  }));

  return result;
}

function interpolateSpeed(
  data: ProcessedCarData[],
  targetDist: number
): number | null {
  if (data.length === 0) return null;

  // Find bracketing points
  let lo = 0;
  let hi = data.length - 1;

  if (targetDist <= data[0].distance) return data[0].speed;
  if (targetDist >= data[hi].distance) return data[hi].speed;

  for (let i = 0; i < data.length - 1; i++) {
    if (data[i].distance <= targetDist && data[i + 1].distance >= targetDist) {
      lo = i;
      hi = i + 1;
      break;
    }
  }

  const range = data[hi].distance - data[lo].distance;
  if (range === 0) return data[lo].speed;
  const t = (targetDist - data[lo].distance) / range;
  return data[lo].speed + t * (data[hi].speed - data[lo].speed);
}
