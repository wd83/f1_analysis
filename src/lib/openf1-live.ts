// OpenF1 live-session helpers.
//
// Unlike src/lib/openf1.ts (which caches completed sessions for 24h), every
// fetch here is `cache: "no-store"` because the data changes second-to-second
// during a live session. Supports `session_key=latest` to auto-target whatever
// session is currently running.

import type {
  OpenF1Session,
  OpenF1Driver,
  OpenF1Position,
  OpenF1Interval,
  OpenF1Lap,
  OpenF1Stint,
  OpenF1Pit,
  OpenF1Weather,
  OpenF1CarData,
} from "./openf1";

const BASE_URL = "https://api.openf1.org/v1";

type SessionKey = number | "latest";

async function fetchLive<T>(
  endpoint: string,
  params: Record<string, string | number>
): Promise<T[]> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`OpenF1 live API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ISO timestamp `seconds` ago, used to bound high-frequency endpoints so the
// payload stays small late in a race instead of growing with every lap.
function sinceISO(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

// --- Aggregated live leaderboard shape returned to the client ---

export interface LiveLeaderboardRow {
  position: number;
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  team_colour: string;
  gap_to_leader: number | null; // seconds; null for the leader
  interval: number | null; // seconds to car ahead
  last_lap: number | null; // seconds
  best_lap: number | null; // seconds
  compound: string | null; // SOFT | MEDIUM | HARD | INTERMEDIATE | WET
  tyre_age: number | null; // laps on current set
  pit_count: number;
  laps_completed: number;
}

export interface LiveSnapshot {
  session: {
    session_key: number;
    session_name: string;
    session_type: string;
    is_live: boolean;
  } | null;
  leaderboard: LiveLeaderboardRow[];
  weather: OpenF1Weather | null;
  server_time: string;
}

// Resolve the currently-targeted session. With "latest", OpenF1 returns the
// running session, or the most recent one if nothing is live right now.
export async function getLiveSession(
  sessionKey: SessionKey
): Promise<OpenF1Session | null> {
  const sessions = await fetchLive<OpenF1Session>("/sessions", {
    session_key: sessionKey,
  });
  return sessions[0] ?? null;
}

// Latest value per driver from a timestamped endpoint. Rows arrive in time
// order; the last one wins.
function latestByDriver<T extends { driver_number: number }>(rows: T[]): Map<number, T> {
  const map = new Map<number, T>();
  for (const row of rows) {
    map.set(row.driver_number, row);
  }
  return map;
}

// Build the full leaderboard snapshot in one shot. Positions/stints/pits are
// small (one row per change) so we fetch the whole session; intervals and laps
// are windowed because they emit several rows per driver per minute.
export async function getLiveSnapshot(
  sessionKey: SessionKey
): Promise<LiveSnapshot> {
  const session = await getLiveSession(sessionKey);

  if (!session) {
    return { session: null, leaderboard: [], weather: null, server_time: new Date().toISOString() };
  }

  const sk = session.session_key;
  const now = Date.now();
  const isLive =
    new Date(session.date_start).getTime() <= now &&
    now <= new Date(session.date_end).getTime() + 5 * 60 * 1000;

  // Window the chatty endpoints. If a live window comes back empty (e.g. the
  // session just ended), fall back to a full fetch so post-session standings
  // still render.
  const recentIntervalsSince = sinceISO(180);
  const recentLapsSince = sinceISO(300);

  const [drivers, positions, stints, pits, weatherRows, intervalsWindowed, lapsWindowed] =
    await Promise.all([
      fetchLive<OpenF1Driver>("/drivers", { session_key: sk }),
      fetchLive<OpenF1Position>("/position", { session_key: sk }),
      fetchLive<OpenF1Stint>("/stints", { session_key: sk }),
      fetchLive<OpenF1Pit>("/pit", { session_key: sk }),
      fetchLive<OpenF1Weather>("/weather", { session_key: sk }),
      fetchLive<OpenF1Interval>("/intervals", { session_key: sk, "date>=": recentIntervalsSince }),
      fetchLive<OpenF1Lap>("/laps", { session_key: sk, "date>=": recentLapsSince }),
    ]);

  const intervals = intervalsWindowed.length
    ? intervalsWindowed
    : await fetchLive<OpenF1Interval>("/intervals", { session_key: sk });
  const laps = lapsWindowed.length
    ? lapsWindowed
    : await fetchLive<OpenF1Lap>("/laps", { session_key: sk });

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
  const latestPosition = latestByDriver(positions);
  const latestInterval = latestByDriver(intervals);

  // Latest completed lap + running best lap + lap count per driver.
  const lastLap = new Map<number, OpenF1Lap>();
  const bestLap = new Map<number, number>();
  const lapCount = new Map<number, number>();
  for (const lap of laps) {
    lapCount.set(lap.driver_number, Math.max(lapCount.get(lap.driver_number) ?? 0, lap.lap_number));
    if (lap.lap_duration != null) {
      lastLap.set(lap.driver_number, lap);
      const prevBest = bestLap.get(lap.driver_number);
      if (prevBest == null || lap.lap_duration < prevBest) {
        bestLap.set(lap.driver_number, lap.lap_duration);
      }
    }
  }

  // Current stint (highest stint_number) per driver.
  const currentStint = new Map<number, OpenF1Stint>();
  for (const stint of stints) {
    const existing = currentStint.get(stint.driver_number);
    if (!existing || stint.stint_number > existing.stint_number) {
      currentStint.set(stint.driver_number, stint);
    }
  }

  const pitCount = new Map<number, number>();
  for (const pit of pits) {
    pitCount.set(pit.driver_number, (pitCount.get(pit.driver_number) ?? 0) + 1);
  }

  const leaderboard: LiveLeaderboardRow[] = [...latestPosition.values()]
    .map((pos) => {
      const d = driverMap.get(pos.driver_number);
      const stint = currentStint.get(pos.driver_number);
      const lap = lastLap.get(pos.driver_number);
      const tyreAge =
        stint && lap ? stint.tyre_age_at_start + (lap.lap_number - stint.lap_start) : null;
      return {
        position: pos.position,
        driver_number: pos.driver_number,
        name_acronym: d?.name_acronym ?? String(pos.driver_number),
        full_name: d?.full_name ?? "",
        team_name: d?.team_name ?? "",
        team_colour: d?.team_colour ?? "888888",
        gap_to_leader: latestInterval.get(pos.driver_number)?.gap_to_leader ?? null,
        interval: latestInterval.get(pos.driver_number)?.interval ?? null,
        last_lap: lap?.lap_duration ?? null,
        best_lap: bestLap.get(pos.driver_number) ?? null,
        compound: stint?.compound ?? null,
        tyre_age: tyreAge,
        pit_count: pitCount.get(pos.driver_number) ?? 0,
        laps_completed: lapCount.get(pos.driver_number) ?? 0,
      };
    })
    .sort((a, b) => a.position - b.position);

  // Weather rows are time-ordered; the last is current.
  const weather = weatherRows.length ? weatherRows[weatherRows.length - 1] : null;

  return {
    session: {
      session_key: sk,
      session_name: session.session_name,
      session_type: session.session_type,
      is_live: isLive,
    },
    leaderboard,
    weather,
    server_time: new Date().toISOString(),
  };
}

// Recent telemetry for a single driver (last `seconds`), latest-value readout
// for live gauges. Only ever called for the driver(s) the user has selected.
export async function getLiveCarData(
  sessionKey: SessionKey,
  driverNumber: number,
  seconds: number
): Promise<OpenF1CarData[]> {
  return fetchLive<OpenF1CarData>("/car_data", {
    session_key: sessionKey,
    driver_number: driverNumber,
    "date>=": sinceISO(seconds),
  });
}
