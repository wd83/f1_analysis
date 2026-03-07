"use client";

import { useState, useEffect, useCallback } from "react";
import SessionSelector from "./SessionSelector";
import DriverLapSelector from "./DriverLapSelector";
import SpeedTrace from "./SpeedTrace";
import CarDataDashboard from "./CarDataDashboard";
import TrackMap from "./TrackMap";
import GapChart from "./GapChart";
import TyreStrategy from "./TyreStrategy";
import WeatherBar from "./WeatherBar";
import LapTimesTable from "./LapTimesTable";

interface TelemetryTabProps {
  circuitId: string;
}

interface Meeting {
  meeting_key: number;
  meeting_name: string;
  year: number;
}

interface Session {
  session_key: number;
  session_name: string;
  session_type: string;
}

interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
}

interface Lap {
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  date_start: string;
  is_pit_out_lap: boolean;
}

interface ProcessedCarData {
  distance: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  drs: number;
  rpm: number;
}

interface LocationPoint {
  x: number;
  y: number;
  speed: number;
  distance: number;
}

interface DriverSelection {
  driverNumber: number | null;
  lapNumber: number | null;
}

interface WeatherData {
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  wind_direction: number;
}

// Simple client-side cache
const cache = new Map<string, unknown>();

async function cachedFetch<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url) as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const data = await res.json();
  cache.set(url, data);
  return data as T;
}

const AVAILABLE_YEARS = [2023, 2024, 2025];

