// OpenF1 API types and fetch helpers
// API docs: https://openf1.org

const BASE_URL = "https://api.openf1.org/v1";

// --- Types ---

export interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_key: number;
  country_code: string;
  country_name: string;
  circuit_key: number;
  circuit_short_name: string;
  date_start: string;
  year: number;
}

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string; // "Practice" | "Qualifying" | "Race" | "Sprint" etc.
  date_start: string;
  date_end: string;
  meeting_key: number;
  year: number;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  session_key: number;
  first_name: string;
  last_name: string;
  country_code: string;
  headshot_url?: string;
}

export interface OpenF1Lap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  date_start: string;
  is_pit_out_lap: boolean;
  session_key: number;
  st_speed?: number | null;
}

export interface OpenF1CarData {
  driver_number: number;
  date: string;
  speed: number;
  throttle: number;
  brake: number;
  n_gear: number;
  rpm: number;
  drs: number;
  session_key: number;
}

export interface OpenF1Location {
  driver_number: number;
  date: string;
  x: number;
  y: number;
  z: number;
  session_key: number;
}

export interface OpenF1Interval {
  driver_number: number;
  date: string;
  gap_to_leader: number | null;
  interval: number | null;
  session_key: number;
}

export interface OpenF1Stint {
  driver_number: number;
  stint_number: number;
  compound: string;
  tyre_age_at_start: number;
  lap_start: number;
  lap_end: number;
  session_key: number;
}

export interface OpenF1Pit {
  driver_number: number;
  date: string;
  pit_duration: number | null;
  lap_number: number;
  session_key: number;
}

export interface OpenF1Weather {
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  pressure: number;
  rainfall: number;
  wind_direction: number;
  wind_speed: number;
  session_key: number;
}

export interface OpenF1Position {
  driver_number: number;
  date: string;
  position: number;
  session_key: number;
}

// --- Fetch helpers ---

async function fetchOpenF1<T>(
  endpoint: string,
  params: Record<string, string | number>
): Promise<T[]> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 86400 }, // cache 24h - completed sessions are immutable
  });

  if (!res.ok) {
    throw new Error(`OpenF1 API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getMeetings(
  year: number,
  countryName?: string
): Promise<OpenF1Meeting[]> {
  const params: Record<string, string | number> = { year };
  if (countryName) params.country_name = countryName;
  return fetchOpenF1<OpenF1Meeting>("/meetings", params);
}

export async function getSessions(
  meetingKey: number
): Promise<OpenF1Session[]> {
  return fetchOpenF1<OpenF1Session>("/sessions", {
    meeting_key: meetingKey,
  });
}

export async function getDrivers(
  sessionKey: number
): Promise<OpenF1Driver[]> {
  return fetchOpenF1<OpenF1Driver>("/drivers", {
    session_key: sessionKey,
  });
}

export async function getLaps(
  sessionKey: number,
  driverNumber: number
): Promise<OpenF1Lap[]> {
  return fetchOpenF1<OpenF1Lap>("/laps", {
    session_key: sessionKey,
    driver_number: driverNumber,
  });
}

export async function getCarData(
  sessionKey: number,
  driverNumber: number,
  dateGte: string,
  dateLt: string
): Promise<OpenF1CarData[]> {
  return fetchOpenF1<OpenF1CarData>("/car_data", {
    session_key: sessionKey,
    driver_number: driverNumber,
    "date>=": dateGte,
    "date<": dateLt,
  });
}

export async function getLocation(
  sessionKey: number,
  driverNumber: number,
  dateGte: string,
  dateLt: string
): Promise<OpenF1Location[]> {
  return fetchOpenF1<OpenF1Location>("/location", {
    session_key: sessionKey,
    driver_number: driverNumber,
    "date>=": dateGte,
    "date<": dateLt,
  });
}

export async function getIntervals(
  sessionKey: number
): Promise<OpenF1Interval[]> {
  return fetchOpenF1<OpenF1Interval>("/intervals", {
    session_key: sessionKey,
  });
}

export async function getStints(
  sessionKey: number
): Promise<OpenF1Stint[]> {
  return fetchOpenF1<OpenF1Stint>("/stints", {
    session_key: sessionKey,
  });
}

export async function getPits(
  sessionKey: number
): Promise<OpenF1Pit[]> {
  return fetchOpenF1<OpenF1Pit>("/pit", {
    session_key: sessionKey,
  });
}

export async function getWeather(
  sessionKey: number
): Promise<OpenF1Weather[]> {
  return fetchOpenF1<OpenF1Weather>("/weather", {
    session_key: sessionKey,
  });
}

export async function getPositions(
  sessionKey: number
): Promise<OpenF1Position[]> {
  return fetchOpenF1<OpenF1Position>("/position", {
    session_key: sessionKey,
  });
}
