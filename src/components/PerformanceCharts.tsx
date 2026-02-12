"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DriverStats {
  name: string;
  wins: number;
  podiums: number;
  avgFinish: number;
}

interface ConstructorStats {
  name: string;
  wins: number;
  podiums: number;
  avgFinish: number;
}

interface SeasonData {
  season: string;
  winner: string;
  winnerConstructor: string;
}

const COLORS = [
  "#e10600",
  "#1e41ff",
  "#00d2be",
  "#ff8700",
  "#006f62",
  "#9b0000",
  "#2b4562",
  "#b6babd",
  "#0090ff",
  "#005aff",
];

export function DriverWinsChart({ drivers }: { drivers: DriverStats[] }) {
  const data = drivers.filter((d) => d.wins > 0).slice(0, 10);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-lg font-bold text-f1-dark mb-4">
        Top Drivers by Wins
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="wins" name="Wins" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConstructorWinsChart({
  constructors,
}: {
  constructors: ConstructorStats[];
}) {
  const data = constructors.filter((c) => c.wins > 0).slice(0, 10);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-lg font-bold text-f1-dark mb-4">
        Top Constructors by Wins
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="wins" name="Wins" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SeasonWinnersChart({ seasons }: { seasons: SeasonData[] }) {
  if (seasons.length === 0) return null;

  // Count wins per constructor across seasons
  const constructorWins = new Map<string, number>();
  for (const s of seasons) {
    constructorWins.set(
      s.winnerConstructor,
      (constructorWins.get(s.winnerConstructor) || 0) + 1
    );
  }

  const colorMap = new Map<string, string>();
  let ci = 0;
  for (const name of constructorWins.keys()) {
    colorMap.set(name, COLORS[ci % COLORS.length]);
    ci++;
  }

  const data = [...seasons].reverse().map((s) => ({
    season: s.season,
    winner: s.winner,
    constructor: s.winnerConstructor,
    value: 1,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-lg font-bold text-f1-dark mb-4">
        Race Winners by Season
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="season" tick={{ fontSize: 11 }} />
          <YAxis hide />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-white border rounded shadow px-3 py-2 text-sm">
                    <p className="font-bold">{d.season}</p>
                    <p>{d.winner}</p>
                    <p className="text-gray-500">{d.constructor}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={colorMap.get(entry.constructor) || COLORS[0]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-3">
        {Array.from(colorMap.entries()).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: color }}
            />
            <span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
