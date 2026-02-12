const API_BASE = "https://api.jolpi.ca/ergast/f1";

export interface Circuit {
  circuitId: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
}

export interface RaceResult {
  season: string;
  raceName: string;
  round: string;
  Circuit: Circuit;
  date: string;
  Results: {
    position: string;
    number: string;
    Driver: {
      driverId: string;
      givenName: string;
      familyName: string;
      nationality: string;
    };
    Constructor: {
      constructorId: string;
      name: string;
      nationality: string;
    };
    grid: string;
    status: string;
    Time?: {
      millis: string;
      time: string;
    };
    FastestLap?: {
      rank: string;
      lap: string;
      Time: { time: string };
      AverageSpeed: { units: string; speed: string };
    };
  }[];
}

export interface QualifyingResult {
  season: string;
  raceName: string;
  round: string;
  Circuit: Circuit;
  date: string;
  QualifyingResults: {
    position: string;
    Driver: {
      driverId: string;
      givenName: string;
      familyName: string;
      nationality: string;
    };
    Constructor: {
      constructorId: string;
      name: string;
      nationality: string;
    };
    Q1?: string;
    Q2?: string;
    Q3?: string;
  }[];
}

async function fetchJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getCircuits(): Promise<Circuit[]> {
  const allCircuits: Circuit[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const data = await fetchJson(
      `${API_BASE}/circuits.json?limit=${limit}&offset=${offset}`
    );
    const circuits = data.MRData.CircuitTable.Circuits;
    allCircuits.push(...circuits);
    const total = parseInt(data.MRData.total);
    offset += limit;
    if (offset >= total) break;
  }

  return allCircuits;
}

export async function getRaceResults(
  circuitId: string,
  seasonStart: number,
  seasonEnd: number
): Promise<RaceResult[]> {
  const results: RaceResult[] = [];

  for (let year = seasonStart; year <= seasonEnd; year++) {
    try {
      const data = await fetchJson(
        `${API_BASE}/${year}/circuits/${circuitId}/results.json?limit=100`
      );
      const races = data.MRData.RaceTable.Races;
      if (races && races.length > 0) {
        results.push(...races);
      }
    } catch {
      // Season may not have data for this circuit
    }
  }

  return results;
}

export async function getQualifyingResults(
  circuitId: string,
  seasonStart: number,
  seasonEnd: number
): Promise<QualifyingResult[]> {
  const results: QualifyingResult[] = [];

  for (let year = seasonStart; year <= seasonEnd; year++) {
    try {
      const data = await fetchJson(
        `${API_BASE}/${year}/circuits/${circuitId}/qualifying.json?limit=100`
      );
      const races = data.MRData.RaceTable.Races;
      if (races && races.length > 0) {
        results.push(...races);
      }
    } catch {
      // Season may not have data
    }
  }

  return results;
}

// Processed data types for the frontend
export interface DriverTrackStats {
  driverId: string;
  name: string;
  nationality: string;
  wins: number;
  podiums: number;
  fastestLaps: number;
  bestFinish: number;
  avgFinish: number;
  appearances: number;
  bestQuali: number | null;
  constructors: string[];
}

export interface ConstructorTrackStats {
  constructorId: string;
  name: string;
  nationality: string;
  wins: number;
  podiums: number;
  fastestLaps: number;
  oneTwo: number;
  appearances: number;
  avgFinish: number;
  drivers: string[];
}

export interface SeasonSummary {
  season: string;
  winner: string;
  winnerConstructor: string;
  winningTime: string | null;
  fastestLap: string | null;
  fastestLapDriver: string | null;
  polePosition: string | null;
}

