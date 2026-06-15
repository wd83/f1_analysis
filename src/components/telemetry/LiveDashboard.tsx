"use client";

import { useEffect, useRef, useState } from "react";
import { useLivePoll } from "@/hooks/useLivePoll";
import type { LiveSnapshot } from "@/lib/openf1-live";
import LiveLeaderboard from "./LiveLeaderboard";
import LiveTelemetry from "./LiveTelemetry";
import WeatherBar from "./WeatherBar";
import GapChart from "./GapChart";

// Poll cadence for the aggregated snapshot. The free OpenF1 tier runs a few
// seconds behind the broadcast anyway, so faster than this buys nothing.
const POLL_MS = 4000;

interface GapPoint {
  lap: number;
  [acronym: string]: number | null;
}

export default function LiveDashboard() {
  const { data, error, loading, lastUpdated } = useLivePoll<LiveSnapshot>(
    "/api/telemetry/live?session_key=latest",
    { intervalMs: POLL_MS }
  );

  // Accumulate a gap-to-leader history client-side: one point per leader lap.
  const [gapHistory, setGapHistory] = useState<GapPoint[]>([]);
  const lastLeaderLap = useRef<number>(-1);

  useEffect(() => {
    if (!data?.leaderboard.length) return;
    const leaderLap = Math.max(...data.leaderboard.map((r) => r.laps_completed));
    if (leaderLap <= 0 || leaderLap === lastLeaderLap.current) return;
    lastLeaderLap.current = leaderLap;

    const point: GapPoint = { lap: leaderLap };
    for (const r of data.leaderboard) {
      point[r.name_acronym] = r.position === 1 ? 0 : r.gap_to_leader;
    }
    setGapHistory((prev) => [...prev, point]);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-f1-red border-t-transparent" />
        <span className="ml-3 text-sm text-gray-400">Connecting to live timing…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
        Couldn’t reach live timing: {error}
      </div>
    );
  }

  if (!data?.session) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">No session data available right now</p>
        <p className="text-sm text-gray-400 mt-1">
          Live timing appears here when a session is running.
        </p>
      </div>
    );
  }

  const { session, leaderboard, weather } = data;
  const secondsAgo = lastUpdated ? Math.round((Date.now() - lastUpdated) / 1000) : null;

  return (
    <div className="space-y-4">
      {/* Session header + live indicator */}
      <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {session.is_live ? (
            <span className="flex items-center gap-1.5 text-red-600 font-bold text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
              </span>
              LIVE
            </span>
          ) : (
            <span className="text-gray-400 font-semibold text-sm">FINISHED</span>
          )}
          <span className="font-bold text-f1-dark">{session.session_name}</span>
        </div>
        {secondsAgo != null && (
          <span className="text-xs text-gray-400">
            Updated {secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`}
          </span>
        )}
      </div>

      <WeatherBar weather={weather} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LiveLeaderboard rows={leaderboard} />
        </div>
        {leaderboard.length > 0 && (
          <div>
            <LiveTelemetry
              drivers={leaderboard.map((r) => ({
                driver_number: r.driver_number,
                name_acronym: r.name_acronym,
                team_colour: r.team_colour,
              }))}
            />
          </div>
        )}
      </div>

      {gapHistory.length > 1 && (
        <GapChart
          data={gapHistory}
          drivers={leaderboard.map((r) => ({
            name_acronym: r.name_acronym,
            team_colour: r.team_colour,
          }))}
        />
      )}
    </div>
  );
}
