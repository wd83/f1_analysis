import { NextRequest, NextResponse } from "next/server";
import { getIntervals, getLaps, getDrivers } from "@/lib/openf1";

export const runtime = "edge";

interface GapDataPoint {
  lap: number;
  [driverAcronym: string]: number | null;
}

export async function GET(request: NextRequest) {
  const sessionKey = request.nextUrl.searchParams.get("session_key");

  if (!sessionKey) {
    return NextResponse.json(
      { error: "session_key is required" },
      { status: 400 }
    );
  }

  try {
    const sk = parseInt(sessionKey);
    const [intervals, drivers] = await Promise.all([
      getIntervals(sk),
      getDrivers(sk),
    ]);

    if (intervals.length === 0) {
      return NextResponse.json([]);
    }

    // Build driver number -> acronym map
    const driverMap = new Map<number, string>();
    for (const d of drivers) {
      driverMap.set(d.driver_number, d.name_acronym);
    }

    // Get all driver laps to map timestamps to lap numbers
    const driverNumbers = [...new Set(intervals.map((i) => i.driver_number))];
    const allLaps = await Promise.all(
      driverNumbers.slice(0, 20).map((dn) => getLaps(sk, dn))
    );

    // Build timestamp -> lap number lookup per driver
    const driverLapTimes = new Map<number, { start: number; lap: number }[]>();
    for (let i = 0; i < driverNumbers.length && i < 20; i++) {
      const dn = driverNumbers[i];
      const lapTimes = allLaps[i]
        .filter((l) => l.date_start)
        .map((l) => ({
          start: new Date(l.date_start).getTime(),
          lap: l.lap_number,
        }))
        .sort((a, b) => a.start - b.start);
      driverLapTimes.set(dn, lapTimes);
    }

    // Find lap number for each interval timestamp
    function findLap(driverNumber: number, timestamp: string): number | null {
      const lapTimes = driverLapTimes.get(driverNumber);
      if (!lapTimes || lapTimes.length === 0) return null;
      const ts = new Date(timestamp).getTime();
      let lap = lapTimes[0].lap;
      for (const lt of lapTimes) {
        if (lt.start <= ts) lap = lt.lap;
        else break;
      }
      return lap;
    }

    // Group intervals by lap
    const gapsByLap = new Map<number, Map<string, number | null>>();
    for (const interval of intervals) {
      const acronym = driverMap.get(interval.driver_number);
      if (!acronym) continue;
      const lap = findLap(interval.driver_number, interval.date);
      if (lap === null) continue;

      if (!gapsByLap.has(lap)) gapsByLap.set(lap, new Map());
      // Use last interval value per lap per driver
      gapsByLap.get(lap)!.set(acronym, interval.gap_to_leader);
    }

    // Convert to array format
    const result: GapDataPoint[] = [];
    const sortedLaps = [...gapsByLap.keys()].sort((a, b) => a - b);
    for (const lap of sortedLaps) {
      const entry: GapDataPoint = { lap };
      const gaps = gapsByLap.get(lap)!;
      for (const [acronym, gap] of gaps) {
        entry[acronym] = gap;
      }
      result.push(entry);
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch gap data" },
      { status: 500 }
    );
  }
}