export function processRaceResults(races: RaceResult[]): {
  drivers: DriverTrackStats[];
  constructors: ConstructorTrackStats[];
  seasons: SeasonSummary[];
} {
  const driverMap = new Map<string, DriverTrackStats>();
  const constructorMap = new Map<string, ConstructorTrackStats>();
  const seasons: SeasonSummary[] = [];

  for (const race of races) {
    let fastestLapTime: string | null = null;
    let fastestLapDriver: string | null = null;

    for (const result of race.Results) {
      const driverId = result.Driver.driverId;
      const driverName = `${result.Driver.givenName} ${result.Driver.familyName}`;
      const constructorId = result.Constructor.constructorId;
      const constructorName = result.Constructor.name;
      const pos = parseInt(result.position);

      // Driver stats
      if (!driverMap.has(driverId)) {
        driverMap.set(driverId, {
          driverId,
          name: driverName,
          nationality: result.Driver.nationality,
          wins: 0,
          podiums: 0,
          fastestLaps: 0,
          bestFinish: pos,
          avgFinish: 0,
          appearances: 0,
          bestQuali: null,
          constructors: [],
        });
      }
      const driver = driverMap.get(driverId)!;
      driver.appearances++;
      if (pos === 1) driver.wins++;
      if (pos <= 3) driver.podiums++;
      if (result.FastestLap?.rank === "1") driver.fastestLaps++;
      if (pos < driver.bestFinish) driver.bestFinish = pos;
      driver.avgFinish += pos;
      if (!driver.constructors.includes(constructorName)) {
        driver.constructors.push(constructorName);
      }

      // Constructor stats
      if (!constructorMap.has(constructorId)) {
        constructorMap.set(constructorId, {
          constructorId,
          name: constructorName,
          nationality: result.Constructor.nationality,
          wins: 0,
          podiums: 0,
          fastestLaps: 0,
          oneTwo: 0,
          appearances: 0,
          avgFinish: 0,
          drivers: [],
        });
      }
      const constructor = constructorMap.get(constructorId)!;
      if (pos === 1) constructor.wins++;
      if (pos <= 3) constructor.podiums++;
      if (result.FastestLap?.rank === "1") constructor.fastestLaps++;
      constructor.avgFinish += pos;
      constructor.appearances++;
      if (!constructor.drivers.includes(driverName)) {
        constructor.drivers.push(driverName);
      }

      // Fastest lap tracking
      if (result.FastestLap?.rank === "1") {
        fastestLapTime = result.FastestLap.Time.time;
        fastestLapDriver = driverName;
      }
    }

    // Check for 1-2 finishes
    const topTwo = race.Results.slice(0, 2);
    if (
      topTwo.length === 2 &&
      topTwo[0].Constructor.constructorId === topTwo[1].Constructor.constructorId
    ) {
      const cId = topTwo[0].Constructor.constructorId;
      if (constructorMap.has(cId)) {
        constructorMap.get(cId)!.oneTwo++;
      }
    }

    const winner = race.Results[0];
    seasons.push({
      season: race.season,
      winner: `${winner.Driver.givenName} ${winner.Driver.familyName}`,
      winnerConstructor: winner.Constructor.name,
      winningTime: winner.Time?.time ?? null,
      fastestLap: fastestLapTime,
      fastestLapDriver,
      polePosition: null,
    });
  }

  // Calculate averages
  for (const driver of driverMap.values()) {
    driver.avgFinish = Math.round((driver.avgFinish / driver.appearances) * 10) / 10;
  }
  for (const constructor of constructorMap.values()) {
    constructor.avgFinish =
      Math.round((constructor.avgFinish / constructor.appearances) * 10) / 10;
  }

  const drivers = Array.from(driverMap.values()).sort((a, b) => b.wins - a.wins);
  const constructors = Array.from(constructorMap.values()).sort(
    (a, b) => b.wins - a.wins
  );

  return { drivers, constructors, seasons: seasons.sort((a, b) => b.season.localeCompare(a.season)) };
}

export function addQualifyingData(
  drivers: DriverTrackStats[],
  seasons: SeasonSummary[],
  qualifying: QualifyingResult[]
) {
  const driverMap = new Map(drivers.map((d) => [d.driverId, d]));

  for (const race of qualifying) {
    for (const result of race.QualifyingResults) {
      const pos = parseInt(result.position);
      const driver = driverMap.get(result.Driver.driverId);
      if (driver) {
        if (driver.bestQuali === null || pos < driver.bestQuali) {
          driver.bestQuali = pos;
        }
      }
    }

    // Add pole sitter to season summary
    if (race.QualifyingResults.length > 0) {
      const pole = race.QualifyingResults[0];
      const season = seasons.find((s) => s.season === race.season);
      if (season) {
        season.polePosition = `${pole.Driver.givenName} ${pole.Driver.familyName}`;
      }
    }
  }
}
