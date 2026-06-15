"use client";

import type { LiveLeaderboardRow } from "@/lib/openf1-live";

interface LiveLeaderboardProps {
  rows: LiveLeaderboardRow[];
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#da291c",
  MEDIUM: "#ffd12e",
  HARD: "#f0f0f0",
  INTERMEDIATE: "#43b02a",
  WET: "#0067ad",
};

// mm:ss.mmm for a lap, or bare seconds for sub-minute gaps.
function formatLap(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(3).padStart(6, "0")}`;
}

function formatGap(seconds: number | null, position: number): string {
  if (position === 1) return "Leader";
  if (seconds == null) return "—";
  return `+${seconds.toFixed(3)}`;
}

export default function LiveLeaderboard({ rows }: LiveLeaderboardProps) {
  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-f1-dark text-white text-xs uppercase">
            <th className="px-2 py-2 text-left w-8">Pos</th>
            <th className="px-2 py-2 text-left">Driver</th>
            <th className="px-2 py-2 text-right">Gap</th>
            <th className="px-2 py-2 text-right hidden sm:table-cell">Interval</th>
            <th className="px-2 py-2 text-right">Last Lap</th>
            <th className="px-2 py-2 text-right hidden md:table-cell">Best</th>
            <th className="px-2 py-2 text-center">Tyre</th>
            <th className="px-2 py-2 text-center hidden sm:table-cell">Pits</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.driver_number}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="px-2 py-1.5 font-bold text-f1-dark">{r.position}</td>
              <td className="px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-1 h-4 rounded"
                    style={{ backgroundColor: `#${r.team_colour}` }}
                  />
                  <span className="font-semibold">{r.name_acronym}</span>
                  <span className="text-gray-400 text-xs hidden lg:inline">
                    {r.team_name}
                  </span>
                </div>
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatGap(r.gap_to_leader, r.position)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums hidden sm:table-cell text-gray-600">
                {r.interval != null && r.position > 1 ? `+${r.interval.toFixed(3)}` : "—"}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatLap(r.last_lap)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums hidden md:table-cell text-purple-700">
                {formatLap(r.best_lap)}
              </td>
              <td className="px-2 py-1.5 text-center">
                {r.compound ? (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border"
                    style={{
                      backgroundColor: COMPOUND_COLORS[r.compound] ?? "#ccc",
                      color: r.compound === "HARD" ? "#222" : "#fff",
                      borderColor: "rgba(0,0,0,0.15)",
                    }}
                    title={`${r.compound}${r.tyre_age != null ? ` · ${r.tyre_age} laps` : ""}`}
                  >
                    {r.compound[0]}
                  </span>
                ) : (
                  "—"
                )}
                {r.tyre_age != null && (
                  <span className="text-gray-400 text-[10px] ml-1">{r.tyre_age}</span>
                )}
              </td>
              <td className="px-2 py-1.5 text-center text-gray-600 hidden sm:table-cell">
                {r.pit_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