export default function TelemetryTab({ circuitId }: TelemetryTabProps) {
  // Selection state
  const [selectedYear, setSelectedYear] = useState(2024);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<string>("");

  // Driver/lap state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selection1, setSelection1] = useState<DriverSelection>({
    driverNumber: null,
    lapNumber: null,
  });
  const [selection2, setSelection2] = useState<DriverSelection>({
    driverNumber: null,
    lapNumber: null,
  });
  const [laps1, setLaps1] = useState<Lap[]>([]);
  const [laps2, setLaps2] = useState<Lap[]>([]);

  // Data state
  const [carData1, setCarData1] = useState<ProcessedCarData[]>([]);
  const [carData2, setCarData2] = useState<ProcessedCarData[]>([]);
  const [locationData, setLocationData] = useState<LocationPoint[]>([]);
  const [gapData, setGapData] = useState<
    { lap: number; [key: string]: number | null }[]
  >([]);
  const [stints, setStints] = useState<
    {
      driver_number: number;
      stint_number: number;
      compound: string;
      tyre_age_at_start: number;
      lap_start: number;
      lap_end: number;
    }[]
  >([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // UI state
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingLaps, setLoadingLaps] = useState(false);
  const [loadingCarData, setLoadingCarData] = useState(false);
  const [hoverDistance, setHoverDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch meetings when year changes
  useEffect(() => {
    setLoadingMeetings(true);
    setError(null);
    setMeetings([]);
    setSelectedMeeting(null);
    setSessions([]);
    setSelectedSession(null);

    cachedFetch<Meeting[]>(
      `/api/telemetry/meetings?year=${selectedYear}&circuitId=${circuitId}`
    )
      .then((data) => {
        setMeetings(data);
        if (data.length === 1) {
          setSelectedMeeting(data[0].meeting_key);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingMeetings(false));
  }, [selectedYear, circuitId]);

  // Fetch sessions when meeting changes
  useEffect(() => {
    if (!selectedMeeting) return;
    setLoadingSessions(true);
    setSessions([]);
    setSelectedSession(null);

    cachedFetch<Session[]>(
      `/api/telemetry/sessions?meeting_key=${selectedMeeting}`
    )
      .then((data) => {
        setSessions(data);
        // Auto-select Race if available
        const race = data.find((s) => s.session_name === "Race");
        if (race) setSelectedSession(race.session_key);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingSessions(false));
  }, [selectedMeeting]);

  // Fetch drivers + weather when session changes
  useEffect(() => {
    if (!selectedSession) return;
    setLoadingDrivers(true);
    setDrivers([]);
    setSelection1({ driverNumber: null, lapNumber: null });
    setSelection2({ driverNumber: null, lapNumber: null });
    setCarData1([]);
    setCarData2([]);
    setLocationData([]);
    setGapData([]);
    setStints([]);
    setWeather(null);

    const session = sessions.find((s) => s.session_key === selectedSession);
    setSessionType(session?.session_name || "");

    Promise.all([
      cachedFetch<Driver[]>(
        `/api/telemetry/drivers?session_key=${selectedSession}`
      ),
      cachedFetch<WeatherData>(
        `/api/telemetry/weather?session_key=${selectedSession}`
      ),
    ])
      .then(([driversData, weatherData]) => {
        setDrivers(driversData);
        setWeather(weatherData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingDrivers(false));

    // Fetch race-only data
    if (session?.session_name === "Race") {
      cachedFetch<{ lap: number; [key: string]: number | null }[]>(
        `/api/telemetry/gaps?session_key=${selectedSession}`
      )
        .then(setGapData)
        .catch(() => {}); // non-critical

      cachedFetch<
        {
          driver_number: number;
          stint_number: number;
          compound: string;
          tyre_age_at_start: number;
          lap_start: number;
          lap_end: number;
        }[]
      >(`/api/telemetry/stints?session_key=${selectedSession}`)
        .then(setStints)
        .catch(() => {}); // non-critical
    }
  }, [selectedSession, sessions]);

  // Fetch laps when driver selection changes
  useEffect(() => {
    if (!selectedSession || !selection1.driverNumber) {
      setLaps1([]);
      return;
    }
    setLoadingLaps(true);
    cachedFetch<Lap[]>(
      `/api/telemetry/laps?session_key=${selectedSession}&driver_number=${selection1.driverNumber}`
    )
      .then(setLaps1)
      .catch(() => setLaps1([]))
      .finally(() => setLoadingLaps(false));
  }, [selectedSession, selection1.driverNumber]);

  useEffect(() => {
    if (!selectedSession || !selection2.driverNumber) {
      setLaps2([]);
      return;
    }
    cachedFetch<Lap[]>(
      `/api/telemetry/laps?session_key=${selectedSession}&driver_number=${selection2.driverNumber}`
    )
      .then(setLaps2)
      .catch(() => setLaps2([]));
  }, [selectedSession, selection2.driverNumber]);

  // Fetch car data when lap selection changes
  useEffect(() => {
    if (
      !selectedSession ||
      !selection1.driverNumber ||
      !selection1.lapNumber
    ) {
      setCarData1([]);
      return;
    }
    setLoadingCarData(true);
    cachedFetch<ProcessedCarData[]>(
      `/api/telemetry/car-data?session_key=${selectedSession}&driver_number=${selection1.driverNumber}&lap_number=${selection1.lapNumber}`
    )
      .then(setCarData1)
      .catch(() => setCarData1([]))
      .finally(() => setLoadingCarData(false));

    // Also fetch location for track map
    cachedFetch<LocationPoint[]>(
      `/api/telemetry/location?session_key=${selectedSession}&driver_number=${selection1.driverNumber}&lap_number=${selection1.lapNumber}`
    )
      .then(setLocationData)
      .catch(() => setLocationData([]));
  }, [selectedSession, selection1.driverNumber, selection1.lapNumber]);

  useEffect(() => {
    if (
      !selectedSession ||
      !selection2.driverNumber ||
      !selection2.lapNumber
    ) {
      setCarData2([]);
      return;
    }
    cachedFetch<ProcessedCarData[]>(
      `/api/telemetry/car-data?session_key=${selectedSession}&driver_number=${selection2.driverNumber}&lap_number=${selection2.lapNumber}`
    )
      .then(setCarData2)
      .catch(() => setCarData2([]));
  }, [selectedSession, selection2.driverNumber, selection2.lapNumber]);

  const driver1 = drivers.find(
    (d) => d.driver_number === selection1.driverNumber
  );
  const driver2 = drivers.find(
    (d) => d.driver_number === selection2.driverNumber
  );
  const color1 = driver1 ? `#${driver1.team_colour}` : "#e10600";
  const color2 = driver2 ? `#${driver2.team_colour}` : "#1e41ff";
  const label1 = driver1?.name_acronym || "Driver 1";
  const label2 = driver2?.name_acronym || "Driver 2";

  const isRace = sessionType === "Race";
  const hasCarData = carData1.length > 0 || carData2.length > 0;

  return (
    <div className="space-y-4">
      {/* Year + Meeting selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
              Year
            </label>
            <div className="flex gap-1">
              {AVAILABLE_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedYear === year
                      ? "bg-f1-dark text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {loadingMeetings ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 pt-5">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-f1-red border-t-transparent" />
              Loading meetings...
            </div>
          ) : meetings.length > 1 ? (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                Meeting
              </label>
              <select
                className="px-3 py-1.5 rounded border border-gray-300 text-sm bg-white"
                value={selectedMeeting ?? ""}
                onChange={(e) =>
                  setSelectedMeeting(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
              >
                <option value="">Select meeting</option>
                {meetings.map((m) => (
                  <option key={m.meeting_key} value={m.meeting_key}>
                    {m.meeting_name}
                  </option>
                ))}
              </select>
            </div>
          ) : meetings.length === 0 && !loadingMeetings ? (
            <p className="text-sm text-gray-400 pt-5">
              No meetings found for this circuit in {selectedYear}
            </p>
          ) : null}

          {loadingSessions ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 pt-5">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-f1-red border-t-transparent" />
              Loading sessions...
            </div>
          ) : sessions.length > 0 ? (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                Session
              </label>
              <SessionSelector
                sessions={sessions}
                selectedKey={selectedSession}
                onSelect={setSelectedSession}
              />
            </div>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Weather */}
      <WeatherBar weather={weather} />

      {/* Driver/Lap selector */}
      {loadingDrivers ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-f1-red border-t-transparent" />
        </div>
      ) : drivers.length > 0 ? (
        <DriverLapSelector
          drivers={drivers}
          laps1={laps1}
          laps2={laps2}
          selection1={selection1}
          selection2={selection2}
          onSelect1={setSelection1}
          onSelect2={setSelection2}
          loadingLaps={loadingLaps}
        />
      ) : null}

      {/* Loading car data */}
      {loadingCarData && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-f1-red border-t-transparent" />
          <span className="ml-2 text-sm text-gray-400">
            Loading telemetry data...
          </span>
        </div>
      )}

      {/* Speed trace + Track map */}
      {hasCarData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SpeedTrace
              data1={carData1}
              data2={carData2}
              color1={color1}
              color2={color2}
              label1={label1}
              label2={label2}
              onHoverDistance={setHoverDistance}
            />
          </div>
          <div>
            <TrackMap
              locationData={locationData}
              hoverDistance={hoverDistance}
            />
          </div>
        </div>
      )}

      {/* Car data dashboard */}
      {hasCarData && (
        <CarDataDashboard
          data1={carData1}
          data2={carData2}
          color1={color1}
          color2={color2}
          label1={label1}
          label2={label2}
        />
      )}

      {/* Race-only sections */}
      {isRace && gapData.length > 0 && (
        <GapChart
          data={gapData}
          drivers={drivers.map((d) => ({
            name_acronym: d.name_acronym,
            team_colour: d.team_colour,
          }))}
        />
      )}

      {isRace && stints.length > 0 && (
        <TyreStrategy
          stints={stints}
          drivers={drivers.map((d) => ({
            driver_number: d.driver_number,
            name_acronym: d.name_acronym,
            team_colour: d.team_colour,
          }))}
        />
      )}

      {/* Lap times tables */}
      {laps1.length > 0 && (
        <LapTimesTable
          laps={laps1}
          driverLabel={label1}
          color={color1}
        />
      )}
      {laps2.length > 0 && (
        <LapTimesTable
          laps={laps2}
          driverLabel={label2}
          color={color2}
        />
      )}

      {/* Empty state */}
      {selectedSession &&
        !loadingDrivers &&
        !loadingCarData &&
        !hasCarData &&
        drivers.length > 0 &&
        !selection1.lapNumber && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Select a driver and lap to view telemetry data
          </div>
        )}
    </div>
  );
}
