"use client";

interface Driver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  team_colour: string;
}

interface Lap {
  lap_number: number;
  lap_duration: number | null;
}

interface DriverSelection {
  driverNumber: number | null;
  lapNumber: number | null;
}

interface DriverLapSelectorProps {
  drivers: Driver[];
  laps1: Lap[];
  laps2: Lap[];
  selection1: DriverSelection;
  selection2: DriverSelection;
  onSelect1: (sel: DriverSelection) => void;
  onSelect2: (sel: DriverSelection) => void;
  loadingLaps: boolean;
}

function formatLapTime(seconds: number | null): string {
  if (seconds === null) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, "0")}` : `${secs}s`;
}

function DriverSelect({
  label,
  color,
  drivers,
  laps,
  selection,
  onSelect,
  loadingLaps,
}: {
  label: string;
  color: string;
  drivers: Driver[];
  laps: Lap[];
  selection: DriverSelection;
  onSelect: (sel: DriverSelection) => void;
  loadingLaps: boolean;
}) {
  const selectedDriver = drivers.find(
    (d) => d.driver_number === selection.driverNumber
  );

  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium text-gray-500 uppercase">
          {label}
        </span>
      </div>
      <div className="flex gap-2">
        <select
          className="flex-1 px-2 py-1.5 rounded border border-gray-300 text-sm bg-white"
          value={selection.driverNumber ?? ""}
          onChange={(e) =>
            onSelect({
              driverNumber: e.target.value ? parseInt(e.target.value) : null,
              lapNumber: null,
            })
          }
        >
          <option value="">Select driver</option>
          {drivers.map((d) => (
            <option key={d.driver_number} value={d.driver_number}>
              {d.name_acronym} - {d.full_name}
              {selectedDriver?.team_name !== d.team_name
                ? ` (${d.team_name})`
                : ""}
            </option>
          ))}
        </select>
        <select
          className="w-32 px-2 py-1.5 rounded border border-gray-300 text-sm bg-white"
          value={selection.lapNumber ?? ""}
          onChange={(e) =>
            onSelect({
              ...selection,
              lapNumber: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          disabled={!selection.driverNumber || loadingLaps}
        >
          <option value="">
            {loadingLaps ? "Loading..." : "Select lap"}
          </option>
          {laps
            .filter((l) => l.lap_duration !== null)
            .map((l) => (
              <option key={l.lap_number} value={l.lap_number}>
                Lap {l.lap_number} ({formatLapTime(l.lap_duration)})
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}

export default function DriverLapSelector({
  drivers,
  laps1,
  laps2,
  selection1,
  selection2,
  onSelect1,
  onSelect2,
  loadingLaps,
}: DriverLapSelectorProps) {
  const driver1 = drivers.find(
    (d) => d.driver_number === selection1.driverNumber
  );
  const driver2 = drivers.find(
    (d) => d.driver_number === selection2.driverNumber
  );

  const color1 = driver1 ? `#${driver1.team_colour}` : "#e10600";
  const color2 = driver2 ? `#${driver2.team_colour}` : "#1e41ff";

  // Find fastest lap button
  const findFastest = (
    laps: Lap[],
    selection: DriverSelection,
    onSelect: (sel: DriverSelection) => void
  ) => {
    if (!selection.driverNumber || laps.length === 0) return null;
    const validLaps = laps.filter((l) => l.lap_duration !== null);
    if (validLaps.length === 0) return null;
    const fastest = validLaps.reduce((best, l) =>
      (l.lap_duration ?? Infinity) < (best.lap_duration ?? Infinity) ? l : best
    );
    return (
      <button
        className="text-xs text-f1-red hover:underline"
        onClick={() =>
          onSelect({ ...selection, lapNumber: fastest.lap_number })
        }
      >
        Fastest
      </button>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <DriverSelect
            label="Driver 1"
            color={color1}
            drivers={drivers}
            laps={laps1}
            selection={selection1}
            onSelect={onSelect1}
            loadingLaps={loadingLaps}
          />
          <div className="mt-1">
            {findFastest(laps1, selection1, onSelect1)}
          </div>
        </div>
        <div className="flex-1">
          <DriverSelect
            label="Driver 2"
            color={color2}
            drivers={drivers}
            laps={laps2}
            selection={selection2}
            onSelect={onSelect2}
            loadingLaps={loadingLaps}
          />
          <div className="mt-1">
            {findFastest(laps2, selection2, onSelect2)}
          </div>
        </div>
      </div>
    </div>
  );
}
