"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import YearRangeSelector from "@/components/YearRangeSelector";
import StatsTable from "@/components/StatsTable";
import {
  DriverWinsChart,
  ConstructorWinsChart,
  SeasonWinnersChart,
} from "@/components/PerformanceCharts";

interface DriverStats {
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

interface ConstructorStats {
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

interface SeasonSummary {
  season: string;
  winner: string;
  winnerConstructor: string;
  winningTime: string | null;
  fastestLap: string | null;
  fastestLapDriver: string | null;
  polePosition: string | null;
}

interface ResultsData {
  circuitId: string;
  drivers: DriverStats[];
  constructors: ConstructorStats[];
  seasons: SeasonSummary[];
}

type Tab = "drivers" | "constructors" | "seasons";

export default function TrackClient() {
  const params = useParams();
  const circuitId = params.circuitId as string;

  const [startYear, setStartYear] = useState(2015);
  const [endYear, setEndYear] = useState(2024);
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("drivers");
  const [circuitName, setCircuitName] = useState("");

  useEffect(() => {
    fetch("/api/circuits")
      .then((res) => res.json())
      .then((circuits) => {
        const circuit = circuits.find(
          (c: { circuitId: string }) => c.circuitId === circuitId
        );
        if (circuit) setCircuitName(circuit.circuitName);
      });
  }, [circuitId]);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch(
      `/api/results?circuitId=${circuitId}&startYear=${startYear}&endYear=${endYear}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "drivers", label: "Drivers" },
    { key: "constructors", label: "Constructors" },
    { key: "seasons", label: "Season History" },
  ];

  const driverColumns = [
    {
      key: "name",
      label: "Driver",
      render: (d: DriverStats) => (
        <div>
          <span className="font-semibold">{d.name}</span>
          <span className="text-gray-400 text-xs ml-2">{d.nationality}</span>
        </div>
      ),
    },
    {
      key: "wins",
      label: "Wins",
      render: (d: DriverStats) => (
        <span className={d.wins > 0 ? "font-bold text-f1-red" : ""}>
          {d.wins}
        </span>
      ),
      sortValue: (d: DriverStats) => d.wins,
    },
    {
      key: "podiums",
      label: "Podiums",
      render: (d: DriverStats) => d.podiums,
      sortValue: (d: DriverStats) => d.podiums,
    },
    {
      key: "fastestLaps",
      label: "Fastest Laps",
      render: (d: DriverStats) => d.fastestLaps,
      sortValue: (d: DriverStats) => d.fastestLaps,
    },
    {
      key: "bestFinish",
      label: "Best Finish",
      render: (d: DriverStats) => `P${d.bestFinish}`,
      sortValue: (d: DriverStats) => -d.bestFinish,
    },
    {
      key: "avgFinish",
      label: "Avg Finish",
      render: (d: DriverStats) => d.avgFinish.toFixed(1),
      sortValue: (d: DriverStats) => -d.avgFinish,
    },
    {
      key: "bestQuali",
      label: "Best Quali",
      render: (d: DriverStats) =>
        d.bestQuali !== null ? `P${d.bestQuali}` : "-",
      sortValue: (d: DriverStats) => -(d.bestQuali ?? 99),
    },
    {
      key: "appearances",
      label: "Races",
      render: (d: DriverStats) => d.appearances,
      sortValue: (d: DriverStats) => d.appearances,
    },
    {
      key: "constructors",
      label: "Teams",
      render: (d: DriverStats) => (
        <span className="text-gray-500 text-xs">
          {d.constructors.join(", ")}
        </span>
      ),
    },
  ];

  const constructorColumns = [
    {
      key: "name",
      label: "Constructor",
      render: (c: ConstructorStats) => (
        <div>
          <span className="font-semibold">{c.name}</span>
          <span className="text-gray-400 text-xs ml-2">{c.nationality}</span>
        </div>
      ),
    },
    {
      key: "wins",
      label: "Wins",
      render: (c: ConstructorStats) => (
        <span className={c.wins > 0 ? "font-bold text-f1-red" : ""}>
          {c.wins}
        </span>
      ),
      sortValue: (c: ConstructorStats) => c.wins,
    },
    {
      key: "podiums",
      label: "Podiums",
      render: (c: ConstructorStats) => c.podiums,
      sortValue: (c: ConstructorStats) => c.podiums,
    },
    {
      key: "fastestLaps",
      label: "Fastest Laps",
      render: (c: ConstructorStats) => c.fastestLaps,
      sortValue: (c: ConstructorStats) => c.fastestLaps,
    },
    {
      key: "oneTwo",
      label: "1-2 Finishes",
      render: (c: ConstructorStats) => c.oneTwo,
      sortValue: (c: ConstructorStats) => c.oneTwo,
    },
    {
      key: "avgFinish",
      label: "Avg Finish",
      render: (c: ConstructorStats) => c.avgFinish.toFixed(1),
      sortValue: (c: ConstructorStats) => -c.avgFinish,
    },
    {
      key: "appearances",
      label: "Entries",
      render: (c: ConstructorStats) => c.appearances,
      sortValue: (c: ConstructorStats) => c.appearances,
    },
    {
      key: "drivers",
      label: "Drivers",
      render: (c: ConstructorStats) => (
        <span className="text-gray-500 text-xs">
          {c.drivers.slice(0, 5).join(", ")}
          {c.drivers.length > 5 && ` +${c.drivers.length - 5} more`}
        </span>
      ),
    },
  ];

  const seasonColumns = [
    {
      key: "season",
      label: "Season",
      render: (s: SeasonSummary) => (
        <span className="font-semibold">{s.season}</span>
      ),
      sortValue: (s: SeasonSummary) => parseInt(s.season),
    },
    {
      key: "winner",
      label: "Winner",
      render: (s: SeasonSummary) => (
        <span className="font-medium">{s.winner}</span>
      ),
    },
    {
      key: "winnerConstructor",
      label: "Team",
      render: (s: SeasonSummary) => s.winnerConstructor,
    },
    {
      key: "winningTime",
      label: "Race Time",
      render: (s: SeasonSummary) => s.winningTime ?? "-",
    },
    {
      key: "polePosition",
      label: "Pole Position",
      render: (s: SeasonSummary) => s.polePosition ?? "-",
    },
    {
      key: "fastestLap",
      label: "Fastest Lap",
      render: (s: SeasonSummary) =>
        s.fastestLap ? (
          <div>
            <span className="text-f1-red font-mono">{s.fastestLap}</span>
            <span className="text-gray-400 text-xs ml-1">
              {s.fastestLapDriver}
            </span>
          </div>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <a
          href="/"
          className="text-sm text-gray-500 hover:text-f1-red transition-colors"
        >
          &larr; Back to circuits
        </a>
        <h2 className="text-3xl font-bold text-f1-dark mt-2">
          {circuitName || circuitId}
        </h2>
        <p className="text-gray-500 mt-1">
          Performance analysis across{" "}
          {data ? data.seasons.length : "..."} seasons
        </p>
      </div>

      <div className="mb-6">
        <YearRangeSelector
          startYear={startYear}
          endYear={endYear}
          onStartYearChange={setStartYear}
          onEndYearChange={setEndYear}
          onApply={fetchData}
          loading={loading}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}. Please try again.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-f1-red border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              label="Most Wins (Driver)"
              value={data.drivers[0]?.name ?? "-"}
              sub={data.drivers[0] ? `${data.drivers[0].wins} wins` : ""}
            />
            <SummaryCard
              label="Most Wins (Team)"
              value={data.constructors[0]?.name ?? "-"}
              sub={
                data.constructors[0]
                  ? `${data.constructors[0].wins} wins`
                  : ""
              }
            />
            <SummaryCard
              label="Seasons Analyzed"
              value={String(data.seasons.length)}
              sub={`${startYear} - ${endYear}`}
            />
            <SummaryCard
              label="Drivers"
              value={String(data.drivers.length)}
              sub={`${data.constructors.length} constructors`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <DriverWinsChart drivers={data.drivers} />
            <ConstructorWinsChart constructors={data.constructors} />
          </div>
          <div className="mb-8">
            <SeasonWinnersChart seasons={data.seasons} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-200 rounded-lg p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-f1-dark shadow"
                    : "text-gray-500 hover:text-f1-dark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tables */}
          {activeTab === "drivers" && (
            <StatsTable
              data={data.drivers}
              columns={driverColumns}
              title="Driver Performance"
              defaultSortKey="wins"
            />
          )}
          {activeTab === "constructors" && (
            <StatsTable
              data={data.constructors}
              columns={constructorColumns}
              title="Constructor Performance"
              defaultSortKey="wins"
            />
          )}
          {activeTab === "seasons" && (
            <StatsTable
              data={data.seasons}
              columns={seasonColumns}
              title="Race History"
              defaultSortKey="season"
            />
          )}
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-f1-dark mt-1 truncate">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
