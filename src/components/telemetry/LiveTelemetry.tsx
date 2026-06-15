"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { useLivePoll } from "@/hooks/useLivePoll";
import type { LiveCarPoint } from "@/app/api/telemetry/live/car-data/route";

// car_data is ~3.7 Hz, so poll fast — but only for the one selected driver.
const POLL_MS = 1500;
const WINDOW_SECONDS = 30;

interface DriverOption {
  driver_number: number;
  name_acronym: string;
  team_colour: string;
}

interface LiveTelemetryProps {
  drivers: DriverOption[];
}

// OpenF1 DRS codes: 10/12/14 = open, 8 = eligible, others = closed.
function drsState(code: number): "OPEN" | "ELIGIBLE" | "OFF" {
  if (code >= 10) return "OPEN";
  if (code === 8) return "ELIGIBLE";
  return "OFF";
}

function Gauge({
  value,
  unit,
  label,
  color,
}: {
  value: string | number;
  unit?: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg px-3 py-2 min-w-[72px]">
      <span
        className="text-2xl font-bold tabular-nums leading-none"
        style={{ color: color ?? "#15151e" }}
      >
        {value}
        {unit && <span className="text-sm font-medium text-gray-400 ml-0.5">{unit}</span>}
      </span>
      <span className="text-[10px] uppercase text-gray-400 mt-1">{label}</span>
    </div>
  );
}

function PedalBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase text-gray-400 w-12">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full rounded transition-[width] duration-150"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs tabular-nums text-gray-500 w-9 text-right">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export default function LiveTelemetry({ drivers }: LiveTelemetryProps) {
  const [driverNumber, setDriverNumber] = useState<number | null>(
    drivers[0]?.driver_number ?? null
  );

  const url = driverNumber
    ? `/api/telemetry/live/car-data?driver_number=${driverNumber}&seconds=${WINDOW_SECONDS}`
    : null;

  const { data: points, loading } = useLivePoll<LiveCarPoint[]>(url, {
    intervalMs: POLL_MS,
  });

  const driver = drivers.find((d) => d.driver_number === driverNumber);
  const color = driver ? `#${driver.team_colour}` : "#e10600";
  const latest = points && points.length ? points[points.length - 1] : null;
  const drs = latest ? drsState(latest.drs) : "OFF";

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-f1-dark">Live Telemetry</h3>
        <select
          className="px-2 py-1 rounded border border-gray-300 text-sm bg-white"
          value={driverNumber ?? ""}
          onChange={(e) => setDriverNumber(e.target.value ? parseInt(e.target.value) : null)}
        >
          {drivers.map((d) => (
            <option key={d.driver_number} value={d.driver_number}>
              {d.name_acronym}
            </option>
          ))}
        </select>
      </div>

      {!latest ? (
        <div className="text-center py-8 text-sm text-gray-400">
          {loading ? "Loading telemetry…" : "No recent telemetry for this driver"}
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            <Gauge value={Math.round(latest.speed)} unit="km/h" label="Speed" color={color} />
            <Gauge value={latest.gear === 0 ? "N" : latest.gear} label="Gear" />
            <Gauge value={Math.round(latest.rpm)} label="RPM" />
            <Gauge
              value={drs === "OPEN" ? "ON" : drs === "ELIGIBLE" ? "—" : "OFF"}
              label="DRS"
              color={drs === "OPEN" ? "#43b02a" : drs === "ELIGIBLE" ? "#ffd12e" : "#999"}
            />
          </div>

          <div className="space-y-1.5">
            <PedalBar label="Throttle" pct={latest.throttle} color="#43b02a" />
            <PedalBar label="Brake" pct={latest.brake} color="#da291c" />
          </div>

          {/* Rolling speed trace over the last window. */}
          <div>
            <p className="text-[10px] uppercase text-gray-400 mb-1">
              Speed · last {WINDOW_SECONDS}s
            </p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={points!} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <YAxis domain={[0, 360]} width={28} tick={{ fontSize: 9 }} />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
