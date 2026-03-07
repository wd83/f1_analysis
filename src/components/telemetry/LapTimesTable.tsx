"use client";

interface Lap {
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean;
}

interface LapTimesTableProps {
  laps: Lap[];
  driverLabel: string;
  color: string;
}

function formatTime(seconds: number | null): string {
  if (seconds === null) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, "0")}` : secs;
}

export default function LapTimesTable({
  laps,
  driverLabel,
  color,
}: LapTimesTableProps) {
  if (laps.length === 0) return null;

  // Find best times for highlighting
  const validLaps = laps.filter((l) => l.lap_duration !== null && !l.is_pit_out_lap);
  const bestLap = validLaps.reduce(
    (best, l) =>
      (l.lap_duration ?? Infinity) < (best ?? Infinity)
        ? l.lap_duration
        : best,
    null as number | null
  );
  const bestS1 = validLaps.reduce(
    (best, l) =>
      (l.duration_sector_1 ?? Infinity) < (best ?? Infinity)
        ? l.duration_sector_1
        : best,
    null as number | null
  );
  const bestS2 = validLaps.reduce(
    (best, l) =>
      (l.duration_sector_2 ?? Infinity) < (best ?? Infinity)
        ? l.duration_sector_2
        : best,
    null as number | null
  );
  const bestS3 = validLaps.reduce(
    (best, l) =>
      (l.duration_sector_3 ?? Infinity) < (best ?? Infinity)
        ? l.duration_sector_3
        : best,
    null as number | null
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-5 py-3 border-b flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="text-sm font-bold text-f1-dark">{driverLabel} - Lap Times</h3>
      </div>
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Lap
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Time
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                S1
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                S2
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                S3
              </th>
            </tr>
          </thead>
          <tbody>
            {laps.map((lap) => (
              <tr
                key={lap.lap_number}
                className={`border-t hover:bg-gray-50 ${
                  lap.is_pit_out_lap ? "opacity-50" : ""
                }`}
              >
                <td className="px-3 py-1.5 font-mono text-xs">
                  {lap.lap_number}
                </td>
                <td
                  className={`px-3 py-1.5 font-mono text-xs ${
                    lap.lap_duration === bestLap && bestLap !== null
                      ? "text-purple-600 font-bold"
                      : ""
                  }`}
                >
                  {formatTime(lap.lap_duration)}
                  {lap.is_pit_out_lap && (
                    <span className="ml-1 text-yellow-600">P</span>
                  )}
                </td>
                <td
                  className={`px-3 py-1.5 font-mono text-xs ${
                    lap.duration_sector_1 === bestS1 && bestS1 !== null
                      ? "text-purple-600 font-bold"
                      : ""
                  }`}
                >
                  {formatTime(lap.duration_sector_1)}
                </td>
                <td
                  className={`px-3 py-1.5 font-mono text-xs ${
                    lap.duration_sector_2 === bestS2 && bestS2 !== null
                      ? "text-purple-600 font-bold"
                      : ""
                  }`}
                >
                  {formatTime(lap.duration_sector_2)}
                </td>
                <td
                  className={`px-3 py-1.5 font-mono text-xs ${
                    lap.duration_sector_3 === bestS3 && bestS3 !== null
                      ? "text-purple-600 font-bold"
                      : ""
                  }`}
                >
                  {formatTime(lap.duration_sector_3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
